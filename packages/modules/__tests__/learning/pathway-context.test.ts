import { describe, expect, it } from "vitest";
import { buildPathwayContext } from "../../src/learning/pathway-context";
import { generateStarterPathway } from "../../src/learning/starter-pathway";

// ── Helpers ─────────────────────────────────────────────────────────────────

const NOW = new Date("2026-04-24T12:00:00Z").getTime();
const START = "2026-04-22T12:00:00Z"; // 2 days ago

function makePathway() {
	return generateStarterPathway("general_improvement", "10");
}

// ── Pathway Context (AC: 1) ────────────────────────────────────────────────

describe("buildPathwayContext — Context (AC: 1)", () => {
	it("shows current day based on start date", () => {
		const ctx = buildPathwayContext(makePathway(), [], START, NOW);
		expect(ctx.currentDay).toBe(3); // Day 3 (2 days after start)
	});

	it("shows goal label", () => {
		const ctx = buildPathwayContext(makePathway(), [], START, NOW);
		expect(ctx.goalLabel).toBe("Cải thiện toàn diện");
	});

	it("shows today's pathway day", () => {
		const ctx = buildPathwayContext(makePathway(), [], START, NOW);
		expect(ctx.today).toBeTruthy();
		expect(ctx.today!.day).toBe(3);
	});

	it("shows completed days count", () => {
		const ctx = buildPathwayContext(makePathway(), [1, 2], START, NOW);
		expect(ctx.completedDays).toBe(2);
	});

	it("shows next milestone text", () => {
		const ctx = buildPathwayContext(makePathway(), [1, 2], START, NOW);
		expect(ctx.nextMilestone.length).toBeGreaterThan(0);
	});

	it("calculates progress percentage", () => {
		const ctx = buildPathwayContext(makePathway(), [1, 2, 3], START, NOW);
		expect(ctx.progressPercent).toBe(43); // 3/7 ≈ 43%
	});
});

// ── Primary Action Not Buried (AC: 2) ──────────────────────────────────────

describe("buildPathwayContext — Not Burying Action (AC: 2)", () => {
	it("today has concrete actions (not just summary)", () => {
		const ctx = buildPathwayContext(makePathway(), [], START, NOW);
		expect(ctx.today!.actions.length).toBeGreaterThanOrEqual(1);
		expect(ctx.today!.actions[0]!.actionUrl.startsWith("/")).toBe(true);
	});
});

// ── Settings Entry Point (AC: 3) ───────────────────────────────────────────

describe("buildPathwayContext — Settings (AC: 3)", () => {
	it("exposes goal label for settings display", () => {
		const ctx = buildPathwayContext(makePathway(), [], START, NOW);
		expect(ctx.goalLabel).toBeTruthy();
		expect(ctx.hasPathway).toBe(true);
	});
});

// ── Empty State (AC: 4) ────────────────────────────────────────────────────

describe("buildPathwayContext — Empty State (AC: 4)", () => {
	it("returns empty context when no pathway", () => {
		const ctx = buildPathwayContext(null, []);
		expect(ctx.hasPathway).toBe(false);
		expect(ctx.onboardingSkipped).toBe(true);
		expect(ctx.today).toBeNull();
		expect(ctx.currentDay).toBe(0);
	});
});

// ── Edge Cases ──────────────────────────────────────────────────────────────

describe("buildPathwayContext — Edge Cases", () => {
	it("clamps day to 1 on start date", () => {
		const ctx = buildPathwayContext(makePathway(), [], "2026-04-24T12:00:00Z", NOW);
		expect(ctx.currentDay).toBe(1);
	});

	it("clamps day to 7 after a week", () => {
		const longAgo = "2026-04-10T12:00:00Z"; // 14 days ago
		const ctx = buildPathwayContext(makePathway(), [], longAgo, NOW);
		expect(ctx.currentDay).toBe(7);
	});

	it("shows completion milestone on day 7", () => {
		const lastDay = "2026-04-18T12:00:00Z"; // 6 days ago → day 7
		const ctx = buildPathwayContext(makePathway(), [1, 2, 3, 4, 5, 6], lastDay, NOW);
		expect(ctx.nextMilestone).toContain("Hoàn thành");
	});
});
