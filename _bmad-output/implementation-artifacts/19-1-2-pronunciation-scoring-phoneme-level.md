# Story 19.1.2: Pronunciation Scoring (Phoneme-Level)

Status: done

## Story

As a self-learner, I want each word I read aloud to be scored against the reference text so I know which sounds I mispronounced and can target them in practice.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R9 — Speaking Core
**Story ID:** 19.1.2
**Dependencies:** 19.1.1 (STT integration)

## Acceptance Criteria

1. **AC1** — `POST /api/pronunciation/score` accepts `{ audioBlob, referenceText, accent }` and returns `{ overall: 0-100, wordScores: Array<{ word, score, status: "ok"|"slightly-off"|"wrong", expectedPhonemes?, actualPhonemes? }>, transcript }`.
2. **AC2** — Scoring algorithm: (a) transcribe audio via 19.1.1; (b) align transcript words to `referenceText` using a Levenshtein-based aligner; (c) for each reference word, score = 100 if exact match (case-insensitive), 60 if close match (edit distance ≤ 2 or phoneme distance ≤ 1), 0 otherwise; (d) overall = weighted average by word length.
3. **AC3** — Phoneme lookup uses the CMU Pronouncing Dictionary (`cmudict`) for `en-US`; a small helper `lib/pronunciation/phonemes.ts` exposes `wordToPhonemes(word): string[] | null`.
4. **AC4** — The `/pronunciation` page gets a "Record & Score" section: record with `useVoiceRecorder`, submit to the endpoint, render word-by-word colored chips (green/yellow/red) with expected vs. actual phonemes on hover.
5. **AC5** — Errors are user-friendly: no-speech, audio-too-short, off-topic (transcript < 30% overlap with reference).
6. **AC6** — Score persists to `pronunciationAttempt` table: `{ userId, referenceText, transcript, overall, createdAt }` (new Drizzle schema in `packages/database`).

## Tasks

- [ ] Task 1: Add `cmudict` dependency, write `lib/pronunciation/phonemes.ts` with a lazy-loaded trie/map (AC3).
- [ ] Task 2: Add aligner `lib/pronunciation/align.ts` — word-level Levenshtein + phoneme distance helper (AC2).
- [ ] Task 3: Add endpoint `app/api/pronunciation/score/route.ts` (AC1, AC2, AC5).
- [ ] Task 4: Add Drizzle schema `pronunciationAttempt` and migration (AC6).
- [ ] Task 5: Extend `apps/web/app/(app)/pronunciation/page.tsx` with the Record & Score UI (AC4).
- [ ] Task 6: Add unit tests for the aligner (exact, near-miss, totally wrong cases).

## Dev Notes

- Keep phoneme comparison simple; do NOT pull in Montreal Forced Aligner or Kaldi. A dictionary lookup + ARPAbet edit distance is sufficient for self-study feedback.
- Word-time offsets from 19.1.1 are available but not required for this story — may be used for timing feedback in a later iteration.
- Match the Google STT transcript's casing/punctuation cleanly before aligning: strip punctuation, lowercase, collapse whitespace.
- Keep the Drizzle schema minimal; no composite indexes yet.

## References

- [CMU Pronouncing Dictionary (npm cmudict)](https://www.npmjs.com/package/cmudict)
- ARPAbet phoneme set: [en.wikipedia.org/wiki/ARPABET](https://en.wikipedia.org/wiki/ARPABET)
- Existing pronunciation page: [apps/web/app/(app)/pronunciation/page.tsx](apps/web/app/(app)/pronunciation/page.tsx)

### Review Findings

- [x] [Review][Patch] Rate limit map memory leak — eviction added [score/route.ts:30]
- [x] [Review][Patch] Tokenize drops accented loanwords (café, naïve) [align.ts:27]
- [x] [Review][Patch] transcriptOverlap can exceed 1.0 [align.ts:163]
- [x] [Review][Patch] AC2 scoring hybrid threshold (dist<=2 || sim>=0.7) [align.ts:119]
- [x] [Review][Patch] AC5 no-speech error not explicitly handled [score/route.ts:55]
- [x] [Review][Patch] Empty recording blob guard missing [page.tsx:144]
- [x] [Review][Patch] setState on unmounted component during recording [page.tsx:139]
- [x] [Review][Defer] In-memory rate limiter doesn't work across instances — deferred, pre-existing
- [x] [Review][Defer] AC1 input shape differs from spec (audioBlob → spokenText split) — deferred, architectural decision
