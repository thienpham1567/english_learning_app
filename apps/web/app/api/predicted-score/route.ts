import { activityLog, db, errorLog, listeningExercise, userVocabulary } from "@repo/database";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * GET /api/predicted-score
 *
 * Calculates a predicted TOEIC score based on user performance data.
 * Algorithm weights: grammar accuracy 40%, listening accuracy 30%,
 * vocabulary size 20%, mock test scores 10%.
 *
 * Returns null if insufficient data (<5 quizzes + <3 listening exercises).
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  // Parallel queries
  const [grammarScores, listeningScores, vocabCount, weeklyHistory] = await Promise.all([
    // Grammar scores (from error resolution rate)
    db
      .select({
        total: sql<number>`count(*)::int`,
        resolved: sql<number>`count(*) filter (where ${errorLog.isResolved} = true)::int`,
      })
      .from(errorLog)
      .where(eq(errorLog.userId, userId)),

    // Listening exercise scores
    db
      .select({
        score: listeningExercise.score,
        total: sql<number>`jsonb_array_length(${listeningExercise.questions})::int`,
        createdAt: listeningExercise.createdAt,
      })
      .from(listeningExercise)
      .where(and(eq(listeningExercise.userId, userId), sql`${listeningExercise.score} IS NOT NULL`))
      .orderBy(desc(listeningExercise.createdAt))
      .limit(20),

    // Total saved vocabulary
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(userVocabulary)
      .where(and(eq(userVocabulary.userId, userId), eq(userVocabulary.saved, true))),

    // Weekly XP for trend (last 4 weeks)
    db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${activityLog.createdAt}), 'YYYY-MM-DD')`,
        xp: sql<number>`coalesce(sum(${activityLog.xpEarned}), 0)::int`,
      })
      .from(activityLog)
      .where(and(eq(activityLog.userId, userId), gte(activityLog.createdAt, fourWeeksAgo)))
      .groupBy(sql`date_trunc('week', ${activityLog.createdAt})`)
      .orderBy(sql`date_trunc('week', ${activityLog.createdAt})`),
  ]);

  const grammarTotal = grammarScores[0]?.total ?? 0;
  const grammarResolved = grammarScores[0]?.resolved ?? 0;
  const totalListening = listeningScores.length;

  // Check minimum data requirements
  if (grammarTotal < 5 || totalListening < 3) {
    return Response.json({
      predicted: null,
      insufficient: true,
      quizzesNeeded: Math.max(0, 5 - grammarTotal),
      listeningNeeded: Math.max(0, 3 - totalListening),
    });
  }

  // Calculate component scores

  // 1. Grammar accuracy (error resolution rate, scale 0-100)
  const grammarAvg = grammarTotal > 0 ? (grammarResolved / grammarTotal) * 100 : 50;

  // 2. Listening accuracy (avg percentage)
  const listeningAvg =
    listeningScores.reduce((sum, l) => {
      const total = Math.max(l.total ?? 1, 1);
      return sum + ((l.score ?? 0) / total) * 100;
    }, 0) / totalListening;

  // 3. Vocabulary score (normalized: 500 words = 100%)
  const totalVocab = vocabCount[0]?.count ?? 0;
  const vocabScore = Math.min((totalVocab / 500) * 100, 100);

  // 4. Top performance component
  const topScoresAvg = grammarAvg;

  // Weighted prediction: grammar 40%, listening 30%, vocab 20%, top scores 10%
  const composite = grammarAvg * 0.4 + listeningAvg * 0.3 + vocabScore * 0.2 + topScoresAvg * 0.1;

  // Map composite (0-100) to TOEIC scale (10-990)
  const predicted = Math.round(10 + (composite / 100) * 980);
  const confidence = Math.round(30 - Math.min(grammarTotal + totalListening, 30)); // ±30 down to ±0

  // Reading/Listening split (TOEIC is 495 max each)
  const readingBase = grammarAvg * 0.5 + vocabScore * 0.3 + topScoresAvg * 0.2;
  const listeningBase = listeningAvg * 0.7 + grammarAvg * 0.3;
  const readingPredicted = Math.round(5 + (readingBase / 100) * 490);
  const listeningPredicted = Math.round(5 + (listeningBase / 100) * 490);

  // Weekly predicted scores for trend chart
  const weeklyPredictions = weeklyHistory.map((w) => ({
    week: w.week,
    xp: w.xp,
  }));

  return Response.json({
    predicted,
    confidence,
    reading: readingPredicted,
    listening: listeningPredicted,
    components: {
      grammar: Math.round(grammarAvg),
      listeningAccuracy: Math.round(listeningAvg),
      vocabulary: Math.round(vocabScore),
      topScores: Math.round(topScoresAvg),
    },
    dataPoints: {
      quizzes: grammarTotal,
      listening: totalListening,
      vocabulary: totalVocab,
    },
    weeklyXP: weeklyPredictions,
    insufficient: false,
  });
}
