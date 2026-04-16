# Story 17.8: Create Dashboard Query Service in `packages/database`

Status: done

## Story

As a developer,
I want the dashboard aggregation query extracted into a dedicated query service,
so that the dashboard use case and route adapter can reuse one typed read model without knowing Drizzle internals.

**Epic:** 17 - Monorepo Backend Architecture  
**Sprint:** R3 - Dashboard Module Extraction  
**Story ID:** 17.8  
**Estimate:** 3h  
**Risk:** Medium - behavior-preserving extraction from a live route  
**Dependencies:** 17.6 (`@repo/database` - done), 17.7 (`resolveWebActor` proof-of-concept - done)

## Acceptance Criteria

1. **AC1 - Query service files exist in `packages/database`:**
   ```text
   packages/database/src/queries/
     dashboard-query-service.ts
     drizzle-dashboard-query-service.ts
     dashboard-badges.ts              # only if needed for extracted badge logic
     index.ts
   ```

2. **AC2 - Query service interface is typed against existing contracts, not a duplicate DTO:**
   - `DashboardQueryService` is exported from `packages/database/src/queries/dashboard-query-service.ts`
   - The service exposes `getOverviewForUser(userId: string): Promise<DashboardResponse>`
   - `DashboardResponse` is imported from `@repo/contracts`
   - Do not create a second hand-written `DashboardOverviewData` shape if `DashboardResponse` already matches the contract

3. **AC3 - Drizzle implementation extracts the current dashboard aggregation logic from [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts):**
   - Flashcard due count
   - Vocabulary due count
   - Daily challenge status for the current Vietnam-local day
   - Streak row lookup with current/best streak and XP fallback
   - Recent vocabulary join with `vocabulary_cache`
   - Weekly activity rollup using the existing `generate_series` SQL
   - Badge calculation with the same thresholds, labels, and emoji used today

4. **AC4 - The route handler becomes a thin adapter without changing the API payload:**
   - `apps/web/app/api/dashboard/route.ts` keeps auth and HTTP error mapping
   - The route delegates the aggregation work to `drizzleDashboardQueryService.getOverviewForUser(userId)`
   - The JSON response body remains behaviorally identical for existing consumers
   - Unauthorized responses stay `{ error: "Unauthorized" }`

5. **AC5 - Export and package wiring are complete:**
   - `packages/database/src/index.ts` re-exports the new query service API
   - `packages/database/package.json` includes whatever is required to compile and test the new query service cleanly
   - If the service returns `DashboardResponse`, add `@repo/contracts` as a workspace dependency instead of duplicating the type shape

6. **AC6 - Query service tests exist and verify the real output shape:**
   - Add a database-backed integration test for the query service
   - Seed only the minimal rows needed for the dashboard read model
   - Assert the returned object matches `DashboardResponseSchema`
   - Cover default/fallback behavior for missing streak and incomplete challenge data

7. **AC7 - No behavior regression is introduced:**
   - Existing dashboard route tests continue to pass
   - The extracted query preserves timezone handling, defaults, and count semantics from the current route
   - No new framework coupling is introduced into `packages/database`

## Tasks / Subtasks

- [x] Task 1: Add query service structure in `packages/database` (AC: 1, 5)
  - [x] Create `src/queries/dashboard-query-service.ts`
  - [x] Create `src/queries/drizzle-dashboard-query-service.ts`
  - [x] Create `src/queries/index.ts`
  - [x] Export query service symbols from `packages/database/src/index.ts`

- [x] Task 2: Wire package dependencies and scripts needed for typed tests (AC: 2, 5, 6)
  - [x] Add `@repo/contracts` as a workspace dependency to `packages/database`
  - [x] Add `test` / `test:run` scripts to `packages/database/package.json` to match other shared packages
  - [x] Add `vitest` to `packages/database` devDependencies if not already present

- [x] Task 3: Implement `DashboardQueryService` without changing dashboard semantics (AC: 2, 3, 7)
  - [x] Keep the service signature `getOverviewForUser(userId: string): Promise<DashboardResponse>`
  - [x] Move the current `Promise.all([...])` query bundle out of the route and into the Drizzle implementation
  - [x] Preserve current fallback values for streak, daily challenge, recent vocabulary, weekly activity, and XP
  - [x] Keep all count fields as numbers, not strings

