/**
 * Shared CEFR level configuration used across modules
 * (diagnostic, daily-challenge, grammar quiz, progress)
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/**
 * CEFR colors using CSS custom properties for theme consistency.
 * These map to semantic meaning: A-levels (beginner) are warm,
 * B-levels (intermediate) are neutral, C-levels (advanced) are cool.
 */
export const CEFR_COLORS: Record<string, string> = {
  A1: "var(--error)",
  A2: "var(--warning)",
  B1: "var(--xp)",
  B2: "var(--success)",
  C1: "var(--accent)",
  C2: "var(--secondary)",
};

export const CEFR_LABELS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficiency",
};
