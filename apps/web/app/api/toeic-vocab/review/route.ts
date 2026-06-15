import { db, reviewTask, toeicVocab, userVocabulary, vocabularyCache } from "@repo/database";
import { computeInitialSchedule, computeReschedule, recordLearningEvent } from "@repo/modules";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { recordActivityStreak } from "@/lib/streak";
import { awardXP, XP_VALUES } from "@/lib/xp";

const BodySchema = z.object({
  wordId: z.string().uuid(),
  outcome: z.enum(["again", "hard", "good", "easy"]),
  durationMs: z.number().int().min(0).default(0),
});

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = BodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }
  const { wordId, outcome, durationMs } = parsed.data;
  const userId = session.user.id;

  const [word] = await db.select().from(toeicVocab).where(eq(toeicVocab.id, wordId)).limit(1);
  if (!word) return Response.json({ error: "Word not found" }, { status: 404 });

  const [existing] = await db
    .select()
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.sourceType, "flashcard_review"),
        eq(reviewTask.sourceId, wordId),
      ),
    )
    .limit(1);

  const now = new Date();
  if (existing) {
    const sched = computeReschedule(
      outcome,
      existing.easeFactor,
      existing.nextIntervalDays,
      existing.attemptCount,
      existing.priority,
      existing.dueAt.getTime(),
      now.getTime(),
    );
    await db
      .update(reviewTask)
      .set({
        lastOutcome: outcome,
        attemptCount: sched.newAttemptCount,
        nextIntervalDays: sched.nextIntervalDays,
        easeFactor: sched.newEaseFactor,
        priority: sched.newPriority,
        dueAt: new Date(sched.nextDueAt),
        status: outcome === "again" || outcome === "hard" ? "pending" : "pending",
        updatedAt: now,
      })
      .where(eq(reviewTask.id, existing.id));
  } else {
    const init = computeInitialSchedule("flashcard_review", now.getTime());
    await db.insert(reviewTask).values({
      userId,
      sourceType: "flashcard_review",
      sourceId: wordId,
      skillIds: ["toeic.part5.vocab", "toeic.part7.vocab_in_context"],
      priority: 50,
      dueAt: new Date(init.dueAt),
      estimatedMinutes: init.estimatedMinutes,
      reviewMode: init.reviewMode,
      status: "pending",
      lastOutcome: outcome,
      attemptCount: 1,
      nextIntervalDays: init.intervalDays,
      easeFactor: 2.5,
    });
  }

  // Bridge to vocabulary: ensure word exists in vocabularyCache + userVocabulary
  // so general vocab page sees TOEIC essentials alongside dictionary lookups.
  void (async () => {
    try {
      const cacheData = {
        headword: word.word,
        ipa: word.ipa,
        pos: word.pos,
        definition: word.meaningEn,
        vietnamese: word.meaningVi,
        example: word.exampleEn,
        exampleVietnamese: word.exampleVi,
        topic: word.topic,
        source: "toeic_essential",
      };
      await db
        .insert(vocabularyCache)
        .values({
          query: word.word,
          data: cacheData,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing({ target: vocabularyCache.query });
      await db
        .insert(userVocabulary)
        .values({
          userId,
          query: word.word,
          saved: false,
          masteryLevel: outcome === "easy" ? "mastered" : "learning",
        })
        .onConflictDoUpdate({
          target: [userVocabulary.userId, userVocabulary.query],
          set: {
            masteryLevel: outcome === "easy" ? "mastered" : "learning",
          },
        });
    } catch (err) {
      console.warn("vocabulary bridge failed:", err instanceof Error ? err.message : err);
    }
  })();

  // Emit learning event for dashboard / mastery tracking
  const result = outcome === "again" ? "incorrect" : outcome === "hard" ? "partial" : "correct";
  const score = outcome === "again" ? 0 : outcome === "hard" ? 0.5 : outcome === "good" ? 0.85 : 1;
  void recordLearningEvent({
    userId,
    sessionId: `vocab:${wordId}`,
    moduleType: "toeic_vocab",
    contentId: wordId,
    skillIds: ["toeic.part5.vocab", "toeic.part7.vocab_in_context"],
    attemptId: `vocab-${userId}-${wordId}-${now.getTime()}`,
    eventType: "review_completed",
    result,
    score,
    durationMs,
    difficulty:
      word.level === "beginner"
        ? "elementary"
        : word.level === "advanced"
          ? "advanced"
          : "intermediate",
    errorTags: [],
  });

  if (outcome !== "again") {
    void awardXP(userId, XP_VALUES.TOEIC_VOCAB_REVIEW);
    void recordActivityStreak(userId);
  }

  return Response.json({ ok: true });
}
