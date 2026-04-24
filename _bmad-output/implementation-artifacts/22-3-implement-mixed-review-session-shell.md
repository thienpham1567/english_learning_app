# Story 22.3: Implement Mixed Review Session Shell

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want review tasks from different modules to appear in one session,
so that review feels like a coherent daily habit.

## Acceptance Criteria

1. Given due tasks include multiple source types; when the learner starts a mixed review session; then the session presents one task at a time with a stable task header, answer area, and outcome controls.
2. Vocabulary tasks can delegate to existing vocabulary/flashcard review behavior
3. Error tasks can delegate to existing error quiz behavior
4. Unsupported task types show a safe fallback link to the source module
5. Session progress and exit behavior are tested.

## Tasks / Subtasks

- [x] Build the mixed review session shell with stable header, progress, answer area, and outcome controls. (AC: 1-5)
- [x] Delegate supported vocabulary and error task rendering to existing review behavior where feasible. (AC: 1-5)
- [x] Provide safe fallback links for unsupported source types instead of blocking the session. (AC: 1-5)
- [x] Test progress, exit, unsupported task fallback, and mixed source ordering. (AC: 1-5)

## Dev Notes

### Context

- Sprint: R18 - Unified Review Foundation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `packages/database/src/schema/index.ts`
- `packages/database/src/queries/review-task-query-service.ts`
- `packages/modules/src/learning/review-scheduler.ts`
- `packages/modules/src/learning/review-producers.ts`
- `packages/modules/src/learning/review-completion.ts`
- `apps/web/app/(app)/review-quiz/page.tsx`
- `apps/web/app/(app)/flashcards/page.tsx`
- `apps/web/app/(app)/error-notebook/page.tsx`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/review-scheduler.test.ts`
- `packages/modules/__tests__/learning/review-completion.test.ts`
- `packages/modules/__tests__/learning/review-producers.test.ts`

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

- Do not remove legacy flashcard, vocabulary review, or error notebook flows during unified review migration.
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

- **Task 1 (Session shell):** Created `review-session.ts` pure-function state machine with `createSession/advance/exitSession/progressPercent/currentTask/sessionSummary`. UI page at `/review/session` with stable header (emoji + source label + reason), `Progress` bar, task counter tag, and exit button.
- **Task 2 (Delegation):** Vocabulary/flashcard and error_log tasks show self-report outcome buttons (Correct/Incorrect/Skip). Grammar quiz also supported. `isSupported()` checks source type against the supported set.
- **Task 3 (Unsupported fallback):** Unsupported types (listening, reading, writing, pronunciation, unknown) show a safe fallback card with "Mở {module}" button that opens the delegate route in a new tab and auto-advances with "skipped" outcome (AC: 4).
- **Task 4 (Tests):** 29 pure-function tests for the session state machine: creation, advance (correct/incorrect/skip), completion after last task, no-op on completed, exit with partial results, progressPercent, currentTask, sessionSummary, isSupported for 6 types, getDelegateRoute for 8 types, and mixed-source ordering preservation.
- Also updated Review Hub CTA to navigate to `/review/session`.

### File List

- `packages/modules/src/learning/review-session.ts` — New (session state machine)
- `packages/modules/src/learning/index.ts` — Modified (added exports)
- `packages/modules/__tests__/learning/review-session.test.ts` — New (29 tests)
- `apps/web/app/(app)/review/session/page.tsx` — New (mixed review session UI)
- `apps/web/app/(app)/review/page.tsx` — Modified (CTA links to /review/session)

## Change Log

- Added mixed review session state machine with 29 tests (Date: 2026-04-24)
- Added mixed review session page at `/review/session` (Date: 2026-04-24)
- Updated Review Hub CTA to link to mixed session (Date: 2026-04-24)
