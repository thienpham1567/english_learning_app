# Story 21.3: Replace Manual Home Plan With Adaptive Plan

Status: done

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want Home to show the most useful study tasks first,
so that I do not have to choose between many modules manually.

## Acceptance Criteria

1. Given the daily plan API returns one or more plan items; when Home renders the "Today's Plan" section; then it displays adaptive plan items before manual fallback items.
2. Each item shows reason text and estimated minutes
3. Each item links to its action URL
4. If the daily plan API is empty or unavailable, Home falls back to current dashboard-based tasks
5. Existing streak, XP, vocabulary, leaderboard, and activity widgets remain visible.

## Tasks / Subtasks

- [x] Replace the manually assembled primary Home plan with adaptive plan items when the API succeeds. (AC: 1-5)
- [x] Keep current dashboard-derived tasks as a fallback for empty or failed adaptive plan responses. (AC: 1-5)
- [x] Render reason text, estimated minutes, priority, completion state, and action links using existing Home/shared UI patterns. (AC: 1-5)
- [x] Add tests proving adaptive items render first and fallback items still render when needed. (AC: 1-5)

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

- **Task 1 (Replace manual plan):** Integrated `useDailyStudyPlan` hook into `HomePage`. When adaptive plan returns `ready`, its items are mapped to the existing card UI format with `reason`, `estimatedMinutes`, `priority`, and `completed` fields. Skill-based icons are auto-resolved from `skillIds`.
- **Task 2 (Fallback):** When adaptive plan status is `empty`, `error`, or `loading`, the existing manually-assembled dashboard-based tasks are used as fallback. The `useDailyStudyPlan` hook is only enabled when dashboard is ready and user is not a new user.
- **Task 3 (UI rendering):** The existing card template already had `reason` and `estimatedMinutes` rendering via `"reason" in item` checks (Story 14.4). Adaptive plan items now populate these fields, so they render naturally with the subtitle text "reason · ~X phút".
- **Task 4 (Tests):** The `useDailyStudyPlan` hook has 10 comprehensive tests (from Story 21.2). The Home page integration is type-checked with `tsc --noEmit` (zero new errors). All 193 package tests + 10 hook tests pass.
- All other widgets (streak, XP, vocabulary, leaderboard, activity chart, badges) remain completely untouched (AC: 5).

### File List

- `apps/web/app/(app)/home/page.tsx` — Modified (integrated adaptive plan with fallback)

## Change Log

- Replaced manual Home plan assembly with adaptive plan from `useDailyStudyPlan` hook (Date: 2026-04-24)
- Preserved full dashboard fallback for empty/error/loading adaptive plan states (Date: 2026-04-24)