- [x] Task 4: Resolve badge computation at the package boundary correctly (AC: 3, 7)
  - [x] Preserve the current badge thresholds and labels from [apps/web/lib/daily-challenge/badges.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/daily-challenge/badges.ts)
  - [x] Do not import from `apps/web` into `packages/database`
  - [x] If badge logic is extracted into the query service layer, keep one active source of truth in the migrated path and remove route-local badge shaping for this flow

- [x] Task 5: Refactor the dashboard route into a thin adapter (AC: 4, 7)
  - [x] Keep `resolveWebActor()` in the route
  - [x] Replace inline query logic with a single query-service call
  - [x] Preserve `UnauthorizedError` and `AppError` handling behavior

- [x] Task 6: Add regression and integration coverage (AC: 6, 7)
  - [x] Add a `packages/database` integration test for `getOverviewForUser`
  - [x] Keep or extend the dashboard route test to prove the route still returns the existing unauthorized payload
  - [x] Validate the returned object with `DashboardResponseSchema.safeParse(...)`

### Review Findings

**Patch items:**
- [x] [Review][Patch] `lookedUpAt.toISOString()` has no null guard — fixed: added `?.toISOString() ?? new Date(0).toISOString()` guard [packages/database/src/queries/drizzle-dashboard-query-service.ts]
- [x] [Review][Patch] Seed inserts lack conflict handling → permanent test failure after crash — fixed: added `.onConflictDoNothing()` to all seed inserts [packages/database/__tests__/dashboard-query-service.test.ts]
- [x] [Review][Patch] Silent integration test skip gives false green CI — fixed: added `console.warn` when DATABASE_URL absent so CI surface the skip [packages/database/__tests__/dashboard-query-service.test.ts]
- [x] [Review][Patch] Fixed `TEST_USER_ID` causes conflicts in concurrent CI runs — fixed: uses `RUN_SUFFIX = Date.now() + random` per run [packages/database/__tests__/dashboard-query-service.test.ts]
- [x] [Review][Patch] `todayVN` evaluated at module parse time — midnight edge case — fixed: moved inside `beforeAll` [packages/database/__tests__/dashboard-query-service.test.ts]

**Defer items:**
- [x] [Review][Defer] Badge duplication drift risk (dashboard-badges.ts vs apps/web) — deferred, pre-existing; Story 17.9 consolidation
- [x] [Review][Defer] Singleton `drizzleDashboardQueryService` hinders DI — deferred, pre-existing; Story 17.9 module/use-case layer addresses this
- [x] [Review][Defer] `Promise.all` connection leak on partial rejection — deferred, pre-existing architectural concern
- [x] [Review][Defer] JSON `"null"` string not caught by `?? "unknown"` for vocab level — deferred, pre-existing bug in both old and new code


## Dev Notes

### Current Route Behavior Snapshot

The current route already uses `resolveWebActor()` from Story 17.7, then performs aggregation directly in the route handler. The implementation to preserve is in [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts).

Important details from the current route:

- Flashcard due count:
  - `user_vocabulary` left-joined to `flashcard_progress`
  - counts saved vocabulary where `nextReview` is null or due
- Vocabulary due count:
  - direct count on `user_vocabulary.nextReview <= now`
- Daily challenge lookup:
  - uses `challengeDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" })`
- Weekly activity:
  - uses a raw SQL `generate_series` CTE
  - unions `daily_challenge.completed_at` and `writing_submission.created_at`
  - does **not** currently read from `activity_log`
- Recent vocabulary:
  - joins `user_vocabulary` with `vocabulary_cache`
  - orders by `lookedUpAt desc`
  - defaults missing `level` to `"unknown"`
- Streak fallback when no row exists:
  ```ts
  {
    currentStreak: 0,
    bestStreak: 0,
    lastCompletedDate: null,
    xpTotal: 0,
  }
  ```

### Architecture Guardrails

Follow the monorepo design spec in [2026-04-15-monorepo-ready-backend-design.md](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md):

- `packages/database` owns read-model query services and SQL-aware performance logic
- `packages/database` must not import `next/*`, `Request`, `Response`, browser APIs, or `apps/web/*`
- The route stays as an HTTP adapter
- Story 17.8 does **not** create `packages/modules`; that happens in Story 17.9

