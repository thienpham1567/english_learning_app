# Story 18.6.1: Add Unit and E2E Test Harnesses for `apps/api`

Status: ready-for-dev

## Story

As a developer,
I want API tests in place before migration work scales out,
so that controllers, services, and guards can be verified safely.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.6.1  
**Dependencies:** 18.4.2, 18.5.2

## Acceptance Criteria

1. `apps/api` has a working unit test setup for services and guards.
2. `apps/api` has a working e2e harness using `supertest` or an equivalent tool.
3. The sample authenticated and validation endpoints are covered by tests.
4. Failure paths are asserted, not only happy paths.

## Tasks / Subtasks

- [ ] Task 1: Add the unit-test harness.
  - [ ] Match repo conventions where possible.
  - [ ] Cover services, guards, and validation helpers.
- [ ] Task 2: Add the e2e harness.
  - [ ] Boot the Nest app in tests.
  - [ ] Exercise the validation sample endpoint and `/me`.
- [ ] Task 3: Capture failure-path coverage.
  - [ ] Include invalid payloads and unauthenticated requests.
- [ ] Task 4: Wire test scripts into `apps/api/package.json`.

## Dev Notes

### Current Repo Reality

- Shared packages such as [packages/contracts/package.json](/Users/thienpham/Documents/english_learning_app/packages/contracts/package.json) and [packages/database/package.json](/Users/thienpham/Documents/english_learning_app/packages/database/package.json) use Vitest.
- [apps/web/package.json](/Users/thienpham/Documents/english_learning_app/apps/web/package.json) also uses Vitest for repo-local testing.
- `apps/api` does not exist in the test matrix yet.

### Implementation Guardrails

- Prefer Vitest for consistency with the rest of the repo unless Nest tooling forces a clearly justified exception.
- Keep e2e coverage focused on the seams created so far: validation, error envelope, and auth.
- Do not defer failure-path testing; this story exists to catch bad assumptions before dashboard/preferences migration.
- Make test teardown explicit so DB pools or HTTP servers do not keep the process alive.

### File Targets

- [apps/api/package.json](/Users/thienpham/Documents/english_learning_app/apps/api/package.json)
- [apps/api/vitest.config.ts](/Users/thienpham/Documents/english_learning_app/apps/api/vitest.config.ts)
- [apps/api/__tests__](/Users/thienpham/Documents/english_learning_app/apps/api/__tests__)
- [apps/api/test](/Users/thienpham/Documents/english_learning_app/apps/api/test)

### Testing Requirements

- Unit tests for guards/services/helpers
- E2E tests for the sample validation endpoint
- E2E tests for `/me`
- Explicit negative-path assertions

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Contracts package.json](/Users/thienpham/Documents/english_learning_app/packages/contracts/package.json)
- [Database package.json](/Users/thienpham/Documents/english_learning_app/packages/database/package.json)
- [Web app package.json](/Users/thienpham/Documents/english_learning_app/apps/web/package.json)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The repo is already Vitest-first, so this story should resist Nest's default Jest gravity unless there is a compelling reason.

### Completion Notes List

- This is the last safe point to standardize test conventions before the API starts carrying real product flows.

### File List

- `_bmad-output/implementation-artifacts/18-6-1-add-unit-and-e2e-test-harnesses-for-apps-api.md`
