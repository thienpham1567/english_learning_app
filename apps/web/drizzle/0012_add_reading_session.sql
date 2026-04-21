-- Migration: 0012_add_reading_session.sql
-- Story 19.4.3: Extensive Reading Tracker (AC1, AC6)

CREATE TABLE IF NOT EXISTS "reading_session" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"       text NOT NULL,
  "passage_id"    uuid NOT NULL REFERENCES "reading_passage"("id") ON DELETE CASCADE,
  "word_count"    integer NOT NULL DEFAULT 0,
  "started_at"    timestamp with time zone DEFAULT now() NOT NULL,
  "ended_at"      timestamp with time zone,
  "completed_at"  timestamp with time zone,
  "scroll_pct"    integer NOT NULL DEFAULT 0,
  "click_count"   integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "reading_session_user_completed_idx"
  ON "reading_session" ("user_id", "completed_at");

CREATE INDEX IF NOT EXISTS "reading_session_user_started_idx"
  ON "reading_session" ("user_id", "started_at");
