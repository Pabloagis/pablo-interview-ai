-- Remove recruiter mode — Migration
-- Run in Supabase SQL Editor (safe to re-run; uses IF EXISTS guards)
--
-- Removes:
--   • recruiter_id column from sessions
--   • recruiter_email_sent_at column from sessions
--   • company_name column from profiles
--   • role CHECK constraint update (removes 'recruiter' option)
--   • "Recruiters can read published candidate profiles" policy (also fixes
--     an RLS infinite-recursion risk: it subqueried profiles from a policy
--     on profiles — a pattern CLAUDE.md flags as fatal to auth)
--   • Replacement policy: candidates and service role only

-- ── sessions table ────────────────────────────────────────────────────────────

ALTER TABLE sessions
  DROP COLUMN IF EXISTS recruiter_id,
  DROP COLUMN IF EXISTS recruiter_email_sent_at;

-- ── profiles table ────────────────────────────────────────────────────────────

ALTER TABLE profiles
  DROP COLUMN IF EXISTS company_name;

-- Update the role CHECK constraint to only allow 'candidate'.
-- Drop + recreate because Postgres has no ALTER CONSTRAINT.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('candidate'));

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- Drop the recursive policy (subqueried profiles from a profiles policy).
DROP POLICY IF EXISTS "Recruiters can read published candidate profiles" ON profiles;

-- Replacement: users can read their own row; service role bypasses RLS.
-- If a broader policy already covers auth.uid() = id, this is a no-op.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Candidates can read own profile'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Candidates can read own profile"
        ON profiles FOR SELECT
        USING (auth.uid() = id)
    $p$;
  END IF;
END $$;
