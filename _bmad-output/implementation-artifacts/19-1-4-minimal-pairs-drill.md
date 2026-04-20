# Story 19.1.4: Minimal Pairs Drill

Status: done

## Story

As a self-learner, I want a drill that plays two similar-sounding words (e.g. "ship" vs "sheep") and asks me to identify which I heard, plus a mode where I say the target word and the app verifies my pronunciation — so I can train the specific phoneme contrasts I struggle with.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R9 — Speaking Core
**Story ID:** 19.1.4
**Dependencies:** 19.1.2 (scoring aligner + phoneme helper)

## Acceptance Criteria

1. **AC1** — New route `app/(app)/pronunciation/minimal-pairs/page.tsx` with two modes: **Listen** (identify which of two words was played) and **Speak** (say the highlighted word, get pass/fail).
2. **AC2** — Static seed dataset `lib/pronunciation/minimal-pairs.ts` exports ≥ 40 pairs across common contrasts: /ɪ/ vs /iː/, /æ/ vs /e/, /θ/ vs /s/, /v/ vs /w/, /l/ vs /r/, /ʃ/ vs /s/.
3. **AC3** — Listen mode uses existing `/api/voice/synthesize` with accent selector; user clicks which word they heard; immediate green/red feedback; 10-question session produces an accuracy report.
4. **AC4** — Speak mode uses 19.1.1 + 19.1.2 scoring (`overall ≥ 70` = pass); mispronounced words are added to a "focus queue" shown on next session.
5. **AC5** — Session results persist to `minimalPairsSession` table: `{ userId, mode, total, correct, focusTags: string[], createdAt }`.
6. **AC6** — A small "your weakest contrasts" block on the pronunciation page aggregates results across sessions and shows the top 3.

## Tasks

- [x] Task 1: Curate the seed dataset with phonetic tags (AC2).
- [x] Task 2: Build the Listen mode UI + logic (AC1, AC3).
- [x] Task 3: Build the Speak mode UI using existing scoring endpoint (AC4).
- [x] Task 4: Add `minimalPairsSession` schema + migration (AC5).
- [x] Task 5: Add weakness aggregator query + UI block (AC6).

### Review Findings

- [x] [Review][Patch] Add the listen-mode accent selector required by AC3 [apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx:57]
- [x] [Review][Patch] Persist and aggregate missed/weak tags instead of every tag in the session [apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx:193]
- [x] [Review][Patch] Avoid assigning full mixed-session totals to each tag in weakness aggregation [apps/web/app/api/pronunciation/minimal-pairs/route.ts:68]
- [x] [Review][Patch] Ensure focused drills still run 10 questions or clearly handle short focus pools [apps/web/lib/pronunciation/minimal-pairs.ts:92]
- [x] [Review][Patch] Await session save before refreshing weakest-contrast data [apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx:195]
- [x] [Review][Patch] Validate `focusTags` is an array of known string tags before saving [apps/web/app/api/pronunciation/minimal-pairs/route.ts:19]
- [x] [Review][Patch] End speak-mode evaluation when recording stops without an audio blob [apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx:137]
- [x] [Review][Patch] Do not record transcription/scoring infrastructure failures as pronunciation misses [apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx:171]
- [x] [Review][Patch] Aggregate weakest contrasts across all persisted sessions, not only the last 20 [apps/web/app/api/pronunciation/minimal-pairs/route.ts:60]

## Dev Notes

- Dataset format suggestion: `{ a: "ship", b: "sheep", contrast: "ɪ-iː", tag: "short-long-i" }`.
- Pre-warm TTS by pre-fetching both audio clips in parallel before the user is prompted to choose.
- Speak mode can reuse the scoring endpoint but the UI should be tighter (single-word) — no need for word-by-word chips.

## References

- Seed inspiration: [Okanagan minimal pairs list](https://en.wikipedia.org/wiki/Minimal_pair)
- Existing TTS: [apps/web/app/api/voice/synthesize/route.ts](apps/web/app/api/voice/synthesize/route.ts)

## File List

- `apps/web/lib/pronunciation/minimal-pairs.ts` — 42 pairs, 6 contrasts, shuffle/pick utilities (AC2)
- `packages/database/src/schema/index.ts` — Added `minimalPairsSession` table (AC5)
- `apps/web/lib/db/migrations/0013_minimal_pairs_session.sql` — Migration SQL
- `apps/web/lib/db/migrations/meta/_journal.json` — Journal entry
- `apps/web/app/api/pronunciation/minimal-pairs/route.ts` — POST save + GET weakness aggregation (AC5, AC6)
- `apps/web/app/(app)/pronunciation/minimal-pairs/page.tsx` — Drill UI with Listen + Speak modes (AC1, AC3, AC4)
- `apps/web/test/lib/minimal-pairs.test.ts` — 17 unit tests
- `apps/web/app/api/pronunciation/minimal-pairs/__tests__/route.test.ts` — Route-helper validation and aggregation tests

## Change Log

- 2026-04-20: Implemented all 5 tasks. Dataset, schema, API, UI (listen + speak), and tests complete.
- 2026-04-20: Resolved code review findings for accent selection, focused 10-question drills, missed-tag persistence, per-tag aggregation, save/refresh ordering, payload validation, and speak-mode retry handling.

## Dev Agent Record

### Completion Notes

- Dataset: 42 pairs across 6 contrasts (ɪ-iː, æ-e, θ-s, v-w, l-r, ʃ-s) — exceeds AC2's ≥40 requirement
- Listen mode: TTS plays target word, user clicks correct choice, immediate green/red feedback, auto-plays on question entry
- Speak mode: user records single word, transcribed via 19.1.1, scored via 19.1.2, pass threshold ≥70
- Focus queue: wrong tags from current session displayed at results, clickable to start focused drill
- Weakness aggregator: GET endpoint aggregates all persisted per-tag session stats and returns top 3 weakest
- Weakness block shown on drill setup page; clicking a tag starts a focused session
- Session persistence: POST saves to minimalPairsSession table with all AC5 fields plus per-tag stats for accurate aggregation
- All 20 focused minimal-pairs tests pass; broader project checks still have unrelated pre-existing failures
