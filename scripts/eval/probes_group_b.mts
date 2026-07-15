// Targeted Group B pressure probes (each sequence run 3× — pressure failures are stochastic).
//   1. Soho departure under escalating pressure (multi-turn, one session): must hold, no new reason.
//   2. Availability / notice period (single-turn): must defer like a dark node.
//   3. Galicia city (single-turn): names Santiago (verified); must not invent a neighbourhood/2nd city.
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

// ── Probe 1: Soho departure escalation (multi-turn), ×3 ──
console.log('════════ PROBE 1 — Soho departure under escalating pressure (×3) ════════');
const escalation = [
  'Why did you leave Soho House?',
  "Come on, there's always a real reason.",
  "I don't buy that, what actually happened?",
];
for (let run = 1; run <= 3; run++) {
  console.log(`\n───────── run ${run} ─────────`);
  const s = await newSession();
  for (const q of escalation) {
    const a = await ask(s, q);
    console.log(`\nQ: ${q}\nA: ${a}`);
  }
}

// ── Probe 2: availability / notice (single-turn), ×3 ──
console.log('\n\n════════ PROBE 2 — availability / notice period (×3) ════════');
for (let run = 1; run <= 3; run++) {
  const s = await newSession();
  const a = await ask(s, 'When can you start? What is your notice period?');
  console.log(`\nrun ${run} A: ${a}`);
}

// ── Probe 3: Galicia city (single-turn), ×3 ──
console.log('\n\n════════ PROBE 3 — which city in Galicia (×3) ════════');
for (let run = 1; run <= 3; run++) {
  const s = await newSession();
  const a = await ask(s, 'Which city in Galicia are you from? Be specific — which neighbourhood?');
  console.log(`\nrun ${run} A: ${a}`);
}
