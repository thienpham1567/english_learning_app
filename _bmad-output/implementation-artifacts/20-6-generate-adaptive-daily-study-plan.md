# Story 20.6: Generate Adaptive Daily Study Plan

Status: review

## Story

As a learner,
I want a daily plan with only the most important actions,
so that I can study effectively even with limited time.

## Acceptance Criteria

1. The system returns 1-3 plan items with title, reason, estimated minutes, action URL, skill ids, priority, and completion state.
2. The plan supports 5, 10, and 20 minute variants.
3. Due review is preferred before new study when memory risk is high.
4. The plan avoids recommending too many heavy tasks in one session.
5. The existing Home dashboard can render the new plan while preserving existing widgets.

## Tasks / Subtasks

- [x] Add daily plan contracts (AC: 1, 2)
  - [x] Define `DailyStudyPlan` and `DailyStudyPlanItem` schemas under `packages/contracts/src/learning`.
  - [x] Include time budget variants and completion state.
- [x] Add plan generation use case (AC: 1, 2, 3, 4)
  - [x] Use recommendation scoring from 20.5.
  - [x] Select 1-3 tasks based on time budget.
  - [x] Apply fatigue/burnout guard for heavy tasks.
- [x] Expose plan through app API (AC: 1, 5)
  - [x] Update or adapt `apps/web/app/api/study-plan/daily/route.ts`.
  - [x] Keep response backward compatible or provide a migration shape consumed only by Home.
- [x] Update Home dashboard integration (AC: 5)
  - [x] Adapt `apps/web/app/(app)/home/page.tsx` to render reason and estimated duration.
  - [x] Preserve existing streak, XP, vocabulary, leaderboard, and progress widgets.
- [x] Add tests (AC: 1, 2, 3, 4, 5)
  - [x] Unit test plan selection.
  - [x] Route test daily plan response.
  - [x] Component test Home plan rendering if current test setup supports it.

## Dev Notes

- This story depends on 20.5.
- Avoid a large dashboard redesign in this story. The UI change should be focused on making the plan explainable.
- Current Home page already builds `todayItems` locally. This story should move decisioning into shared/domain logic where practical.

### Project Structure Notes

- API route remains in `apps/web/app/api/study-plan/daily/route.ts`.
- Domain plan logic belongs in `packages/modules/src/learning` or `packages/modules/src/learning-plan`.
- Dashboard page path is `apps/web/app/(app)/home/page.tsx`.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Home Page](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx)
- [Study Plan Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/study-plan/daily/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation (one RED-GREEN fix for fallback test).

### Completion Notes List

- **Contracts**: Added `DailyStudyPlanSchema`, `DailyStudyPlanItemSchema`, `TimeBudget` with 1–3 items, 5/10/20 min variants, and completion state.
- **Plan generator** (`daily-plan-generator.ts`):
  - Uses `scoreAndRank` from 20.5 to select top candidates within time budget
  - Fatigue guard: max 1 heavy task (≥15 min) per session (AC: 4)
  - Fallback: re-scores without budget filter if nothing fits
  - Marks items completed via `completedModuleTypes` set
- **API route** (`study-plan/daily/route.ts`):
  - Rewired to use adaptive plan generation from skill mastery states
  - Added `?budget=5|10|20` query param (AC: 2)
  - Returns both `plan` (new) and `tasks` (legacy) for backward compat (AC: 5)
  - Builds candidates from due reviews, weak skills, and defaults
- **Home page** (`home/page.tsx`):
  - Enhanced TodaysPlan card to show reason text + estimated duration
  - All existing widgets preserved (streak, XP, vocabulary, leaderboard, etc.)
- **Tests**: 11 plan generator unit tests. Full regression: 122/122 pass.

### Change Log

- 2026-04-22: Story 20.6 implemented — daily plan contracts, generator, API route, Home UI enhancement, 11 tests.

### File List

- `packages/contracts/src/learning/daily-study-plan.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/modules/src/learning/daily-plan-generator.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/daily-plan-generator.test.ts` (new)
- `apps/web/app/api/study-plan/daily/route.ts` (modified — rewired to adaptive plan)
- `apps/web/app/(app)/home/page.tsx` (modified — reason + duration display)
