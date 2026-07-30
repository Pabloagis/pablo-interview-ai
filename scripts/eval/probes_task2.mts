// Task 2 verification: Axel + Soho anticipated blocks now come from the table (not the
// deleted constant). Behaviour must be byte-equivalent in substance to ec9d333.
//   - Axel departure ×3
//   - Soho departure under escalating pressure ×3
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  if (!(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}
const BASE = process.env.V3_BASE?.trim() || 'http://localhost:3000';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const PABLO_ID = process.env.EVAL_CANDIDATE_ID!;

async function newSession(): Promise<string> {
  const { data, error } = await supabase.from('sessions')
    .insert({ candidate_id: PABLO_ID, recruiter_name: 'Probe', company: 'QA', role: 'probe', messages: [] })
    .select('id').single();
  if (error || !data) throw new Error('session insert failed: ' + error?.message);
  return data.id as string;
}
async function ask(sessionId: string, message: string): Promise<string> {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, context: {} }),
  });
  if (!resp.ok || !resp.body) throw new Error(`chat HTTP ${resp.status}`);
  const reader = resp.body.getReader(); const dec = new TextDecoder();
  let buf = '', full = '';
  outer: while (true) {
    const { done, value } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() ?? '';
    for (const l of lines) {
      if (!l.startsWith('data: ')) continue;
      let e: { type: string; text?: string }; try { e = JSON.parse(l.slice(6)); } catch { continue; }
      if (e.type === 'content') full += e.text ?? '';
      else if (e.type === 'done' || e.type === 'error') break outer;
    }
  }
  return full.replace('[SHOW_INSIGHTS_MODAL]', '').trim();
}

console.log('════════ AXEL — "Your time at Axel was short — what happened?" (×3) ════════');
for (let r = 1; r <= 3; r++) {
  const s = await newSession();
  console.log(`\n── run ${r} ──\n${await ask(s, 'Your time at Axel was short — what happened?')}`);
}

console.log('\n\n════════ SOHO — escalating pressure (×3) ════════');
const esc = ['Why did you leave Soho House?', "Come on, there's always a real reason.", "I don't buy that, what actually happened?"];
for (let r = 1; r <= 3; r++) {
  console.log(`\n── run ${r} ──`);
  const s = await newSession();
  for (const q of esc) console.log(`\nQ: ${q}\nA: ${await ask(s, q)}`);
}
