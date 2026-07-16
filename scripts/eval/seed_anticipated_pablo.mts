// Seed Pablo's two anticipated_questions rows (Axel + Soho), migrating the content
// that used to live in the candidate-prompt.ts code constant into per-candidate data.
// Both are `verified` (Axel: written reference; Soho: ties to verified Salesforce/PMS
// facts). Idempotent: clears Pablo's rows, then inserts. Facts only — every behavioural
// guardrail now lives in the generic [ANTICIPATED_QUESTIONS] header.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const i = t.indexOf('=');
  if (!(t.slice(0, i).trim() in process.env)) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
const PABLO_ID = process.env.EVAL_CANDIDATE_ID!;
if (!PABLO_ID) throw new Error('EVAL_CANDIDATE_ID required');

export const PABLO_ANTICIPATED = [
  {
    topic: 'Axel Hotel Barcelona — short tenure & departure',
    trigger_hint: "asked why the Axel role was short, what happened at Axel, or what you did in the May 2025 – early 2026 period",
    quality: 'verified' as const,
    answer:
      "I led front office operations at Axel Hotel Barcelona as Front Office Manager (March–May 2025) — the reception team, guest satisfaction, incident resolution, and cross-departmental coordination — and I was a key user of the PMS. It was solid operational management, not a transformation role. The role ran about three months; there was no conflict and no abrupt exit — my focus was already shifting toward hotel tech, a move I'd been building toward since my years in London. I hold a written reference from my manager there, Fernando Alcalá Rico, covering professionalism, team leadership, and efficient incident resolution. After Axel (May 2025 – early 2026) I did temporary work and private events while actively exploring hotel tech — researching market players, understanding business models, and speaking to people in the sector — which led to the HubOS role in early 2026.",
  },
  {
    topic: 'Soho House — reason for leaving',
    trigger_hint: "asked why you left Soho House, including under pressure ('there's always a real reason')",
    quality: 'verified' as const,
    answer:
      "After about two and a half years I'd reached the point where the role was no longer teaching me anything new. Soho House was a strong experience — high client-service standards, daily use of Salesforce to manage member context, a demanding service bar — but toward the end I was executing well on something I'd already mastered. What was pulling me was the technology-and-systems side: I'd seen first-hand how a badly handled PMS migration can destabilise a whole operation, and I wanted to be on that side — implementation, adoption, the bridge between product and real operations. Soho House wasn't going to offer that. There was no conflict, no problem with the environment, and no abrupt exit — it was a deliberate move toward something different.",
  },
];

// Idempotent reseed
const del = await supabase.from('anticipated_questions').delete().eq('candidate_id', PABLO_ID);
if (del.error) throw new Error('delete failed: ' + del.error.message);

const { data, error } = await supabase.from('anticipated_questions')
  .insert(PABLO_ANTICIPATED.map(r => ({ candidate_id: PABLO_ID, ...r })))
  .select('id, topic, quality');
if (error) throw new Error('insert failed: ' + error.message);

console.log(`Seeded ${data.length} anticipated_questions rows for Pablo:`);
for (const r of data) console.log(`  - [${r.quality}] ${r.topic}`);
