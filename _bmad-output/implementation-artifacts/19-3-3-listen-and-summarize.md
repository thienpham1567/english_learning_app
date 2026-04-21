# Story 19.3.3: Listen-and-Summarize with AI Scoring

Status: done

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

- [x] Task 1: Add `SummarizeMode.tsx` and wire it into the listening page mode switcher (AC1, AC3).
- [x] Task 2: Add `/api/listening/summary-score` (AC2, AC4, AC5).
- [x] Task 3: Add `listeningSummaryAttempt` schema + migration (AC6).

### Review Findings

- [x] [Review][Decision] **SummarizeMode hardcodes `level: "b1"`** — Resolved (a): added compact inline CEFR level picker (A1–C2) to idle state; `selectedLevel` (default B1) passed to generate call.
- [x] [Review][Patch] **Rate limit consumed before input validation** — Fixed: `checkRateLimit()` moved to after Zod + word-count guard.
- [x] [Review][Patch] **Fragile error message extraction** — Fixed: extraction now follows `response.data.error → message → fallback` chain.
- [x] [Review][Patch] **UI label "transcript" instead of "passage"** — Fixed: renamed to "Xem đoạn văn gốc" everywhere.
- [x] [Review][Patch] **Migration numbered `0010` but `0009` missing** — Fixed: renamed to `0009_add_listening_summary_attempt.sql`.
- [x] [Review][Defer] **`entry.count++` mutates rate-limit map entry in-place** [route.ts:L36] — Relies on object reference semantics; technically correct but non-obvious. Pre-existing pattern in the codebase.
- [x] [Review][Defer] **No "player finished" auto-advance to writing state** [SummarizeMode.tsx] — Users must click "Đã nghe xong" button manually; player completion doesn't trigger transition. Acceptable UX for v1.
- [x] [Review][Defer] **`whereInSummary` in JSONB has no length cap** [route.ts:L206] — AI could return a very long string; low severity for a learning app.
- [x] [Review][Defer] **Passage always revealed server-side regardless of client state** [route.ts:L220] — The reveal gate is client-only; server always returns passage. Intentional design simplicity.

## Dev Agent Record

### Completion Notes
- Created `SummarizeMode.tsx` with audio player (reusing 19.3.2 `AudioPlayer` — learners get A-B loop + speed for free), "start writing" gate, word count indicator (30–400), score result with color-coded key ideas coverage, and toggle transcript reveal.
- Wired `SummarizeMode` into `listening/page.tsx` as a 4th tab ("Tóm tắt") alongside listening/shadowing/dictation.
- `/api/listening/summary-score`: Zod validation → word count guard (30–400) → rate limit (10/min/user, Map-based) → DB ownership check → OpenAI structured JSON at temperature=0.2 → shape validation → score clamping → insert `listeningSummaryAttempt` → return passage for reveal.
- Two-step prompt: system prompt instructs the LLM to first extract 3–6 key ideas, then compare semantically (AC4 determinism via low temperature + explicit instructions).
- Added `listeningSummaryAttempt` table to `packages/database/src/schema/index.ts` with FK to `listeningExercise` (cascade delete), JSONB columns for key ideas and coverage.
- Created migration `apps/web/drizzle/0010_add_listening_summary_attempt.sql`.
- Type-checked: zero new errors.

### File List
- `apps/web/app/(app)/listening/_components/SummarizeMode.tsx` (new) — full summarize mode UI.
- `apps/web/app/(app)/listening/page.tsx` (modified) — added 4th mode tab + SummarizeMode render.
- `apps/web/app/api/listening/summary-score/route.ts` (new) — scoring API with rate limit + ownership check.
- `packages/database/src/schema/index.ts` (modified) — added `listeningSummaryAttempt` table.
- `apps/web/drizzle/0010_add_listening_summary_attempt.sql` (new) — migration SQL.

### Change Log
- 2026-04-21: Implemented Story 19.3.3. New SummarizeMode, summary-score API, DB schema + migration.

## Dev Notes

- Reuse `AudioPlayer` from 19.3.2 so A-B loop and speed controls work here too.
- Use the same structured-output approach as 19.2.1; share prompt builders under `lib/prompts/`.
- Don't overfit "coverage" to exact word match — the LLM should judge semantic coverage.

## References

- Structured outputs: [platform.openai.com/docs/guides/structured-outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Existing listening surface: [apps/web/app/(app)/listening/](apps/web/app/(app)/listening/)
