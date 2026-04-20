# Story 19.2.4: Error Pattern → Auto-Quiz in Error Notebook

Status: ready-for-dev

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

- [ ] Task 1: Define the tag taxonomy (12–20 tags) in `lib/writing/error-tags.ts`.
- [ ] Task 2: Add a classifier step (LLM-based) invoked right after 19.2.1 persist (AC1).
- [ ] Task 3: Add `writingErrorPattern` schema + migration.
- [ ] Task 4: Add `/api/writing/pattern-quiz` (AC3).
- [ ] Task 5: Extend error-notebook UI (AC2, AC4).
- [ ] Task 6: Wire quiz completion into the review-quiz loop (AC5).

## Dev Notes

- Consider running the classifier as part of the existing `/api/writing/score` response (same prompt call, just ask for `inlineIssues[].tag`) to avoid a second LLM call per attempt.
- Upserts on `writingErrorPattern` use `{ userId, tag }` as the composite key.
- Quiz items should be short (1–2 sentence stems) so repetition is cheap to test.

## References

- Existing error notebook: [apps/web/app/(app)/error-notebook/](apps/web/app/(app)/error-notebook/)
- Existing review quiz: [apps/web/app/(app)/review-quiz/](apps/web/app/(app)/review-quiz/)