Target flow after this story:

```text
apps/web/app/api/dashboard/route.ts
  -> @repo/auth resolveWebActor
  -> @repo/database drizzleDashboardQueryService
  -> @repo/contracts DashboardResponse
```

### Critical Implementation Decisions

1. **Do not duplicate the dashboard response type**

The repo already has `DashboardResponseSchema` and `DashboardResponse` in:

- [packages/contracts/src/dashboard/dashboard.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts)
- [packages/contracts/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)

Use the existing contract type directly. This story is an extraction story, not a DTO redesign story.

2. **Do not pull `apps/web` code into `packages/database`**

`getBadges()` currently lives in `apps/web/lib/daily-challenge/badges.ts`, which is the wrong dependency direction for a package import.

For this story:

- keep badge thresholds identical: `3`, `7`, `30`, `100`
- keep labels and emoji identical
- do not import `apps/web/lib/daily-challenge/badges.ts` from `packages/database`
- if you need a helper, create a package-local helper under `packages/database/src/queries/`

3. **Keep the query service infrastructure-only**

The query service:

- accepts `userId: string`
- returns contract-aligned data
- does not resolve auth
- does not know about `Request` / `Response`
- does not decide transport errors

4. **Preserve numeric aggregation behavior**

The dashboard contract expects numbers. PostgreSQL counts can surface as strings unless cast or mapped carefully.

Keep the current approach of explicit numeric casting for count projections. Do not return stringified counts.

### File Structure Requirements

Expected touched files:

- [packages/database/package.json](/Users/thienpham/Documents/english_learning_app/packages/database/package.json)
- [packages/database/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/index.ts)
- [packages/database/src/queries/dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/dashboard-query-service.ts)
- [packages/database/src/queries/drizzle-dashboard-query-service.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/drizzle-dashboard-query-service.ts)
- [packages/database/src/queries/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/queries/index.ts)
- [packages/database/__tests__/dashboard-query-service.test.ts](/Users/thienpham/Documents/english_learning_app/packages/database/__tests__/dashboard-query-service.test.ts)
- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [apps/web/app/api/dashboard/__tests__/route.test.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/__tests__/route.test.ts)

### Testing Requirements

Current package test conventions:

- `packages/shared` and `packages/auth` both expose `test` and `test:run` scripts
- package tests use Vitest directly
- package tests live under `__tests__/`

Mirror those conventions in `packages/database` instead of inventing a new test layout.

Test guidance:

- Use Vitest Node environment for `packages/database`
- Seed only the tables used by dashboard aggregation:
  - `userVocabulary`
  - `vocabularyCache`
  - `flashcardProgress`
  - `dailyChallenge`
  - `userStreak`
  - `writingSubmission`
- Use a unique sentinel `userId` in tests and clean up inserted rows
- Assert the final object with `DashboardResponseSchema.safeParse(result)`
- Keep the existing route unauthorized test green

### Previous Story Intelligence

From Story 17.7 in git history (`git show HEAD:_bmad-output/implementation-artifacts/17-7-packages-auth.md`):

- Follow the shared-package pattern already used in `packages/shared` and `packages/auth`
- Keep package code framework-agnostic
- Use root `tsconfig.json` with per-package `outDir` / `rootDir`
- Preserve the route's current `UnauthorizedError` -> `{ error: "Unauthorized" }` behavior

The important pattern carried forward from 17.7 is: extract infrastructure concerns behind a package API while leaving the route as a thin adapter.

### Git Intelligence Summary

Recent git history is relevant in three ways:

- `0e48dfc chore restructure folders web`
  - path references now consistently use `apps/web/...`
  - avoid stale `app/...` root paths when creating imports or references
- `f0ed893 chore: update`
  - recent auth wiring changed in `apps/web/lib/auth.ts`; do not rework auth in this story
- `a13e833 chore: update`
  - `turbo.json` was recently updated; package scripts should align with the workspace task model instead of bypassing it

### Latest Technical Information

Official references checked on 2026-04-16:

