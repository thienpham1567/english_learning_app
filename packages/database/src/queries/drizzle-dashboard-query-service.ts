import { eq, and, sql, desc, lte } from "drizzle-orm";
import type { DashboardResponse } from "@repo/contracts";
import { db } from "../client";
import {
  userVocabulary,
  vocabularyCache,
  flashcardProgress,
  dailyChallenge,
  userStreak,
  writingSubmission,
} from "../schema";
import type { DashboardQueryService } from "./dashboard-query-service";
import { getBadges } from "./dashboard-badges";

/**
 * Drizzle-backed implementation of DashboardQueryService.
 *
 * All query logic is extracted verbatim from the original
 * apps/web/app/api/dashboard/route.ts to preserve behavior.
 */
export const drizzleDashboardQueryService: DashboardQueryService = {
  async getOverviewForUser(userId: string): Promise<DashboardResponse> {
    const now = new Date();
    const todayVN = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // ── Parallel DB queries (Promise.all for performance) ──
    const [
      flashcardDueRows,
      streakRows,
      dailyChallengeRows,
      recentVocabularyRows,
      weeklyActivityRows,
      vocabDueRows,
    ] = await Promise.all([
      // 1. Flashcard due count
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(userVocabulary)
        .leftJoin(
          flashcardProgress,
          and(
            eq(flashcardProgress.userId, userId),
            eq(flashcardProgress.query, userVocabulary.query),
          ),
        )
        .where(
          and(
            eq(userVocabulary.userId, userId),
            eq(userVocabulary.saved, true),
            sql`(${flashcardProgress.nextReview} IS NULL OR ${flashcardProgress.nextReview} <= ${now})`,
          ),
        ),

      // 2. Streak data
      db
        .select()
        .from(userStreak)
        .where(eq(userStreak.userId, userId))
        .limit(1),

      // 3. Today's daily challenge status
      db
        .select({
          completedAt: dailyChallenge.completedAt,
          score: dailyChallenge.score,
        })
        .from(dailyChallenge)
        .where(
          and(
            eq(dailyChallenge.userId, userId),
            eq(dailyChallenge.challengeDate, todayVN),
          ),
        )
        .limit(1),

      // 4. Last 10 vocabulary lookups
      db
        .select({
          query: userVocabulary.query,
          headword: sql<string>`${vocabularyCache.data}->>'headword'`,
          level: sql<string | null>`${vocabularyCache.data}->>'level'`,
          lookedUpAt: userVocabulary.lookedUpAt,
        })
        .from(userVocabulary)
        .innerJoin(
          vocabularyCache,
          eq(userVocabulary.query, vocabularyCache.query),
        )
        .where(eq(userVocabulary.userId, userId))
        .orderBy(desc(userVocabulary.lookedUpAt))
        .limit(10),

      // 5. Weekly activity counts (last 7 days)
      // Counts daily_challenge completions + writing_submissions per day
      db.execute(sql`
        WITH dates AS (
          SELECT generate_series(
            (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '6 days',
            CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh',
            '1 day'
          )::date AS day
        ),
        activity AS (
          SELECT (${dailyChallenge.completedAt} AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
          FROM ${dailyChallenge}
          WHERE ${dailyChallenge.userId} = ${userId}
            AND ${dailyChallenge.completedAt} IS NOT NULL
            AND ${dailyChallenge.completedAt} >= (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '6 days'
          UNION ALL
          SELECT (${writingSubmission.createdAt} AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
          FROM ${writingSubmission}
          WHERE ${writingSubmission.userId} = ${userId}
            AND ${writingSubmission.createdAt} >= (CURRENT_DATE AT TIME ZONE 'Asia/Ho_Chi_Minh') - INTERVAL '6 days'
        )
        SELECT dates.day::text AS day, COUNT(activity.day)::int AS count
        FROM dates
        LEFT JOIN activity ON dates.day = activity.day
        GROUP BY dates.day
        ORDER BY dates.day ASC
      `),

      // 6. Vocabulary SRS due count
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(userVocabulary)
        .where(
          and(
            eq(userVocabulary.userId, userId),
            eq(userVocabulary.saved, true),
            lte(userVocabulary.nextReview, now),
          ),
        ),
    ]);

    // ── Assemble response ──
    const flashcardsDue = flashcardDueRows[0]?.count ?? 0;

    const streak = streakRows[0] ?? {
      currentStreak: 0,
      bestStreak: 0,
      lastCompletedDate: null,
      xpTotal: 0,
    };

    const dailyChallengeStatus = dailyChallengeRows[0]
      ? {
          completed: dailyChallengeRows[0].completedAt !== null,
          score: dailyChallengeRows[0].score,
        }
      : { completed: false, score: null };

    const recentVocabulary = recentVocabularyRows.map((row) => ({
      query: row.query,
      headword: row.headword,
      level: row.level ?? "unknown",
      lookedUpAt: row.lookedUpAt?.toISOString() ?? new Date(0).toISOString(),
    }));

    const weeklyActivity = (
      weeklyActivityRows.rows as Array<{ day: string; count: number }>
    ).map((row) => ({
      day: row.day,
      count: row.count,
    }));

    const totalXP = streak.xpTotal ?? 0;
    const vocabDue = vocabDueRows[0]?.count ?? 0;

    return {
      flashcardsDue,
      vocabDue,
      dailyChallenge: dailyChallengeStatus,
      streak: {
        currentStreak: streak.currentStreak,
        bestStreak: streak.bestStreak,
        lastCompletedDate: streak.lastCompletedDate,
      },
      badges: getBadges(streak.bestStreak),
      recentVocabulary,
      weeklyActivity,
      totalXP,
    };
  },
};
