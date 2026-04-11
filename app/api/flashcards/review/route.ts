import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { flashcardProgress } from "@/lib/db/schema";
import { computeSm2, defaultSm2State } from "@/lib/flashcard/sm2";
import { awardXP, XP_VALUES } from "@/lib/xp";

const ReviewBodySchema = z.object({
  query: z.string().min(1),
  quality: z.number().int().min(0).max(5),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ReviewBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { query, quality } = parsed.data;
  const userId = session.user.id;

  // Find existing progress or use defaults
  const existing = await db
    .select()
    .from(flashcardProgress)
    .where(and(eq(flashcardProgress.userId, userId), eq(flashcardProgress.query, query)))
    .limit(1);

  const prevState = existing[0]
    ? {
        easeFactor: existing[0].easeFactor,
        interval: existing[0].interval,
        repetitions: existing[0].repetitions,
        nextReview: existing[0].nextReview.toISOString(),
      }
    : defaultSm2State();

  const nextState = computeSm2(prevState, quality);
  const now = new Date();

  if (existing[0]) {
    // Update existing row
    await db
      .update(flashcardProgress)
      .set({
        easeFactor: nextState.easeFactor,
        interval: nextState.interval,
        repetitions: nextState.repetitions,
        nextReview: new Date(nextState.nextReview),
        updatedAt: now,
      })
      .where(eq(flashcardProgress.id, existing[0].id));
  } else {
    // Insert new row
    await db.insert(flashcardProgress).values({
      userId,
      query,
      easeFactor: nextState.easeFactor,
      interval: nextState.interval,
      repetitions: nextState.repetitions,
      nextReview: new Date(nextState.nextReview),
      updatedAt: now,
    });
  }

  // Award XP for review (fire-and-forget)
  void awardXP(userId, XP_VALUES.FLASHCARD_REVIEW).catch(() => {});

  return Response.json({ success: true, state: nextState });
}
