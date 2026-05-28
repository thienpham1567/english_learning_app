/**
 * Maps TOEIC vocabulary pack topics to roadmap weeks.
 * Aligns with the curriculum data.ts daily plans for vocabulary days (Wednesday units).
 */

export const VOCAB_TOPIC_TO_WEEK: Record<string, { weekNumber: number; label: string }> = {
  // Phase 1: Foundation
  office: { weekNumber: 1, label: "Week 1 — Office Essentials" },
  business: { weekNumber: 2, label: "Week 2 — Business Core" },
  finance: { weekNumber: 3, label: "Week 3 — Finance & Accounting" },
  marketing: { weekNumber: 4, label: "Week 4 — Marketing & Advertising" },
  manufacturing: { weekNumber: 5, label: "Week 5 — Manufacturing" },
  travel: { weekNumber: 5, label: "Week 5 — Travel & Tourism" },
  restaurants: { weekNumber: 6, label: "Week 6 — Restaurants & Hospitality" },
  health: { weekNumber: 6, label: "Week 6 — Health & Safety" },

  // Phase 2: Skill Building
  technology: { weekNumber: 9, label: "Week 9 — Technology" },
  general: { weekNumber: 13, label: "Week 13 — General Vocabulary" },
};

/**
 * Get the roadmap week for a vocabulary topic.
 */
export function getVocabRoadmapWeek(topic: string): { weekNumber: number; label: string } | null {
  return VOCAB_TOPIC_TO_WEEK[topic] ?? null;
}

/**
 * Get the roadmap unit ID for a vocabulary topic (Wednesday vocab units).
 */
export function getUnitIdForVocabTopic(topic: string): string | null {
  const mapping = VOCAB_TOPIC_TO_WEEK[topic];
  if (!mapping) return null;
  // Vocabulary units are on Wednesday (wed), index 0
  return `w${mapping.weekNumber}-wed-0`;
}
