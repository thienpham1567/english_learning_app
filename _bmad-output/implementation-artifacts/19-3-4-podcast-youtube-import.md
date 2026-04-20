# Story 19.3.4: Podcast / YouTube Import (Whisper)

Status: ready-for-dev

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

- [ ] Task 1: Choose the YouTube downloader strategy and wire host allowlist (AC1).
- [ ] Task 2: Add Whisper call (AC2).
- [ ] Task 3: Add analysis call for vocab + quiz (AC3).
- [ ] Task 4: Add `listeningImport` schema + migration (AC4).
- [ ] Task 5: Build the import page with progress UI (AC5).
- [ ] Task 6: Add owner-only audio stream endpoint (AC6).

## Dev Notes

- ytdl-core is fine for personal use; failure modes (captcha, age-gated) should surface a clean error to the user.
- Whisper has a 25MB per-file limit — enforce upstream via `maxDurationSec` default of 10 minutes.
- Consider chunking > 10min audio in a later story; this story stays short-form.
- Cache the audio file so re-visiting an import is instant.

## References

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [ytdl-core (distube fork)](https://github.com/distubejs/ytdl-core)
