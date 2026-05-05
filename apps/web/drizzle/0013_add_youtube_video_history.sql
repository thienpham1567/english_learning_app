-- Migration: 0013_add_youtube_video_history.sql
-- YouTube Learn: store user's watched video history with cached transcript

CREATE TABLE IF NOT EXISTS "youtube_video_history" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id"        text NOT NULL,
  "video_id"       text NOT NULL,
  "title"          text NOT NULL,
  "thumbnail_url"  text,
  "channel_title"  text,
  "duration_sec"   integer,
  "transcript"     jsonb NOT NULL DEFAULT '[]'::jsonb,
  "last_position"  integer NOT NULL DEFAULT 0,
  "created_at"     timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at"     timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "youtube_video_history_user_video_idx"
  ON "youtube_video_history" ("user_id", "video_id");

CREATE INDEX IF NOT EXISTS "youtube_video_history_user_updated_idx"
  ON "youtube_video_history" ("user_id", "updated_at" DESC);
