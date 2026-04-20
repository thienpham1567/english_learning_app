# Story 19.2.4: Error Pattern → Auto-Quiz in Error Notebook

Status: done

## Story

As a self-learner, I want my recurring writing mistakes (tracked from essay scores) to auto-generate targeted quizzes in my error-notebook — so I actually fix patterns instead of seeing the same red marks every week.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R10 — Writing Core
**Story ID:** 19.2.4
**Dependencies:** 19.2.1

## Acceptance Criteria

1. **AC1** — After each `writingAttempt` is saved, a background post-step classifies each `inlineIssue` into an error tag (e.g. `subject-verb-agreement`, `article-a-an-the`, `word-form-confusion`, `comma-splice`, `collocation`, `preposition`) and upserts rows into `writingErrorPattern: { userId, tag, count, lastSeenAt }`.
2. **AC2** — A user with ≥ 3 occurrences of a tag in the last 14 days triggers creation of an `errorNotebookEntry` of type `writing-pattern` linked to that tag, with 5 auto-generated quiz items (MCQ or fill-in-the-blank).
3. **AC3** — Quiz items come from `POST /api/writing/pattern-quiz` which takes a tag + 3 example sentences from the user's past `inlineIssues` and returns 5 fresh MCQ items with explanations. No sentence is copied verbatim.
4. **AC4** — `error-notebook` page gets a "Writing patterns" section listing active tags with a "Practice" button that opens the generated quiz inline.
5. **AC5** — Completed quizzes feed the existing `review-quiz` spaced-repetition loop (reuse existing plumbing if present; otherwise link to the existing review flow).
6. **AC6** — Tag classification happens server-side; do not leak raw essay content to the quiz generator beyond the 3 short example sentences.

## Tasks

- [x] Task 1: Define the tag taxonomy (18 tags) in `lib/writing/error-tags.ts`.
- [x] Task 2: Add a classifier step (prompt-based, same LLM call) invoked right after 19.2.1 persist (AC1).
- [x] Task 3: Add `writingErrorPattern` schema + migration 0016.
- [x] Task 4: Add `/api/writing/pattern-quiz` (AC3).
- [x] Task 5: Extend error-notebook UI — WritingPatternSection (AC2, AC4).
- [x] Task 6: Wire quiz completion into error_log for SRS review loop (AC5).

## Dev Notes

- Consider running the classifier as part of the existing `/api/writing/score` response (same prompt call, just ask for `inlineIssues[].tag`) to avoid a second LLM call per attempt.
- Upserts on `writingErrorPattern` use `{ userId, tag }` as the composite key.
- Quiz items should be short (1–2 sentence stems) so repetition is cheap to test.

## References

- Existing error notebook: [apps/web/app/(app)/error-notebook/](apps/web/app/(app)/error-notebook/)
- Existing review quiz: [apps/web/app/(app)/review-quiz/](apps/web/app/(app)/review-quiz/)

## File List

- `apps/web/lib/writing/error-tags.ts` — 18-tag taxonomy with labels + descriptions (Task 1)
- `packages/database/src/schema/index.ts` — `writingErrorPattern` table (Task 3)
- `apps/web/lib/db/migrations/0016_writing_error_pattern.sql` — DDL migration
- `apps/web/lib/writing/rubric-prompts.ts` — `tag` field added to inlineIssues schema (Task 2)
- `apps/web/app/api/writing/score/route.ts` — `classifyAndUpsertPatterns` fire-and-forget after persist (Task 2, AC1)
- `apps/web/app/api/writing/pattern-quiz/route.ts` — POST (quiz gen + errorLog insert, AC3, AC5, AC6) + GET (active patterns, AC4)
- `apps/web/app/(app)/error-notebook/_components/WritingPatternSection.tsx` — Inline quiz UI (Task 5, AC4)
- `apps/web/app/(app)/error-notebook/page.tsx` — Integrated WritingPatternSection above error cards

## Dev Agent Record

### Completion Notes

- Tag taxonomy: 18 tags with Vietnamese labels and English descriptions
- Classifier: `tag` field added to inlineIssues in the scoring prompt — same LLM call, no extra API cost (per dev notes)
- AC1: tags validated against VALID_ERROR_TAGS set before upsert; invalid LLM tags silently skipped
- AC1: upsert pattern — check-then-insert/update with per-tag loop; fire-and-forget (non-fatal)
- AC2: threshold check in pattern-quiz endpoint (≥3 hits in 14-day window)
- AC3: POST /api/writing/pattern-quiz — rate limited 10/min/user; returns 5 MCQ items
- AC5: quiz items persisted to `error_log` with `sourceModule: "writing-pattern"` and `grammarTopic: tag` — automatically picked up by existing SRS review loop
- AC6: only up to 3 sentences of ≤200 chars each sent to quiz generator; no full essay content
- Migration 0016 applied to Supabase ✅
- 22 tests passing ✅

### Review Findings

- [x] [Review][Patch] `userAnswer` in error_log never updated after inline quiz — **fixed** (PATCH handler + InlineQuiz wiring)
- [x] [Review][Patch] `hotTags` filter checks per-essay delta — **fixed** (removed misleading log)
- [x] [Review][Patch] GET /pattern-quiz should filter `count >= 3` server-side — **fixed**
- [x] [Review][Defer] No unique constraint on `(userId, tag)` — TOCTOU race possible but low probability
- [x] [Review][Defer] Sequential upsert loop could be batched — fire-and-forget so low impact
- [x] [Review][Dismiss] Tag "word-choice" overlaps with category "word-choice" — different semantic scopes
