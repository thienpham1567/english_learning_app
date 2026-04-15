# Story 17.9 — Dashboard Module in `packages/modules`

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R3 - Dashboard Module Extraction
- **Estimate:** 3h
- **Dependencies:** 17.5 (contracts), 17.7 (auth), 17.8 (query service)

## Description

Create the first domain module — dashboard — with a `getDashboardOverview` use case. This proves the adapter → use case → repo pattern end-to-end.

## Acceptance Criteria

- [ ] AC1: Package created:
  ```
  packages/modules/
    package.json          # name: @repo/modules
    tsconfig.json
    src/
      dashboard/
        application/
          get-dashboard-overview.ts
          index.ts
        index.ts
      index.ts            # barrel
  ```
- [ ] AC2: Use case function:
  ```ts
  export async function getDashboardOverview(deps: {
    actor: ActorContext;
    dashboardQuery: DashboardQueryService;
  }): Promise<DashboardOverviewData> {
    return deps.dashboardQuery.getOverviewForUser(deps.actor.userId);
  }
  ```
- [ ] AC3: **Zero imports from forbidden packages:**
  - NO `next/*`
  - NO `drizzle-orm`
  - NO `@/lib/*`
  - NO `better-auth`
  - Only imports from: `@repo/contracts`, `@repo/shared`, `@repo/auth` (types only)
- [ ] AC4: Unit test with fake `DashboardQueryService`:
  ```ts
  test("returns overview for user", async () => {
    const fakeQuery: DashboardQueryService = {
      getOverviewForUser: async () => mockDashboardData,
    };
    const result = await getDashboardOverview({
      actor: { userId: "u1", roles: [], clientType: "web" },
      dashboardQuery: fakeQuery,
    });
    expect(result.totalXP).toBe(mockDashboardData.totalXP);
  });
  ```
- [ ] AC5: Package builds independently: `pnpm build --filter @repo/modules`
- [ ] AC6: Web app can import: `import { getDashboardOverview } from "@repo/modules"`

## Technical Notes

- Dashboard is intentionally the simplest module — it's read-only, no writes, no complex business rules
- The use case is almost a passthrough to the query service — that's by design
- Future modules (vocabulary, chat) will have real domain logic, validation, and orchestration
- This story proves the wiring works; optimization comes later

## Dev Notes

- The `DashboardQueryService` interface should be defined in `packages/database` (from 17.8)
- `ActorContext` type comes from `@repo/auth`
- This module should be testable without any DB or framework
