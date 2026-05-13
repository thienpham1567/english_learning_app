import { headers } from "next/headers";
import { eq, and, gte, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { activityLog } from "@repo/database";

/**
 * GET /api/dashboard/heatmap
 *
 * Returns daily activity counts for the last 90 days.
 * Used by the GitHub-style contribution heatmap on the dashboard.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const rows = await db
    .select({
      date: sql<string>`to_char(${activityLog.createdAt}::date, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
      xp: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
    })
    .from(activityLog)
    .where(
      and(
        eq(activityLog.userId, session.user.id),
        gte(activityLog.createdAt, ninetyDaysAgo),
      ),
    )
    .groupBy(sql`${activityLog.createdAt}::date`)
    .orderBy(sql`${activityLog.createdAt}::date`);

  return Response.json({ days: rows });
}
