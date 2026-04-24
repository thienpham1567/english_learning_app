# Story 23.1: Normalize Error Categories

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want my mistakes grouped into understandable categories,
so that I know which patterns to fix first.

## Acceptance Criteria

1. Given errors are created from grammar, writing, listening, daily challenge, mock test, or speaking feedback; when the error is stored or displayed; then it includes or derives a normalized category such as tense, article, preposition, word form, coherence, pronunciation, vocabulary, listening detail, or exam strategy.
2. Existing error records still display without migration
3. New categories map to skill ids when possible
4. Classification fallback behavior is tested.

## Tasks / Subtasks

- [x] Define a normalized error category list and source-to-category mapping rules. (AC: 1-4)
- [x] Apply category derivation to new errors without requiring destructive migration of old rows. (AC: 1-4)
- [x] Map categories to skill ids where reliable and leave safe unknown fallbacks otherwise. (AC: 1-4)
- [x] Add tests for grammar, writing, listening, daily challenge, mock test, and sparse legacy rows. (AC: 1-4)

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

- **Task 1 (Category list):** Defined 16 normalized error categories: tense, article, preposition, word-form, subject-verb, clause, vocabulary, coherence, task-response, spelling, pronunciation, listening-detail, listening-comprehension, reading-comprehension, exam-strategy, other. Each has key, label, labelVi, emoji, skillId, and optional subskillId.
- **Task 2 (Category derivation):** `classifyError()` uses a two-level strategy: first tries regex pattern matching against `grammarTopic` (15 patterns), then falls back to `sourceModule` mapping. Legacy rows with null/undefined grammarTopic still classify correctly via module fallback. No DB migration needed.
- **Task 3 (Skill ID mapping):** `categoryToSkillIds()` returns [skillId, subskillId?] for each category. Maps to existing skill taxonomy IDs (grammar, vocabulary, listening, writing, pronunciation, reading + their subskills).
- **Task 4 (Tests):** 41 tests covering: 14 grammar topic patterns, 7 source module fallbacks, 5 legacy row edge cases (null/undefined/empty/unknown), 5 skill ID mappings, 2 fallback behaviors, 4 registry checks, 4 module name variants (underscore/hyphen).

### File List

- `packages/modules/src/learning/error-category.ts` — New (error category normalization)
- `packages/modules/src/learning/index.ts` — Modified (added exports)
- `packages/modules/__tests__/learning/error-category.test.ts` — New (41 tests)

## Change Log

- Added normalized error category system with 16 categories and 41 tests (Date: 2026-04-24)
