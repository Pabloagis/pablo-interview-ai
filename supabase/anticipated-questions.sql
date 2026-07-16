-- ─────────────────────────────────────────────────────────────────────────────
-- Anticipated Questions — per-candidate, user-authored answers to questions a
-- recruiter is likely to probe (short tenure, employment gap, departure reason,
-- pivot). Replaces the hardcoded Axel/Soho code constants.
--
-- Run in Supabase SQL Editor (safe to re-run — DROP POLICY guards included).
--
-- LOAD-BEARING INVARIANT (enforced at the schema level):
--   quality ∈ ('solid','verified') ONLY. A vague / unsubstantiated answer must
--   never persist here — a vague anticipated answer is worse than none, because it
--   licenses the agent to speak with false confidence. The AI proposes the QUESTION;
--   the user authors the ANSWER; only substantiated answers land in this table.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS anticipated_questions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic         TEXT        NOT NULL,           -- short label, e.g. "Axel — short tenure"
  trigger_hint  TEXT        NOT NULL,           -- when it applies, e.g. "asked why Axel was short"
  answer        TEXT        NOT NULL,           -- the user's grounded answer, verbatim-in-substance
  quality       TEXT        NOT NULL CHECK (quality IN ('solid', 'verified')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anticipated_questions_candidate
  ON anticipated_questions (candidate_id);

ALTER TABLE anticipated_questions ENABLE ROW LEVEL SECURITY;

-- Candidate reads / writes their OWN rows only. No recruiter access (recruiters
-- experience these through the agent's answers, never the raw table).
-- Subquerying profiles from a policy on THIS table is safe; the recursion trap is
-- only a policy ON profiles that subqueries profiles.
DROP POLICY IF EXISTS "Candidates read own anticipated"   ON anticipated_questions;
DROP POLICY IF EXISTS "Candidates insert own anticipated"  ON anticipated_questions;
DROP POLICY IF EXISTS "Candidates update own anticipated"  ON anticipated_questions;
DROP POLICY IF EXISTS "Candidates delete own anticipated"  ON anticipated_questions;

CREATE POLICY "Candidates read own anticipated"
  ON anticipated_questions FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own anticipated"
  ON anticipated_questions FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates update own anticipated"
  ON anticipated_questions FOR UPDATE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates delete own anticipated"
  ON anticipated_questions FOR DELETE
  USING (auth.uid() = candidate_id);

-- updated_at trigger. Reuses update_updated_at() from phase2-candidate-training.sql,
-- but guarded so a missing function never aborts the table/policy creation above.
DROP TRIGGER IF EXISTS anticipated_questions_updated_at ON anticipated_questions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE TRIGGER anticipated_questions_updated_at
      BEFORE UPDATE ON anticipated_questions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  ELSE
    RAISE NOTICE 'update_updated_at() not found — skipping trigger (non-critical).';
  END IF;
END $$;

-- Service role (used by /api/chat prompt build + training routes) bypasses RLS.
