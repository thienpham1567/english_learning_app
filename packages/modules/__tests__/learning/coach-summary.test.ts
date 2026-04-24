import { describe, expect, it } from "vitest";
import { buildCoachSummary, coachSummaryToPrompt } from "../../src/learning/coach-summary";
import type { LessonSummary } from "@repo/contracts";

function makeSummary(overrides?: Partial<LessonSummary>): LessonSummary {
	return {
		moduleType: "grammar-quiz",
		sessionId: "s-1",
		completedAt: "2026-04-24T12:00:00Z",
		outcome: "passed",
		score: 80,
		correctCount: 8,
		totalCount: 10,
		durationSeconds: 300,
		explanation: "Good",
		topIssue: null,
		nextActions: [{ label: "Next", href: "/", priority: "primary" }],
		skillIds: ["grammar"],
		reviewCandidates: [],
		...overrides,
	};
}

describe("buildCoachSummary", () => {
	it("returns empty context for no summaries", () => {
		const cs = buildCoachSummary([]);
		expect(cs.performanceLevel).toBe("moderate");
		expect(cs.focusAreas).toEqual([]);
		expect(cs.contextText).toContain("mới bắt đầu");
	});

	it("detects strong performance", () => {
		const cs = buildCoachSummary([makeSummary({ score: 90 }), makeSummary({ score: 85 })]);
		expect(cs.performanceLevel).toBe("strong");
		expect(cs.tone).toBe("encouraging");
	});

	it("detects struggling performance", () => {
		const cs = buildCoachSummary([makeSummary({ score: 30 }), makeSummary({ score: 40 })]);
		expect(cs.performanceLevel).toBe("struggling");
		expect(cs.tone).toBe("corrective");
	});

	it("collects focus areas from top issues", () => {
		const cs = buildCoachSummary([
			makeSummary({ topIssue: { description: "Tense errors", category: "tense", occurrences: 3 } }),
			makeSummary({ topIssue: { description: "Article errors", category: "article", occurrences: 2 } }),
		]);
		expect(cs.focusAreas).toContain("Tense errors");
		expect(cs.focusAreas).toContain("Article errors");
	});

	it("includes average score in context", () => {
		const cs = buildCoachSummary([makeSummary({ score: 60 }), makeSummary({ score: 80 })]);
		expect(cs.contextText).toContain("70");
	});
});

describe("coachSummaryToPrompt", () => {
	it("produces prompt with coaching tone", () => {
		const cs = buildCoachSummary([makeSummary({ score: 90 })]);
		const prompt = coachSummaryToPrompt(cs);
		expect(prompt).toContain("[Thông tin người học]");
		expect(prompt).toContain("khen ngợi");
	});
});
