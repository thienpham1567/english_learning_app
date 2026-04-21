-- Migration: 0011_add_reading_passage.sql
-- Story 19.4.1: CEFR-Graded Reader + Vocab Prioritization (AC1, AC3)

CREATE TABLE IF NOT EXISTS "reading_passage" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title"              text NOT NULL,
  "body"               text NOT NULL,
  "cefr_level"         text NOT NULL,
  "section"            text NOT NULL DEFAULT 'general',
  "word_count"         integer NOT NULL DEFAULT 0,
  "lexical_tags_json"  jsonb NOT NULL DEFAULT '[]'::jsonb,
  "created_at"         timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reading_passage_level_idx"
  ON "reading_passage" ("cefr_level");

CREATE TABLE IF NOT EXISTS "reading_progress" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"     text NOT NULL,
  "passage_id"  uuid NOT NULL REFERENCES "reading_passage"("id") ON DELETE CASCADE,
  "read_at"     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "reading_progress_user_passage_idx"
  ON "reading_progress" ("user_id", "passage_id");
