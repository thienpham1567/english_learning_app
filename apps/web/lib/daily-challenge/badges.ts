import type { Badge } from "./types";

/** Streak-based badge definitions */
const STREAK_BADGES: Omit<Badge, "unlocked">[] = [
  { id: "streak-3", icon: "FireOutlined", label: "Bắt đầu tốt", requiredStreak: 3 },
  { id: "streak-7", icon: "FireOutlined", label: "Kiên trì", requiredStreak: 7 },
  { id: "streak-30", icon: "FireOutlined", label: "Không thể cản", requiredStreak: 30 },
  { id: "streak-100", icon: "TrophyOutlined", label: "Huyền thoại", requiredStreak: 100 },
];

/** Performance-based badge definitions */
export type PerformanceBadge = {
  id: string;
  icon: string;
  label: string;
  description: string;
  condition: "perfect-day" | "speed-demon" | "perfect-week" | "bonus-warrior";
};

export const PERFORMANCE_BADGES: PerformanceBadge[] = [
  { id: "perfect-day", icon: "StarFilled", label: "Ngày hoàn hảo", description: "5/5 đúng", condition: "perfect-day" },
  { id: "speed-demon", icon: "ThunderboltOutlined", label: "Siêu tốc", description: "Hoàn thành < 60s", condition: "speed-demon" },
  { id: "perfect-week", icon: "CrownOutlined", label: "Tuần hoàn hảo", description: "7 ngày 5/5 liên tiếp", condition: "perfect-week" },
  { id: "bonus-warrior", icon: "RocketOutlined", label: "Chiến binh bonus", description: "Hoàn thành 10 bonus", condition: "bonus-warrior" },
];

export function getBadges(bestStreak: number): Badge[] {
  return STREAK_BADGES.map((b) => ({
    ...b,
    unlocked: bestStreak >= b.requiredStreak,
  }));
}

export function getNewlyUnlockedBadges(previousBestStreak: number, newBestStreak: number): Badge[] {
  return STREAK_BADGES.filter(
    (b) => previousBestStreak < b.requiredStreak && newBestStreak >= b.requiredStreak,
  ).map((b) => ({ ...b, unlocked: true }));
}

/**
 * Check which performance badges were earned this session.
 * Called after scoring to determine new achievements.
 */
export function checkPerformanceBadges(context: {
  score: number;
  totalExercises: number;
  timeElapsedMs: number;
}): PerformanceBadge[] {
  const earned: PerformanceBadge[] = [];

  // Perfect Day: all correct
  if (context.score === context.totalExercises && context.totalExercises >= 5) {
    earned.push(PERFORMANCE_BADGES.find(b => b.condition === "perfect-day")!);
  }

  // Speed Demon: under 60s with at least 4/5 correct
  if (context.timeElapsedMs < 60000 && context.score >= 4) {
    earned.push(PERFORMANCE_BADGES.find(b => b.condition === "speed-demon")!);
  }

  return earned.filter(Boolean);
}
