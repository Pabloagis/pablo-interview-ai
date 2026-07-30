-- ─────────────────────────────────────────────────────────────────────────────
-- Evidence Items — persistent store for facts extracted from trainer conversations
-- Run in Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS / IF NOT EXISTS policies).
--
-- Why a new table (not candidate_stories / candidate_responses):
--   candidate_stories has a fixed STAR shape; candidate_responses has one fixed
--   question per row. Extracted evidence is a short free-form claim tied to a
--   coverage node. Forcing it into those tables would be lossy and would corrupt
--   the existing 10-step journey data.
--
-- Rows are APPEND-ONLY and never mutated. Multiple rows per node are expected and
-- correct — they are the audit trail of how the candidate's answers improved over
-- successive turns.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS evidence_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_key        TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  quality         TEXT        NOT NULL
                              CHECK (quality IN ('verified', 'solid', 'vague', 'missing_detail')),
  source          TEXT        NOT NULL DEFAULT 'trainer_conversation',
  source_question TEXT,       -- the trainer question that prompted this answer
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_items_candidate_node
  ON evidence_items (candidate_id, node_key);

ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;

-- Candidates read / insert / delete their OWN evidence.
-- No UPDATE policy — rows are immutable by design.
-- Subquerying profiles from a policy on evidence_items is safe (no recursion);
-- the recursion trap is only a policy ON profiles that subqueries profiles.
CREATE POLICY "Candidates read own evidence"
  ON evidence_items FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own evidence"
  ON evidence_items FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates delete own evidence"
  ON evidence_items FOR DELETE
  USING (auth.uid() = candidate_id);

-- NOTE: Recruiters intentionally get NO access. They see the agent's answers,
-- not the raw evidence log. Do not add a recruiter SELECT policy here.

-- Service role (used by /api/trainer/extract and /api/training/coverage) bypasses RLS.
