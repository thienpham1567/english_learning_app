import type { Badge } from "./types";

const BADGE_DEFINITIONS: Omit<Badge, "unlocked">[] = [
  { id: "streak-3", emoji: "🔥", label: "Bắt đầu tốt", requiredStreak: 3 },
  { id: "streak-7", emoji: "🔥", label: "Kiên trì", requiredStreak: 7 },
  { id: "streak-30", emoji: "🔥", label: "Không thể cản", requiredStreak: 30 },
  { id: "streak-100", emoji: "🏆", label: "Huyền thoại", requiredStreak: 100 },
];

export function getBadges(bestStreak: number): Badge[] {
  return BADGE_DEFINITIONS.map((b) => ({
    ...b,
    unlocked: bestStreak >= b.requiredStreak,
  }));
}

export function getNewlyUnlockedBadges(previousBestStreak: number, newBestStreak: number): Badge[] {
  return BADGE_DEFINITIONS.filter(
    (b) => previousBestStreak < b.requiredStreak && newBestStreak >= b.requiredStreak,
  ).map((b) => ({ ...b, unlocked: true }));
}
