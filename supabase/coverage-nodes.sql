-- ─────────────────────────────────────────────────────────────────────────────
-- Coverage Nodes — materialized cache of agent evidence coverage
-- Run in Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS)
--
-- Choice: separate table over JSONB column on candidate_context.
-- Reasons from Prompt 0 audit:
--   1. candidate_context.context is already a write-heavy grab-bag (7+ keys).
--      Adding 12 coverage sub-keys inflates it further and makes JSONB path
--      extraction fragile.
--   2. Per-node updated_at + evidence_ids TEXT[] map naturally to rows, not
--      nested JSON.
--   3. A recruiter-facing session can read all 12 nodes in one indexed query
--      (WHERE candidate_id = X) instead of a JSONB path traversal.
--   4. Coverage is always derived (never source-of-truth), making upsert on
--      UNIQUE (candidate_id, node_key) the natural write pattern.
--
-- Note: candidate_objections and candidate_context DDL was not in source
-- control (audit finding). Add those CREATE TABLE statements to this file
-- or a separate migration if you ever need to recreate the DB from scratch.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coverage_nodes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_key     TEXT        NOT NULL,
  state        TEXT        NOT NULL DEFAULT 'dark'
                           CHECK (state IN ('dark', 'weak', 'solid', 'verified')),
  evidence_ids TEXT[]      NOT NULL DEFAULT '{}',
  score        SMALLINT    NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 3),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, node_key)
);

CREATE INDEX IF NOT EXISTS idx_coverage_nodes_candidate
  ON coverage_nodes (candidate_id);

ALTER TABLE coverage_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own coverage"
  ON coverage_nodes FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own coverage"
  ON coverage_nodes FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates update own coverage"
  ON coverage_nodes FOR UPDATE
  USING (auth.uid() = candidate_id);

-- Recruiters can read coverage nodes for any candidate they are evaluating.
-- (Same pattern as candidate_profiles, candidate_stories, etc.)
CREATE POLICY "Recruiters read all coverage"
  ON coverage_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'recruiter'
    )
  );

-- Service role (used by /api/chat and /api/training/coverage) bypasses RLS.
