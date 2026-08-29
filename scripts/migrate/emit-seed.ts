// Renders scripts/migrate/pablo-v3-data.ts into reviewable SQL.
//
// This script NEVER touches the database. It writes a .sql file that the user
// reviews and runs manually in the Supabase SQL editor.
//
//   npx tsx scripts/migrate/emit-seed.ts
//
// Output goes to supabase/seeds/ which is gitignored: the SQL contains a real
// profiles UUID, a real email and consulting-client detail, and this repo is public.

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  CANDIDATE_ID,
  profile,
  cvData,
  stories,
  context,
  objections,
  anticipated,
  evidence,
} from './pablo-v3-data';

/** Single-quote a value for SQL, or emit NULL. */
function q(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'NULL';
  return `'${v.replace(/'/g, "''")}'`;
}

/** JSON literal cast to jsonb. */
function j(v: unknown): string {
  return `${q(JSON.stringify(v))}::jsonb`;
}

const out: string[] = [];
const w = (s = '') => out.push(s);

w('-- ═══════════════════════════════════════════════════════════════════════════');
w('-- Pablo Agis Burgos — v2 → v3 profile seed');
w(`-- Generated ${new Date().toISOString()} by scripts/migrate/emit-seed.ts`);
w('-- Source of truth: scripts/migrate/pablo-v3-data.ts (extracted from branch `main`)');
w('--');
w('-- PREREQUISITE: run supabase/migrations/2026-07-30-story-ownership.sql first.');
w('-- This file adds no columns; it assumes candidate_stories.ownership and');
w('-- candidate_stories.boundaries already exist.');
w('--');
w('-- Idempotent: safe to re-run. Deletes only rows belonging to this candidate.');
w('-- Review before executing. Nothing here runs automatically.');
w('-- ═══════════════════════════════════════════════════════════════════════════');
w();
w('begin;');
w();

// ── guard ────────────────────────────────────────────────────────────────────
w('-- Abort loudly rather than seeding a candidate that does not exist.');
w('do $$');
w('begin');
w(`  if not exists (select 1 from public.profiles where id = ${q(CANDIDATE_ID)}) then`);
w(`    raise exception 'Candidate ${CANDIDATE_ID} not found in public.profiles';`);
w('  end if;');
w('end $$;');
w();

// ── profiles ─────────────────────────────────────────────────────────────────
w('-- ── profiles ───────────────────────────────────────────────────────────────');
w('-- UPDATE, never INSERT: the eval suite hardcodes this UUID');
w('-- (scripts/eval/candidates/pablo.ts). Recreating the row breaks the baseline.');
w('-- slug and published_at are already correct and are deliberately not touched.');
w('update public.profiles set');
w(`  full_name          = ${q(profile.full_name)},`);
w(`  headline           = ${q(profile.headline)},`);
w(`  notification_email = ${q(profile.notification_email)},`);
w(`  career_goal        = ${q(JSON.stringify(profile.career_goal))}`);
w(`where id = ${q(CANDIDATE_ID)};`);
w();

// ── candidate_profiles ───────────────────────────────────────────────────────
w('-- ── candidate_profiles.cv_data ─────────────────────────────────────────────');
w('insert into public.candidate_profiles (candidate_id, cv_data)');
w(`values (${q(CANDIDATE_ID)}, ${j(cvData)})`);
w('on conflict (candidate_id) do update set');
w('  cv_data    = excluded.cv_data,');
w('  updated_at = now();');
w();

// ── candidate_stories ────────────────────────────────────────────────────────
w('-- ── candidate_stories ──────────────────────────────────────────────────────');
w('-- 6 STAR stories from main:src/lib/stories-knowledge.ts. The two v2 entries with');
w("-- ownership 'narrative' (career progression, future vision) are not STAR stories:");
w('-- they land in candidate_context.career_narrative and profiles.career_goal.');
w('--');
w('-- `ownership` and `boundaries` are what stop the agent upgrading participated → led');
w('-- or quoting a metric it must not quote. They are the whole point of this migration.');
w(`delete from public.candidate_stories where candidate_id = ${q(CANDIDATE_ID)};`);
w();
for (const s of stories) {
  w(`-- ${s.story_type} (${s.ownership})`);
  w('insert into public.candidate_stories');
  w('  (candidate_id, story_type, ownership, situation, task, action, result, boundaries)');
  w('values (');
  w(`  ${q(CANDIDATE_ID)},`);
  w(`  ${q(s.story_type)},`);
  w(`  ${q(s.ownership)},`);
  w(`  ${q(s.situation)},`);
  w(`  ${q(s.task)},`);
  w(`  ${q(s.action)},`);
  w(`  ${q(s.result)},`);
  w(`  ${j(s.boundaries)}`);
  w(');');
  w();
}

