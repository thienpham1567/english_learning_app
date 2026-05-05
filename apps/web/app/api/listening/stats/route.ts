import { headers } from "next/headers";
import { eq, and, isNotNull, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("listening/stats");
import { listeningExercise, userStreak } from "@repo/database";

/**
 * GET /api/listening/stats
 *
 * Aggregated listening dashboard metrics:
 * - Total sessions, sessions this week
 * - Average scores (all-time and this week)
 * - Weekly trend (last 8 weeks)
 * - Breakdown by level and mode
 * - Current streak
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const baseCondition = and(
      eq(listeningExercise.userId, userId),
      isNotNull(listeningExercise.completedAt),
    );

    // Total sessions + avg score
    const [totals] = await db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        avgScore: sql<number>`coalesce(round(avg(${listeningExercise.score}))::int, 0)`,
      })
      .from(listeningExercise)
      .where(baseCondition);

    // This week stats
    const [weekStats] = await db
      .select({
        sessionsThisWeek: sql<number>`count(*)::int`,
        avgScoreThisWeek: sql<number>`coalesce(round(avg(${listeningExercise.score}))::int, 0)`,
      })
      .from(listeningExercise)
      .where(and(baseCondition, gte(listeningExercise.completedAt, sevenDaysAgo)));

    // Weekly trend (last 8 weeks)
    const weeklyTrend = await db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${listeningExercise.completedAt}), 'YYYY-MM-DD')`,
        avg: sql<number>`round(avg(${listeningExercise.score}))::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(listeningExercise)
      .where(
        and(
          baseCondition,
          gte(listeningExercise.completedAt, new Date(Date.now() - 56 * 24 * 60 * 60 * 1000)),
        ),
      )
      .groupBy(sql`date_trunc('week', ${listeningExercise.completedAt})`)
      .orderBy(sql`date_trunc('week', ${listeningExercise.completedAt})`);

    // By level
    const byLevel = await db
      .select({
        level: listeningExercise.level,
        count: sql<number>`count(*)::int`,
        avgScore: sql<number>`round(avg(${listeningExercise.score}))::int`,
      })
      .from(listeningExercise)
      .where(baseCondition)
      .groupBy(listeningExercise.level)
      .orderBy(listeningExercise.level);

    // By mode
    const byMode = await db
      .select({
        mode: listeningExercise.mode,
        count: sql<number>`count(*)::int`,
        avgScore: sql<number>`round(avg(${listeningExercise.score}))::int`,
      })
      .from(listeningExercise)
      .where(baseCondition)
      .groupBy(listeningExercise.mode)
      .orderBy(listeningExercise.mode);

    // Streak
    const [streak] = await db
      .select({ currentStreak: userStreak.currentStreak })
      .from(userStreak)
      .where(eq(userStreak.userId, userId))
      .limit(1);

    return Response.json({
      totalSessions: totals.totalSessions,
      sessionsThisWeek: weekStats.sessionsThisWeek,
      avgScore: totals.avgScore,
      avgScoreThisWeek: weekStats.avgScoreThisWeek,
      weeklyTrend,
      byLevel,
      byMode,
      currentStreak: streak?.currentStreak ?? 0,
    });
  } catch (err) {
    log.error({ err }, "listening.stats.error");
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
