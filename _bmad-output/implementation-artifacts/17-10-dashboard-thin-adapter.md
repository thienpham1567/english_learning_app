# Story 17.10: Refactor Dashboard Route to Thin Adapter

Status: ready-for-dev

## Story

As a developer,
I want the `GET /api/dashboard` route handler refactored to a thin adapter,
so that it only resolves the actor, calls the dashboard use case, and returns the response.

**Epic:** 17 - Monorepo Backend Architecture  
**Sprint:** R3 - Dashboard Module Extraction  
**Story ID:** 17.10  
**Estimate:** 2h  
**Dependencies:** 17.7 (`resolveWebActor` - done), 17.8 (`DashboardQueryService` - done), 17.9 (`getDashboardOverview` use case)

## Acceptance Criteria

1. **AC1 - The dashboard route calls the module use case instead of the database implementation directly**
   - `apps/web/app/api/dashboard/route.ts` imports `getDashboardOverview` from `@repo/modules`
   - the route passes `{ actor, dashboardQuery: drizzleDashboardQueryService }`
   - the route no longer calls `drizzleDashboardQueryService.getOverviewForUser(...)` directly

2. **AC2 - The route remains a thin HTTP adapter**
   - it resolves the actor using the existing `resolveWebActor()` helper
   - it delegates application logic to the use case
   - it returns `Response.json(result)`
   - it keeps HTTP-specific error mapping local to the adapter

3. **AC3 - Response behavior stays identical**
   - success payload shape is unchanged
   - unauthorized responses stay `{ error: "Unauthorized" }`
   - `AppError` mapping remains unchanged
   - existing frontend dashboard consumers work without modification

4. **AC4 - The route stays small and readable**
   - no SQL
   - no aggregation logic
   - no business branching beyond transport/error handling
   - the route remains at approximately the same small size or smaller than the current post-17.8 adapter

5. **AC5 - Dashboard route tests pass and cover the new dependency boundary**
   - current unauthorized test continues to pass
   - authenticated success test continues to pass
   - tests mock the module use case rather than relying on the database implementation directly

6. **AC6 - Scope stays tight**
   - do not change dashboard provider/frontend behavior
   - do not move contracts or query logic again
   - do not rewrite auth/session behavior in this story

## Tasks / Subtasks

- [ ] Task 1: Refactor the route to depend on `@repo/modules` (AC: 1, 2, 4)
  - [ ] Import `getDashboardOverview` from `@repo/modules`
  - [ ] Keep `resolveWebActor()` in place
  - [ ] Pass the existing `drizzleDashboardQueryService` implementation into the use case
  - [ ] Return `Response.json(result)` from the use-case result

- [ ] Task 2: Preserve transport-layer error behavior (AC: 2, 3)
  - [ ] Keep `UnauthorizedError` mapping to `401` with `{ error: "Unauthorized" }`
  - [ ] Keep `AppError` mapping unchanged
  - [ ] Avoid introducing new response envelopes or contract parsing logic in this story

- [ ] Task 3: Update route tests to reflect the new abstraction seam (AC: 5)
  - [ ] Mock `@repo/modules` instead of relying on the database implementation mock
  - [ ] Keep unauthorized and success-path assertions
  - [ ] Verify the route surface remains unchanged from the caller perspective

## Dev Notes

### Story Foundation

This is the culmination step of the Epic 17 dashboard proof-of-pattern:

1. `17.7` introduced framework-agnostic actor resolution
2. `17.8` extracted dashboard aggregation into `@repo/database`
3. `17.9` introduces the application use case in `@repo/modules`
4. `17.10` swaps the route to call that use case

If `17.10` is done correctly, the layering becomes:

```text
apps/web/app/api/dashboard/route.ts
  -> resolveWebActor()
  -> getDashboardOverview(...)
  -> drizzleDashboardQueryService
```

That is the pattern Epic 17 wanted to prove before broader extractions.

### Current Route Reality

The current route is already thinner than the original Epic 17 text assumed:

```ts
const actor = await resolveWebActor();
const data = await drizzleDashboardQueryService.getOverviewForUser(actor.userId);
return Response.json(data);
```

So this story is not a big rewrite anymore. It is now a narrow dependency swap:

- replace the direct query-service call with the `@repo/modules` use case
- keep the existing error handling behavior unchanged

### Critical Guardrails

1. **Do not re-expand the route**

The route should not regain:

- SQL
- aggregation
- badge logic
- contract-shaping logic
- auth/session internals

2. **Do not change the resolver API to match stale plan text**

The original Epic 17 sketch used `resolveWebActor(req)`, but the current repo already uses the zero-arg resolver created in Story 17.7:

```ts
const actor = await resolveWebActor();
```

Preserve the current helper shape. Do not force a `Request` parameter back into the route just to match the old sketch.

3. **The module use case is the new mock seam**

After `17.9`, the route test should mock the application use case, not the database implementation. That is part of proving the layer separation.

### File Structure Requirements

Expected touched files:

- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [apps/web/app/api/dashboard/__tests__/route.test.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/__tests__/route.test.ts)

Expected imported dependencies after the refactor:

- `resolveWebActor` from the app-local web adapter
- `getDashboardOverview` from `@repo/modules`
- `drizzleDashboardQueryService` from `@repo/database`
- `AppError` / `UnauthorizedError` from `@repo/shared`

### Testing Requirements

Keep the route tests focused on adapter behavior:

- unauthorized actor resolution -> `401`
- authenticated flow -> `200`
- caller-visible payload still includes the dashboard fields already asserted today

Do not turn route tests into database integration tests. That coverage already belongs to `17.8`.

### Previous Story Intelligence

From [17-8-dashboard-query-service.md](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/17-8-dashboard-query-service.md):

- the route already preserves the expected unauthorized payload
- query logic and response assembly now live in `@repo/database`
- route behavior is already stable and tested

From `17.9`:

- the use case should be a pure delegation layer
- the application seam is now `@repo/modules`, not `@repo/database`

This means `17.10` should be a very small patch if `17.9` is implemented correctly.

### Git Intelligence Summary

Recent repo history still matters:

- `0e48dfc chore restructure folders web`
  - route paths should remain `apps/web/app/api/...`
- `f0ed893 chore: update`
  - auth changed recently; leave resolver behavior alone
- `a13e833 chore: update`
  - repo task orchestration changed recently; avoid unrelated script churn in this story

### References

- Epic 17 source in git history: `git show 9c2fc63714fe65f464364c59a854c2197b0bb57e:_bmad-output/planning-artifacts/epic-17-monorepo-backend.md`
- [Story 17.8 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/17-8-dashboard-query-service.md)
- [Story 17.9 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/17-9-dashboard-module.md)
- [Current dashboard route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [Current dashboard route test](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/__tests__/route.test.ts)
- [Auth types](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts)
- [Dashboard query service interface](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The original planning text for `17.10` predates the current `17.8` implementation, so this story is intentionally narrower than the original estimate implied
- The route is already thin today; the remaining work is to route through `@repo/modules`

### Completion Notes List

- `17.10` should now be a small adapter refactor, not a large extraction
- The main mistake to avoid is continuing to mock `@repo/database` in the route test after the module seam exists
- Preserve route behavior exactly; this story is about dependency direction, not user-visible changes

### File List

- `_bmad-output/implementation-artifacts/17-10-dashboard-thin-adapter.md`
