-- ─────────────────────────────────────────────────────────
-- Phase 2: Candidate Training Tables
-- Run in Supabase SQL Editor
-- Does NOT modify: sessions, message_events, profiles
-- ─────────────────────────────────────────────────────────

-- 1. candidate_profiles — CV data and extracted structured info
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cv_data      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id)
);

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own profile"
  ON candidate_profiles FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own profile"
  ON candidate_profiles FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates update own profile"
  ON candidate_profiles FOR UPDATE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters read all candidate profiles"
  ON candidate_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );


-- 2. candidate_stories — STAR story library (up to 9 slots)
CREATE TABLE IF NOT EXISTS candidate_stories (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_type   TEXT        NOT NULL,
  situation    TEXT,
  task         TEXT,
  action       TEXT,
  result       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, story_type)
);

ALTER TABLE candidate_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own stories"
  ON candidate_stories FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own stories"
  ON candidate_stories FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates update own stories"
  ON candidate_stories FOR UPDATE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates delete own stories"
  ON candidate_stories FOR DELETE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters read all stories"
  ON candidate_stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );


-- 3. candidate_responses — open answers for modules 3-5
CREATE TABLE IF NOT EXISTS candidate_responses (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id            UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module                  TEXT        NOT NULL,
  question                TEXT        NOT NULL,
  answer_text             TEXT,
  answer_audio_transcript TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (candidate_id, module, question)
);

ALTER TABLE candidate_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own responses"
  ON candidate_responses FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own responses"
  ON candidate_responses FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates update own responses"
  ON candidate_responses FOR UPDATE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters read all responses"
  ON candidate_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );


-- 4. candidate_raw_data — uploads and free text (modules 6-10)
CREATE TABLE IF NOT EXISTS candidate_raw_data (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type   TEXT        NOT NULL,
  artifact_type TEXT,
  raw_text      TEXT,
  file_name     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE candidate_raw_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates read own raw data"
  ON candidate_raw_data FOR SELECT
  USING (auth.uid() = candidate_id);

CREATE POLICY "Candidates insert own raw data"
  ON candidate_raw_data FOR INSERT
  WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Candidates delete own raw data"
  ON candidate_raw_data FOR DELETE
  USING (auth.uid() = candidate_id);

CREATE POLICY "Recruiters read all raw data"
  ON candidate_raw_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'recruiter'
    )
  );


-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER candidate_stories_updated_at
  BEFORE UPDATE ON candidate_stories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
