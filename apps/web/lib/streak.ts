/**
 * Cross-module streak tracking. Any qualifying activity (daily challenge,
 * TOEIC drill, vocab review, mock test, writing/speaking session) updates
 * the user's streak so all activity contributes to a single counter.
 *
 * VN timezone (Asia/Ho_Chi_Minh) is the source of truth for "today".
 */

import { db, userStreak } from "@repo/database";
import { eq } from "drizzle-orm";

/** Get current Vietnam date as YYYY-MM-DD. */
export function getVnDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function getVnYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export type StreakUpdate = {
  currentStreak: number;
  bestStreak: number;
  bumped: boolean; // true if streak advanced today
};

/**
 * Record activity for today and update the streak counter.
 * Idempotent within a day — calling twice on the same day doesn't double-count.
 */
export async function recordActivityStreak(userId: string): Promise<StreakUpdate> {
  const today = getVnDate();
  const yesterday = getVnYesterday();

  const [existing] = await db
    .select()
    .from(userStreak)
    .where(eq(userStreak.userId, userId))
    .limit(1);

  if (!existing) {
    await db.insert(userStreak).values({
      userId,
      currentStreak: 1,
      bestStreak: 1,
      lastCompletedDate: today,
    });
    return { currentStreak: 1, bestStreak: 1, bumped: true };
  }

  let nextStreak: number;
  let bumped = false;
  if (existing.lastCompletedDate === today) {
    nextStreak = existing.currentStreak;
  } else if (existing.lastCompletedDate === yesterday) {
    nextStreak = existing.currentStreak + 1;
    bumped = true;
  } else {
    nextStreak = 1;
    bumped = true;
  }
  const newBest = Math.max(existing.bestStreak, nextStreak);

  await db
    .update(userStreak)
    .set({
      currentStreak: nextStreak,
      bestStreak: newBest,
      lastCompletedDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStreak.userId, userId));

  return { currentStreak: nextStreak, bestStreak: newBest, bumped };
}
