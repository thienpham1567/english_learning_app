-- Migration: 0010_add_listening_summary_attempt.sql
-- Story 19.3.3: Listen-and-Summarize with AI Scoring (AC6)

CREATE TABLE IF NOT EXISTS "listening_summary_attempt" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"           text NOT NULL,
  "exercise_id"       uuid NOT NULL REFERENCES "listening_exercise"("id") ON DELETE CASCADE,
  "summary"           text NOT NULL,
  "overall"           real NOT NULL,
  "accuracy_score"    real NOT NULL,
  "coverage_score"    real NOT NULL,
  "conciseness_score" real NOT NULL,
  "key_ideas_json"    jsonb NOT NULL DEFAULT '[]'::jsonb,
  "coverage_json"     jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at"        timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "listening_summary_attempt_user_created_idx"
  ON "listening_summary_attempt" ("user_id", "created_at");

CREATE INDEX IF NOT EXISTS "listening_summary_attempt_exercise_idx"
  ON "listening_summary_attempt" ("exercise_id");
