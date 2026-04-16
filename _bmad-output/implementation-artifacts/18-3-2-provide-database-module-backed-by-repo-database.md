# Story 18.3.2: Provide a Database Module Backed by `@repo/database`

Status: ready-for-dev

## Story

As a developer,
I want Nest services to consume `@repo/database` through dependency injection,
so that the API reuses the existing Drizzle and PostgreSQL setup.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.3.2  
**Dependencies:** 18.3.1

## Acceptance Criteria

1. `apps/api` exposes a database provider/module that reuses `db`, `pool`, or a narrow wrapper from `@repo/database`.
2. No schema files or table definitions are duplicated inside `apps/api`.
3. A sample service can query the database through the injected provider.
4. The provider lifecycle is compatible with local development and tests.

## Tasks / Subtasks

- [ ] Task 1: Create the Nest database module/provider.
  - [ ] Reuse `db`, `pool`, or `getRawPool` from `@repo/database`.
  - [ ] Export the provider through Nest DI.
- [ ] Task 2: Add a non-domain usage proof.
  - [ ] Create a small service or readiness check that exercises the injected provider.
- [ ] Task 3: Handle lifecycle concerns.
  - [ ] Make sure shutdown and test teardown do not leak pool resources.
- [ ] Task 4: Add tests for provider wiring and failure behavior.

## Dev Notes

### Current Repo Reality

- [packages/database/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/index.ts) already exports `db`, `pool`, and `getRawPool`.
- [packages/database/src/client/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts) lazily constructs the `pg` pool and Drizzle instance.
- The only query-service implementation currently exported is the dashboard read model.

### Implementation Guardrails

- Do not copy schema or client setup into `apps/api`.
- Keep the provider narrow enough that later feature modules can swap in query services or transactions without each module re-importing raw globals.
- Prefer DI tokens or provider classes over importing `db` directly inside controllers.
- The proof service should stay infrastructure-only. Do not start migrating dashboard logic in this story.

### File Targets

- [apps/api/src/database](/Users/thienpham/Documents/english_learning_app/apps/api/src/database)
- [packages/database/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/index.ts)
- [packages/database/src/client/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts)

### Testing Requirements

- Provider wiring test
- A smoke/e2e readiness check that proves the provider can be resolved
- Teardown verification so test runs do not hang on open pool handles

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Database package index](/Users/thienpham/Documents/english_learning_app/packages/database/src/index.ts)
- [Database client](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The shared DB package already owns connection construction, so `apps/api` should consume it through DI, not recreate it.

### Completion Notes List

- The highest-risk mistake is importing raw `db` everywhere and skipping the DI seam this story is supposed to establish.

### File List

- `_bmad-output/implementation-artifacts/18-3-2-provide-database-module-backed-by-repo-database.md`
