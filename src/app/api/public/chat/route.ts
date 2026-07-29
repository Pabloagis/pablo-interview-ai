import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic';
import { CORE_SYSTEM_PROMPT, buildDynamicPrompt } from '@/lib/prompts';
import { buildCandidateSystemPrompt } from '@/lib/candidate-prompt';
import { maybeSendReports } from '@/lib/public-report';
import {
  CLAUDE_MODEL,
  CLAUDE_FALLBACK_MODEL,
  API_TIMEOUT_MS,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  MEMORY_SEARCH_LIMIT,
  MEMORY_MIN_HISTORY,
} from '@/lib/constants';
import {
  ipFromRequest,
  hashIp,
  checkMessage,
  logUsage,
  isPublicChatEnabled,
  MAX_TURNS,
  PUBLIC_MAX_TOKENS,
  HISTORY_MAX_EXCHANGES,
} from '@/lib/rate-limit';
import {
  extractVisitorContext,
  mergeVisitor,
  buildVisitorContextBlock,
  hasAnyVisitor,
  OPENING_ASK,
  type VisitorFields,
} from '@/lib/visitor-context';

export const dynamic = 'force-dynamic';

type SupabaseAdmin = ReturnType<typeof createServerSupabaseClient>;
type Msg = { role: 'user' | 'assistant'; content: string };

// ── Memory helpers (duplicated from /api/chat — that route is untouchable) ────
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}
async function embed(text: string): Promise<number[] | null> {
  try {
    const r = await getOpenAI().embeddings.create({
      model: EMBEDDING_MODEL, input: text, dimensions: EMBEDDING_DIMENSIONS,
    });
    return r.data[0].embedding;
  } catch (e) { console.error('[public/chat] embedding failed (non-critical):', e); return null; }
}
async function searchMemory(supabase: SupabaseAdmin, sessionId: string, embedding: number[]) {
  try {
    const { data } = await supabase.rpc('search_memory', {
      p_session_id: sessionId, p_query_embedding: embedding, p_limit: MEMORY_SEARCH_LIMIT,
    });
    return (data as Array<{ content: string }>) ?? [];
  } catch (e) { console.error('[public/chat] memory search failed (non-critical):', e); return []; }
}
function storeMemory(
  supabase: SupabaseAdmin, sessionId: string, content: string,
  type: 'user_message' | 'assistant_response', embedding: number[] | null,
): void {
  supabase.from('memory').insert({ session_id: sessionId, content, type, embedding }).then(({ error }) => {
    if (error) console.error('[public/chat] memory store failed (non-critical):', error);
  });
}

