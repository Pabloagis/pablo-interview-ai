-- profiles table for multi-user auth platform
-- Run this in the Supabase SQL Editor
-- NOTE: Disable email confirmation in Supabase Auth → Settings → Email → "Confirm email" for immediate login after registration

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT        NOT NULL CHECK (role IN ('candidate', 'recruiter')),
  full_name    TEXT        NOT NULL,
  company_name TEXT,                    -- recruiters only
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
