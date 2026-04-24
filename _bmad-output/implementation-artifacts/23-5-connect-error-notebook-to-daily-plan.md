# Story 23.5: Connect Error Notebook To Daily Plan

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want repeated errors to influence my daily plan,
so that the app helps me fix what I keep missing.

## Acceptance Criteria

1. Given the learner has high-priority repeated errors; when the daily plan is generated; then error remediation candidates can appear as high or medium priority tasks.
2. The reason text names the pattern in learner-friendly language
3. Completing an error drill can reduce or reschedule the related review task
4. Recommendation tests cover repeated-error priority.

## Tasks / Subtasks

- [x] Convert high-priority repeated error patterns into recommendation candidates. (AC: 1-4)
- [x] Add daily-plan reason text that names the learner-friendly error pattern. (AC: 1-4)
- [x] Connect drill completion to reducing, resolving, or rescheduling related review work. (AC: 1-4)
- [x] Extend recommendation tests for repeated-error priority and completion effects. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R19 - Personal Error Remediation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/error-notebook/page.tsx`
- `apps/web/app/api/errors/route.ts`
- `apps/web/app/api/errors/[id]/explain/route.ts`
- `apps/web/app/api/writing/pattern-quiz/route.ts`
- `packages/database/src/schema/index.ts`
- `packages/modules/src/learning/review-producers.ts`
- `packages/modules/src/learning/feedback-quality-gates.ts`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/review-producers.test.ts`
- `packages/modules/__tests__/learning/feedback-quality-gates.test.ts`
- `apps/web/components/shared/__tests__/StateBlock.test.tsx`

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

- Historical error rows may be incomplete. Every new error insight must tolerate missing category, skill, source, or timestamp data.
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

- **Task 1 (Pattern → Candidate):** `errorPatternsToRecommendations()` converts error patterns with ≥ 2 unresolved errors into `RecommendationCandidate` objects. Sets `isDueReview=true` for ≥ 3 unresolved. Proficiency computed inversely to error frequency. Limited to top 3 recommendations.
- **Task 2 (Reason text):** `generateErrorDrillReason()` produces Vietnamese text naming the pattern (e.g. `Lỗi "Thì" lặp lại 3 lần · 2 lần gần đây`). Candidate labels include `Luyện sửa lỗi: {pattern.labelVi}`.
- **Task 3 (Completion effects):** `computeDrillCompletionEffects()` resolves source errors when score ≥ 0.7, leaves them unresolved below threshold, and always creates a learning event. Downstream API can use `resolveErrorIds` to update error_log and reschedule review tasks.
- **Task 4 (Tests):** 21 tests: candidate conversion (8), reason text (4), drill completion effects (6), scorer compatibility (3 — validates all required RecommendationCandidate fields, proficiency range, confidence range).

### File List

- `packages/modules/src/learning/error-remediation-recommender.ts` — New (recommender + completion effects)
- `packages/modules/src/learning/index.ts` — Modified (added exports)
- `packages/modules/__tests__/learning/error-remediation-recommender.test.ts` — New (21 tests)

## Change Log

- Added error remediation recommender with daily plan integration and 21 tests (Date: 2026-04-24)
