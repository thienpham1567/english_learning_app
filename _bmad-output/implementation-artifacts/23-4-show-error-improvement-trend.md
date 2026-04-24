# Story 23.4: Show Error Improvement Trend

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want to know whether repeated errors are decreasing,
so that I can see real improvement beyond XP.

## Acceptance Criteria

1. Given the learner has historical error data; when Progress or Error Notebook renders improvement insights; then it shows repeated-error trend by category over time.
2. It highlights categories that improved, worsened, or need review
3. The trend uses available data without requiring destructive backfill
4. The UI explains low-confidence data when there are few attempts.

## Tasks / Subtasks

- [x] Compute trend data for error categories without requiring historical backfill. (AC: 1-4)
- [x] Show improved, worsened, and needs-review categories with low-data caveats. (AC: 1-4)
- [x] Integrate trend insight into Error Notebook or Progress using existing visual conventions. (AC: 1-4)
- [x] Test rich data, sparse data, and no trend data cases. (AC: 1-4)

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

- **Task 1 (Trend computation):** Created `error-trend.ts` with `computeErrorTrends()`. Splits errors into recent (14 days) vs older periods, groups by normalized category. Computes direction (improved/worsened/stable/new) by comparing counts. No backfill needed — works with whatever data exists.
- **Task 2 (Classification):** Three output groups: improved (recent < older), worsened (recent > older or new), needsReview (stable or low-confidence). Each trend includes resolution rate, total count, confidence flag, and Vietnamese explanation with percentages.
- **Task 3 (UI):** Created `ErrorTrendSection` component with `TrendCard` sub-component. Shows direction icons (↑↓−?), color-coded tags, resolution rates, and low-confidence tooltip (InfoCircleOutlined). Integrated into Error Notebook after pattern summary.
- **Task 4 (Tests):** 15 tests: trend direction detection (5), classification (2), no-backfill compatibility (3), low-confidence detection (3), empty state (1), sorting (1).

### File List

- `packages/modules/src/learning/error-trend.ts` — New (trend computation)
- `packages/modules/src/learning/index.ts` — Modified (added exports)
- `packages/modules/__tests__/learning/error-trend.test.ts` — New (15 tests)
- `apps/web/app/(app)/error-notebook/_components/ErrorTrendSection.tsx` — New (UI component)
- `apps/web/app/(app)/error-notebook/page.tsx` — Modified (integrated component)

## Change Log

- Added error improvement trend engine with 15 tests (Date: 2026-04-24)
- Added Error Trend Section UI to Error Notebook page (Date: 2026-04-24)
