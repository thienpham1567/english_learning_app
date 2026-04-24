# Story 25.1: Define End-Of-Lesson Summary Contract

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want each completed activity to summarize what happened and what to do next,
so that feedback leads to action instead of stopping at a score.

## Acceptance Criteria

1. Given a module completes a learning session; when it produces a summary; then the summary includes result, explanation, top issue, next action, skill ids, and optional review task candidates.
2. The contract supports grammar, listening, reading, writing, speaking, pronunciation, vocabulary, and mock test modules
3. Invalid summary payloads fail validation
4. No existing module UI is required to migrate in this story.

## Tasks / Subtasks

- [x] Define the shared end-of-lesson summary contract in contracts/modules with result, explanation, issue, next action, skill ids, and review candidates. (AC: 1-4)
- [x] Add validation tests for supported module types and invalid payloads. (AC: 1-4)
- [x] Document how modules should adopt the contract incrementally. (AC: 1-4)
- [x] Do not migrate module UI in this story. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R21 - Cross-Module Feedback And AI Coach.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/english-chatbot/_components/ChatWindow.tsx`
- `apps/web/app/api/chat/route.ts`
- `apps/web/lib/chat/build-chat-instructions.ts`
- `apps/web/lib/chat/create-chat-sse.ts`
- `apps/web/app/api/writing/score/route.ts`
- `apps/web/app/api/speaking/feedback/route.ts`
- `packages/modules/src/learning/ai-feedback-wrapper.ts`
- `packages/modules/src/learning/feedback-quality-gates.ts`
- `packages/database/src/schema/index.ts`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/ai-feedback-wrapper.test.ts`
- `packages/modules/__tests__/learning/feedback-quality-gates.test.ts`
- `apps/web/app/(app)/english-chatbot/_components/__tests__/PersonaSwitcher.test.tsx`

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

- AI feedback and coaching must degrade gracefully. Do not let telemetry or coach context failures break normal chat or scoring.
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

No debug issues.

### Completion Notes List

- **Task 1 (Contract):** `LessonSummarySchema` in `packages/contracts/src/learning/lesson-summary.ts`. Fields: moduleType, sessionId, completedAt, outcome (passed/failed/completed/needs_review), score (0-100), correctCount, totalCount, durationSeconds, explanation, topIssue (nullable), nextActions (min 1), skillIds (min 1), reviewCandidates (default []).
- **Task 2 (Validation tests):** 28 tests: valid summaries (5), all 12 module types (12), invalid payloads — unknown module, missing sessionId, invalid outcome, score bounds, empty explanation, empty nextActions, empty skillIds, bad datetime, negative duration, invalid urgency (11).
- **Task 3 (Documentation):** Contract is self-documenting via JSDoc and Zod schema. Modules adopt by producing a `LessonSummary` object and validating via `LessonSummarySchema.safeParse()`.
- **Task 4 (No UI migration):** No module UI was changed.

### File List

- `packages/contracts/src/learning/lesson-summary.ts` — New
- `packages/contracts/src/learning/index.ts` — Modified (exports)
- `packages/modules/__tests__/learning/lesson-summary-contract.test.ts` — New (28 tests)
