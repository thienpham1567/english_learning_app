import { headers } from "next/headers";
import { eq, sql, gte, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";

/**
 * GET /api/leaderboard
 *
 * Returns top 10 users by weekly XP (Monday-reset, VN timezone).
 * User's own rank is always included even if outside top 10.
 * All names are anonymized except the current user.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Get start of current week (Monday 00:00 VN timezone)
  const now = new Date();
  const vnNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
  const dayOfWeek = vnNow.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(vnNow);
  monday.setDate(monday.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Top 10 users by weekly XP
  const topUsers = await db
    .select({
      odUserId: activityLog.userId,
      xp: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
    })
    .from(activityLog)
    .where(gte(activityLog.createdAt, monday))
    .groupBy(activityLog.userId)
    .orderBy(desc(sql`sum(${activityLog.xpEarned})`))
    .limit(10);

  // Get current user's total if not in top 10
  const userInTop = topUsers.find((u) => u.odUserId === userId);
  let userRank: { rank: number; xp: number } | null = null;

  if (!userInTop) {
    // Count users with more XP than current user
    const [userXpRow] = await db
      .select({
        xp: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
      })
      .from(activityLog)
      .where(
        sql`${activityLog.userId} = ${userId} AND ${activityLog.createdAt} >= ${monday}`,
      );

    const userXp = userXpRow?.xp ?? 0;

    const [rankRow] = await db
      .select({
        rank: sql<number>`count(distinct ${activityLog.userId})::int + 1`,
      })
      .from(activityLog)
      .where(
        sql`${activityLog.createdAt} >= ${monday}`,
      )
      .having(sql`sum(${activityLog.xpEarned}) > ${userXp}`);

    userRank = { rank: rankRow?.rank ?? topUsers.length + 1, xp: userXp };
  }

  // Build leaderboard entries (anonymized)
  const BADGES = ["🥇", "🥈", "🥉"];
  const entries = topUsers.map((u, i) => ({
    rank: i + 1,
    badge: BADGES[i] ?? null,
    name: u.odUserId === userId ? "Bạn" : `User_${hashShort(u.odUserId)}`,
    xp: u.xp,
    isCurrentUser: u.odUserId === userId,
  }));

  return Response.json({
    entries,
    currentUser: userInTop
      ? { rank: entries.findIndex((e) => e.isCurrentUser) + 1, xp: userInTop.xp }
      : userRank ?? { rank: entries.length + 1, xp: 0 },
    weekStart: monday.toISOString().slice(0, 10),
  });
}

/** Short hash for anonymization */
function hashShort(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).slice(0, 4).toUpperCase();
}
