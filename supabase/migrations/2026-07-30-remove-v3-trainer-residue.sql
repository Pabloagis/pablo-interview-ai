-- ═══════════════════════════════════════════════════════════════════════════
-- Remove the last v3-trainer content, so only the v2-derived biography remains
--
-- The v2 → v3 seed replaces candidate_stories, evidence_items,
-- anticipated_questions, candidate_objections, candidate_context and
-- candidate_profiles.cv_data wholesale, and candidate_responses was cleared
-- separately. One table was never touched by any of that: candidate_raw_data.
--
-- It holds one row — a CV PDF uploaded through the v3 trainer on 2026-07-28 —
-- and it contradicts the verified record in two places:
--
--   CV says                                    verified record says
--   ────────────────────────────────────────   ──────────────────────────────
--   "Five years running front office           seven years
--    operations in London and Barcelona"
--   "25 units, two assets"                     24 units (18 in Raxó + 6 in
--                                              Pontevedra)
--
-- WHAT THIS DOES AND DOES NOT AFFECT
--   * candidate-prompt.ts selects only `source_type` from this table, never
--     `raw_text`. So this text does NOT reach the agent's mouth today, and
--     deleting it does not change any answer directly.
--   * It DOES feed the coverage model, which reads candidate_raw_data. Removing
--     it may lower the derived coverage readiness. That is the honest direction:
--     coverage should reflect the verified evidence, not an unverified upload.
--   * The CV itself is not lost — public/assets/Pablo_Agis_Burgos_CV.pdf on `main`,
--     plus the copy in interviewmind-backup-2026-07-29/raw-data-documentos/.
--
-- If you would rather keep the upload and correct it instead, skip this file and
-- re-upload a CV whose figures match the verified record. Deleting is the simpler
-- route to "one biography, not two", which is what you asked for.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Look at it first ───────────────────────────────────────────────────────
select id, source_type, artifact_type, file_name, created_at, length(raw_text) as chars
from public.candidate_raw_data
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d';


begin;

delete from public.candidate_raw_data
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d';

commit;


-- ── Verification: every table that carries biography, and where it came from ──
-- Expect: raw_data 0, responses 0, stories 6, evidence 40, anticipated 11,
--         objections 12. Everything non-zero is v2-derived.
select 'raw_data'    as t, count(*) from public.candidate_raw_data
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'responses',   count(*) from public.candidate_responses
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'stories',     count(*) from public.candidate_stories
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'evidence',    count(*) from public.evidence_items
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'anticipated', count(*) from public.anticipated_questions
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'objections',  count(*) from public.candidate_objections
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d';

-- Every evidence row must carry the migration marker. Anything else is trainer
-- residue that crept back in. Expect only ('migration_v2', 40).
select source, count(*) from public.evidence_items
where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
group by source;
