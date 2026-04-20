# Story 19.3.1: Multi-Speaker Dialogues

Status: ready-for-dev

## Story

As a self-learner, I want listening exercises that feature conversations between 2–3 distinct voices (US/UK/AU mix) — so I train my ear for turn-taking and accent variety, not just a single narrator.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R11 — Listening Advanced
**Story ID:** 19.3.1
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — `listeningExercise` schema extended with an optional `dialogueTurnsJson` column: `Array<{ speaker: "A"|"B"|"C", accent: "us"|"uk"|"au", voiceName: string, text: string }>`. When present, the exercise renders as a dialogue; when absent, the existing single-voice path is used.
2. **AC2** — `POST /api/listening/generate-dialogue` accepts `{ topic, level, turns?: 6|8|10 (default 8), speakers?: 2|3 (default 2) }` and returns a structured dialogue + full passage (concatenated) for backward compat.
3. **AC3** — `GET /api/listening/audio/[id]?accent=...` supports the dialogue path: it generates per-turn audio using `synthesizeGoogleTts` with alternating voices and concatenates the MP3 buffers server-side (simple byte concat of MP3 frames — acceptable for self-study).
4. **AC4** — Generated audio is cached per `(exerciseId, voiceSetVersion)` using the existing `Cache-Control: public, max-age=604800` + optional disk cache under `apps/web/.cache/listening/` (opt-in, dev-safe).
5. **AC5** — The UI shows a speaker legend (A = Aoede/US-F, B = Charon/UK-M, etc.) and a transcript-reveal that labels each turn with its speaker.
6. **AC6** — Per-voice assignment in `lib/tts/google.ts` expanded: add at least 2 male + 2 female Chirp 3 HD voices across US/UK/AU to support role variety.

## Tasks

- [ ] Task 1: Extend `VOICES` map with named roles: `us-f`, `us-m`, `uk-f`, `uk-m`, `au-f`, `au-m` (AC6).
- [ ] Task 2: Migration: add nullable `dialogueTurnsJson` to `listeningExercise` (AC1).
- [ ] Task 3: Implement `/api/listening/generate-dialogue` using structured output (AC2).
- [ ] Task 4: Update `[id]/route.ts` to branch on dialogue path and concat buffers (AC3, AC4).
- [ ] Task 5: Update Listening UI to render dialogue transcripts with speaker tags (AC5).

## Dev Notes

- MP3 frame concatenation works for all common players. If playback glitches appear at boundaries, add a short silent frame (~200ms) between turns — do not move to a proper mux library yet.
- Don't try to stream the audio; generate and cache the whole thing — these passages are short.
- Keep legacy single-voice exercises working. Dialogue is additive.

## References

- Chirp 3 HD voices: [cloud.google.com/text-to-speech/docs/chirp3-hd](https://cloud.google.com/text-to-speech/docs/chirp3-hd)
- Existing TTS module: [apps/web/lib/tts/google.ts](apps/web/lib/tts/google.ts)
- Existing listening audio route: [apps/web/app/api/listening/audio/[id]/route.ts](apps/web/app/api/listening/audio/[id]/route.ts)
