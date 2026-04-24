# Story 22.1: Add Due Review Task API Adapter

Status: ready-for-dev

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want due review tasks to come from one queue,
so that review priority is consistent across modules.

## Acceptance Criteria

1. Given pending review tasks exist for a user; when the app requests due review data; then the response includes task id, source type, source id, skill ids, priority, due time, estimated minutes, review mode, and reason metadata.
2. The API can still include legacy vocabulary and error review counts during migration
3. Unauthenticated requests return 401
4. Route tests cover empty, due, and unauthorized cases.

## Tasks / Subtasks

- [ ] Design the due review API response shape around existing `reviewTask` fields and legacy counts. (AC: 1-4)
- [ ] Implement a thin route adapter that returns due pending tasks for the authenticated user. (AC: 1-4)
- [ ] Include legacy vocabulary/error counts only as migration support, without changing old APIs. (AC: 1-4)
- [ ] Add route tests for unauthorized, empty queue, and mixed due task responses. (AC: 1-4)

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

To be filled by the implementing dev-story agent.

### Debug Log References

### Completion Notes List

### File List
