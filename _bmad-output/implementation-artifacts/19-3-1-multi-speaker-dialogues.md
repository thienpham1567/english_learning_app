# Story 19.3.1: Multi-Speaker Dialogues

Status: review

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

- [x] Task 1: Extend `VOICES` map with named roles: `us-f`, `us-m`, `uk-f`, `uk-m`, `au-f`, `au-m` (AC6).
- [x] Task 2: Migration: add nullable `dialogueTurnsJson` to `listeningExercise` (AC1).
- [x] Task 3: Implement `/api/listening/generate-dialogue` using structured output (AC2).
- [x] Task 4: Update `[id]/route.ts` to branch on dialogue path and concat buffers (AC3, AC4).
- [x] Task 5: Update Listening UI to render dialogue transcripts with speaker tags (AC5).

## Dev Agent Record

### Completion Notes
- Provider: stayed on Groq (`playai-tts`) per user direction — Google Cloud TTS was not introduced. The story's "Chirp 3 HD" / `lib/tts/google.ts` references were adapted to Groq voices in [apps/web/lib/tts/groq.ts](apps/web/lib/tts/groq.ts) without changing the file's name.
- Dialogue turns are synthesized as MP3 (`response_format: "mp3"`) and concatenated via raw byte concat (per Dev Notes) — legacy single-voice path keeps returning WAV. Voice-name assumptions (`atlas`, `celeste`, `briggs`, `tara`, `calum`, `hannah`) may need tuning once the Groq voice catalog is verified in your account.
- Disk cache is **opt-in** via `LISTENING_DIALOGUE_DISK_CACHE=1` to `apps/web/.cache/listening/<id>-<VOICE_SET_VERSION>.mp3`. `Cache-Control: public, max-age=604800` is always set. `VOICE_SET_VERSION` bumps invalidate cached audio.
- Audio endpoint requires auth + ownership; rate limit (5/min/user) preserved.
- UI additions: `DialogueGenerator` panel on idle state (topic/level/turns/speakers), `SpeakerLegend` above `AudioPlayer` when turns exist, and `DialogueTranscript` replaces the plain-passage transcript in `Results` when turns exist.
- Type-checked the listening-related paths; only pre-existing, unrelated errors remain (dictionary tests, axios import, exam-mode literal mismatch).

### File List
- `apps/web/lib/tts/groq.ts` (modified) — role map + `synthesizeTtsForVoice` + `VOICE_SET_VERSION`.
- `packages/database/src/schema/index.ts` (modified) — `dialogueTurnsJson` JSONB column + `DialogueTurn` type.
- `apps/web/drizzle/0009_add_listening_dialogue_turns.sql` (new) — migration.
- `apps/web/app/api/listening/generate-dialogue/route.ts` (new) — dialogue generation endpoint.
- `apps/web/app/api/listening/audio/[id]/route.ts` (modified) — dialogue branch + disk cache.
- `apps/web/lib/listening/types.ts` (modified) — dialogue request schema + response types.
- `apps/web/hooks/useListeningExercise.ts` (modified) — `generateDialogue` action.
- `apps/web/app/(app)/listening/_components/SpeakerLegend.tsx` (new) — legend + per-turn transcript.
- `apps/web/app/(app)/listening/_components/DialogueGenerator.tsx` (new) — idle-state generator form.
- `apps/web/app/(app)/listening/_components/Results.tsx` (modified) — renders `DialogueTranscript` when turns present.
- `apps/web/app/(app)/listening/page.tsx` (modified) — integrates DialogueGenerator + SpeakerLegend + passes turns to Results.
- `_bmad-output/implementation-artifacts/19-3-1-multi-speaker-dialogues.md` (modified).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified).

### Change Log
- 2026-04-20: Implemented Story 19.3.1. Adapted TTS approach to Groq (per user) instead of Google Chirp 3 HD; stored dialogue JSON on `listening_exercise`; server-side MP3 concat; added UI affordance for dialogue generation + speaker legend + labeled transcript reveal.

## Dev Notes

- MP3 frame concatenation works for all common players. If playback glitches appear at boundaries, add a short silent frame (~200ms) between turns — do not move to a proper mux library yet.
- Don't try to stream the audio; generate and cache the whole thing — these passages are short.
- Keep legacy single-voice exercises working. Dialogue is additive.

## References

- Chirp 3 HD voices: [cloud.google.com/text-to-speech/docs/chirp3-hd](https://cloud.google.com/text-to-speech/docs/chirp3-hd)
- Existing TTS module: [apps/web/lib/tts/google.ts](apps/web/lib/tts/google.ts)
- Existing listening audio route: [apps/web/app/api/listening/audio/[id]/route.ts](apps/web/app/api/listening/audio/[id]/route.ts)
