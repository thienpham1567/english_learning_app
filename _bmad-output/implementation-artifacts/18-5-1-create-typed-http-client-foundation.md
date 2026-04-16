# Story 18.5.1: Create the Typed HTTP Client Foundation

Status: ready-for-dev

## Story

As a developer,
I want a typed HTTP client built from shared contracts,
so that `apps/web` stops hardcoding endpoint strings and payload shapes.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.5.1  
**Dependencies:** 18.2.2, 18.4.2

## Acceptance Criteria

1. A reusable client layer exists in `@repo/contracts` or a dedicated sibling package.
2. The client consumes shared request, response, and error schemas from `@repo/contracts`.
3. Base URL configuration is environment-driven instead of hardcoded.
4. Client helpers stay thin and transport-focused rather than becoming feature services.

## Tasks / Subtasks

- [ ] Task 1: Define the shared typed client shape.
  - [ ] Reuse contract schemas from `@repo/contracts`.
  - [ ] Keep transport execution separate from feature orchestration.
- [ ] Task 2: Choose the correct workspace location.
  - [ ] Either extend `@repo/contracts` with endpoint descriptors or create a dedicated `packages/api-client`.
  - [ ] Do not bury feature logic inside the client layer.
- [ ] Task 3: Add environment-driven base URL resolution.
  - [ ] Support same-origin and explicit API-base configurations.
- [ ] Task 4: Add unit coverage for URL building, success parsing, and error parsing.

## Dev Notes

### Current Repo Reality

- [apps/web/lib/api-client.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/api-client.ts) already provides a thin fetch wrapper that prefixes `/api`.
- [apps/web/lib/http.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/http.ts) wraps that client in an axios-style `{ data }` shape for older callers.
- The current web client is not contract-driven and does not understand remote `apps/api` base URLs yet.

### Implementation Guardrails

- Extend the existing fetch client; do not create a second unrelated raw HTTP wrapper in `apps/web`.
- Keep contracts schema-only. If reusable execution logic is needed outside `apps/web`, prefer a dedicated workspace package rather than making `@repo/contracts` depend on `fetch`.
- The typed client should be endpoint-focused, not a place to hide domain business rules.
- Preserve `AppError` parsing behavior from the existing client path where possible.

### File Targets

- [apps/web/lib/api-client.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/api-client.ts)
- [apps/web/lib/http.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/http.ts)
- [packages/contracts](/Users/thienpham/Documents/english_learning_app/packages/contracts)
- [packages/api-client](/Users/thienpham/Documents/english_learning_app/packages/api-client)

### Testing Requirements

- Unit tests for base URL resolution
- Contract-aware request/response tests
- Error parsing tests against the shared API envelope

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Current web API client](/Users/thienpham/Documents/english_learning_app/apps/web/lib/api-client.ts)
- [HTTP compatibility wrapper](/Users/thienpham/Documents/english_learning_app/apps/web/lib/http.ts)
- [Contracts package entrypoint](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The repo already has one fetch wrapper in `apps/web`; the missing capability is contract-driven typing and configurable API ownership.

### Completion Notes List

- Avoid a client-layer fork where some callers use `api-client.ts`, some use a new package, and neither shares the same error/base-URL rules.

### File List

- `_bmad-output/implementation-artifacts/18-5-1-create-typed-http-client-foundation.md`
