# Story 19.3.4: Podcast / YouTube Import (Whisper)

Status: review

## Story

As a self-learner, I want to paste a YouTube or podcast URL and have the app extract the audio, transcribe it with Whisper, detect B2+ vocabulary, and turn it into a listening-practice exercise — so my listening material comes from real content I care about.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R11 — Listening Advanced
**Story ID:** 19.3.4
**Dependencies:** 19.1.1 (audio plumbing patterns)

## Acceptance Criteria

1. **AC1** — `POST /api/listening/import` accepts `{ url, maxDurationSec?: 600 }`. For YouTube, uses a server-side fetch of the audio stream (e.g. `@distube/ytdl-core` or `yt-dlp` subprocess). For direct audio URLs (mp3/m4a), fetches directly. URLs are validated against an allowlist of hosts.
2. **AC2** — Transcription via OpenAI Whisper API (`whisper-1`) with `response_format: "verbose_json"` to get word/segment timestamps.
3. **AC3** — A follow-up OpenAI call extracts: `{ title, summary, keyVocab: Array<{ term, partOfSpeech, meaning, example }>, comprehensionQuestions: Array<{ q, options, correctIndex }> }` (5 questions).
4. **AC4** — A new `listeningImport` table persists `{ userId, sourceUrl, title, durationSec, transcriptJson, keyVocabJson, quizJson, audioKey, createdAt }`. Audio file is stored under `apps/web/.cache/listening-imports/<audioKey>.mp3` (self-hosted). File > 25MB is rejected.
5. **AC5** — New page `app/(app)/listening/import/page.tsx`: URL input, progress states (fetching → transcribing → analyzing → done), then renders the exercise using the shared `AudioPlayer` + transcript scrubber + vocab panel + quiz.
6. **AC6** — Legal: the UI includes a short note that imports are for personal practice only and not redistributed. Server never serves the audio publicly — streamed only to the authenticated owner via `GET /api/listening/import/[id]/audio`.

## Tasks

- [x] Task 1: Choose the YouTube downloader strategy and wire host allowlist (AC1).
- [x] Task 2: Add Whisper call (AC2).
- [x] Task 3: Add analysis call for vocab + quiz (AC3).
- [x] Task 4: Add `listeningImport` schema + migration (AC4).
- [x] Task 5: Build the import page with progress UI (AC5).
- [x] Task 6: Add owner-only audio stream endpoint (AC6).

## Dev Agent Record

### Completion Notes

**Architecture decisions:**
- **yt-dlp subprocess** chosen over `@distube/ytdl-core` (Task 1): yt-dlp is more robust against YouTube rate-limiting, captcha, and age-gated content. Requires host install (`brew install yt-dlp ffmpeg`), but avoids npm dependency churn. `execFile` with 2-minute timeout.
- **Single import route** contains Tasks 1–3 (download → Whisper → analysis) as a sequential pipeline. The route is long-running (15–60s) but stays within Next.js API route limits. Future: move to a background job queue if needed.
- **Progress simulation** on the client (Task 5): since the server does all work in a single POST, the UI simulates stage transitions (fetching → transcribing → analyzing) on timers. Not perfectly accurate but gives users visual feedback.

**Key implementation details:**
- Host allowlist includes YouTube variants, plus a catch-all for direct audio file URLs (.mp3/.m4a/.wav/.ogg/.webm from any host).
- Whisper called via OpenAI SDK `openAiClient.audio.transcriptions.create()` with `verbose_json` + `segment` timestamps (consistent with existing `voice/transcribe` route pattern from 19.1.1).
- Analysis prompt instructs GPT to extract B2+ vocab only, with temperature=0.3 for consistency.
- Audio stream endpoint (`GET /api/listening/import/[id]/audio`) verifies ownership per request — never serves publicly (AC6).
- Legal disclaimer rendered in the idle state of the import page (AC6).
- Import page has 3-tab layout: transcript scrubber (with timestamps), vocabulary panel (term/POS/meaning/example), and quiz (MCQ with submit/results).
- Rate limit: 3/min/user (more restrictive than other routes due to heavy server-side work).

### File List
- `apps/web/app/api/listening/import/route.ts` (new) — import pipeline: URL validation, download, Whisper, analysis, persistence.
- `apps/web/app/api/listening/import/[id]/route.ts` (new) — GET detail endpoint for loading saved imports.
- `apps/web/app/api/listening/import/[id]/audio/route.ts` (new) — owner-only audio stream.
- `apps/web/app/(app)/listening/import/page.tsx` (new) — full import UI with progress + exercise view.
- `packages/database/src/schema/index.ts` (modified) — added `listeningImport` table + `ImportKeyVocab` type.
- `apps/web/drizzle/0010_add_listening_import.sql` (new) — migration SQL.

### Change Log
- 2026-04-21: Implemented Story 19.3.4. Full import pipeline, 3 API routes, UI page, schema + migration.

## Dev Notes

- ytdl-core is fine for personal use; failure modes (captcha, age-gated) should surface a clean error to the user.
- Whisper has a 25MB per-file limit — enforce upstream via `maxDurationSec` default of 10 minutes.
- Consider chunking > 10min audio in a later story; this story stays short-form.
- Cache the audio file so re-visiting an import is instant.

## References

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [ytdl-core (distube fork)](https://github.com/distubejs/ytdl-core)
