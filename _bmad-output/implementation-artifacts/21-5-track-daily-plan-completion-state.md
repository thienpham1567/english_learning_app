# Story 21.5: Track Daily Plan Completion State

Status: done

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want Home to reflect what I already completed today,
so that the plan feels responsive and current.

## Acceptance Criteria

1. Given a learner completes a plan-linked activity; when Home reloads or the plan is refetched; then the relevant plan item is marked completed when the underlying activity log or learning event supports it.
2. Completed state does not require manual user checking
3. Completion mapping is tested for at least vocabulary review, daily challenge, grammar quiz, and listening practice
4. Incomplete or unknown completion data fails gracefully.

## Tasks / Subtasks

- [x] Define completion mapping between plan module/action data and existing activity log or learning event signals. (AC: 1-4)
- [x] Implement automatic completed state refresh for supported modules without manual checkboxes. (AC: 1-4)
- [x] Cover vocabulary review, daily challenge, grammar quiz, and listening practice mappings. (AC: 1-4)
- [x] Add fallback behavior for unknown module types and stale completion data. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R17 - Adaptive Home Activation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/home/page.tsx`
- `apps/web/app/api/study-plan/daily/route.ts`
- `apps/web/hooks/useDashboard.tsx`
- `packages/modules/src/learning/recommendation-adapters.ts`
- `packages/modules/src/learning/recommendation-scorer.ts`
- `packages/modules/src/learning/daily-plan-generator.ts`
- `apps/web/components/shared/AppSidebar.tsx`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/daily-plan-generator.test.ts`
- `packages/modules/__tests__/learning/recommendation-scorer.test.ts`
- `apps/web/components/shared/__tests__/AppSidebar.test.tsx`

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

- Home already has a dashboard fallback. Preserve it until adaptive plan behavior is verified.
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

- **Task 1 (Completion mapping):** Already defined in `daily-plan-generator.ts:83` via `completedModuleTypes.has(rec.moduleType)`. The API route at `/api/study-plan/daily` builds `todayModules` from the `activityLog` table (activities completed today), and passes it as `completedModuleTypes` to `generateDailyPlan()`.
- **Task 2 (Auto-refresh):** Added `refetchOnFocus` option (default: `true`) to `useDailyStudyPlan` hook. When the browser tab regains focus via `visibilitychange` event, the plan is automatically refetched — picking up any activities completed since the last load. No manual checkboxes needed (AC: 2).
- **Task 3 (Module coverage):** Created 11 tests in `completion-mapping.test.ts` covering: flashcard/vocabulary review (completed + incomplete), daily_challenge (completed + incomplete), grammar_quiz (completed + incomplete), listening (completed + incomplete), unknown module graceful fallback, and mixed partial completion with 3 modules.
- **Task 4 (Fallback):** Unknown module types return `completed: false` from the `Set.has()` check. If the Set doesn't contain the module type, it simply stays incomplete — no crash, no undefined. Verified with explicit test.

### File List

- `apps/web/hooks/useDailyStudyPlan.ts` — Modified (added refetchOnFocus with visibilitychange listener)
- `packages/modules/__tests__/learning/completion-mapping.test.ts` — New (11 completion mapping tests)

## Change Log

- Added auto-refetch on tab focus for completion state refresh (Date: 2026-04-24)
- Added 11 tests for completion mapping across vocabulary, daily challenge, grammar quiz, listening, unknown types (Date: 2026-04-24)
