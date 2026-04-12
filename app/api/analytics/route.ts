import { headers } from "next/headers";
import { eq, sql, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  activityLog,
  userStreak,
  userVocabulary,
  dailyChallenge,
} from "@/lib/db/schema";

/**
 * GET /api/analytics
 *
 * Returns aggregated learning analytics for the authenticated user.
 * Refactored to avoid raw db.execute() CTEs — uses simpler queries
 * compatible with Supabase PgBouncer (transaction mode).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Helper: get start of week (Monday) for a date
    function getWeekStart(d: Date): string {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      return monday.toISOString().slice(0, 10);
    }

    // Generate date ranges client-side instead of using generate_series
    const now = new Date();
    const weeks12: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks12.push(getWeekStart(d));
    }

    const days90: string[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days90.push(d.toISOString().slice(0, 10));
    }

    const cutoff12Weeks = weeks12[0];

    // Parallel queries — all use Drizzle query builder (not raw SQL)
    const [
      xpByWeekRows,
      activityByDayRows,
      vocabGrowthRows,
      accuracyRows,
      vocabCount,
      quizCount,
      totalActivities,
      streakRows,
    ] = await Promise.all([
      // 1. XP per week (last 12 weeks)
      db.select({
        week: sql<string>`date_trunc('week', ${activityLog.createdAt})::date::text`,
        xp: sql<number>`COALESCE(SUM(${activityLog.xpEarned}), 0)::int`,
      })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          sql`${activityLog.createdAt} >= ${cutoff12Weeks}::date`,
        ))
        .groupBy(sql`date_trunc('week', ${activityLog.createdAt})::date`),

      // 2. Activity count per day (last 90 days)
      db.select({
        date: sql<string>`(${activityLog.createdAt})::date::text`,
        count: sql<number>`COUNT(*)::int`,
      })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          sql`${activityLog.createdAt} >= (CURRENT_DATE - INTERVAL '89 days')`,
        ))
        .groupBy(sql`(${activityLog.createdAt})::date`),

      // 3. Cumulative vocabulary — total saved words before each week boundary
      db.select({
        count: sql<number>`COUNT(*)::int`,
        week: sql<string>`date_trunc('week', ${userVocabulary.lookedUpAt})::date::text`,
      })
        .from(userVocabulary)
        .where(and(
          eq(userVocabulary.userId, userId),
          eq(userVocabulary.saved, true),
          sql`${userVocabulary.lookedUpAt} >= ${cutoff12Weeks}::date`,
        ))
        .groupBy(sql`date_trunc('week', ${userVocabulary.lookedUpAt})::date`),

      // 4. Accuracy by week — daily challenge scores
      db.select({
        week: sql<string>`date_trunc('week', ${dailyChallenge.completedAt})::date::text`,
        accuracy: sql<number>`COALESCE(AVG(${dailyChallenge.score}), 0)::int`,
      })
        .from(dailyChallenge)
        .where(and(
          eq(dailyChallenge.userId, userId),
          sql`${dailyChallenge.completedAt} IS NOT NULL`,
          sql`${dailyChallenge.completedAt} >= ${cutoff12Weeks}::date`,
        ))
        .groupBy(sql`date_trunc('week', ${dailyChallenge.completedAt})::date`),

      // 5a. Total saved words
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(userVocabulary)
        .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.saved, true))),

      // 5b. Total completed quizzes
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(dailyChallenge)
        .where(and(eq(dailyChallenge.userId, userId), sql`${dailyChallenge.completedAt} IS NOT NULL`)),

      // 5c. Total activities
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(activityLog)
        .where(eq(activityLog.userId, userId)),

      // 6. Streak
      db.select().from(userStreak).where(eq(userStreak.userId, userId)).limit(1),
    ]);

    // Merge sparse DB results into dense arrays (fill missing weeks/days with 0)
    const xpMap = new Map(xpByWeekRows.map((r) => [r.week, r.xp]));
    const weeklyXP = weeks12.map((w) => ({ week: w, xp: xpMap.get(w) ?? 0 }));

    const activityMap = new Map(activityByDayRows.map((r) => [r.date, r.count]));
    const dailyActivity = days90.map((d) => ({ date: d, count: activityMap.get(d) ?? 0 }));

    // Vocabulary growth — cumulative sum
    const vocabWeekMap = new Map(vocabGrowthRows.map((r) => [r.week, r.count]));
    let cumulative = 0;
    const vocabularyGrowth = weeks12.map((w) => {
      cumulative += vocabWeekMap.get(w) ?? 0;
      return { week: w, total_words: cumulative };
    });

    const accuracyMap = new Map(accuracyRows.map((r) => [r.week, r.accuracy]));
    const accuracyTrends = weeks12.map((w) => ({ week: w, accuracy: accuracyMap.get(w) ?? 0 }));

    const streak = streakRows[0] ?? { currentStreak: 0, bestStreak: 0, xpTotal: 0 };

    return Response.json({
      weeklyXP,
      dailyActivity,
      vocabularyGrowth,
      accuracyTrends,
      totalStats: {
        totalXP: streak.xpTotal ?? 0,
        totalWords: vocabCount[0]?.count ?? 0,
        totalQuizzes: quizCount[0]?.count ?? 0,
        totalActivities: totalActivities[0]?.count ?? 0,
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
      },
    });
  } catch (err) {
    console.error("[Analytics] Query error:", err);
    return Response.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
