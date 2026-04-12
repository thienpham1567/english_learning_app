import { headers } from "next/headers";
import { eq, sql, and, gte, desc } from "drizzle-orm";

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
 * Uses Promise.all for parallel queries. Response shape:
 * - weeklyXP: last 12 weeks of XP
 * - dailyActivity: last 90 days activity heatmap
 * - vocabularyGrowth: total saved words per week (12 weeks)
 * - accuracyTrends: daily challenge accuracy per week
 * - totalStats: summary stats
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    weeklyXPRows,
    dailyActivityRows,
    vocabularyGrowthRows,
    accuracyTrendRows,
    totalStatsRows,
    streakRows,
  ] = await Promise.all([
    // 1. Weekly XP — last 12 weeks
    db.execute(sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          '1 week'
        )::date AS week_start
      )
      SELECT
        weeks.week_start::text AS week,
        COALESCE(SUM(${activityLog.xpEarned}), 0)::int AS xp
      FROM weeks
      LEFT JOIN ${activityLog} ON
        ${activityLog.userId} = ${userId}
        AND ${activityLog.createdAt} >= weeks.week_start
        AND ${activityLog.createdAt} < weeks.week_start + INTERVAL '1 week'
      GROUP BY weeks.week_start
      ORDER BY weeks.week_start ASC
    `),

    // 2. Daily activity — last 90 days (for heatmap)
    db.execute(sql`
      WITH dates AS (
        SELECT generate_series(
          (CURRENT_DATE - INTERVAL '89 days')::date,
          CURRENT_DATE,
          '1 day'
        )::date AS day
      )
      SELECT
        dates.day::text AS date,
        COALESCE(COUNT(${activityLog.id}), 0)::int AS count
      FROM dates
      LEFT JOIN ${activityLog} ON
        ${activityLog.userId} = ${userId}
        AND (${activityLog.createdAt})::date = dates.day
      GROUP BY dates.day
      ORDER BY dates.day ASC
    `),

    // 3. Vocabulary growth — cumulative saved words per week (12 weeks)
    db.execute(sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          '1 week'
        )::date AS week_start
      )
      SELECT
        weeks.week_start::text AS week,
        (SELECT COUNT(*)::int FROM ${userVocabulary}
         WHERE ${userVocabulary.userId} = ${userId}
           AND ${userVocabulary.saved} = true
           AND ${userVocabulary.lookedUpAt} < weeks.week_start + INTERVAL '1 week'
        ) AS total_words
      FROM weeks
      ORDER BY weeks.week_start ASC
    `),

    // 4. Accuracy trends — daily challenge score per week (12 weeks)
    db.execute(sql`
      WITH weeks AS (
        SELECT generate_series(
          date_trunc('week', NOW() - INTERVAL '11 weeks'),
          date_trunc('week', NOW()),
          '1 week'
        )::date AS week_start
      )
      SELECT
        weeks.week_start::text AS week,
        COALESCE(AVG(${dailyChallenge.score}), 0)::int AS accuracy
      FROM weeks
      LEFT JOIN ${dailyChallenge} ON
        ${dailyChallenge.userId} = ${userId}
        AND ${dailyChallenge.completedAt} IS NOT NULL
        AND ${dailyChallenge.completedAt} >= weeks.week_start
        AND ${dailyChallenge.completedAt} < weeks.week_start + INTERVAL '1 week'
      GROUP BY weeks.week_start
      ORDER BY weeks.week_start ASC
    `),

    // 5. Total stats
    Promise.all([
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(userVocabulary)
        .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.saved, true))),
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(dailyChallenge)
        .where(and(eq(dailyChallenge.userId, userId), sql`${dailyChallenge.completedAt} IS NOT NULL`)),
      db.select({ count: sql<number>`COUNT(*)::int` })
        .from(activityLog)
        .where(eq(activityLog.userId, userId)),
    ]),

    // 6. Streak data
    db.select().from(userStreak).where(eq(userStreak.userId, userId)).limit(1),
  ]);

  const streak = streakRows[0] ?? { currentStreak: 0, bestStreak: 0, xpTotal: 0 };
  const [vocabCount, quizCount, totalActivities] = totalStatsRows;

  return Response.json({
    weeklyXP: (weeklyXPRows.rows as Array<{ week: string; xp: number }>),
    dailyActivity: (dailyActivityRows.rows as Array<{ date: string; count: number }>),
    vocabularyGrowth: (vocabularyGrowthRows.rows as Array<{ week: string; total_words: number }>),
    accuracyTrends: (accuracyTrendRows.rows as Array<{ week: string; accuracy: number }>),
    totalStats: {
      totalXP: streak.xpTotal ?? 0,
      totalWords: vocabCount[0]?.count ?? 0,
      totalQuizzes: quizCount[0]?.count ?? 0,
      totalActivities: totalActivities[0]?.count ?? 0,
      currentStreak: streak.currentStreak,
      bestStreak: streak.bestStreak,
    },
  });
}
