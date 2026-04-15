export type Sm2State = {
  easeFactor: number;
  interval: number; // days
  repetitions: number;
  nextReview: string; // ISO date string
};

/** Quality ratings for SM-2 algorithm */
export enum Sm2Quality {
  BLACKOUT = 0,
  FAIL = 1,
  INCORRECT = 2,
  HARD = 3,
  GOOD = 4,
  EASY = 5,
}

/** Mastery level for vocabulary items */
export type MasteryLevel = "new" | "learning" | "reviewing" | "mastered";

/**
 * Derive mastery level from SM-2 interval.
 * - new: never reviewed (interval = 0, repetitions = 0)
 * - learning: interval < 7 days
 * - reviewing: interval 7–20 days
 * - mastered: interval >= 21 days
 */
export function deriveMastery(interval: number, repetitions: number): MasteryLevel {
  if (repetitions === 0) return "new";
  if (interval < 7) return "learning";
  if (interval < 21) return "reviewing";
  return "mastered";
}
