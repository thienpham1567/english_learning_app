import { resolveWebActor } from "@/lib/resolve-actor";
import { drizzleDashboardQueryService } from "@repo/database";
import { getDashboardOverview } from "@repo/modules";
import { AppError, UnauthorizedError } from "@repo/shared";

/**
 * GET /api/dashboard
 *
 * Thin HTTP adapter — delegates aggregation to the query service in @repo/database.
 * Target: < 500ms response time.
 */
export async function GET() {
  try {
    const actor = await resolveWebActor();
    const result = await getDashboardOverview({
      actor,
      dashboardQuery: drizzleDashboardQueryService,
    });
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
