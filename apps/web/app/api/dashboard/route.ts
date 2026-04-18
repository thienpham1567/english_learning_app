import { unstable_cache } from "next/cache";

import { resolveWebActor } from "@/lib/resolve-actor";
import { drizzleDashboardQueryService } from "@repo/database";
import { AppError, UnauthorizedError } from "@repo/shared";

/**
 * GET /api/dashboard
 *
 * Thin HTTP adapter — delegates aggregation to the query service in @repo/database.
 * Target: < 500ms response time.
 * Cached 60s per user; mutation routes call revalidateTag("dashboard") to drop
 * the cache when streak/XP/flashcard state changes.
 */
const getCachedOverview = unstable_cache(
  (userId: string) => drizzleDashboardQueryService.getOverviewForUser(userId),
  ["dashboard-overview"],
  { revalidate: 60, tags: ["dashboard"] },
);

export async function GET() {
  try {
    const actor = await resolveWebActor();
    const result = await getCachedOverview(actor.userId);
    return Response.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof AppError) {
      return Response.json({ error: e.message }, { status: e.statusCode });
    }
    throw e;
  }
}
