import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSkillProfile } from "@/lib/db/schema";

/** Supported skill modules for adaptive difficulty */
export type SkillModule = "grammar" | "listening" | "reading" | "writing" | "speaking";

/** CEFR level mapping from numeric scale */
const CEFR_THRESHOLDS: { min: number; label: string }[] = [
  { min: 9.5, label: "C2" },
  { min: 9, label: "C1" },
  { min: 7, label: "B2" },
  { min: 4, label: "B1" },
  { min: 1, label: "A2" },
];

/**
 * Map a numeric skill level (1.0–10.0) to a CEFR label.
 */
export function levelToCefr(level: number): string {
  for (const t of CEFR_THRESHOLDS) {
    if (level >= t.min) return t.label;
  }
  return "A1";
}

/**
 * Get or create a user's skill profile for a specific module.
 */
export async function getSkillProfile(userId: string, module: SkillModule) {
  const rows = await db
    .select()
    .from(userSkillProfile)
    .where(and(eq(userSkillProfile.userId, userId), eq(userSkillProfile.module, module)))
    .limit(1);

  if (rows[0]) return rows[0];

  // Create default profile (handle race: another request may insert first)
  await db
    .insert(userSkillProfile)
    .values({ userId, module })
    .onConflictDoNothing();

  // Re-fetch to guarantee a full row with id/updatedAt
  const [refetched] = await db
    .select()
    .from(userSkillProfile)
    .where(and(eq(userSkillProfile.userId, userId), eq(userSkillProfile.module, module)))
    .limit(1);

  return refetched!;
}

/**
 * Update skill profile after completing an exercise.
 *
 * Algorithm: newLevel = oldLevel + 0.3 × (accuracy - 0.7)
 * - Converges around 70% accuracy (optimal learning zone)
 * - Accuracy > 0.7 → level goes up
 * - Accuracy < 0.7 → level goes down
 * - Clamped to [1.0, 10.0]
 */
export async function updateSkillProfile(
  userId: string,
  module: SkillModule,
  sessionAccuracy: number,
) {
  const profile = await getSkillProfile(userId, module);
  const oldLevel = profile.currentLevel;

  // Smooth adjustment converging at 70% accuracy
  const adjustment = 0.3 * (sessionAccuracy - 0.7);
  const newLevel = Math.max(1.0, Math.min(10.0, oldLevel + adjustment));

  // Blend accuracy: 70% new + 30% old (EMA)
  const newAccuracy = 0.7 * sessionAccuracy + 0.3 * profile.accuracyLast10;

  await db
    .insert(userSkillProfile)
    .values({
      userId,
      module,
      currentLevel: newLevel,
      accuracyLast10: newAccuracy,
    })
    .onConflictDoUpdate({
      target: [userSkillProfile.userId, userSkillProfile.module],
      set: {
        currentLevel: newLevel,
        accuracyLast10: newAccuracy,
        updatedAt: new Date(),
      },
    });

  return {
    previousLevel: oldLevel,
    newLevel,
    cefr: levelToCefr(newLevel),
    accuracy: newAccuracy,
    levelChanged: Math.abs(newLevel - oldLevel) >= 0.1,
    levelUp: newLevel > oldLevel,
  };
}
