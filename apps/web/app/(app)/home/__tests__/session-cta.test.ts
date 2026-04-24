import { describe, expect, it } from "vitest";

// ── Pure function extracted from Home page CTA logic (Story 21.4) ───────────
// This mirrors the CTA selection algorithm without requiring React rendering.

interface PlanItem {
	label: string;
	done: boolean;
	href: string;
	priority: number;
}

function selectCtaTarget(
	items: PlanItem[],
): { type: "session"; item: PlanItem } | { type: "all-done" } | { type: "fallback" } {
	if (items.length === 0) return { type: "fallback" };

	const sorted = [...items].sort((a, b) => a.priority - b.priority);
	const next = sorted.find((item) => !item.done);

	if (!next) return { type: "all-done" };
	return { type: "session", item: next };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("selectCtaTarget — Session Start CTA logic (Story 21.4)", () => {
	const ITEMS: PlanItem[] = [
		{ label: "Review Grammar", done: false, href: "/grammar-quiz", priority: 0 },
		{ label: "Train Listening", done: false, href: "/listening", priority: 1 },
		{ label: "Practice Writing", done: false, href: "/writing-practice", priority: 2 },
	];

	// AC: 1 — selects highest-priority incomplete item
	it("selects the highest-priority incomplete item (AC: 1)", () => {
		const result = selectCtaTarget(ITEMS);
		expect(result.type).toBe("session");
		if (result.type === "session") {
			expect(result.item.href).toBe("/grammar-quiz");
			expect(result.item.priority).toBe(0);
		}
	});

	// AC: 2 — skips completed items
	it("skips completed items and selects next incomplete (AC: 2)", () => {
		const partiallyDone = [
			{ ...ITEMS[0]!, done: true },   // grammar done
			{ ...ITEMS[1]! },               // listening still incomplete
			{ ...ITEMS[2]! },               // writing still incomplete
		];
		const result = selectCtaTarget(partiallyDone);
		expect(result.type).toBe("session");
		if (result.type === "session") {
			expect(result.item.href).toBe("/listening");
		}
	});

	it("skips multiple completed items (AC: 2)", () => {
		const mostlyDone = [
			{ ...ITEMS[0]!, done: true },
			{ ...ITEMS[1]!, done: true },
			{ ...ITEMS[2]! },  // only writing remains
		];
		const result = selectCtaTarget(mostlyDone);
		expect(result.type).toBe("session");
		if (result.type === "session") {
			expect(result.item.href).toBe("/writing-practice");
		}
	});

	// AC: 3 — all items complete → celebration state
	it("returns all-done when every item is complete (AC: 3)", () => {
		const allDone = ITEMS.map((item) => ({ ...item, done: true }));
		const result = selectCtaTarget(allDone);
		expect(result.type).toBe("all-done");
	});

	// Edge: empty plan → fallback
	it("returns fallback when plan is empty", () => {
		const result = selectCtaTarget([]);
		expect(result.type).toBe("fallback");
	});

	// Edge: single item incomplete
	it("selects single incomplete item", () => {
		const single = [{ label: "Vocab Review", done: false, href: "/flashcards", priority: 0 }];
		const result = selectCtaTarget(single);
		expect(result.type).toBe("session");
		if (result.type === "session") {
			expect(result.item.href).toBe("/flashcards");
		}
	});

	// Edge: single item complete → all-done
	it("returns all-done for single completed item", () => {
		const single = [{ label: "Vocab Review", done: true, href: "/flashcards", priority: 0 }];
		const result = selectCtaTarget(single);
		expect(result.type).toBe("all-done");
	});

	// Priority ordering is respected
	it("respects priority order regardless of array position (AC: 1)", () => {
		const unordered = [
			{ label: "Low Priority", done: false, href: "/writing-practice", priority: 2 },
			{ label: "High Priority", done: false, href: "/grammar-quiz", priority: 0 },
			{ label: "Med Priority", done: false, href: "/listening", priority: 1 },
		];
		const result = selectCtaTarget(unordered);
		expect(result.type).toBe("session");
		if (result.type === "session") {
			expect(result.item.href).toBe("/grammar-quiz");
			expect(result.item.priority).toBe(0);
		}
	});
});
