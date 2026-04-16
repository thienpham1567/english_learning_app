import { describe, expect, it } from "vitest";
import { getBadges } from "../src/queries/dashboard-badges";

describe("getBadges", () => {
  it("returns all badges unlocked=false when bestStreak is 0", () => {
    const badges = getBadges(0);
    expect(badges).toHaveLength(4);
    expect(badges.every((b) => !b.unlocked)).toBe(true);
  });

  it("unlocks streak-3 when bestStreak >= 3", () => {
    const badges = getBadges(3);
    expect(badges.find((b) => b.id === "streak-3")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "streak-7")?.unlocked).toBe(false);
  });

  it("unlocks streak-3 and streak-7 when bestStreak >= 7", () => {
    const badges = getBadges(7);
    expect(badges.find((b) => b.id === "streak-3")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "streak-7")?.unlocked).toBe(true);
    expect(badges.find((b) => b.id === "streak-30")?.unlocked).toBe(false);
  });

  it("unlocks all badges when bestStreak >= 100", () => {
    const badges = getBadges(100);
    expect(badges.every((b) => b.unlocked)).toBe(true);
  });

  it("returns correct emoji and labels matching the original badges", () => {
    const badges = getBadges(0);
    expect(badges[0]).toMatchObject({ id: "streak-3", emoji: "🔥", label: "Bắt đầu tốt", requiredStreak: 3 });
    expect(badges[1]).toMatchObject({ id: "streak-7", emoji: "🔥", label: "Kiên trì", requiredStreak: 7 });
    expect(badges[2]).toMatchObject({ id: "streak-30", emoji: "🔥", label: "Không thể cản", requiredStreak: 30 });
    expect(badges[3]).toMatchObject({ id: "streak-100", emoji: "🏆", label: "Huyền thoại", requiredStreak: 100 });
  });
});
