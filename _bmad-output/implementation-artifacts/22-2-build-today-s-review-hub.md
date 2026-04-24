# Story 22.2: Build Today's Review Hub

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want one "Today's Review" page,
so that I can review what matters without choosing separate review modules.

## Acceptance Criteria

1. Given due review tasks exist; when the learner opens the review hub; then tasks are grouped by learner need such as words to remember, mistakes to fix, pronunciation to drill, and passages to retry.
2. Each group shows count, estimated time, and priority
3. The learner can start a mixed review session
4. Legacy links to flashcards, review quiz, and error notebook still work.

## Tasks / Subtasks

- [x] Create the review hub page or component using existing app shell/navigation patterns. (AC: 1-4)
- [x] Group due tasks by learner need instead of raw source type names. (AC: 1-4)
- [x] Show count, priority, estimated minutes, and start action for each group. (AC: 1-4)
- [x] Keep legacy flashcards/review quiz/error notebook links discoverable during migration. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R18 - Unified Review Foundation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `packages/database/src/schema/index.ts`
- `packages/database/src/queries/review-task-query-service.ts`
- `packages/modules/src/learning/review-scheduler.ts`
- `packages/modules/src/learning/review-producers.ts`
- `packages/modules/src/learning/review-completion.ts`
- `apps/web/app/(app)/review-quiz/page.tsx`
- `apps/web/app/(app)/flashcards/page.tsx`
- `apps/web/app/(app)/error-notebook/page.tsx`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/review-scheduler.test.ts`
- `packages/modules/__tests__/learning/review-completion.test.ts`
- `packages/modules/__tests__/learning/review-producers.test.ts`

### Architecture And Implementation Guardrails

- Preserve existing module behavior and public route payloads unless this story explicitly changes them.
- Keep Next.js route handlers thin; put reusable learning, recommendation, review, or feedback rules in `packages/modules`, contracts in `packages/contracts`, and database access in `packages/database` where practical.
- Prefer additive schema changes. Do not rewrite historical activity, learning event, review, vocabulary, or error data.
- Use existing shared UI components and Ant Design conventions in `apps/web`; do not introduce a new design system.
- Generated recommendation/action links must target real app routes.
- Telemetry, learning event, and review task writes should not block the learner's main flow unless the acceptance criteria require synchronous behavior.

### Project Structure Notes

- UI work belongs under `apps/web/app/(app)`, `apps/web/components`, or `apps/web/hooks` following nearby patterns.
- HTTP transport belongs under `apps/web/app/api/**/route.ts` and should delegate business rules to packages where the logic will be reused.
- Shared contracts belong under `packages/contracts/src/learning` when multiple app/package consumers need the shape.
- Domain logic belongs under `packages/modules/src/learning`; database query helpers belong under `packages/database/src/queries`.
- Tests should be placed beside the existing package/app test style rather than creating a new test framework.

### Risks And Compatibility

- Do not remove legacy flashcard, vocabulary review, or error notebook flows during unified review migration.
- This story should be implemented incrementally with fallback UI or compatibility adapters where existing learner flows are already live.
- Avoid broad redesign or unrelated refactors; touch only files needed for the story and closely related tests.

### References

- [Parent epic/story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md)
- [Sprint plan](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md)
- [Sprint status](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/sprint-status.yaml)

## Testing Requirements

- Add or update tests for each acceptance criterion that changes behavior.
- Run the narrowest relevant tests for touched modules before marking the story ready for review.
- For UI stories, cover loading, empty/error, and primary action behavior where feasible.
- For route/domain stories, cover authenticated success, unauthorized/error, validation failure, and backward-compatible fallback cases where relevant.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1 (Review hub page):** Created `apps/web/app/(app)/review/page.tsx` using `ModuleHeader`, Ant Design `Card`/`Flex`/`Tag`, and the existing `cta-shimmer` button pattern. Fetches from `/api/review/due` (Story 22.1).
- **Task 2 (Grouping):** Created `packages/modules/src/learning/review-group-mapper.ts` with `groupReviewTasks()` that maps sourceType → learner-friendly groups (words, mistakes, grammar, listening, reading, writing, pronunciation, other). Added 12 tests.
- **Task 3 (Count/priority/time):** Each group card shows count, estimated minutes, and a "high priority" tag when priority ≤ 30. Summary strip shows total items and total minutes.
- **Task 4 (Legacy links):** "Truy cập nhanh" section with clickable links to Flashcards, Ôn lỗi sai, and Sổ lỗi sai. Shows badge counts for flashcards due and unresolved errors.

### File List

- `apps/web/app/(app)/review/page.tsx` — New (review hub page)
- `packages/modules/src/learning/review-group-mapper.ts` — New (grouping logic)
- `packages/modules/src/learning/index.ts` — Modified (added export)
- `packages/modules/__tests__/learning/review-group-mapper.test.ts` — New (12 tests)

## Change Log

- Added Today's Review Hub page at `/review` (Date: 2026-04-24)
- Added review group mapper with 12 unit tests (Date: 2026-04-24)
