# Story 17.9: Create Dashboard Module (use case)

Status: done

## Story

As a developer,
I want a dashboard domain module with a `getDashboardOverview` use case,
so that the route handler can delegate dashboard reads through a framework-agnostic application layer.

**Epic:** 17 - Monorepo Backend Architecture  
**Sprint:** R3 - Dashboard Module Extraction  
**Story ID:** 17.9  
**Estimate:** 3h  
**Dependencies:** 17.7 (`@repo/auth` - done), 17.8 (`DashboardQueryService` extraction - done)

## Acceptance Criteria

1. **AC1 - `packages/modules` package exists and builds**
   - `packages/modules/package.json` created with name `@repo/modules`
   - `packages/modules/tsconfig.json` extends the root TypeScript config using the same pattern as the existing shared packages
   - the package builds independently with `pnpm build --filter @repo/modules`

2. **AC2 - Dashboard module structure exists**
   ```text
   packages/modules/
     package.json
     tsconfig.json
     src/
       dashboard/
         application/
           get-dashboard-overview.ts
         index.ts
       index.ts
     __tests__/
       dashboard/
         get-dashboard-overview.test.ts
   ```

3. **AC3 - `getDashboardOverview` is a pure application use case**
   - it accepts `{ actor: ActorContext, dashboardQuery: DashboardQueryService }`
   - it returns the typed dashboard response from `@repo/contracts`
   - it contains no imports from `next/*`, `drizzle-orm`, `@/lib/*`, or `apps/web/*`
   - it delegates to `dashboardQuery.getOverviewForUser(actor.userId)` without re-embedding SQL or HTTP concerns

4. **AC4 - The package API is exported cleanly**
   - `packages/modules/src/dashboard/index.ts` exports `getDashboardOverview`
   - `packages/modules/src/index.ts` exports the dashboard module surface
   - consumers can import the use case from `@repo/modules`

5. **AC5 - Unit coverage exists with a fake query service**
   - test the success path using a fake `DashboardQueryService`
   - assert the returned shape matches the dashboard contract
   - verify the use case passes `actor.userId` through to the query service

6. **AC6 - Story scope stays narrow**
   - do not refactor the dashboard route in this story
   - do not move SQL or database logic out of the `@repo/database` query service created in `17.8`
   - do not introduce other dashboard business rules unless they are already implicit in the existing response path

## Tasks / Subtasks

- [ ] Task 1: Create the new `@repo/modules` package scaffold (AC: 1, 2, 4)
  - [ ] Add `packages/modules/package.json`
  - [ ] Add `packages/modules/tsconfig.json`
  - [ ] Add `src/index.ts`
  - [ ] Add `src/dashboard/index.ts`

- [ ] Task 2: Implement the dashboard application use case (AC: 2, 3)
  - [ ] Add `src/dashboard/application/get-dashboard-overview.ts`
  - [ ] Type the input with `ActorContext`
  - [ ] Type the output with the dashboard response contract
  - [ ] Delegate to the provided query service using `actor.userId`

- [ ] Task 3: Add package exports and dependencies (AC: 1, 4)
  - [ ] Add only the workspace dependencies required for the use case (`@repo/auth`, `@repo/contracts`, and whichever package provides the `DashboardQueryService` interface)
  - [ ] Keep the package free of web/runtime/framework dependencies

- [ ] Task 4: Add unit tests with a fake query service (AC: 5)
  - [ ] Create `__tests__/dashboard/get-dashboard-overview.test.ts`
  - [ ] Verify delegation and returned payload
  - [ ] Keep tests package-local and aligned with the existing shared-package Vitest pattern

## Dev Notes

### Story Foundation

Story `17.8` already extracted the dashboard aggregation into `@repo/database` and refactored the route to call `drizzleDashboardQueryService` directly.

This story inserts the missing application layer between:

```text
apps/web/app/api/dashboard/route.ts
  -> @repo/auth resolveWebActor
  -> @repo/modules getDashboardOverview
  -> @repo/database DashboardQueryService
```

That is the pattern the Epic 17 design was trying to prove.

### Current Repo State

Today:

- `packages/modules` does **not** exist yet
- `@repo/database` now exports `DashboardQueryService` and `drizzleDashboardQueryService`
- the dashboard route is already relatively thin, but it still depends directly on `@repo/database`

