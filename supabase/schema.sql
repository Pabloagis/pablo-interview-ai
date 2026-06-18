-- InterviewMind v2 — Supabase Schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New Query)
-- Run in this exact order.

-- ============================================================
-- 1. Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS vector;


-- ============================================================
-- 2. sessions — one row per recruiter conversation
-- ============================================================
CREATE TABLE sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_name TEXT,
  company      TEXT,
  role         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  messages     JSONB       NOT NULL DEFAULT '[]',   -- Anthropic message array [{role, content}]
  transcript   TEXT                                 -- optional cached export
);

CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);


-- ============================================================
-- 3. memory — semantic memory store with pgvector embeddings
-- ============================================================
CREATE TABLE memory (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recruiter_name TEXT,
  company        TEXT,
  content        TEXT        NOT NULL,
  type           TEXT        NOT NULL CHECK (type IN (
                               'user_message',
                               'assistant_response',
                               'recruiter_info',
                               'conversation_pattern'
                             )),
  embedding      vector(1536),           -- OpenAI text-embedding-3-small
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memory_session_id ON memory(session_id);
CREATE INDEX idx_memory_type       ON memory(type);

-- IVFFlat index for fast approximate nearest-neighbour search.
-- Requires at least one row before it can be created.
-- If you get an error here, run it again after inserting the first session.
CREATE INDEX idx_memory_embedding  ON memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- ============================================================
-- 4. search_memory() — semantic similarity search
-- ============================================================
CREATE OR REPLACE FUNCTION search_memory(
  p_session_id      UUID,
  p_query_embedding vector(1536),
  p_limit           INT DEFAULT 5
)
RETURNS TABLE (
  id         UUID,
  content    TEXT,
  type       TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memory.id,
    memory.content,
    memory.type,
    (1 - (memory.embedding <=> p_query_embedding))::FLOAT AS similarity
  FROM memory
  WHERE memory.session_id = p_session_id
    AND memory.embedding  IS NOT NULL
  ORDER BY memory.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;


-- ============================================================
-- 5. Row Level Security (optional — app uses service role key)
-- ============================================================
-- The API routes use SUPABASE_SERVICE_KEY which bypasses RLS.
-- Enable RLS only if you later add user authentication.

-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memory   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 6. Migrations — run these in Supabase SQL Editor
-- ============================================================

-- Added: email capture + GDPR consent (2026-05-19)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS consent_to_email BOOLEAN NOT NULL DEFAULT FALSE;

-- Added: email send tracking (2026-05-19)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Added: email preview HTML storage (2026-05-21)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS email_html TEXT;

-- Added: per-message event log for real-time monitoring (2026-05-22)
-- Stores every message as it is sent, with denormalized session context.
CREATE TABLE IF NOT EXISTS message_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recruiter_name TEXT,
  email          TEXT,
  company        TEXT,
  role           TEXT,                          -- recruiter's job role
  message_role   TEXT        NOT NULL CHECK (message_role IN ('user', 'assistant')),
  content        TEXT        NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_events_session_id ON message_events(session_id);
CREATE INDEX IF NOT EXISTS idx_message_events_created_at ON message_events(created_at DESC);

-- Added: link sessions to a candidate profile for multi-candidate dynamic prompts (2026-06-06)
-- NULL = Pablo fallback (v2 behaviour). Set to a profiles.id UUID to use that candidate's training data.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS candidate_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_candidate_id ON sessions(candidate_id);

-- Added: link sessions to the authenticated recruiter who created them (2026-06-06)
-- Enables interview history per recruiter and recruiter-initiated session flow.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_recruiter_id ON sessions(recruiter_id);

