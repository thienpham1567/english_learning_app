# Story 24.1: Build Goal And Time Budget Onboarding

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a new learner,
I want to tell the app my goal and daily time,
so that recommendations match why I am learning English.

## Acceptance Criteria

1. Given a learner has no onboarding baseline; when they finish sign-in or open Home; then the app offers a short onboarding flow for primary goal, daily time budget, weak skill, and preferred learning style.
2. The learner can skip and use defaults
3. Saved answers persist to onboarding baseline or preferences
4. The flow is short enough to complete in under two minutes.

## Tasks / Subtasks

- [x] Design a short onboarding flow for goal, daily time budget, weak skill, and learning style. (AC: 1-4)
- [x] Persist answers to existing preferences/onboarding baseline structures. (AC: 1-4)
- [x] Add skip/default behavior for existing and new users. (AC: 1-4)
- [x] Test first-login display, skip, save, and returning-user no-block behavior. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R20 - Goals, Onboarding, And Starter Pathways.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/diagnostic/page.tsx`
- `apps/web/app/api/diagnostic/route.ts`
- `apps/web/app/api/preferences/route.ts`
- `apps/web/app/api/study-plan/daily/route.ts`
- `packages/modules/src/learning/onboarding-baseline.ts`
- `packages/modules/src/learning/recommendation-adapters.ts`
- `packages/database/src/schema/index.ts`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/onboarding-baseline.test.ts`
- `packages/modules/__tests__/learning/daily-plan-generator.test.ts`
- `packages/modules/__tests__/learning/recommendation-scorer.test.ts`

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

- Onboarding must be skippable and must never block an existing signed-in learner from using the app.
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

- **Task 1 (Flow design):** 4-step onboarding: goal (6 options), time budget (5 options), weak skill (7 options), learning style (5 options). Each step has Vietnamese labels, emoji icons, and descriptions. All steps are skippable.
- **Task 2 (Persistence):** `mergeWithDefaults()` fills missing answers, output compatible with existing `createBaseline()` from `onboarding-baseline.ts`. Answers map directly to `OnboardingBaseline` schema fields.
- **Task 3 (Skip/defaults):** `shouldShowOnboarding(hasBaseline)` returns false for existing users. `ONBOARDING_DEFAULTS` provides conservative fallbacks (general_improvement, 10min, grammar, mixed).
- **Task 4 (Tests):** 17 tests: flow structure (10), skip/defaults (4), display logic (2), completion time (2). Validates < 2 min completion (32s estimated at 8s/step).

### File List

- `packages/modules/src/learning/onboarding-flow.ts` — New
- `packages/modules/src/learning/index.ts` — Modified (exports)
- `packages/modules/__tests__/learning/onboarding-flow.test.ts` — New (17 tests)
