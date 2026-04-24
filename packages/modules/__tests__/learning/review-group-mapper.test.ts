import { describe, expect, it } from "vitest";
import { groupReviewTasks } from "../../src/learning/review-group-mapper";
import type { DueReviewItem } from "../../src/learning/review-group-mapper";

// ── Helper ──────────────────────────────────────────────────────────────────

function makeItem(overrides?: Partial<DueReviewItem>): DueReviewItem {
	return {
		id: "task-1",
		sourceType: "grammar_quiz",
		sourceId: "q-1",
		skillIds: ["grammar"],
		priority: 50,
		dueAt: "2026-04-24T00:00:00Z",
		estimatedMinutes: 5,
		reviewMode: "recall",
		reason: "Ôn ngữ pháp",
		...overrides,
	};
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("groupReviewTasks — Group by Learner Need (AC: 1)", () => {
	it("groups vocabulary and flashcard into 'words' group", () => {
		const items = [
			makeItem({ id: "v1", sourceType: "vocabulary", priority: 80 }),
			makeItem({ id: "v2", sourceType: "flashcard", priority: 70 }),
		];
		const groups = groupReviewTasks(items);
		const words = groups.find((g) => g.key === "words");

		expect(words).toBeDefined();
		expect(words!.count).toBe(2);
		expect(words!.label).toBe("Từ vựng cần nhớ");
	});

	it("groups error_log into 'mistakes' group", () => {
		const items = [makeItem({ sourceType: "error_log" })];
		const groups = groupReviewTasks(items);
		const mistakes = groups.find((g) => g.key === "mistakes");

		expect(mistakes).toBeDefined();
		expect(mistakes!.label).toBe("Lỗi sai cần sửa");
	});

	it("groups pronunciation into 'pronunciation' group", () => {
		const items = [makeItem({ sourceType: "pronunciation" })];
		const groups = groupReviewTasks(items);
		const pron = groups.find((g) => g.key === "pronunciation");

		expect(pron).toBeDefined();
		expect(pron!.label).toBe("Phát âm cần luyện");
	});

	it("groups reading into 'reading' group", () => {
		const items = [makeItem({ sourceType: "reading" })];
		const groups = groupReviewTasks(items);
		const reading = groups.find((g) => g.key === "reading");

		expect(reading).toBeDefined();
		expect(reading!.label).toBe("Bài đọc cần ôn");
	});

	it("falls back to 'other' for unknown source types", () => {
		const items = [makeItem({ sourceType: "future_module" })];
		const groups = groupReviewTasks(items);
		const other = groups.find((g) => g.key === "other");

		expect(other).toBeDefined();
		expect(other!.label).toBe("Ôn tập khác");
	});
});

describe("groupReviewTasks — Count, Time, Priority (AC: 2)", () => {
	it("sums estimated minutes within a group", () => {
		const items = [
			makeItem({ id: "g1", sourceType: "grammar_quiz", estimatedMinutes: 5 }),
			makeItem({ id: "g2", sourceType: "grammar_quiz", estimatedMinutes: 10 }),
		];
		const groups = groupReviewTasks(items);
		const grammar = groups.find((g) => g.key === "grammar");

		expect(grammar!.estimatedMinutes).toBe(15);
		expect(grammar!.count).toBe(2);
	});

	it("uses the highest priority (lowest number) in a group", () => {
		const items = [
			makeItem({ id: "g1", sourceType: "grammar_quiz", priority: 80 }),
			makeItem({ id: "g2", sourceType: "grammar_quiz", priority: 30 }),
		];
		const groups = groupReviewTasks(items);
		const grammar = groups.find((g) => g.key === "grammar");

		expect(grammar!.priority).toBe(30);
	});

	it("sorts groups by priority (lowest number first)", () => {
		const items = [
			makeItem({ id: "v1", sourceType: "vocabulary", priority: 90 }),
			makeItem({ id: "e1", sourceType: "error_log", priority: 20 }),
			makeItem({ id: "g1", sourceType: "grammar_quiz", priority: 50 }),
		];
		const groups = groupReviewTasks(items);

		expect(groups[0]!.key).toBe("mistakes"); // priority 20
		expect(groups[1]!.key).toBe("grammar");  // priority 50
		expect(groups[2]!.key).toBe("words");    // priority 90
	});
});

describe("groupReviewTasks — Edge Cases", () => {
	it("returns empty array for empty input", () => {
		const groups = groupReviewTasks([]);
		expect(groups).toEqual([]);
	});

	it("handles single item", () => {
		const groups = groupReviewTasks([makeItem()]);
		expect(groups).toHaveLength(1);
		expect(groups[0]!.count).toBe(1);
	});

	it("includes correct actionUrl per group", () => {
		const items = [
			makeItem({ sourceType: "vocabulary" }),
			makeItem({ id: "e1", sourceType: "error_log" }),
		];
		const groups = groupReviewTasks(items);

		const words = groups.find((g) => g.key === "words");
		const mistakes = groups.find((g) => g.key === "mistakes");

		expect(words!.actionUrl).toBe("/flashcards");
		expect(mistakes!.actionUrl).toBe("/review-quiz");
	});

	it("includes emoji per group", () => {
		const items = [makeItem({ sourceType: "listening" })];
		const groups = groupReviewTasks(items);

		expect(groups[0]!.emoji).toBe("🎧");
	});
});
