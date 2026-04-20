# Story 19.3.3: Listen-and-Summarize with AI Scoring

Status: ready-for-dev

## Story

As a self-learner, I want to listen to a passage (no transcript) and write a 3–5 sentence summary — then have AI compare my summary to the passage and score accuracy + key-idea coverage.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R11 — Listening Advanced
**Story ID:** 19.3.3
**Dependencies:** 19.2.1 (writing scoring prompt patterns)

## Acceptance Criteria

1. **AC1** — New mode `SummarizeMode.tsx` in listening: audio player (no transcript visible), textarea for summary, submit button.
2. **AC2** — `POST /api/listening/summary-score` accepts `{ exerciseId, summary }`, loads the passage from DB (ownership check), calls OpenAI structured output for `{ keyIdeas: string[], coverage: { idea, covered: bool, whereInSummary?: string }[], accuracyScore, coverageScore, concisenessScore, overall, feedback }`.
3. **AC3** — UI shows a color-coded "ideas covered" list after scoring and reveals the transcript only after submission.
4. **AC4** — Key ideas: 3–6 items, extracted from the passage by the same LLM call (deterministically — first ask for ideas, then compare).
5. **AC5** — Rate-limited 10/min/user. Summary cap: 400 words. Under 30 words → rejected with guidance.
6. **AC6** — Persist to `listeningSummaryAttempt`: `{ userId, exerciseId, summary, overall, keyIdeasJson, coverageJson, createdAt }`.

## Tasks

- [ ] Task 1: Add `SummarizeMode.tsx` and wire it into the listening page mode switcher (AC1, AC3).
- [ ] Task 2: Add `/api/listening/summary-score` (AC2, AC4, AC5).
- [ ] Task 3: Add `listeningSummaryAttempt` schema + migration (AC6).

## Dev Notes

- Reuse `AudioPlayer` from 19.3.2 so A-B loop and speed controls work here too.
- Use the same structured-output approach as 19.2.1; share prompt builders under `lib/prompts/`.
- Don't overfit "coverage" to exact word match — the LLM should judge semantic coverage.

## References

- Structured outputs: [platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Existing listening surface: [apps/web/app/(app)/listening/](apps/web/app/(app)/listening/)
