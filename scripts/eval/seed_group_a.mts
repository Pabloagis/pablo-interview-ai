// GROUP A — dataset alignment for the v3 Pablo candidate.
//   1. Delete non-Pablo evidence_items (a cybersecurity/cryptography persona leaked in).
//   2. Add the verified home city (Santiago de Compostela) to the education entry.
//   3. Seed Origin as a VERIFIED evidence_item (the same P8 verified-facts path) so the
//      agent can name Santiago — his real, verified home city.
// Verified facts only. Santiago is nameable BECAUSE it is true; no other city is added.
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

// ── 1. Delete the clearly non-Pablo evidence rows ─────────────────────────────
const { data: before } = await supabase.from('evidence_items')
  .select('id, node_key, content').eq('candidate_id', PABLO_ID);
const junk = (before ?? []).filter(r => /cybersecurity|cryptography|cryptograph/i.test(r.content));
console.log(`Found ${junk.length} non-Pablo rows to delete:`);
for (const r of junk) console.log(`  - [${r.node_key}] ${r.content}`);
if (junk.length) {
  const { error } = await supabase.from('evidence_items').delete().in('id', junk.map(r => r.id));
  if (error) throw new Error('delete failed: ' + error.message);
  console.log('  → deleted.');
}

// ── 2. Add home city to the education institution (truthful; CSHG is in Santiago) ──
const { data: cvRow } = await supabase.from('candidate_profiles')
  .select('cv_data').eq('candidate_id', PABLO_ID).single();
const cv = cvRow!.cv_data as { education?: Array<{ institution: string; degree: string; year: string }> };
let eduChanged = false;
for (const e of cv.education ?? []) {
  if (/hosteler/i.test(e.institution) && !/santiago/i.test(e.institution)) {
    e.institution = `${e.institution}, Santiago de Compostela`;
    eduChanged = true;
  }
}
if (eduChanged) {
  const { error } = await supabase.from('candidate_profiles')
    .update({ cv_data: cv, updated_at: new Date().toISOString() }).eq('candidate_id', PABLO_ID);
  if (error) throw new Error('cv update failed: ' + error.message);
  console.log('Education institution updated:', cv.education);
} else {
  console.log('Education already carries the city (no change).');
}

// ── 3. Seed Origin as a verified evidence_item (idempotent) ───────────────────
const ORIGIN = 'Originally from Galicia; home city is Santiago de Compostela.';
const { data: existingOrigin } = await supabase.from('evidence_items')
  .select('id').eq('candidate_id', PABLO_ID).eq('content', ORIGIN);
if (!existingOrigin?.length) {
  const { error } = await supabase.from('evidence_items').insert({
    candidate_id: PABLO_ID,
    node_key: 'career_narrative',
    content: ORIGIN,
    quality: 'verified',
    source: 'seed_verified',
    source_question: null,
  });
  if (error) throw new Error('origin insert failed: ' + error.message);
  console.log('Origin evidence seeded (verified).');
} else {
  console.log('Origin evidence already present (no change).');
}

console.log('\nGroup A data alignment complete.');