// ── candidate_context ────────────────────────────────────────────────────────
w('-- ── candidate_context ──────────────────────────────────────────────────────');
w('-- career_narrative + communication_style (the VOICE section of v2) + hard_stops');
w('-- (the HARD_STOP_LIST, which had no home in the v3 model before this).');
w('insert into public.candidate_context (candidate_id, context)');
w(`values (${q(CANDIDATE_ID)}, ${j(context)})`);
w('on conflict (candidate_id) do update set');
w('  context      = excluded.context,');
w('  last_updated = now();');
w();

// ── candidate_objections ─────────────────────────────────────────────────────
w('-- ── candidate_objections ───────────────────────────────────────────────────');
w('-- Wipes the 4 AI-generated objections currently on the profile — they contain a');
w('-- factual error (they say Axel was a 2-month stay; it was 3 months, Mar–May 2025).');
w(`delete from public.candidate_objections where candidate_id = ${q(CANDIDATE_ID)};`);
w();
w('insert into public.candidate_objections');
w('  (candidate_id, type, concern, why, priority, how_to_surface, linked_module)');
w('values');
w(
  objections
    .map(
      (o) =>
        `  (${q(CANDIDATE_ID)}, ${q(o.type)}, ${q(o.concern)}, ${q(o.why)}, ${q(o.priority)}, ${q(o.how_to_surface)}, ${q(o.linked_module)})`
    )
    .join(',\n') + ';'
);
w();

// ── anticipated_questions ────────────────────────────────────────────────────
w('-- ── anticipated_questions ──────────────────────────────────────────────────');
w('-- The section header in candidate-prompt.ts states this list is EXHAUSTIVE: a role');
w('-- not listed has NO anticipated answer. That is why there is deliberately no entry');
w('-- for the Accor departure reason — main states none is written, and inventing a row');
w('-- here would be the exact failure the eval suite tests for.');
w(`delete from public.anticipated_questions where candidate_id = ${q(CANDIDATE_ID)};`);
w();
w('insert into public.anticipated_questions (candidate_id, topic, trigger_hint, answer, quality)');
w('values');
w(
  anticipated
    .map(
      (a) =>
        `  (${q(CANDIDATE_ID)}, ${q(a.topic)}, ${q(a.trigger_hint)}, ${q(a.answer)}, ${q(a.quality)})`
    )
    .join(',\n') + ';'
);
w();

// ── evidence_items ───────────────────────────────────────────────────────────
w('-- ── evidence_items ─────────────────────────────────────────────────────────');
w('-- Wipes the existing set, which includes a row asserting Pablo LED the FOLS');
w('-- migration. main:stories-knowledge.ts is explicit that he was an operational');
w('-- participant and never the lead — that row is a live hallucination in the profile.');
w(`delete from public.evidence_items where candidate_id = ${q(CANDIDATE_ID)};`);
w();
w(`-- ${evidence.length} rows. candidate-prompt.ts caps the prompt at MAX_EVIDENCE_ITEMS = 40,`);
w('-- so staying under 40 means nothing is silently dropped before reaching the agent.');
w('insert into public.evidence_items (candidate_id, node_key, content, quality, source)');
w('values');
w(
  evidence
    .map(
      (e) =>
        `  (${q(CANDIDATE_ID)}, ${q(e.node_key)}, ${q(e.content)}, ${q(e.quality)}, 'migration_v2')`
    )
    .join(',\n') + ';'
);
w();

