-- ─────────────────────────────────────────────────────────────────────────────
-- Evidence supersession — lets a candidate's agent be CORRECTED over time.
-- Run in the Supabase SQL editor. Safe to re-run.
--
-- Why:
--   evidence_items was append-only. An agent could accumulate facts but never
--   retire one, so "I left that company" landed NEXT TO "I work there" and both
--   reached the agent's mouth as true. This adds retirement, not mutation:
--   content is still never rewritten. A row is retired by pointing at the row
--   that replaced it, which keeps the full audit trail intact.
--
-- Deliberately NO update policy for candidates. Retirement is written only by
-- /api/trainer/supersede using the service-role client (RLS bypassed), after the
-- candidate has explicitly confirmed the replacement in the trainer chat. The
-- browser still cannot mutate a single row.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE evidence_items
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES evidence_items(id) ON DELETE SET NULL;

-- Live rows are the hot path: every prompt build and coverage recompute reads
-- exactly this set.
CREATE INDEX IF NOT EXISTS idx_evidence_items_live
  ON evidence_items (candidate_id, node_key)
  WHERE superseded_at IS NULL;

-- Finding "which rows did this update replace" — used to render [RECENT_UPDATES].
CREATE INDEX IF NOT EXISTS idx_evidence_items_superseded_by
  ON evidence_items (superseded_by)
  WHERE superseded_by IS NOT NULL;
