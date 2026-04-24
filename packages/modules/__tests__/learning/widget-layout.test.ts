import { describe, expect, it } from "vitest";
import {
	buildWidgetLayout,
	getMobileVisibleWidgets,
	getPrimaryWidgets,
	getActiveWidgets,
} from "../../src/learning/widget-layout";

const FULL_CONTEXT = {
	hasPathway: true,
	hasSkillData: true,
	hasReviewDebt: true,
	hasStreak: true,
	hasXp: true,
	hasBadges: true,
	hasLeaderboard: true,
};

describe("buildWidgetLayout — Priority (AC: 1)", () => {
	it("places primary widgets before gamification", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		const primaryIdx = slots.findIndex((s) => s.id === "daily-action");
		const gamIdx = slots.findIndex((s) => s.id === "streak");
		expect(primaryIdx).toBeLessThan(gamIdx);
	});

	it("has 3 primary and 4 gamification widgets", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		expect(slots.filter((s) => s.category === "primary")).toHaveLength(3);
		expect(slots.filter((s) => s.category === "gamification")).toHaveLength(4);
	});
});

describe("buildWidgetLayout — Accessibility (AC: 2)", () => {
	it("all gamification widgets are present", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		const ids = slots.map((s) => s.id);
		expect(ids).toContain("streak");
		expect(ids).toContain("xp");
		expect(ids).toContain("badges");
		expect(ids).toContain("leaderboard");
	});
});

describe("buildWidgetLayout — Empty States (AC: 3)", () => {
	it("provides empty messages when no data", () => {
		const slots = buildWidgetLayout({
			hasPathway: false, hasSkillData: false, hasReviewDebt: false,
			hasStreak: false, hasXp: false, hasBadges: false, hasLeaderboard: false,
		});
		for (const slot of slots) {
			expect(slot.emptyMessage.length).toBeGreaterThan(0);
		}
	});
});

describe("getMobileVisibleWidgets (AC: 4)", () => {
	it("includes all primary widgets on mobile", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		const mobile = getMobileVisibleWidgets(slots);
		expect(mobile.filter((s) => s.category === "primary")).toHaveLength(3);
	});

	it("includes gamification widgets with data on mobile", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		const mobile = getMobileVisibleWidgets(slots);
		expect(mobile.length).toBeGreaterThan(3); // primary + some gamification
	});
});

describe("getPrimaryWidgets", () => {
	it("returns only primary widgets", () => {
		const slots = buildWidgetLayout(FULL_CONTEXT);
		const primary = getPrimaryWidgets(slots);
		expect(primary).toHaveLength(3);
		expect(primary.every((s) => s.category === "primary")).toBe(true);
	});
});

describe("getActiveWidgets", () => {
	it("hides empty gamification widgets", () => {
		const slots = buildWidgetLayout({
			hasPathway: true, hasSkillData: true, hasReviewDebt: false,
			hasStreak: true, hasXp: false, hasBadges: false, hasLeaderboard: false,
		});
		const active = getActiveWidgets(slots);
		expect(active.find((s) => s.id === "xp")).toBeFalsy();
		expect(active.find((s) => s.id === "streak")).toBeTruthy();
	});
});
