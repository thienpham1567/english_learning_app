# Story 18.2.2: Add Zod Validation Adapters and a Sample Endpoint

Status: ready-for-dev

## Story

As a developer,
I want Nest request validation to be driven by Zod contracts,
so that request parsing and response typing do not drift.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.2.2  
**Dependencies:** 18.2.1

## Acceptance Criteria

1. A reusable Zod-based request validation path exists for Nest controllers.
2. A sample endpoint demonstrates request validation, typed response shaping, and shared error handling end to end.
3. No duplicate `class-validator` model is created for the same transport contract.
4. Invalid payloads return the shared validation error envelope instead of ad hoc JSON.

## Tasks / Subtasks

- [ ] Task 1: Add reusable Zod validation primitives to `apps/api`.
  - [ ] Create a request parser or pipe that accepts shared Zod schemas.
  - [ ] Make sure the result is usable from controllers without `class-validator`.
- [ ] Task 2: Add a non-domain sample endpoint.
  - [ ] Create a small controller that proves request schema parsing and typed response shaping.
  - [ ] Keep it outside dashboard/preferences/vocabulary business flows.
- [ ] Task 3: Hook validation failures into the shared error envelope.
  - [ ] Ensure invalid bodies and query params map to the `18.2.1` validation response shape.
- [ ] Task 4: Add unit and e2e coverage for valid and invalid payloads.

## Dev Notes

### Current Repo Reality

- `@repo/contracts` already uses `zod/v4` in [packages/contracts/src/common/api-error.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common/api-error.ts) and [packages/contracts/src/dashboard/dashboard.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts).
- There is no existing `class-validator` or `class-transformer` setup in the monorepo.
- `apps/api` currently has only bootstrap stories in flight, so this is the right point to standardize validation.

### Implementation Guardrails

- Do not add parallel DTO classes beside Zod contracts.
- The sample endpoint should be disposable infrastructure, not a hidden business feature.
- Keep response shaping contract-first: parse inputs with Zod, return a response that also comes from shared schemas.
- Validation should be reusable by later stories for dashboard, preferences, vocabulary, flashcards, and daily challenge modules.

### File Targets

- [apps/api/src/common/validation](/Users/thienpham/Documents/english_learning_app/apps/api/src/common/validation)
- [apps/api/src/common/filters/api-exception.filter.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/common/filters/api-exception.filter.ts)
- [apps/api/src/examples](/Users/thienpham/Documents/english_learning_app/apps/api/src/examples)
- [apps/api/test](/Users/thienpham/Documents/english_learning_app/apps/api/test)
- [packages/contracts/src/common](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common)

### Testing Requirements

- A unit test for the Zod adapter/pipe
- An end-to-end test for a valid payload
- An end-to-end test for an invalid payload returning the shared error envelope

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Shared API error envelope story](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-2-1-define-shared-api-error-envelope.md)
- [Dashboard contract example](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The repo is already Zod-first, so bringing in `class-validator` would create needless duplicate schemas.

### Completion Notes List

- The sample endpoint is only a proof seam. Keep it intentionally small so later domain stories can replace it with real feature endpoints.

### File List

- `_bmad-output/implementation-artifacts/18-2-2-add-zod-validation-adapters-and-sample-endpoint.md`
