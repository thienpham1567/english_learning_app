import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import {
  buildGrammarLessonSummary,
  getRecommendedGrammarTopic,
  type GrammarLessonProgressItem,
} from "@/lib/grammar-lessons/schema";
import { GRAMMAR_TOPIC_CATEGORIES } from "@/lib/grammar-lessons/topics";
import { db, grammarLessonProgress } from "@repo/database";

/**
 * GET /api/grammar-lessons/progress
 *
 * Returns persistent grammar lesson progress for the current user.
 * Query params: examMode, level
 */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const examMode = url.searchParams.get("examMode") === "ielts" ? "ielts" : "toeic";
  const preferredLevel = url.searchParams.get("level") ?? undefined;

  const rows = await db
    .select()
    .from(grammarLessonProgress)
    .where(and(
      eq(grammarLessonProgress.userId, session.user.id),
      eq(grammarLessonProgress.examMode, examMode),
    ));

  const progress: GrammarLessonProgressItem[] = rows.map((row) => ({
    topicId: row.topicId,
    status: row.status === "completed" ? "completed" : "in_progress",
    correctCount: row.correctCount,
    totalCount: row.totalCount,
    scorePct: row.scorePct,
    completedAt: row.completedAt?.toISOString() ?? null,
    lastStudiedAt: row.lastStudiedAt.toISOString(),
  }));

  const summary = buildGrammarLessonSummary(GRAMMAR_TOPIC_CATEGORIES, progress);
  const recommendedTopic = getRecommendedGrammarTopic(GRAMMAR_TOPIC_CATEGORIES, progress, preferredLevel);

  return Response.json({
    progress,
    summary,
    recommendedTopic,
  });
}
