import { resolveWebActor } from "@/lib/resolve-actor";
import { AppError, UnauthorizedError } from "@repo/shared";
import { drizzleDashboardQueryService } from "@repo/database";

/**
 * GET /api/dashboard
 *
 * Thin HTTP adapter — delegates aggregation to the query service in @repo/database.
 * Target: < 500ms response time.
 */
export async function GET() {
  try {
    const actor = await resolveWebActor();
    const data = await drizzleDashboardQueryService.getOverviewForUser(actor.userId);
    return Response.json(data);
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
