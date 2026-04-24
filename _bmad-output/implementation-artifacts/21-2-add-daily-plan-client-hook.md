# Story 21.2: Add Daily Plan Client Hook

Status: ready-for-dev

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want Home to load my adaptive daily study plan,
so that the plan is based on my actual mastery state and goals.

## Acceptance Criteria

1. Given an authenticated user opens Home; when the client requests `/api/study-plan/daily?budget=20`; then the hook returns loading, ready, empty, and error states.
2. The returned plan items preserve title, reason, estimated minutes, action URL, skill ids, priority, and completion state
3. Home can retry the request after a failed load
4. Existing dashboard loading remains backward compatible.

## Tasks / Subtasks

- [ ] Define the daily-plan client response types from `/api/study-plan/daily` without duplicating contract logic unnecessarily. (AC: 1-4)
- [ ] Implement a `useDailyStudyPlan`-style hook or colocated Home data loader with loading, ready, empty, retry, and error states. (AC: 1-4)
- [ ] Preserve current dashboard loading behavior and avoid duplicate dashboard fetches where practical. (AC: 1-4)
- [ ] Add hook/component tests for success, empty plan, API failure, and retry behavior. (AC: 1-4)

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

To be filled by the implementing dev-story agent.

### Debug Log References

### Completion Notes List

### File List
