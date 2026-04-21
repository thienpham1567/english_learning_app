-- Migration: 0010_add_listening_import.sql
-- Story 19.3.4: Podcast / YouTube Import (AC4)

CREATE TABLE IF NOT EXISTS "listening_import" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"         text NOT NULL,
  "source_url"      text NOT NULL,
  "title"           text NOT NULL,
  "duration_sec"    integer NOT NULL,
  "transcript_json" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "key_vocab_json"  jsonb NOT NULL DEFAULT '[]'::jsonb,
  "quiz_json"       jsonb NOT NULL DEFAULT '[]'::jsonb,
  "audio_key"       text NOT NULL,
  "created_at"      timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "listening_import_user_created_idx"
  ON "listening_import" ("user_id", "created_at");