Current route shape in [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts):

```ts
const actor = await resolveWebActor();
const data = await drizzleDashboardQueryService.getOverviewForUser(actor.userId);
return Response.json(data);
```

The goal of `17.9` is to replace the direct dependency on the query implementation with an application use case in the next story.

### Architecture Guardrails

From the monorepo design spec:

- framework code depends on domain/application code
- domain/application code must not depend on `next/*`
- dashboard is intentionally the first low-risk pattern proof because it is read-only

The target design examples in the spec show:

```ts
export async function getDashboardOverview(deps: {
  actor: ActorContext;
  dashboardQuery: DashboardQueryService;
}) {
  return deps.dashboardQuery.getOverviewForUser(deps.actor.userId);
}
```

Use that as the shape to preserve.

### Important Tradeoff: Port Ownership

There is one tension between the ideal architecture and the current repo state:

- the broader design prefers ports/interfaces to be owned by `packages/modules`
- story `17.8` already established `DashboardQueryService` inside `@repo/database`

For this story, stay pragmatic:

- depend on the **interface type** only
- do **not** import the concrete drizzle implementation into the module
- do **not** move the port interface out of `@repo/database` unless that can be done with zero scope expansion

The priority is proving the adapter -> use case -> query-service layering, not perfecting the port location yet.

### Package Conventions

Mirror the existing package conventions used by:

- [packages/shared/package.json](/Users/thienpham/Documents/english_learning_app/packages/shared/package.json)
- [packages/auth/package.json](/Users/thienpham/Documents/english_learning_app/packages/auth/package.json)
- [packages/database/package.json](/Users/thienpham/Documents/english_learning_app/packages/database/package.json)

Recommended package shape:

- name: `@repo/modules`
- `main` / `types`: `./src/index.ts`
- scripts:
  - `build`: `tsc`
  - `dev`: `tsc --watch`
  - `test`: `vitest`
  - `test:run`: `vitest run`

Recommended TypeScript shape:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### File Structure Requirements

Expected touched files:

- [packages/modules/package.json](/Users/thienpham/Documents/english_learning_app/packages/modules/package.json)
- [packages/modules/tsconfig.json](/Users/thienpham/Documents/english_learning_app/packages/modules/tsconfig.json)
- [packages/modules/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/modules/src/index.ts)
- [packages/modules/src/dashboard/index.ts](/Users/thienpham/Documents/english_learning_app/packages/modules/src/dashboard/index.ts)
- [packages/modules/src/dashboard/application/get-dashboard-overview.ts](/Users/thienpham/Documents/english_learning_app/packages/modules/src/dashboard/application/get-dashboard-overview.ts)
- [packages/modules/__tests__/dashboard/get-dashboard-overview.test.ts](/Users/thienpham/Documents/english_learning_app/packages/modules/__tests__/dashboard/get-dashboard-overview.test.ts)

Files this story should avoid changing:

- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [packages/database/src/queries/drizzle-dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts)

Those belong to the completed `17.8` work and the upcoming `17.10` route swap.

### Testing Requirements

Use the same Vitest pattern as the existing shared packages:

- unit tests only for this story
- no DB integration test expansion
- fake query service rather than real DB wiring

Minimum assertions:

- `dashboardQuery.getOverviewForUser` is called with `actor.userId`
- the use case returns the same payload it receives from the fake query
- the result conforms to the dashboard contract shape

### Previous Story Intelligence

From [17-8-dashboard-query-service.md](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/17-8-dashboard-query-service.md):

- `DashboardQueryService` already exists in `@repo/database`
- the route already preserves `UnauthorizedError -> { error: "Unauthorized" }`
- dashboard SQL, badge shaping, and contract typing are already established
- review findings for `17.8` specifically deferred:
  - badge duplication drift risk
  - DI/port cleanup beyond current scope

Do not reopen those concerns in this story unless they block the use case.

### Git Intelligence Summary

Recent repo history that matters:

- `0e48dfc chore restructure folders web`
  - repo paths are now consistently `apps/web/...`; use current paths only
- `a13e833 chore: update`
  - Turbo orchestration changed recently; follow existing package script patterns instead of inventing new ones
