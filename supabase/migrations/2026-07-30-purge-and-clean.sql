-- ═══════════════════════════════════════════════════════════════════════════
-- v2 → v3 cutover: purge history and drop dead schema
--
-- ⛔ DESTRUCTIVE AND IRREVERSIBLE. Read every section before running any of it.
--
-- ⛔ PRECONDITION — DO NOT RUN THIS BEFORE THE v3 CODE IS DEPLOYED.
--    `main` and `dev` share ONE Supabase project. interviewmind.one is currently
--    served by v2, and v2 reads the columns dropped below. Running this first
--    puts production into 500s the moment it commits.
--    Correct order:  deploy v3 to main  →  confirm the site is healthy  →  run this.
--
-- ⛔ PRECONDITION — the following code must already be gone or changed, or the
--    live app will start erroring on write:
--      src/app/api/chat/route.ts            insert into message_events (~L288-301)
--      src/app/api/save-message/route.ts    insert into message_events (deleted in cutover)
--      src/app/api/recruiter/sessions/route.ts   `consent_to_email: false` on insert (~L60)
--      src/app/api/session/route.ts         `consent_to_email` (deleted in cutover)
--      src/app/api/exit-notify|send-followup|test-followup|inactivity-check   (deleted in cutover)
--      src/app/api/cron/expire-sessions/route.ts   (deleted in cutover)
--      scripts/send-test-emails.ts          email_html / email_sent_at / consent_to_email
--
-- BACKUP: /Users/agis/Documents/interviewmind-backup-2026-07-29/
--    All 16 tables as JSON + schema-snapshot-pre-migration.sql.
--    Taken 2026-07-29, before any of this. Row counts verified against the audit.
--
-- Each section is independent. Run them one at a time, checking in between.
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 0 — Look before deleting. Run this ALONE first, change nothing.
-- ───────────────────────────────────────────────────────────────────────────

select 'sessions'       as t, count(*) from public.sessions
union all select 'memory',         count(*) from public.memory
union all select 'message_events', count(*) from public.message_events
union all select 'usage_events',   count(*) from public.usage_events;

-- Breakdown of what the TRUNCATE in section 1 destroys.
select
  source,
  candidate_id is not null as has_candidate,
  count(*)                 as sessions,
  min(created_at)::date    as first,
  max(created_at)::date    as last
from public.sessions
group by 1, 2
order by 1, 2;

-- Sanity check that nobody but Pablo is in here. Expect exactly the two known rows.
-- If this returns a profile you do not recognise, STOP — a real user exists and
-- the purge has to be rethought.
--
-- NOTE: public.profiles has NO `email` column — identity emails live in auth.users,
-- and profiles carries `notification_email` (where reports are sent), which is a
-- different thing. An earlier version of this file selected profiles.email and
-- failed with 42703. Joining auth.users gives the login address as well.
select p.id, u.email as login_email, p.notification_email, p.full_name,
       p.slug, p.role, p.created_at
from public.profiles p
left join auth.users u on u.id = p.id
order by p.created_at;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 1 — Purge all conversation history
--
-- Live counts read on 2026-07-31, immediately before handing this over:
--   1589 sessions total
--     383  source='owner', no candidate_id   14 May – 29 Jul   ← REAL v2 recruiter
--                                                                conversations
--    1199  source='owner', with candidate_id 15 Jul – 30 Jul   ← eval suite noise
--       7  source='public'                   29 Jul            ← tests of the new flow
--
-- Those 383 are the only ones with human content in them, and destroying them was
-- a deliberate decision, not a side effect.
--
-- The CASCADE reaches exactly two tables, confirmed against pg_constraint on
-- 2026-07-31 — `memory` and `message_events`, both ON DELETE CASCADE. There is no
-- third dependant, so nothing else is destroyed by surprise.
--
-- The eval suite writes fresh sessions on every run, so it is unaffected.
-- ───────────────────────────────────────────────────────────────────────────

truncate table public.sessions cascade;

-- Expect 0, 0, 0.
select 'sessions' as t, count(*) from public.sessions
union all select 'memory',         count(*) from public.memory
union all select 'message_events', count(*) from public.message_events;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 2 — Drop message_events
--
-- Write-only table: two inserts in the codebase, zero reads anywhere in either
-- branch. It has never been queried by anything.
-- ───────────────────────────────────────────────────────────────────────────

drop table if exists public.message_events;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 3 — Drop the dead columns on sessions
--
--   transcript       never read or written; transcripts are built from
--                    sessions.messages (JSONB). Already documented in CLAUDE.md.
--   email            \
--   consent_to_email  |  the v2 recruiter follow-up email chain, replaced in v3
--   email_sent_at     |  by recruiter_email + report_sent_at.
--   email_html       /
--
-- NOT dropped, deliberately: sessions.company and sessions.role. They duplicate
-- recruiter_company / recruiter_role, but scripts/eval/targets.ts writes them
-- (~L80-85). Dropping them breaks the measuring instrument, which is frozen for
-- this migration. They come out in a separate pass, after a measurement.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.sessions
  drop column if exists transcript,
  drop column if exists email,
  drop column if exists consent_to_email,
  drop column if exists email_sent_at,
  drop column if exists email_html;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 4 — Drop candidate_objections.addressed
--
-- Never read by candidate-prompt.ts. The only `addressed` the live code touches
-- is candidate_context.context.recruiter_concerns.addressed, which is JSONB in a
-- different table and is NOT affected by this.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.candidate_objections
  drop column if exists addressed;


-- ───────────────────────────────────────────────────────────────────────────
-- SECTION 5 — Final verification
-- ───────────────────────────────────────────────────────────────────────────

-- Dropped columns must be absent. Expect zero rows.
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'sessions' and column_name in
      ('transcript','email','consent_to_email','email_sent_at','email_html'))
    or (table_name = 'candidate_objections' and column_name = 'addressed')
  );

-- message_events must be gone. Expect zero rows.
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'message_events';

-- Pablo's profile must be untouched by all of the above.
-- Expect: stories 6, evidence 40, anticipated 11, objections 12, nodes_lit 11.
-- (Read off the live database on 2026-07-31, immediately before handing this over.)
select 'stories' as t, count(*) from public.candidate_stories
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'evidence', count(*) from public.evidence_items
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'anticipated', count(*) from public.anticipated_questions
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'objections', count(*) from public.candidate_objections
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d'
union all select 'nodes_lit', count(*) from public.coverage_nodes
  where candidate_id = 'a838e0a4-77e5-43b2-86ac-831bfdce959d' and state <> 'dark';

-- No policy is created, replaced or dropped by this file, so there is no
-- CREATE POLICY here and therefore no DROP POLICY IF EXISTS guard to write.
-- RLS on every remaining table is unchanged.