// ── coverage_nodes ───────────────────────────────────────────────────────────
w('-- ── coverage_nodes ─────────────────────────────────────────────────────────');
w('-- Recomputed from evidence_items rather than hand-written, so the coverage map');
w('-- cannot claim a node is lit that the evidence does not actually support.');
w("--   verified: 2+ verified items   solid: 1 verified or 2+ solid   weak: 1 item   dark: none");
w('--');
w('-- signature_stories is fed by candidate_stories, not evidence_items — otherwise it');
w('-- would report dark while 6 fully-bounded STAR stories sit in the table.');
w('with items as (');
w('  select node_key, quality from public.evidence_items');
w(`  where candidate_id = ${q(CANDIDATE_ID)}`);
w('  union all');
w("  select 'signature_stories', 'verified' from public.candidate_stories");
w(`  where candidate_id = ${q(CANDIDATE_ID)}`);
w(')');
w('insert into public.coverage_nodes (candidate_id, node_key, state, score, updated_at)');
w('select');
w(`  ${q(CANDIDATE_ID)},`);
w('  n.node_key,');
w('  case');
w("    when count(*) filter (where e.quality = 'verified') >= 2 then 'verified'");
w("    when count(*) filter (where e.quality = 'verified') >= 1 then 'solid'");
w("    when count(e.node_key) >= 2 then 'solid'");
w("    when count(e.node_key) = 1 then 'weak'");
w("    else 'dark'");
w('  end,');
w('  case');
w("    when count(*) filter (where e.quality = 'verified') >= 2 then 3");
w("    when count(*) filter (where e.quality = 'verified') >= 1 then 2");
w('    when count(e.node_key) >= 2 then 2');
w('    when count(e.node_key) = 1 then 1');
w('    else 0');
w('  end,');
w('  now()');
w('from (values');
w(
  [
    'role_history',
    'signature_stories',
    'metrics_impact',
    'tools_systems',
    'failure_modes',
    'conflict_disagreement',
    'decision_style',
    'limits_gaps',
    'career_narrative',
    'company_fit',
    'constraints',
    'compensation',
  ]
    .map((k) => `  (${q(k)})`)
    .join(',\n') + '\n) as n(node_key)'
);
w('left join items e on e.node_key = n.node_key');
w('group by n.node_key');
w('on conflict (candidate_id, node_key) do update set');
w('  state      = excluded.state,');
w('  score      = excluded.score,');
w('  updated_at = now();');
w();

w('commit;');
w();

// ── verification block (not part of the transaction) ─────────────────────────
w('-- ── verification (run after committing) ────────────────────────────────────');
w("select 'stories' as t, count(*) from public.candidate_stories where candidate_id = " + q(CANDIDATE_ID));
w("union all select 'evidence', count(*) from public.evidence_items where candidate_id = " + q(CANDIDATE_ID));
w("union all select 'anticipated', count(*) from public.anticipated_questions where candidate_id = " + q(CANDIDATE_ID));
w("union all select 'objections', count(*) from public.candidate_objections where candidate_id = " + q(CANDIDATE_ID));
w("union all select 'nodes_lit', count(*) from public.coverage_nodes where candidate_id = " + q(CANDIDATE_ID) + " and state <> 'dark';");
w();
w('-- Expected: stories ' + stories.length + ', evidence ' + evidence.length + ', anticipated ' + anticipated.length + ', objections ' + objections.length + '.');
w();
w('-- No story may claim ownership it does not have. This must return zero rows.');
w('select story_type, ownership from public.candidate_stories');
w(`where candidate_id = ${q(CANDIDATE_ID)}`);
w("  and story_type in ('managing_change','lesson_learned')");
w("  and ownership <> 'participated';");

const dir = join(process.cwd(), 'supabase', 'seeds');
mkdirSync(dir, { recursive: true });
const path = join(dir, 'pablo-v3-seed.sql');
writeFileSync(path, out.join('\n') + '\n', 'utf8');

console.log(`Wrote ${path}`);
console.log(
  `  stories ${stories.length} · evidence ${evidence.length} · anticipated ${anticipated.length} · objections ${objections.length}`
);
console.log('\nThis file was NOT executed. Review it, then run it in the Supabase SQL editor.');
