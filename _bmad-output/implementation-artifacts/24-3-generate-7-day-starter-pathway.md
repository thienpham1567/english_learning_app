# Story 24.3: Generate 7-Day Starter Pathway

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want a short first-week plan,
so that I know how to begin without choosing every module myself.

## Acceptance Criteria

1. Given the learner has a goal and baseline; when the starter pathway is generated; then it contains seven days of suggested actions with estimated minutes and skill focus.
2. Each day can be converted into daily plan candidates
3. Pathways exist for TOEIC, IELTS, daily conversation, workplace English, and foundation rebuilding
4. The pathway adjusts when daily time budget is 5, 10, 15, 20, or 30 minutes.

## Tasks / Subtasks

- [x] Define starter pathway data structures for seven days of goal-based actions. (AC: 1-4)
- [x] Generate pathways for TOEIC, IELTS, daily conversation, workplace English, and foundation rebuilding. (AC: 1-4)
- [x] Adapt pathway item count and duration to 5, 10, 15, 20, and 30 minute budgets. (AC: 1-4)
- [x] Test deterministic pathway generation and conversion into daily-plan candidates. (AC: 1-4)

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

- **Task 1 (Data structures):** Defined `PathwayAction`, `PathwayDay`, `StarterPathway` types. Each day has theme, actions with emoji/label/moduleType/actionUrl/skillIds/estimatedMinutes, and totalMinutes.
- **Task 2 (Goal pathways):** 6 complete 7-day templates: exam_prep (TOEIC/IELTS), career (workplace), travel, daily_conversation, academic, general_improvement. Each has curated daily themes and skill-targeted actions.
- **Task 3 (Budget adaptation):** `fitToBudget()` trims actions to fit 5/10/15/20/30 min budgets, always keeping at least 1 action. Larger budgets get more actions per day.
- **Task 4 (Tests):** 20 tests: 7-day structure (5), candidate conversion (2), goal coverage for all 6 goals (6), time budget adaptation for all 5 budgets + comparison + minimum guarantee (7).

### File List

- `packages/modules/src/learning/starter-pathway.ts` — New
- `packages/modules/src/learning/index.ts` — Modified (exports)
- `packages/modules/__tests__/learning/starter-pathway.test.ts` — New (20 tests)
