import { eq, and } from "drizzle-orm";
import { db } from "../client";
import { userSkillState } from "../schema";
import type { UserSkillStateRow } from "../schema";

/**
 * Get a user's skill state for a specific skill.
 * Returns null if no state exists yet.
 */
export async function getUserSkillState(
  userId: string,
  skillId: string,
): Promise<UserSkillStateRow | null> {
  const [row] = await db
    .select()
    .from(userSkillState)
    .where(and(eq(userSkillState.userId, userId), eq(userSkillState.skillId, skillId)))
    .limit(1);
  return row ?? null;
}

/**
 * Get all skill states for a user.
 */
export async function getAllUserSkillStates(
  userId: string,
): Promise<UserSkillStateRow[]> {
  return db
    .select()
    .from(userSkillState)
    .where(eq(userSkillState.userId, userId));
}

/**
 * Upsert a user's skill state.
 * Uses the unique(userId, skillId) constraint for conflict resolution.
 */
export async function upsertUserSkillState(
  data: {
    userId: string;
    skillId: string;
    proficiency: number;
    confidence: number;
    successStreak: number;
    failureStreak: number;
    decayRate: number;
    signalCount: number;
    lastPracticedAt: Date;
    nextReviewAt: Date;
  },
): Promise<void> {
  const now = new Date();
  await db
    .insert(userSkillState)
    .values({
      ...data,
      lastUpdatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userSkillState.userId, userSkillState.skillId],
      set: {
        proficiency: data.proficiency,
        confidence: data.confidence,
        successStreak: data.successStreak,
        failureStreak: data.failureStreak,
        decayRate: data.decayRate,
        signalCount: data.signalCount,
        lastPracticedAt: data.lastPracticedAt,
        lastUpdatedAt: now,
        nextReviewAt: data.nextReviewAt,
      },
    });
}
