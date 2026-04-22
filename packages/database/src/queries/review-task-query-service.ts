import { eq, and, lte } from "drizzle-orm";
import { db } from "../client";
import { reviewTask } from "../schema";
import type { ReviewTaskRow } from "../schema";

/**
 * Create a new review task (upsert on userId+sourceType+sourceId).
 */
export async function createReviewTask(
  data: {
    userId: string;
    sourceType: string;
    sourceId: string;
    skillIds: string[];
    priority: number;
    dueAt: Date;
    estimatedMinutes: number;
    reviewMode: string;
  },
): Promise<void> {
  const now = new Date();
  await db
    .insert(reviewTask)
    .values({
      ...data,
      status: "pending",
      lastOutcome: null,
      attemptCount: 0,
      nextIntervalDays: 0,
      easeFactor: 2.5,
      suppressionReason: null,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
}

/**
 * List due review tasks for a user (status=pending, dueAt <= now).
 */
export async function listDueReviewTasks(
  userId: string,
  now: Date = new Date(),
): Promise<ReviewTaskRow[]> {
  return db
    .select()
    .from(reviewTask)
    .where(
      and(
        eq(reviewTask.userId, userId),
        eq(reviewTask.status, "pending"),
        lte(reviewTask.dueAt, now),
      ),
    )
    .orderBy(reviewTask.dueAt);
}

/**
 * Update a review task after an attempt (outcome, schedule, priority).
 */
export async function updateReviewTaskOutcome(
  taskId: string,
  data: {
    lastOutcome: string;
    attemptCount: number;
    nextIntervalDays: number;
    easeFactor: number;
    dueAt: Date;
    priority: number;
    status: string;
  },
): Promise<void> {
  await db
    .update(reviewTask)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(reviewTask.id, taskId));
}

/**
 * Suppress a review task (hide from queue with reason).
 */
export async function suppressReviewTask(
  taskId: string,
  reason: string,
): Promise<void> {
  await db
    .update(reviewTask)
    .set({
      status: "suppressed",
      suppressionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(reviewTask.id, taskId));
}

/**
 * Reschedule a review task to a new due date.
 */
export async function rescheduleReviewTask(
  taskId: string,
  dueAt: Date,
  nextIntervalDays: number,
): Promise<void> {
  await db
    .update(reviewTask)
    .set({
      dueAt,
      nextIntervalDays,
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(reviewTask.id, taskId));
}
