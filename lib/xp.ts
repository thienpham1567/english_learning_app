import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { userStreak } from "@/lib/db/schema";

/** XP point values per activity type */
export const XP_VALUES = {
  FLASHCARD_REVIEW: 10, // per card
  QUIZ_COMPLETE: 50,
  WRITING_SUBMISSION: 100,
  DAILY_CHALLENGE: 30,
} as const;

/**
 * Atomically increment a user's XP total.
 * Upserts the user_streak row if it doesn't exist yet.
 * Returns the new xp_total.
 */
export async function awardXP(userId: string, amount: number): Promise<number> {
  if (amount <= 0) return 0;

  const result = await db
    .insert(userStreak)
    .values({
      userId,
      xpTotal: amount,
    })
    .onConflictDoUpdate({
      target: userStreak.userId,
      set: {
        xpTotal: sql`${userStreak.xpTotal} + ${amount}`,
        updatedAt: new Date(),
      },
    })
    .returning({ xpTotal: userStreak.xpTotal });

  return result[0]?.xpTotal ?? 0;
}