- `f0ed893 chore: update`
  - auth changes happened recently; use the existing `ActorContext` surface instead of revisiting auth design

### References

- Epic 17 source in git history: `git show 9c2fc63714fe65f464364c59a854c2197b0bb57e:_bmad-output/planning-artifacts/epic-17-monorepo-backend.md`
- [Story 17.8 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/17-8-dashboard-query-service.md)
- [Current dashboard route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [Current dashboard route test](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/__tests__/route.test.ts)
- [Dashboard query service interface](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts)
- [Drizzle dashboard query implementation](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts)
- [Auth package types](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts)
- [Contracts index](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The original Epic 17 planning artifact is no longer present in the working tree; source context for `17.9` was recovered from git history
- `pnpm --filter @repo/modules build` failed in the red phase because `@repo/modules` did not exist yet
- `pnpm install` was required after creating `packages/modules/package.json` so the new workspace package could resolve `@repo/auth`, `@repo/contracts`, and `@repo/database`
- `17.8` is already done, so this story must build on the extracted query-service shape rather than restating pre-extraction assumptions
- `pnpm build` passes when the root `.env.local` is sourced; a plain repo build fails in `apps/web` because `/diagnostic` prerender expects `DATABASE_URL`
- `pnpm test:run` still fails in untouched `apps/web` suites (`http-usage`, dictionary UI, persona, sign-in, and some route tests), so full-repo regression validation is not clean yet

### Completion Notes List

- Implemented `@repo/modules` with a pure `getDashboardOverview` use case that depends only on `ActorContext`, `DashboardResponse`, and the `DashboardQueryService` interface
- Added package-local Vitest coverage with a fake query service that verifies delegation, returned payload equality, and dashboard contract conformance
- Kept story scope narrow: no route refactor, no query-service rewrite, and no framework/runtime imports inside the application layer
- Validation summary: `pnpm --filter @repo/modules build` passed, `pnpm --filter @repo/modules test:run` passed, root `pnpm build` passed with sourced root env, root `pnpm lint` passed with existing warnings, and root `pnpm test:run` remains blocked by unrelated `apps/web` failures

### File List

- `_bmad-output/implementation-artifacts/17-9-dashboard-module.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `packages/modules/__tests__/dashboard/get-dashboard-overview.test.ts`
- `packages/modules/package.json`
- `packages/modules/src/dashboard/application/get-dashboard-overview.ts`
- `packages/modules/src/dashboard/index.ts`
- `packages/modules/src/index.ts`
- `packages/modules/tsconfig.json`
- `packages/modules/vitest.config.ts`
- `pnpm-lock.yaml`

### Review Findings

- [x] [Review][Defer] Runtime response validation — deferred; establish as cross-cutting policy when multiple use cases exist, not ad-hoc in the first one [packages/modules/src/dashboard/application/get-dashboard-overview.ts:8] — deferred, pre-existing
- [x] [Review][Patch] `vitest.config.ts` uses `globals: true` but test explicitly imports `describe`/`it`/`expect` from `"vitest"` — removed `globals: true`, explicit imports retained [packages/modules/vitest.config.ts:4]
- [x] [Review][Defer] userId runtime guard — `resolveWebActor()` throws `UnauthorizedError` before reaching the use case; guard belongs to the auth layer per AC6 narrow scope [packages/modules/src/dashboard/application/get-dashboard-overview.ts:9] — deferred, pre-existing
- [x] [Review][Defer] `DashboardQueryService` port owned by `@repo/database` instead of `@repo/modules` — explicitly acknowledged as a known tradeoff in spec dev notes [packages/modules/src/dashboard/application/get-dashboard-overview.ts:3] — deferred, pre-existing
- [x] [Review][Defer] No lint/typecheck scripts in `package.json` — follows existing monorepo package pattern; out of story scope [packages/modules/package.json] — deferred, pre-existing

## Change Log

- 2026-04-16: Implemented the `@repo/modules` scaffold, added `getDashboardOverview`, wired the allowed workspace dependencies, and added package-local tests. Story remains `in-progress` because repo-wide `pnpm test:run` is failing in pre-existing `apps/web` suites outside this story's change set.
