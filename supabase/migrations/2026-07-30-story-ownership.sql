-- ═══════════════════════════════════════════════════════════════════════════
-- candidate_stories: add `ownership` and `boundaries`
--
-- WHY THIS EXISTS
-- v2 (branch `main`) stored each STAR story with an explicit ownership level and
-- a STORY BOUNDARIES block — CAN SAY / CANNOT SAY / IF PUSHED. The v3 table has
-- only situation/task/action/result, so migrating v2 into v3 as-is would drop
-- exactly the fields that prevent hallucination:
--
--   * "Story ownership is sacred — never upgrade participated → led" (CLAUDE.md)
--     has no column to live in. The FOLS migration is the concrete case: Pablo was
--     an operational participant, and the profile currently holds an evidence row
--     claiming he LED it.
--   * The CANNOT SAY blocks (no Vienna time figures, no HubOS room counts, no
--     revenue percentage from an ongoing project) have nowhere to go.
--
-- Additive only. Existing rows get ownership = NULL and boundaries = NULL, and
-- candidate-prompt.ts renders nothing extra for them, so this is a no-op for any
-- candidate whose stories are not backfilled.
--
-- Run this BEFORE supabase/seeds/pablo-v3-seed.sql.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.candidate_stories
  add column if not exists ownership text,
  add column if not exists boundaries jsonb;

-- Named constraint so it is re-runnable: a plain CHECK in ADD COLUMN cannot be
-- guarded with IF NOT EXISTS.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'candidate_stories_ownership_check'
      and conrelid = 'public.candidate_stories'::regclass
  ) then
    alter table public.candidate_stories
      add constraint candidate_stories_ownership_check
      check (ownership is null or ownership in ('led','participated','observed','narrative'));
  end if;
end $$;

comment on column public.candidate_stories.ownership is
  'How the candidate actually participated. Never upgraded upward by any code path — '
  'the agent must not turn participated into led under recruiter pressure.';

comment on column public.candidate_stories.boundaries is
  'jsonb {can_say, cannot_say, if_pushed}: what may be said about this story, what may '
  'never be said (unverified metrics, ownership upgrades), and how to hold the line when pushed.';

-- No RLS change: candidate_stories policies are column-agnostic. Listed here so the
-- next reader does not have to check.
--   DROP POLICY IF EXISTS is not needed — no policy is created or replaced by this file.
