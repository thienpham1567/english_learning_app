# Story 18.8.1: Implement the Dashboard Module in `apps/api`

Status: ready-for-dev

## Story

As a learner,
I want dashboard data served by the Nest backend,
so that the new API boundary is proven on a real read-heavy workflow.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.8.1  
**Dependencies:** 18.7.1

## Acceptance Criteria

1. `apps/api` contains a dashboard controller, service, and any query adapters needed for the existing dashboard flow.
2. Logic currently in `apps/web/app/api/dashboard/route.ts` is moved into API-owned services or adapters.
3. Database access flows through `@repo/database`.
4. Tests cover success, unauthorized, and failure behavior for the migrated dashboard endpoint.

## Tasks / Subtasks

- [ ] Task 1: Create the dashboard controller and service in `apps/api`.
  - [ ] Keep controllers transport-thin and push query orchestration into services/adapters.
- [ ] Task 2: Reuse the shared DB/query surface.
  - [ ] Prefer `DashboardQueryService` and `drizzleDashboardQueryService` over rewriting SQL.
- [ ] Task 3: Return the shared dashboard contract from the API module.
- [ ] Task 4: Add unit/e2e coverage for success and auth/failure cases.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts) is already thinner than many other routes after Epic 17 work.
- [packages/database/src/queries/dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts) and [packages/database/src/queries/drizzle-dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts) already exist.
- `packages/modules` is not present today, so this story must not assume a shared application layer has already been implemented there.

### Implementation Guardrails

- Reuse the existing dashboard query service rather than re-embedding aggregation SQL inside Nest.
- Keep the Nest controller thin and contract-aware.
- If Epic 17's `@repo/modules` work lands first, it can be reused, but this story cannot depend on that package existing.
- Do not cut web consumers over yet; that belongs to `18.9.1`.

### File Targets

- [apps/api/src/dashboard](/Users/thienpham/Documents/english_learning_app/apps/api/src/dashboard)
- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [packages/database/src/queries/dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts)
- [packages/database/src/queries/drizzle-dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts)

### Testing Requirements

- Unit tests for service/controller behavior
- E2E tests for authenticated success and unauthenticated failure
- A failure-path test for unexpected DB/query errors

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Dashboard route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [Dashboard query interface](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts)
- [Drizzle dashboard query service](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Dashboard is the best first live slice because the shared query service already exists and the web hook surface is compact.

### Completion Notes List

- The critical mistake is rewriting dashboard aggregation in Nest when the repo already extracted it into `@repo/database`.

### File List

- `_bmad-output/implementation-artifacts/18-8-1-implement-dashboard-module-in-apps-api.md`
