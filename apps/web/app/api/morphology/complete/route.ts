import { activityLog, db, morphemeProgress } from "@repo/database";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { MORPHEME_LESSON_XP, MorphemeCompleteRequestSchema } from "@/lib/morphology/schema";

/**
 * POST /api/morphology/complete
 *
 * Awards XP (once) for completing a morpheme lesson and upserts progress.
 * Body matches MorphemeCompleteRequestSchema.
 */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = MorphemeCompleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { morphemeId, morpheme, correctCount, totalCount } = parsed.data;
  const scorePct = Math.round((correctCount / totalCount) * 100);
  const now = new Date();

  const [existing] = await db
    .select()
    .from(morphemeProgress)
    .where(and(eq(morphemeProgress.userId, userId), eq(morphemeProgress.morphemeId, morphemeId)))
    .limit(1);

  const wasCompleted = existing?.status === "completed";
  const xpAmount = wasCompleted ? 0 : MORPHEME_LESSON_XP;
  const previousBest = existing?.scorePct ?? 0;
  const isBest = scorePct >= previousBest;
  const mergedCorrect = isBest ? correctCount : (existing?.correctCount ?? correctCount);
  const mergedTotal = isBest ? totalCount : (existing?.totalCount ?? totalCount);
  const mergedScore = Math.max(previousBest, scorePct);
  const completedAt = existing?.completedAt ?? now;

  if (existing) {
    await db
      .update(morphemeProgress)
      .set({
        status: "completed",
        correctCount: mergedCorrect,
        totalCount: mergedTotal,
        scorePct: mergedScore,
        attemptCount: existing.attemptCount + 1,
        lastStudiedAt: now,
        completedAt,
        updatedAt: now,
      })
      .where(eq(morphemeProgress.id, existing.id));
  } else {
    await db.insert(morphemeProgress).values({
      userId,
      morphemeId,
      status: "completed",
      correctCount,
      totalCount,
      scorePct,
      attemptCount: 1,
      lastStudiedAt: now,
      completedAt: now,
      updatedAt: now,
    });
  }

  if (xpAmount > 0) {
    await db.insert(activityLog).values({
      userId,
      activityType: "morphology",
      xpEarned: xpAmount,
      metadata: { morphemeId, morpheme, correctCount, totalCount, scorePct },
    });
  }

  return Response.json({
    xpAwarded: xpAmount,
    alreadyCompleted: wasCompleted,
    progress: {
      morphemeId,
      status: "completed",
      correctCount: mergedCorrect,
      totalCount: mergedTotal,
      scorePct: mergedScore,
      completedAt: completedAt.toISOString(),
      lastStudiedAt: now.toISOString(),
    },
  });
}
