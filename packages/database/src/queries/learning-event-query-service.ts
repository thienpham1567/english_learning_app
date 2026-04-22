import { eq } from "drizzle-orm";
import type { LearningEvent } from "@repo/contracts";
import { db } from "../client";
import { learningEvent } from "../schema";

/**
 * Persist a validated learning event.
 *
 * Uses the `idempotencyKey` unique constraint to prevent duplicate writes
 * from client retries (AC: 4). On conflict the row is silently skipped.
 *
 * Write failures are caught and logged but never rethrown (AC: 5).
 */
export async function insertLearningEvent(
  event: LearningEvent & { taxonomyVersion?: string; idempotencyKey: string },
): Promise<{ inserted: boolean }> {
  try {
    await db
      .insert(learningEvent)
      .values({
        userId: event.userId,
        sessionId: event.sessionId,
        moduleType: event.moduleType,
        contentId: event.contentId,
        skillIds: event.skillIds,
        attemptId: event.attemptId,
        eventType: event.eventType,
        result: event.result,
        score: event.score,
        durationMs: event.durationMs,
        difficulty: event.difficulty,
        errorTags: event.errorTags,
        aiVersion: event.aiVersion ?? null,
        rubricVersion: event.rubricVersion ?? null,
        taxonomyVersion: event.taxonomyVersion ?? "1.0.0",
        idempotencyKey: event.idempotencyKey,
      })
      .onConflictDoNothing({ target: learningEvent.idempotencyKey });

    return { inserted: true };
  } catch (err) {
    // AC 5: log but never break the learning action
    console.warn("[insertLearningEvent] Write failed (non-fatal):", err);
    return { inserted: false };
  }
}

/**
 * Fetch learning events for a user, ordered by most recent.
 * Useful for downstream mastery computation (Story 20.4).
 */
export async function getLearningEventsForUser(
  userId: string,
  limit = 100,
): Promise<typeof learningEvent.$inferSelect[]> {
  return db
    .select()
    .from(learningEvent)
    .where(eq(learningEvent.userId, userId))
    .orderBy(learningEvent.createdAt)
    .limit(limit);
}
