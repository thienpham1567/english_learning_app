import type { ActorContext } from "@repo/auth";
import type { DashboardResponse } from "@repo/contracts";
import type { DashboardQueryService } from "@repo/database";

export async function getDashboardOverview(deps: {
	actor: ActorContext;
	dashboardQuery: DashboardQueryService;
}): Promise<DashboardResponse> {
	return deps.dashboardQuery.getOverviewForUser(deps.actor.userId);
}
