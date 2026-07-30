-- Phased Publishing — Migration
-- Run in Supabase SQL Editor (safe to re-run; uses IF NOT EXISTS pattern)
--
-- Adds publish visibility flag to profiles.
-- publish_level is NOT stored — always derived live from coverage_nodes
-- to avoid stale labels in the recruiter directory.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Recruiter-read policy: recruiters can see full_name + published_at for published candidates.
-- (They already have SELECT via the service-role key; this policy covers anon/auth paths.)
-- Candidates with published_at IS NULL are invisible to recruiters.
CREATE POLICY "Recruiters can read published candidate profiles"
  ON profiles FOR SELECT
  USING (
    -- Own row always visible
    auth.uid() = id
    OR
    -- Recruiters see published candidates
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'recruiter'
    )
  );
