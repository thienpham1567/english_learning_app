-- Story 6.2: Add XP total column to user_streak table
ALTER TABLE user_streak ADD COLUMN IF NOT EXISTS xp_total INTEGER NOT NULL DEFAULT 0;
