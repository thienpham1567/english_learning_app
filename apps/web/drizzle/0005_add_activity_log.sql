-- Activity Log table for Progress Analytics (Story 9.1)
-- Tracks all learning activities with metadata for analytics queries.

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'flashcard_review',
    'grammar_quiz',
    'writing_practice',
    'daily_challenge',
    'chatbot_session',
    'voice_practice'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  activity_type activity_type NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_date
ON activity_log (user_id, created_at);
