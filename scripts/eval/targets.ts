// Target adapters — the two doors.
// Each ask() is a COLD, single-turn question: a fresh session with no history,
// so results are independent and the failure surface is per-question.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env';

export interface AgentTarget {
  name: string;                                   // "v2-prod" | "v3-local"
  ask(question: string): Promise<string>;         // one cold question → agent's full reply
  preflight(): Promise<void>;                      // throws loudly if the target is unreachable
}

const CONTROL_TOKENS = ['[SHOW_INSIGHTS_MODAL]'];

function stripControlTokens(text: string): string {
  let out = text;
  for (const tok of CONTROL_TOKENS) out = out.split(tok).join('');
  return out.trim();
}

// Read a text/event-stream body (the /api/chat SSE shape) to completion.
// Events: {type:'content',text} | {type:'done'} | {type:'error',message}
async function readChatStream(resp: Response): Promise<string> {
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error(`chat HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }
  if (!resp.body) throw new Error('chat response had no body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let evt: { type: string; text?: string; message?: string };
      try { evt = JSON.parse(line.slice(6)); } catch { continue; }
      if (evt.type === 'content') full += evt.text ?? '';
      else if (evt.type === 'done') break outer;
      else if (evt.type === 'error') throw new Error(`agent error event: ${evt.message ?? 'unknown'}`);
    }
  }
  return stripControlTokens(full);
}

async function pingBase(base: string, label: string): Promise<void> {
  let resp: Response;
  try {
    resp = await fetch(base, { method: 'GET' });
  } catch (err) {
    throw new Error(`${label} unreachable at ${base} — ${(err as Error).message}. Is the server running?`);
  }
  // Any HTTP response (even 404) proves the host is up; a thrown fetch is the real failure.
  if (resp.status >= 500) {
    throw new Error(`${label} at ${base} returned ${resp.status} — server appears down.`);
  }
}

// ── v3-local: dynamic candidate prompt via /api/chat with a candidate-linked session ──
// The session's candidate_id makes /api/chat build the prompt from candidate-prompt.ts
// (the P8–P10 code). We create the session row directly with the service role, exactly
// as the app's recruiter flow does, because /api/session does not accept a candidate_id.
export function makeV3LocalTarget(): AgentTarget {
  const base = process.env.V3_BASE?.trim() || 'http://localhost:3000';
  const candidateId = getEnv('EVAL_CANDIDATE_ID');           // Pablo's profiles.id — never hardcoded
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = getEnv('SUPABASE_SERVICE_KEY');
  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey);

  async function freshSession(): Promise<string> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        candidate_id: candidateId,
        recruiter_name: 'Hallucination Eval',
        company: 'Automated QA',
        role: 'eval-suite',
        messages: [],
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`v3-local session insert failed: ${error?.message ?? 'no row'}`);
    return data.id as string;
  }

  return {
    name: 'v3-local',
    async preflight() { await pingBase(base, 'v3-local'); },
    async ask(question: string) {
      const sessionId = await freshSession();
      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, sessionId, context: {} }),
      });
      return readChatStream(resp);
    },
  };
}

// ── v2-prod: exactly what the browser does on "Start interview" ──
// POST /api/session (candidate_id null → static Pablo prompt) → POST /api/chat.
export function makeV2ProdTarget(): AgentTarget {
  const base = process.env.V2_BASE?.trim() || 'https://interviewmind.one';

  async function freshSession(): Promise<string> {
    const resp = await fetch(`${base}/api/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recruiterName: 'Hallucination Eval',
        company: 'Automated QA',
        role: 'eval-suite',
        email: 'eval-suite@interviewmind.one',
        consentToEmail: false,
      }),
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => '');
      throw new Error(`v2-prod /api/session HTTP ${resp.status}: ${body.slice(0, 300)}`);
    }
    const json = await resp.json() as { sessionId?: string; error?: string };
    if (!json.sessionId) throw new Error(`v2-prod session missing sessionId: ${json.error ?? 'unknown'}`);
    return json.sessionId;
  }

  return {
    name: 'v2-prod',
    async preflight() { await pingBase(base, 'v2-prod'); },
    async ask(question: string) {
      const sessionId = await freshSession();
      const resp = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, sessionId, context: {} }),
      });
      return readChatStream(resp);
    },
  };
}

export function makeTarget(name: string): AgentTarget {
  if (name === 'v2-prod') return makeV2ProdTarget();
  if (name === 'v3-local') return makeV3LocalTarget();
  throw new Error(`Unknown target "${name}" (expected v2-prod | v3-local)`);
}