const sse = (enc: TextEncoder, data: object) => enc.encode(`data: ${JSON.stringify(data)}\n\n`);

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  if (!isPublicChatEnabled()) {
    return new Response(JSON.stringify({ error: 'Public chat is temporarily unavailable.' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { sessionId?: string; message?: string };
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { sessionId, message } = body;
  if (!sessionId || !message?.trim()) {
    return new Response(JSON.stringify({ error: 'sessionId and message are required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createServerSupabaseClient();

  // Identity comes from the session row — never from the request body.
  const { data: session } = await supabase
    .from('sessions')
    .select('id, candidate_id, source, messages, turn_count, ended_at, recruiter_name, recruiter_role, recruiter_company, recruiter_email, context_captured_at')
    .eq('id', sessionId)
    .single();

  if (!session || session.source !== 'public' || !session.candidate_id) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  if (session.ended_at) {
    return new Response(JSON.stringify({ error: 'This conversation has ended.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
  }

  // ── Rate-limit checks BEFORE any model call — a blocked request spends no tokens ──
  const ipHash = hashIp(ipFromRequest(request));
  const msgLimit = await checkMessage(supabase, ipHash);
  if (!msgLimit.allowed) {
    return new Response(JSON.stringify({ error: 'Too many messages. Please slow down.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
  }

  const candidateId = session.candidate_id as string;
  const sid: string = sessionId; // stable: control-flow narrowing resets inside nested closures
  const rawHistory = (session.messages ?? []) as Msg[];
  const turnCount = session.turn_count ?? 0;

  // ── Turn cap: close the session, fire the report, return a polite message ────
  if (turnCount >= MAX_TURNS) {
    await supabase.from('sessions').update({ ended_at: new Date().toISOString() }).eq('id', sessionId);
    void maybeSendReports(sessionId);
    const closeMsg = 'This conversation has reached its limit — contact the candidate directly.';
    const stream = new ReadableStream({
      start(c) { c.enqueue(sse(encoder, { type: 'content', text: closeMsg })); c.enqueue(sse(encoder, { type: 'done' })); c.close(); },
    });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } });
  }

  const abort = new AbortController();
  const timeoutId = setTimeout(() => abort.abort(), API_TIMEOUT_MS);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (d: object) => controller.enqueue(sse(encoder, d));
      try {
        // Build per-candidate prompt (unchanged) with the same Pablo fallback as /api/chat.
        let corePrompt = CORE_SYSTEM_PROMPT;
        try { corePrompt = await buildCandidateSystemPrompt(candidateId, supabase); }
        catch (e) { console.error('[public/chat] buildCandidateSystemPrompt failed, fallback:', e); }

        const userMsg: Msg = { role: 'user', content: message.trim() };
        // Last 12 exchanges (24 messages) to the model — never the unbounded transcript.
        const windowed = rawHistory.slice(-(HISTORY_MAX_EXCHANGES * 2));
        const messagesForClaude: Msg[] = [...windowed, userMsg];

        const embedding = await embed(message);
        let memories: Array<{ content: string }> = [];
        if (embedding && rawHistory.length >= MEMORY_MIN_HISTORY) {
          memories = await searchMemory(supabase, sessionId, embedding);
        }

        const dynamic = buildDynamicPrompt(
          {
            recruiterName: session.recruiter_name ?? undefined,
            company: session.recruiter_company ?? undefined,
            role: session.recruiter_role ?? undefined,
          },
          memories.map(m => ({ id: '', content: m.content, type: '', similarity: 0 })),
          '',
        );

        // Visitor context is UNVERIFIED session metadata. Append it as a SEPARATE block
        // AFTER the verified candidate core — never merged, never embedded into memory.
        const visitor: VisitorFields = {
          name: session.recruiter_name ?? null,
          role: session.recruiter_role ?? null,
          company: session.recruiter_company ?? null,
          email: session.recruiter_email ?? null,
        };
        const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
          { type: 'text', text: corePrompt, cache_control: { type: 'ephemeral' } },
        ];
        if (hasAnyVisitor(visitor)) {
          systemBlocks.push({ type: 'text', text: buildVisitorContextBlock(visitor) });
        }
        systemBlocks.push({ type: 'text', text: dynamic });
        if (rawHistory.length === 0) {
          systemBlocks.push({ type: 'text', text: OPENING_ASK });
        }

        const anthropic = getAnthropicClient();

        async function streamOnce(model: string, msgs: Msg[]): Promise<{ text: string; stop: string | null }> {
          let text = '';
          const s = anthropic.messages.stream(
            { model, max_tokens: PUBLIC_MAX_TOKENS, system: systemBlocks, messages: msgs },
            { signal: abort.signal },
          );
          for await (const ev of s) {
            if (abort.signal.aborted) break;
            if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
              text += ev.delta.text;
              send({ type: 'content', text: ev.delta.text });
            }
          }
          const final = await s.finalMessage();
          logUsage(supabase, {            candidateId, sessionId: sid, model,
            inputTokens: final.usage?.input_tokens ?? null,
            outputTokens: final.usage?.output_tokens ?? null,
          });
          return { text, stop: final.stop_reason };
        }

        let full = '';
        let result: { text: string; stop: string | null };
        try {
          result = await streamOnce(CLAUDE_MODEL, messagesForClaude);
        } catch (err) {
          const overloaded = err instanceof Error && err.message.includes('overloaded_error');
          if (overloaded) { result = await streamOnce(CLAUDE_FALLBACK_MODEL, messagesForClaude); }
          else throw err;
        }
        full = result.text;

        // One continuation if truncated at the token ceiling — so replies don't end mid-sentence.
        if (result.stop === 'max_tokens' && full && !abort.signal.aborted) {
          const cont = await streamOnce(CLAUDE_MODEL, [...messagesForClaude, { role: 'assistant', content: full }]);
          full += cont.text;
        }

        if (!abort.signal.aborted && full) {
          const updated: Msg[] = [...rawHistory, userMsg, { role: 'assistant', content: full }];
          const now = new Date().toISOString();
          await supabase.from('sessions')
            .update({ messages: updated, updated_at: now, last_activity_at: now, turn_count: turnCount + 1 })
            .eq('id', sessionId);

          send({ type: 'done' });

          storeMemory(supabase, sid, message, 'user_message', embedding);
          embed(full).then(e => storeMemory(supabase, sid, full, 'assistant_response', e));

          // ── Visitor-context capture — first 3 visitor messages, AFTER the stream so it
          //    never delays the first token. Stored as session metadata, never as memory. ──
          const visitorMsgs = updated.filter(m => m.role === 'user').map(m => m.content);
          if (visitorMsgs.length <= 3 && !session.context_captured_at) {
            try {
              const { fields, usage } = await extractVisitorContext(visitorMsgs);
              logUsage(supabase, {
                candidateId, sessionId: sid, model: CLAUDE_FALLBACK_MODEL,
                inputTokens: usage.input, outputTokens: usage.output,
              });
              const merged = mergeVisitor(visitor, fields); // never overwrites a non-null
              const patch: Record<string, string> = {};
              if (merged.name && merged.name !== visitor.name) patch.recruiter_name = merged.name;
              if (merged.role && merged.role !== visitor.role) patch.recruiter_role = merged.role;
              if (merged.company && merged.company !== visitor.company) patch.recruiter_company = merged.company;
              if (merged.email && merged.email !== visitor.email) patch.recruiter_email = merged.email;
              const allThree = !!(merged.name && merged.role && merged.company);
              if (allThree || visitorMsgs.length >= 3) patch.context_captured_at = new Date().toISOString();
              if (Object.keys(patch).length > 0) await supabase.from('sessions').update(patch).eq('id', sid);
            } catch (e) {
              console.error('[public/chat] visitor extraction failed (non-fatal):', e);
            }
          }
        }
      } catch (error) {
        console.error('[public/chat] stream error:', error);
        send({ type: 'error', message: 'Something went wrong. Please try again.' });
      } finally {
        clearTimeout(timeoutId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
  });
}
