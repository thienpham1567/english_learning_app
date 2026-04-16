import type { DashboardResponse } from "@repo/contracts";

/**
 * Read-model query service for the dashboard aggregation.
 *
 * Accepts a userId and returns the full dashboard overview payload
 * typed against @repo/contracts.  Implementations must not import
 * HTTP or framework types — they are infrastructure-only.
 */
export interface DashboardQueryService {
  getOverviewForUser(userId: string): Promise<DashboardResponse>;
}
