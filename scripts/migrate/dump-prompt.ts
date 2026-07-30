// Dumps the system prompt v3 builds for a candidate, straight from the database.
//
//   npx tsx scripts/migrate/dump-prompt.ts <profiles.id> [outfile]
//
// Read-only. Used to verify prompt changes by inspecting the built artifact
// instead of spending a 40-case eval run on a change that should be a no-op.

import { writeFileSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { buildCandidateSystemPrompt } from '../../src/lib/candidate-prompt';

// Minimal .env.local reader. Deliberately not importing scripts/eval/env.ts:
// the eval suite is a frozen measuring instrument and nothing here should be
// able to change how it resolves its environment.
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (!m) continue;
  const val = m[2].trim().replace(/^["']|["']$/g, '');
  if (!(m[1] in process.env)) process.env[m[1]] = val;
}

const candidateId = process.argv[2];
const outfile = process.argv[3];

if (!candidateId) {
  console.error('usage: npx tsx scripts/migrate/dump-prompt.ts <profiles.id> [outfile]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // buildCandidateSystemPrompt is typed against the app's server client; the
  // service-role client exposes the same query surface it uses.
  const prompt = await buildCandidateSystemPrompt(
    candidateId,
    supabase as unknown as Parameters<typeof buildCandidateSystemPrompt>[1]
  );

  if (outfile) {
    writeFileSync(outfile, prompt, 'utf8');
    console.error(`Wrote ${outfile} — ${prompt.length} chars`);
  } else {
    console.log(prompt);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
