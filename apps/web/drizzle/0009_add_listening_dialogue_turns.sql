-- Multi-speaker dialogue support for listening_exercise (Story 19.3.1)
-- Adds a nullable JSONB column holding per-turn dialogue data.
-- When NULL, legacy single-voice rendering is used.

ALTER TABLE listening_exercise
  ADD COLUMN IF NOT EXISTS dialogue_turns_json JSONB;
