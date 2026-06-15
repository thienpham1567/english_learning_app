import { db, userStreak } from "@repo/database";
import { sql } from "drizzle-orm";

/** XP point values per activity type */
export const XP_VALUES = {
  QUIZ_COMPLETE: 50,
  WRITING_SUBMISSION: 100,
  LISTENING_PRACTICE: 40,
  // TOEIC actions
  TOEIC_ANSWER_CORRECT: 5,
  TOEIC_VOCAB_REVIEW: 8,
  TOEIC_MOCK_COMPLETE: 150,
  TOEIC_WRITING_COMPLETE: 120,
  TOEIC_SPEAKING_COMPLETE: 120,
  TOEIC_DICTATION_COMPLETE: 30,
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
