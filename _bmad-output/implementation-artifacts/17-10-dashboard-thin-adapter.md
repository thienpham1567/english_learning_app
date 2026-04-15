# Story 17.10 — Refactor Dashboard Route to Thin Adapter

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R3 - Dashboard Module Extraction
- **Estimate:** 2h
- **Dependencies:** 17.9 (dashboard module complete)

## Description

Refactor the `GET /api/dashboard` route handler into a thin adapter that only does: resolve actor → call use case → return response. This is the culmination story that proves the entire pattern works.

## Acceptance Criteria

- [ ] AC1: Route handler refactored to ≤ 15 lines:
  ```ts
  import { resolveWebActor } from "@repo/auth";
  import { getDashboardOverview } from "@repo/modules";
  import { drizzleDashboardQueryService } from "@repo/database";

  export async function GET() {
    const actor = await resolveWebActor();
    const result = await getDashboardOverview({
      actor,
      dashboardQuery: drizzleDashboardQueryService,
    });
    return Response.json(result);
  }
  ```
- [ ] AC2: Response body is byte-for-byte identical to current response
- [ ] AC3: `DashboardProvider` context on the frontend works unchanged:
  - Home page loads correctly
  - Sidebar badges display correctly
  - SessionSummary shows streak
- [ ] AC4: Error handling works:
  - Unauthenticated request → 401
  - DB error → 500 with proper error shape
- [ ] AC5: Performance: response time within ±50ms of current
- [ ] AC6: All dashboard-related tests pass
- [ ] AC7: `pnpm build` succeeds from root

## Technical Notes

### Error mapping

Add a shared error-to-response mapper in `apps/web/lib/api-utils.ts`:

```ts
import { AppError } from "@repo/shared";

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { code: error.code, message: error.message },
      { status: error.statusCode },
    );
  }
  console.error("Unhandled error:", error);
  return Response.json(
    { code: "INTERNAL_ERROR", message: "Internal server error" },
    { status: 500 },
  );
}
```

Route with error handling:

```ts
export async function GET() {
  try {
    const actor = await resolveWebActor();
    const result = await getDashboardOverview({
      actor,
      dashboardQuery: drizzleDashboardQueryService,
    });
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Verification checklist

After refactoring:

1. ✅ Open home page → dashboard data loads
2. ✅ Check sidebar badges → counts display
3. ✅ Complete a flashcard session → SessionSummary shows streak
4. ✅ Logout → dashboard returns 401
5. ✅ `pnpm build` → no errors

## Definition of Done (Initiative Level)

When this story is complete, the entire Epic 17 initiative has proven:

- ✅ Monorepo workspace works (apps + packages)
- ✅ Shared packages import correctly (@repo/shared, @repo/contracts, @repo/database, @repo/auth, @repo/modules)
- ✅ Domain module has zero framework dependencies
- ✅ Route handler is a thin adapter
- ✅ The pattern can be replicated for vocabulary, chat, reading modules in future epics
