-- Migration: Add SRS fields to user_vocabulary + create user_skill_profile
-- Sprint 9, Stories 12.1 + 12.4

-- 1. Add SRS columns to user_vocabulary (with safe defaults for existing rows)
-- next_review defaults to far future so existing words don't flood the review queue
ALTER TABLE "user_vocabulary"
  ADD COLUMN IF NOT EXISTS "mastery_level" text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS "ease_factor" real NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS "interval" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "review_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_review" timestamp with time zone NOT NULL DEFAULT '2099-12-31T00:00:00Z';

-- 2. Index on next_review for efficient due-item queries
CREATE INDEX IF NOT EXISTS "user_vocabulary_next_review_idx"
  ON "user_vocabulary" ("user_id", "next_review");

-- 3. Create user_skill_profile table
CREATE TABLE IF NOT EXISTS "user_skill_profile" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "module" text NOT NULL,
  "current_level" real NOT NULL DEFAULT 5.0,
  "accuracy_last_10" real NOT NULL DEFAULT 0.7,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create unique index for user_skill_profile
CREATE UNIQUE INDEX IF NOT EXISTS "user_skill_profile_user_module_idx"
  ON "user_skill_profile" ("user_id", "module");
