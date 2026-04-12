-- Listening Exercise table for Listening Practice Module (Story 10.1)
-- Stores AI-generated audio exercises with MCQ questions.

-- Extend activity_type enum with listening_practice
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'listening_practice';

CREATE TABLE IF NOT EXISTS listening_exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  level TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  passage TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB,
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listening_exercise_user_date
ON listening_exercise (user_id, created_at);
