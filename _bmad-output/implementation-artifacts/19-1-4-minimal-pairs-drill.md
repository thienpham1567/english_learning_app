# Story 19.1.4: Minimal Pairs Drill

Status: ready-for-dev

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

- [ ] Task 1: Curate the seed dataset with phonetic tags (AC2).
- [ ] Task 2: Build the Listen mode UI + logic (AC1, AC3).
- [ ] Task 3: Build the Speak mode UI using existing scoring endpoint (AC4).
- [ ] Task 4: Add `minimalPairsSession` schema + migration (AC5).
- [ ] Task 5: Add weakness aggregator query + UI block (AC6).

## Dev Notes

- Dataset format suggestion: `{ a: "ship", b: "sheep", contrast: "ɪ-iː", tag: "short-long-i" }`.
- Pre-warm TTS by pre-fetching both audio clips in parallel before the user is prompted to choose.
- Speak mode can reuse the scoring endpoint but the UI should be tighter (single-word) — no need for word-by-word chips.

## References

- Seed inspiration: [Okanagan minimal pairs list](https://en.wikipedia.org/wiki/Minimal_pair)
- Existing TTS: [apps/web/app/api/voice/synthesize/route.ts](apps/web/app/api/voice/synthesize/route.ts)
