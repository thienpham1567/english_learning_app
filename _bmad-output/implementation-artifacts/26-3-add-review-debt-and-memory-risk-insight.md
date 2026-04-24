# Story 26.3: Add Review Debt And Memory Risk Insight

Status: ready-for-dev

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want to know what I am likely to forget soon,
so that I prioritize review before learning new content.

## Acceptance Criteria

1. Given due or overdue review tasks exist; when Home or Progress renders review insight; then the app shows review debt by category and estimated minutes.
2. High memory-risk items can appear in the daily plan
3. The insight links to the review hub
4. Tests cover overdue review priority.

## Tasks / Subtasks

- [ ] Compute review debt by category and estimated minutes from due/overdue tasks. (AC: 1-4)
- [ ] Surface high memory-risk insight on Home or Progress with a link to review hub. (AC: 1-4)
- [ ] Feed high-risk items into daily-plan priority where appropriate. (AC: 1-4)
- [ ] Test overdue priority, no debt, and mixed review categories. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R22 - Progress Insights And Outcome Motivation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/progress/page.tsx`
- `apps/web/app/api/analytics/route.ts`
- `apps/web/app/(app)/home/page.tsx`
- `packages/database/src/queries/user-skill-state-query-service.ts`
- `packages/modules/src/learning/mastery-engine.ts`
- `packages/modules/src/learning/recommendation-scorer.ts`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/mastery-engine.test.ts`
- `packages/modules/__tests__/learning/recommendation-scorer.test.ts`
- `packages/modules/__tests__/learning/review-completion.test.ts`

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

- Progress copy must not overclaim improvement from sparse data. Low-confidence or missing data needs explicit fallback language.
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
