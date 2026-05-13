import { headers } from "next/headers";
import { eq, and, gte, sql, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import {
  dailyChallenge,
  activityLog,
  userVocabulary,
  listeningExercise,
  errorLog,
  userStreak,
} from "@repo/database";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { routeLogger } from "@/lib/logger";

const log = routeLogger("dashboard/weekly-report");

/**
 * GET /api/dashboard/weekly-report
 *
 * AI-powered weekly learning report.
 * Aggregates the user's activity from the past 7 days and uses AI
 * to generate a personalized summary with insights and recommendations.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Parallel data aggregation
  const [
    activities,
    challenges,
    newVocab,
    listeningResults,
    unresolvedErrors,
    streakData,
  ] = await Promise.all([
    // Total activities + XP
    db
      .select({
        count: sql<number>`count(*)::int`,
        totalXP: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
        avgPerDay: sql<number>`count(DISTINCT ${activityLog.createdAt}::date)::int`,
      })
      .from(activityLog)
      .where(and(eq(activityLog.userId, userId), gte(activityLog.createdAt, sevenDaysAgo))),

    // Challenge scores
    db
      .select({
        score: dailyChallenge.score,
        date: dailyChallenge.challengeDate,
      })
      .from(dailyChallenge)
      .where(
        and(
          eq(dailyChallenge.userId, userId),
          gte(dailyChallenge.createdAt, sevenDaysAgo),
          sql`${dailyChallenge.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(desc(dailyChallenge.createdAt)),

    // New vocabulary saved
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVocabulary)
      .where(
        and(
          eq(userVocabulary.userId, userId),
          gte(userVocabulary.lookedUpAt, sevenDaysAgo),
          eq(userVocabulary.saved, true),
        ),
      ),

    // Listening exercises
    db
      .select({
        score: listeningExercise.score,
        total: sql<number>`jsonb_array_length(${listeningExercise.questions})::int`,
      })
      .from(listeningExercise)
      .where(
        and(
          eq(listeningExercise.userId, userId),
          gte(listeningExercise.createdAt, sevenDaysAgo),
          sql`${listeningExercise.score} IS NOT NULL`,
        ),
      ),

    // Unresolved errors from this week
    db
      .select({
        count: sql<number>`count(*)::int`,
        topTopic: sql<string>`mode() WITHIN GROUP (ORDER BY ${errorLog.grammarTopic})`,
      })
      .from(errorLog)
      .where(
        and(
          eq(errorLog.userId, userId),
          gte(errorLog.createdAt, sevenDaysAgo),
          eq(errorLog.isResolved, false),
        ),
      ),

    // Current streak
    db
      .select({
        currentStreak: userStreak.currentStreak,
        bestStreak: userStreak.bestStreak,
      })
      .from(userStreak)
      .where(eq(userStreak.userId, userId))
      .limit(1),
  ]);

  const stats = {
    totalActivities: activities[0]?.count ?? 0,
    totalXP: activities[0]?.totalXP ?? 0,
    daysActive: activities[0]?.avgPerDay ?? 0,
    challengesCompleted: challenges.length,
    avgChallengeScore:
      challenges.length > 0
        ? (challenges.reduce((s, c) => s + (c.score ?? 0), 0) / challenges.length).toFixed(1)
        : "N/A",
    newVocabulary: newVocab[0]?.count ?? 0,
    listeningExercises: listeningResults.length,
    listeningAccuracy:
      listeningResults.length > 0
        ? Math.round(
            (listeningResults.reduce((s, l) => s + (l.score ?? 0), 0) /
              listeningResults.reduce((s, l) => s + (l.total ?? 1), 0)) *
              100,
          )
        : null,
    unresolvedErrors: unresolvedErrors[0]?.count ?? 0,
    weakestTopic: unresolvedErrors[0]?.topTopic ?? null,
    currentStreak: streakData[0]?.currentStreak ?? 0,
    bestStreak: streakData[0]?.bestStreak ?? 0,
  };

  // Insufficient data guard
  if (stats.totalActivities < 3) {
    return Response.json({
      report: null,
      stats,
      insufficient: true,
    });
  }

  // Generate AI summary
  try {
    const completion = await openAiClient.chat.completions.create({
      model: openAiConfig.chatModel,
      temperature: 0.6,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a motivational TOEIC study coach writing a weekly report in Vietnamese.
Write a brief, encouraging weekly report (3-5 paragraphs) that:
1. Summarizes what the student accomplished this week
2. Highlights strengths and areas for improvement
3. Gives 2-3 specific recommendations for next week
4. Ends with an encouraging message

Use emoji sparingly (1-2 per paragraph max). Keep paragraphs short.
Format with simple markdown (bold for key metrics).`,
        },
        {
          role: "user",
          content: `Weekly stats:
- Days active: ${stats.daysActive}/7
- Total XP: ${stats.totalXP}
- Daily challenges completed: ${stats.challengesCompleted} (avg score: ${stats.avgChallengeScore}/10)
- New vocabulary saved: ${stats.newVocabulary}
- Listening exercises: ${stats.listeningExercises}${stats.listeningAccuracy ? ` (${stats.listeningAccuracy}% accuracy)` : ""}
- Unresolved errors: ${stats.unresolvedErrors}${stats.weakestTopic ? ` (weakest: ${stats.weakestTopic})` : ""}
- Current streak: ${stats.currentStreak} days (best: ${stats.bestStreak})

Write the weekly report in Vietnamese.`,
        },
      ],
    });

    const report = completion.choices[0]?.message?.content ?? "";

    return Response.json({ report, stats, insufficient: false });
  } catch (err) {
    log.error({ err }, "dashboard.weekly-report.ai.failed");
    return Response.json({ report: null, stats, insufficient: false, error: "AI generation failed" });
  }
}
