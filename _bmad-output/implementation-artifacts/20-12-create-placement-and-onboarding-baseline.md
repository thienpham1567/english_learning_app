# Story 20.12: Create Placement and Onboarding Baseline

Status: review

## Story

As a new learner,
I want the app to understand my goal, level, and available study time,
so that my first study plan is immediately relevant.

## Acceptance Criteria

1. Onboarding or placement stores primary goal, daily time budget, self-reported weak skill, preferred learning style, baseline skill scores, and confidence per skill.
2. Placement can initialize user skill mastery states.
3. The first daily plan uses placement results and goal relevance.
4. Learners can skip placement and receive a conservative default plan.
5. Tests cover baseline creation, skip behavior, and first-plan generation.

## Tasks / Subtasks

- [x] Add onboarding baseline contracts (AC: 1, 2, 4)
  - [x] Define learner goal, daily time budget, weak skill, preferred learning style, baseline score, and skip state schemas.
  - [x] Export from shared contracts.
- [x] Add persistence support (AC: 1, 2, 4)
  - [x] Add additive profile/baseline fields or table in `packages/database/src/schema/index.ts`.
  - [x] Add query service methods for create/update/read baseline.
- [x] Add baseline creation use case (AC: 1, 2, 4)
  - [x] Convert placement/self-report into initial mastery states.
  - [x] Provide conservative defaults when placement is skipped.
- [x] Integrate with first daily plan (AC: 3)
  - [x] Feed learner goal and baseline mastery into the daily plan generator from 20.6.
  - [x] Ensure goal relevance affects ranking from 20.5.
- [x] Add tests (AC: 1, 2, 3, 4, 5)
  - [x] Baseline creation from placement.
  - [x] Skip placement default state.
  - [x] First plan uses baseline and goal relevance.

## Dev Notes

- This story depends on 20.4 and 20.6.
- Existing `/diagnostic` route and `diagnostic_result` table behavior can be reused where possible.
- Keep onboarding scoped to personalization baseline. Avoid broad redesign of sign-in or marketing.
- If placement UI already exists, adapt it instead of creating a parallel test experience.

### Project Structure Notes

- Existing diagnostic UI: `apps/web/app/(app)/diagnostic/page.tsx`.
- Existing diagnostic API: `apps/web/app/api/diagnostic/route.ts`.
- Baseline logic belongs in `packages/modules/src/learning` or a placement-focused module.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Diagnostic Page](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/diagnostic/page.tsx)
- [Diagnostic API](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/diagnostic/route.ts)
- [Study Plan Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/study-plan/daily/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean first-pass implementation.

### Completion Notes List

- **Contracts** (`onboarding-baseline.ts`):
  - `LearnerGoal`: career/travel/academic/daily_conversation/exam_prep/general_improvement
  - `DailyTimeBudget`: 5/10/15/20/30 minutes
  - `WeakSkillSelfReport` + `LearningStyle` enums
  - `BaselineSkillScoreSchema`: skillId, score (0–100), confidence (0–1)
  - `OnboardingBaselineSchema`: full onboarding shape with placementSkipped flag
- **Persistence** (`onboardingBaseline` table): 10 columns incl. JSONB baselineScores, unique user index.
- **Domain logic** (`onboarding-baseline.ts`):
  - `createBaseline()` — from placement results (AC: 1)
  - `createSkippedBaseline()` — conservative defaults: score=30, confidence=0.3 for all 7 core skills (AC: 4)
  - `baselineToMasteryStates()` — converts to UserSkillState[] for 20.4 mastery engine (AC: 2)
  - `getGoalRelevantSkills()` / `isGoalRelevant()` — goal→skill mapping for 20.5/20.6 plan ranking (AC: 3)
- **Tests**: 15 tests covering placement creation, skip defaults, mastery conversion, goal relevance, first-plan integration.
- Full regression: 218/218 pass.

### Change Log

- 2026-04-22: Story 20.12 implemented — onboarding baseline contracts, persistence, use case, 15 tests.

### File List

- `packages/contracts/src/learning/onboarding-baseline.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/database/src/schema/index.ts` (modified — added `onboardingBaseline` table)
- `packages/modules/src/learning/onboarding-baseline.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/onboarding-baseline.test.ts` (new)