- Drizzle select docs: [orm.drizzle.team/docs/select](https://orm.drizzle.team/docs/select)
  - Drizzle recommends explicit numeric casting or mapping for aggregate counts because PostgreSQL count values can otherwise surface as strings
- Drizzle SQL docs: [orm.drizzle.team/docs/sql](https://orm.drizzle.team/docs/sql)
  - `sql<T>` and `db.execute(sql\`\`)` are the correct typed escape hatches for custom SQL like the existing `generate_series` query
- Zod versioning docs: [zod.dev/v4/versioning](https://zod.dev/v4/versioning)
  - `zod/v4` remains permanently supported even though the package root now exports Zod 4
  - do not churn Zod imports in this story
- Vitest migration docs: [vitest.dev/guide/migration.html](https://vitest.dev/guide/migration.html)
  - Vitest 4 requires Vite >= 6 and Node >= 20
  - this repo currently uses Vitest `^3.2.4`, so this story should keep existing Vitest 3-style package test patterns instead of upgrading the runner

### Project Structure Notes

- `packages/modules` does not exist yet in the current workspace; do not create it in Story 17.8
- `packages/database` currently contains only `src/client`, `src/schema`, and `src/index.ts`
- The query service folder introduced here should be the first `queries/` slice in `packages/database`
- The route should remain in `apps/web/app/api/dashboard/route.ts` for now; Story 17.9 will insert the module/use-case layer

### References

- Epic 17 planning artifact in git history: `git show HEAD:_bmad-output/planning-artifacts/epic-17-monorepo-backend.md`
- [Current dashboard route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)
- [Current dashboard route test](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/__tests__/route.test.ts)
- [Dashboard contracts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts)
- [Database package root](/Users/thienpham/Documents/english_learning_app/packages/database/src/index.ts)
- [Database schema](/Users/thienpham/Documents/english_learning_app/packages/database/src/schema/index.ts)
- [Database client](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)
- [README package conventions](/Users/thienpham/Documents/english_learning_app/README.md)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

- No `project-context.md` file was found in the workspace
- Sprint status uses `not_started` instead of the newer `backlog` / `development_status` format; this story was selected as the first pending story in order
- Fixed `lookedUpAt` Date→string serialization: Drizzle returns Date objects but the contract expects ISO strings; original route relied on `Response.json()` implicit serialization
- Integration test uses `describe.skip` + dynamic imports when DATABASE_URL is absent to avoid crashing turbo pipeline

### Completion Notes List

- All 6 tasks completed, all ACs satisfied
- Created `DashboardQueryService` interface and `drizzleDashboardQueryService` implementation in `packages/database/src/queries/`
- Created package-local `getBadges()` helper with identical thresholds/labels/emoji to avoid importing from `apps/web`
- Dashboard route refactored from 190 lines → 27 lines (thin HTTP adapter)
- `@repo/contracts` added as workspace dependency to `packages/database`
- vitest + test/test:run scripts added to match shared package conventions
- 15 total tests: 2 route tests (unauthorized + happy path), 5 badge unit tests, 8 integration tests (schema validation, counts, streak, challenge, badges, vocabulary, weekly activity, fallback defaults)
- `lookedUpAt` explicitly converted to ISO string to match `RecentVocabularyItemSchema` contract
- Integration tests skip gracefully when DATABASE_URL is not set (turbo CI compatibility)
- Pre-existing vocabulary route test failures (Missing DATABASE_URL) are unrelated to this story

### Change Log

- 2026-04-16: Story 17.8 implemented — Dashboard query service extracted to @repo/database, route refactored to thin adapter, full test coverage added

### File List

- `packages/database/src/queries/dashboard-query-service.ts` (new)
- `packages/database/src/queries/drizzle-dashboard-query-service.ts` (new)
- `packages/database/src/queries/dashboard-badges.ts` (new)
- `packages/database/src/queries/index.ts` (new)
- `packages/database/src/index.ts` (modified)
- `packages/database/package.json` (modified)
- `packages/database/tsconfig.json` (modified)
- `packages/database/vitest.config.ts` (new)
- `packages/database/__tests__/dashboard-query-service.test.ts` (new)
- `packages/database/__tests__/dashboard-badges.test.ts` (new)
- `apps/web/app/api/dashboard/route.ts` (modified)
- `apps/web/app/api/dashboard/__tests__/route.test.ts` (modified)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified)
- `_bmad-output/implementation-artifacts/17-8-dashboard-query-service.md` (modified)
