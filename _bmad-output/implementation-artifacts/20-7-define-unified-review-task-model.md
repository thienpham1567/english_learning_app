# Story 20.7: Define Unified Review Task Model

Status: review

## Story

As a learner,
I want all things I need to review to appear in one coherent queue,
so that review feels purposeful instead of scattered.

## Acceptance Criteria

1. A review task stores user id, source type, source id, skill ids, priority, due time, estimated duration, review mode, status, last outcome, attempt count, next interval, and optional suppression reason.
2. Source types include flashcard review, error retry, grammar remediation, writing rewrite, pronunciation drill, listening replay, and cloze retry.
3. Existing vocabulary and flashcard SRS behavior can be represented by the unified model.
4. Scheduling rules support success quality, urgency boost, and burnout protection.
5. Unit tests cover scheduling and rescheduling rules.

## Tasks / Subtasks

- [x] Add review task contracts (AC: 1, 2)
  - [x] Define review task source type, mode, status, outcome, and DTO schemas.
  - [x] Export from `packages/contracts/src/learning`.
- [x] Add review task persistence (AC: 1, 2, 3)
  - [x] Add additive Drizzle table(s) for unified review tasks.
  - [x] Add query service methods to create, list due, update outcome, suppress, and reschedule tasks.
- [x] Add scheduling policy (AC: 3, 4, 5)
  - [x] Implement scheduler under `packages/modules/src/review-engine` or `packages/modules/src/learning`.
  - [x] Support quality-based intervals and urgency boost.
  - [x] Add burnout protection limits for heavy task types.
- [x] Add tests (AC: 3, 4, 5)
  - [x] Verify initial schedule by source type.
  - [x] Verify success and failure rescheduling.
  - [x] Verify overdue priority boost.
  - [x] Verify heavy-task cap behavior.

## Dev Notes

- This story can start after 20.2 and should align with 20.4 mastery fields.
- Do not remove existing `flashcardProgress` or `userVocabulary` SRS fields in this story.
- The unified task model should represent existing SRS behavior first, then enable incremental migration.

### Project Structure Notes

- Contracts: `packages/contracts/src/learning`.
- Scheduler/use cases: `packages/modules/src/review-engine` or `packages/modules/src/learning`.
- DB schema/query service: `packages/database/src/schema/index.ts` and `packages/database/src/queries`.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [SRS SM2](/Users/thienpham/Documents/english_learning_app/apps/web/lib/srs/sm2.ts)
- [Flashcard Review Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts)
- [Vocabulary Review Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/review/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

Fixed 3 test failures: Zod v4 enum `.options` → inline array, SM-2 ease factor math in assertion.

### Completion Notes List

- **Contracts**: Added `ReviewTaskSchema` with 17 fields, 7 source types (AC: 2), 4 review modes, 4 statuses, 4 outcomes. Plus `ScheduleReviewInput/Output`.
- **Persistence**: Added `reviewTask` table with unique(userId, sourceType, sourceId) and due-queue index. Query service: create, listDue, updateOutcome, suppress, reschedule.
- **Scheduling policy** (`review-scheduler.ts`):
  - SM-2 compatible: computeInitialSchedule (per source type), computeReschedule (quality-based)
  - Ease factor: min 1.3, adjusted by quality formula (AC: 3)
  - Urgency boost: overdue tasks get +10 priority (AC: 4)
  - Burnout protection: max 2 heavy tasks/day, excess postponed (AC: 4)
  - Easy bonus: +50% interval (AC: 3)
  - Failure reset: again→6h, hard→12h (AC: 3)
- **Tests**: 19 scheduler tests covering all 7 source types, success/failure/urgency/burnout/SM-2 compat.
- Full regression: 141/141 pass.
- No changes to existing flashcardProgress or userVocabulary.

### Change Log

- 2026-04-22: Story 20.7 implemented — review task contracts, DB table, scheduling policy, 19 tests.

### File List

- `packages/contracts/src/learning/review-task.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/database/src/schema/index.ts` (modified — added `reviewTask` table)
- `packages/database/src/queries/review-task-query-service.ts` (new)
- `packages/database/src/queries/index.ts` (modified)
- `packages/modules/src/learning/review-scheduler.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/review-scheduler.test.ts` (new)
