# Story 19.2.1: IELTS/TOEFL Essay Scoring by Rubric

Status: done

## Story

As a self-learner, I want to submit an essay and get a score broken down by IELTS band (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) with inline suggestions — so I know exactly where to improve.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R10 — Writing Core
**Story ID:** 19.2.1
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — `POST /api/writing/score` accepts `{ text, prompt?, exam: "ielts-task2" | "ielts-task1" | "toefl-independent", targetBand?: number }` and returns a structured rubric result.
2. **AC2** — Response shape matches the specified TypeScript interface with overall, criteria, inlineIssues, strengths, nextSteps.
3. **AC3** — Uses OpenAI with `response_format: { type: "json_schema" }` and a rubric-calibrated system prompt. Word count pre-check: < 150 words → auto-respond `{ error: "under-length" }` without calling the model.
4. **AC4** — New route `app/(app)/writing-practice/score/page.tsx`: textarea + exam selector + prompt field + "Score my essay" button. Results render with the essay displayed and `inlineIssues` highlighted (hover = suggestion).
5. **AC5** — Rate-limited 5/min/user (scoring is expensive).
6. **AC6** — Persist to `writingAttempt`: `{ userId, exam, prompt, text, overall, criteriaJson, inlineIssuesJson, createdAt }`.

## Tasks

- [x] Task 1: Add `writingAttempt` Drizzle schema + migration (AC6).
- [x] Task 2: Author the rubric system prompt per exam variant — keep prompts in `lib/writing/rubric-prompts.ts` (AC3).
- [x] Task 3: Implement `/api/writing/score` with structured output + rate-limit (AC1, AC2, AC3, AC5).
- [x] Task 4: Build the score page UI with inline highlights (AC4).
- [x] Task 5: Snapshot tests for the prompt template — assert exam variant, word-count guard, JSON schema shape.

## Dev Notes

- Compute `startOffset`/`endOffset` server-side (defensively) by searching for `quote` in `text` — do not trust model offsets. If quote not found, drop the issue rather than misaligning highlights.
- Cap `text` at 2000 words.
- For IELTS, the model should be instructed to use the public band descriptors and be slightly conservative (err on the lower band).
- Consider a second pass ("self-check") in the same prompt to reduce hallucinated issues — keep it in the same API call to avoid double cost.

## References

- [IELTS Task 2 band descriptors (public)](https://www.ielts.org/-/media/pdfs/writing-band-descriptors-task-2.ashx)
- OpenAI client: [apps/web/lib/openai.ts](apps/web/lib/openai.ts)
- Existing writing page: [apps/web/app/(app)/writing-practice/](apps/web/app/(app)/writing-practice/)

## File List

- `packages/database/src/schema/index.ts` — Added `writingAttempt` table (AC6)
- `apps/web/lib/db/migrations/0014_writing_attempt.sql` — Migration SQL
- `apps/web/lib/db/migrations/meta/_journal.json` — Journal entry
- `apps/web/lib/writing/rubric-prompts.ts` — Rubric prompts per exam variant (AC3)
- `apps/web/app/api/writing/score/route.ts` — Scoring endpoint (AC1, AC2, AC3, AC5)
- `apps/web/app/(app)/writing-practice/score/page.tsx` — Score page UI (AC4)
- `apps/web/test/lib/rubric-prompts.test.ts` — 19 unit tests (Task 5)

## Change Log

- 2026-04-20: Implemented all 5 tasks. Schema, prompts, API, UI, and tests complete. Migration applied.

## Dev Agent Record

### Completion Notes

- Rubric prompts calibrated per exam: IELTS uses 1–9 band scale with conservative bias; TOEFL uses 1–5 per criterion scaled to 30
- Self-check instruction embedded in system prompt to reduce hallucinated inline issues
- Server-side offset computation: searches for exact `quote` in essay text, drops issues where quote not found
- Rate limiter: 5/min/user with eviction at 500 entries
- Word count guard: <150 returns `under-length` without calling OpenAI; >2000 returns 400
- Inline highlights: color-coded by category (grammar=red, word-choice=yellow, coherence=blue, task=purple), hover shows tooltip
- All 19 unit tests pass; migration applied to Supabase

### Review Findings

- [x] [Review][Decision] TOEFL `targetBand` → `targetScore`; hide for TOEFL; use exam-appropriate label in prompt — **fixed**
- [x] [Review][Patch] Dead import `SCORE_RANGES` — **fixed** (now used for validation)
- [x] [Review][Patch] Exam default bug — **fixed** (`toefl` mode now defaults to `toefl-independent`)
- [x] [Review][Patch] `parsed.inlineIssues` null guard — **fixed** (`?? []`)
- [x] [Review][Patch] `max_tokens: 2000` → 3000 — **fixed**
- [x] [Review][Patch] `highlightedText` hover rebuild — **fixed** (split into `sortedIssues` + `highlightSegments` memos)
- [x] [Review][Patch] Overlapping inline issues — **fixed** (skip if `startOffset < cursor`)
- [x] [Review][Patch] `targetScore` not validated — **fixed** (type + range check)
- [x] [Review][Defer] `text.indexOf(quote)` finds first occurrence only — deferred, acceptable for v1
- [x] [Review][Defer] TOEFL `overall` score not range-validated — deferred, low severity
- [x] [Review][Defer] No `Retry-After` header on 429 — deferred
- [x] [Review][Defer] Prompt injection via essay text — deferred

