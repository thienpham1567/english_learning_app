# Story 20.1: Define Learning Event Contract

Status: done

## Story

As a product and engineering team,
I want a normalized learning event contract,
so that all modules can emit comparable signals for personalization.

## Acceptance Criteria

1. A learning event contract exists for high-value learning actions.
2. Each event includes user id, session id, module type, content id, skill ids, attempt id, result, score, duration, difficulty, error tags, optional AI/rubric version, and timestamp.
3. Core event types are supported: `exercise_submitted`, `answer_graded`, `mistake_detected`, `skill_practice_completed`, `review_completed`, `ai_feedback_generated`, `mastery_updated`.
4. Invalid payloads fail contract validation.
5. The contract can be imported by app routes and package modules.
6. No existing module UX changes are introduced.

## Tasks / Subtasks

- [x] Add learning contract package exports (AC: 1, 2, 3, 4, 5)
  - [x] Create `packages/contracts/src/learning/learning-event.ts`.
  - [x] Create `packages/contracts/src/learning/index.ts`.
  - [x] Export the learning contract from `packages/contracts/src/index.ts`.
- [x] Define event enums and DTO schemas (AC: 1, 2, 3, 4)
  - [x] Use Zod, following existing contract style in `packages/contracts/src/dashboard`.
  - [x] Add schemas for event type, module type, result, difficulty, and learning event payload.
  - [x] Keep event payload additive and JSON-safe.
- [x] Add tests (AC: 4, 5)
  - [x] Add contract tests in `packages/contracts/__tests__/learning-event.test.ts`.
  - [x] Cover valid payloads, missing required fields, invalid event types, and optional AI metadata.

### Review Findings

- [x] [Review][Patch] `timestamp` accepts any string — use `z.string().datetime()` for ISO 8601 validation [`learning-event.ts`:L67]
- [x] [Review][Patch] `score` has no bounds — add `.finite()` to reject `Infinity`/`NaN` [`learning-event.ts`:L63]
- [x] [Review][Patch] No test for empty-string `userId` rejection [`learning-event.test.ts`]
- [x] [Review][Defer] Missing `mock_test` and other app modules from `LearningModuleType` enum — deferred, will be addressed when Story 20.3 adds event emission from those modules

## Dev Notes

- Existing contract patterns live in `packages/contracts/src/dashboard` and `packages/contracts/src/common`.
- Use `zod` because the repo already depends on Zod v4 and existing package contracts use Zod.
- Do not write app code in this story. This story creates shared types and validation only.
- Keep names stable for downstream stories: event type, module type, skill ids, and metadata keys will become cross-package dependencies.

### Project Structure Notes

- Add new files under `packages/contracts/src/learning`.
- Do not put contract definitions in `apps/web/lib`; app routes should import shared contracts.
- Use the existing package barrel export pattern in `packages/contracts/src/index.ts`.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Backend Design](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)
- [Contracts Index](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation with no issues.

### Completion Notes List

- Created learning event contract with 5 Zod enums: `LearningEventType` (7 types per AC3), `LearningModuleType` (11 modules), `LearningResult` (4 outcomes), `LearningDifficulty` (5 CEFR-aligned levels).
- `LearningEventSchema` covers all AC2 required fields (userId, sessionId, moduleType, contentId, skillIds, attemptId, eventType, result, score, durationMs, difficulty, errorTags, timestamp) plus optional `aiVersion` and `rubricVersion`.
- Followed existing dashboard contract pattern: `z.object()` → inferred types → barrel export → root re-export.
- 20 tests: 5 valid parse tests (full payload, minimal, optional AI metadata), 11 rejection tests (missing fields, invalid enums, type mismatches, negative values), 4 enum coverage tests.
- Full regression suite: 34/34 tests pass.
- No existing module UX changes (AC6) — pure shared types/validation.

### Change Log

- 2026-04-22: Story 20.1 implemented — learning event contract with Zod schemas, types, barrel exports, and 20 contract tests.

### File List

- `packages/contracts/src/learning/learning-event.ts` (new)
- `packages/contracts/src/learning/index.ts` (new)
- `packages/contracts/src/index.ts` (modified)
- `packages/contracts/__tests__/learning-event.test.ts` (new)
