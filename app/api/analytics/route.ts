import { headers } from "next/headers";
import { eq, sql, and, gte } from "drizzle-orm";

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
 * Uses Drizzle query builder — compatible with Supabase PgBouncer.
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

    // Generate date ranges client-side
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

    // Cutoff dates as Date objects for gte()
    const cutoffDate = new Date(weeks12[0]);
    const cutoff90Days = new Date(days90[0]);

    // Run all queries in parallel
    const [
      xpByWeekRows,
      activityByDayRows,
      vocabGrowthRows,
      accuracyRows,
      vocabCount,
      quizCount,
      totalActivities,
      streakRows,
      skillRadarRows,
    ] = await Promise.all([
      // 1. XP per week (last 12 weeks)
      db.select({
        week: sql<string>`to_char(date_trunc('week', ${activityLog.createdAt}), 'YYYY-MM-DD')`,
        xp: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
      })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          gte(activityLog.createdAt, cutoffDate),
        ))
        .groupBy(sql`date_trunc('week', ${activityLog.createdAt})`),

      // 2. Activity count per day (last 90 days)
      db.select({
        date: sql<string>`to_char(${activityLog.createdAt}::date, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
        .from(activityLog)
        .where(and(
          eq(activityLog.userId, userId),
          gte(activityLog.createdAt, cutoff90Days),
        ))
        .groupBy(sql`${activityLog.createdAt}::date`),

      // 3. Vocabulary new saves per week
      db.select({
        week: sql<string>`to_char(date_trunc('week', ${userVocabulary.lookedUpAt}), 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
        .from(userVocabulary)
        .where(and(
          eq(userVocabulary.userId, userId),
          eq(userVocabulary.saved, true),
          gte(userVocabulary.lookedUpAt, cutoffDate),
        ))
        .groupBy(sql`date_trunc('week', ${userVocabulary.lookedUpAt})`),

      // 4. Accuracy by week — daily challenge scores
      db.select({
        week: sql<string>`to_char(date_trunc('week', ${dailyChallenge.completedAt}), 'YYYY-MM-DD')`,
        accuracy: sql<number>`coalesce(avg(${dailyChallenge.score}), 0)::int`,
      })
        .from(dailyChallenge)
        .where(and(
          eq(dailyChallenge.userId, userId),
          sql`${dailyChallenge.completedAt} is not null`,
          gte(dailyChallenge.completedAt, cutoffDate),
        ))
        .groupBy(sql`date_trunc('week', ${dailyChallenge.completedAt})`),

      // 5a. Total saved words
      db.select({ count: sql<number>`count(*)::int` })
        .from(userVocabulary)
        .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.saved, true))),

      // 5b. Total completed quizzes
      db.select({ count: sql<number>`count(*)::int` })
        .from(dailyChallenge)
        .where(and(eq(dailyChallenge.userId, userId), sql`${dailyChallenge.completedAt} is not null`)),

      // 5c. Total activities
      db.select({ count: sql<number>`count(*)::int` })
        .from(activityLog)
        .where(eq(activityLog.userId, userId)),

      // 6. Streak
      db.select().from(userStreak).where(eq(userStreak.userId, userId)).limit(1),

      // 7. Skill Radar — sessions + avg XP per activity type
      db.select({
        type: activityLog.activityType,
        sessions: sql<number>`count(*)::int`,
        avgXp: sql<number>`coalesce(avg(${activityLog.xpEarned}), 0)::int`,
      })
        .from(activityLog)
        .where(eq(activityLog.userId, userId))
        .groupBy(activityLog.activityType),
    ]);

    // Merge sparse DB results into dense arrays
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

    // Skill Radar
    const SKILL_MAP: Record<string, { axis: string; icon: string }> = {
      grammar_quiz: { axis: "Grammar", icon: "BulbOutlined" },
      listening_practice: { axis: "Listening", icon: "SoundOutlined" },
      voice_practice: { axis: "Speaking", icon: "AudioOutlined" },
      writing_practice: { axis: "Writing", icon: "EditOutlined" },
      flashcard_review: { axis: "Vocabulary", icon: "BookOutlined" },
      chatbot_session: { axis: "Fluency", icon: "CommentOutlined" },
    };

    const skillRadar = Object.entries(SKILL_MAP).map(([type, meta]) => {
      const row = skillRadarRows.find((r) => r.type === type);
      const sessions = row?.sessions ?? 0;
      const avgXp = row?.avgXp ?? 0;
      const frequencyScore = Math.min(sessions / 50, 1) * 50;
      const qualityScore = Math.min(avgXp / 20, 1) * 50;
      return {
        axis: meta.axis,
        icon: meta.icon,
        score: Math.round(frequencyScore + qualityScore),
        sessions,
        avgXp,
      };
    });

    return Response.json({
      weeklyXP,
      dailyActivity,
      vocabularyGrowth,
      accuracyTrends,
      skillRadar,
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
    return Response.json(
      { error: "Failed to load analytics", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
