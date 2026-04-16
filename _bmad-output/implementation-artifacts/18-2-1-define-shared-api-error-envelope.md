# Story 18.2.1: Define the Shared API Error Envelope

Status: ready-for-dev

## Story

As a developer,
I want one error contract shared by web and API,
so that transport failures are shaped consistently across migrated routes.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.2.1  
**Dependencies:** 18.1.2

## Acceptance Criteria

1. `@repo/contracts` exposes a standard API error envelope schema and TypeScript type.
2. The error envelope covers validation, unauthorized, forbidden, not-found, and internal error cases.
3. `apps/api` can map Nest exceptions into the shared error envelope.
4. Existing dashboard contract patterns remain compatible with the shared envelope.

## Tasks / Subtasks

- [ ] Task 1: Expand the shared error contract in `@repo/contracts`.
  - [ ] Update the common error schema to represent the required failure categories.
  - [ ] Export the schema and type from the package root.
- [ ] Task 2: Align the new transport envelope with shared error primitives.
  - [ ] Reuse the error code/status patterns already present in `@repo/shared`.
  - [ ] Avoid inventing a second error vocabulary inside `apps/api`.
- [ ] Task 3: Add API-side exception mapping.
  - [ ] Introduce a Nest exception filter or equivalent mapper that returns the shared envelope.
  - [ ] Cover unknown exceptions with a stable internal-error response.
- [ ] Task 4: Add contract and mapper tests.
  - [ ] Assert success parsing is unchanged for existing contracts.
  - [ ] Assert validation and auth failures parse through the shared schema.

## Dev Notes

### Current Repo Reality

- [packages/contracts/src/common/api-error.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common/api-error.ts) currently exposes only `code`, `message`, and optional `statusCode`.
- [packages/shared/src/errors/domain-errors.ts](/Users/thienpham/Documents/english_learning_app/packages/shared/src/errors/domain-errors.ts) already defines `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, and `IntegrationError`.
- `apps/api` does not have a common exception filter yet.

### Implementation Guardrails

- Keep the envelope transport-focused. Do not leak raw Nest exception objects or stack traces to callers.
- Extend the existing contract rather than replacing it with a completely different shape unless compatibility is preserved.
- The filter should map both `AppError`-style failures and unexpected exceptions.
- Do not add domain-specific error variants here; that belongs in feature contracts if needed later.

### File Targets

- [packages/contracts/src/common/api-error.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common/api-error.ts)
- [packages/contracts/src/common/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common/index.ts)
- [packages/contracts/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)
- [packages/contracts/__tests__/common.test.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/__tests__/common.test.ts)
- [apps/api/src/common/filters/api-exception.filter.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/common/filters/api-exception.filter.ts)

### Testing Requirements

- Contract parse tests in `@repo/contracts`
- Filter/unit tests in `apps/api`
- One end-to-end check that invalid requests return the shared envelope

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [API error contract](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/common/api-error.ts)
- [Shared domain errors](/Users/thienpham/Documents/english_learning_app/packages/shared/src/errors/domain-errors.ts)
- [Shared AppError base](/Users/thienpham/Documents/english_learning_app/packages/shared/src/errors/app-error.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The repo already has a shared error vocabulary in `@repo/shared`; the missing piece is the transport contract and Nest mapping layer.

### Completion Notes List

- The easiest mistake here is to let Nest return ad hoc JSON while `@repo/contracts` defines a different envelope.

### File List

- `_bmad-output/implementation-artifacts/18-2-1-define-shared-api-error-envelope.md`
