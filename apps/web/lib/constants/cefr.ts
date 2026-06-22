/**
 * Shared CEFR level configuration used across modules
 * (diagnostic, daily-challenge, grammar quiz, progress)
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/**
 * CEFR colors using dedicated CSS custom properties (--cefr-*).
 * Warm-to-cool progression: Red → Orange → Gold → Green → Blue → Purple
 */
export const CEFR_COLORS: Record<string, string> = {
  A1: "var(--cefr-a1)",
  A2: "var(--cefr-a2)",
  B1: "var(--cefr-b1)",
  B2: "var(--cefr-b2)",
  C1: "var(--cefr-c1)",
  C2: "var(--cefr-c2)",
};

/** Tailwind utility classes for CEFR level badges (Soft UI) */
export const CEFR_BADGE_CLASSES: Record<string, string> = {
  A1: "text-cefr-a1 border-cefr-a1/30 bg-cefr-a1/5",
  A2: "text-cefr-a2 border-cefr-a2/30 bg-cefr-a2/5",
  B1: "text-cefr-b1 border-cefr-b1/30 bg-cefr-b1/5",
  B2: "text-cefr-b2 border-cefr-b2/30 bg-cefr-b2/5",
  C1: "text-cefr-c1 border-cefr-c1/30 bg-cefr-c1/5",
  C2: "text-cefr-c2 border-cefr-c2/30 bg-cefr-c2/5",
};

export const CEFR_LABELS: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficiency",
};
