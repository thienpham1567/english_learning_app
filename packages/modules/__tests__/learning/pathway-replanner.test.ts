import { describe, expect, it } from "vitest";
import {
	replanPathway,
	isReplanNeeded,
} from "../../src/learning/pathway-replanner";
import { generateStarterPathway } from "../../src/learning/starter-pathway";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makePathway(goal = "exam_prep" as const, budget = "10" as const) {
	return generateStarterPathway(goal, budget);
}

// ── Future Plan Uses New Settings (AC: 1) ───────────────────────────────────

describe("replanPathway — Future Plan (AC: 1)", () => {
	it("regenerates pathway with new goal", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "career",
			newTimeBudget: "10",
			currentPathway: current,
			completedDayNumbers: [],
			currentDay: 1,
		});
		expect(result.changed).toBe(true);
		expect(result.pathway.goalKey).toBe("career");
	});

	it("regenerates pathway with new time budget", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "exam_prep",
			newTimeBudget: "30",
			currentPathway: current,
			completedDayNumbers: [],
			currentDay: 1,
		});
		expect(result.changed).toBe(true);
		expect(result.pathway.timeBudget).toBe("30");
	});

	it("returns changed=false when nothing changes", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "exam_prep",
			newTimeBudget: "10",
			currentPathway: current,
			completedDayNumbers: [],
			currentDay: 1,
		});
		expect(result.changed).toBe(false);
	});

	it("generates change summary in Vietnamese", () => {
		const result = replanPathway({
			newGoal: "career",
			newTimeBudget: "20",
			currentPathway: makePathway("exam_prep", "10"),
			completedDayNumbers: [],
			currentDay: 1,
		});
		expect(result.changeSummary).toContain("Đã cập nhật");
		expect(result.changeSummary).toContain("Mục tiêu");
		expect(result.changeSummary).toContain("Thời gian");
	});
});

// ── Preserve Completed (AC: 2) ─────────────────────────────────────────────

describe("replanPathway — Preserve Completed (AC: 2)", () => {
	it("keeps completed days from old pathway", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "career",
			newTimeBudget: "10",
			currentPathway: current,
			completedDayNumbers: [1, 2],
			currentDay: 3,
		});
		// Days 1 and 2 should be from old pathway
		expect(result.preservedDays).toHaveLength(2);
		expect(result.pathway.days[0]!.theme).toBe(current.days[0]!.theme);
		expect(result.pathway.days[1]!.theme).toBe(current.days[1]!.theme);
	});

	it("uses new pathway for uncompleted days", () => {
		const current = makePathway("exam_prep", "10");
		const careerPathway = makePathway("career", "10");
		const result = replanPathway({
			newGoal: "career",
			newTimeBudget: "10",
			currentPathway: current,
			completedDayNumbers: [1, 2],
			currentDay: 3,
		});
		// Days 3-7 should be from new career pathway
		expect(result.pathway.days[2]!.theme).toBe(careerPathway.days[2]!.theme);
	});
});

// ── Refresh Current Day (AC: 3) ────────────────────────────────────────────

describe("replanPathway — Refresh Current Day (AC: 3)", () => {
	it("current day gets new pathway tasks", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "career",
			newTimeBudget: "10",
			currentPathway: current,
			completedDayNumbers: [], // Day 3 is NOT completed
			currentDay: 3,
		});
		// Current day should use new pathway
		const careerPathway = makePathway("career", "10");
		expect(result.pathway.days[2]!.theme).toBe(careerPathway.days[2]!.theme);
	});
});

// ── TOEIC ↔ IELTS Switching (AC: 4) ────────────────────────────────────────

describe("replanPathway — Goal Switching (AC: 4)", () => {
	it("switching from exam_prep to academic changes pathway", () => {
		const current = makePathway("exam_prep", "15");
		const result = replanPathway({
			newGoal: "academic",
			newTimeBudget: "15",
			currentPathway: current,
			completedDayNumbers: [1],
			currentDay: 2,
		});
		expect(result.changed).toBe(true);
		expect(result.pathway.goalKey).toBe("academic");
		expect(result.pathway.goalLabel).toContain("học thuật");
	});

	it("switching time budget preserves completed days", () => {
		const current = makePathway("exam_prep", "10");
		const result = replanPathway({
			newGoal: "exam_prep",
			newTimeBudget: "30",
			currentPathway: current,
			completedDayNumbers: [1, 2, 3],
			currentDay: 4,
		});
		expect(result.preservedDays).toHaveLength(3);
		expect(result.newDays.length).toBeGreaterThan(0);
	});
});

// ── isReplanNeeded ──────────────────────────────────────────────────────────

describe("isReplanNeeded", () => {
	it("returns true when no pathway exists", () => {
		expect(isReplanNeeded("career", "10", null)).toBe(true);
	});

	it("returns true when goal changes", () => {
		const pathway = makePathway("exam_prep", "10");
		expect(isReplanNeeded("career", "10", pathway)).toBe(true);
	});

	it("returns true when budget changes", () => {
		const pathway = makePathway("exam_prep", "10");
		expect(isReplanNeeded("exam_prep", "30", pathway)).toBe(true);
	});

	it("returns false when nothing changes", () => {
		const pathway = makePathway("exam_prep", "10");
		expect(isReplanNeeded("exam_prep", "10", pathway)).toBe(false);
	});
});
