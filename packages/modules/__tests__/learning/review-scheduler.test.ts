import { describe, expect, it } from "vitest";
import {
	computeInitialSchedule,
	computeReschedule,
	isHeavySourceType,
	applyBurnoutProtection,
	DEFAULT_ESTIMATED_MINUTES,
	DEFAULT_REVIEW_MODE,
} from "../../src/learning/review-scheduler";
import type { ReviewSourceTypeValue } from "@repo/contracts";

const ALL_SOURCE_TYPES: ReviewSourceTypeValue[] = [
	"flashcard_review",
	"error_retry",
	"grammar_remediation",
	"writing_rewrite",
	"pronunciation_drill",
	"listening_replay",
	"cloze_retry",
];

const NOW = Date.now();

// ── Initial Schedule by Source Type (AC: 3) ─────────────────────────────────

describe("computeInitialSchedule", () => {
	it("creates schedule for all 7 source types", () => {
	for (const sourceType of ALL_SOURCE_TYPES) {
			const schedule = computeInitialSchedule(sourceType, NOW);
			expect(schedule.intervalDays).toBeGreaterThan(0);
			expect(schedule.estimatedMinutes).toBeGreaterThan(0);
			expect(schedule.reviewMode).toBeTruthy();
			expect(new Date(schedule.dueAt).getTime()).toBeGreaterThan(NOW);
		}
	});

	it("flashcard review has recall mode", () => {
		const schedule = computeInitialSchedule("flashcard_review");
		expect(schedule.reviewMode).toBe("recall");
	});

	it("error retry has shorter initial interval than writing rewrite", () => {
		const error = computeInitialSchedule("error_retry", NOW);
		const writing = computeInitialSchedule("writing_rewrite", NOW);
		expect(error.intervalDays).toBeLessThan(writing.intervalDays);
	});

	it("provides estimated minutes matching source type defaults", () => {
	for (const sourceType of ALL_SOURCE_TYPES) {
			const schedule = computeInitialSchedule(sourceType, NOW);
			expect(schedule.estimatedMinutes).toBe(DEFAULT_ESTIMATED_MINUTES[sourceType]);
		}
	});
});

// ── Success Rescheduling (AC: 3) ────────────────────────────────────────────

describe("computeReschedule — success", () => {
	it("extends interval on 'good' outcome", () => {
		const result = computeReschedule("good", 2.5, 1, 2, 50, NOW - 1000, NOW);
		expect(result.nextIntervalDays).toBeGreaterThan(1);
		expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
	});

	it("extends interval more on 'easy' outcome", () => {
		const good = computeReschedule("good", 2.5, 6, 3, 50, NOW - 1000, NOW);
		const easy = computeReschedule("easy", 2.5, 6, 3, 50, NOW - 1000, NOW);
		expect(easy.nextIntervalDays).toBeGreaterThan(good.nextIntervalDays);
	});

	it("reduces priority on 'easy'", () => {
		const result = computeReschedule("easy", 2.5, 1, 2, 50, NOW - 1000, NOW);
		expect(result.newPriority).toBeLessThan(50);
	});

	it("increments attempt count", () => {
		const result = computeReschedule("good", 2.5, 1, 2, 50, NOW, NOW);
		expect(result.newAttemptCount).toBe(3);
	});
});

// ── Failure Rescheduling (AC: 3) ────────────────────────────────────────────

describe("computeReschedule — failure", () => {
	it("resets to short interval on 'again'", () => {
		const result = computeReschedule("again", 2.5, 6, 3, 50, NOW, NOW);
		expect(result.nextIntervalDays).toBeLessThanOrEqual(0.5);
	});

	it("uses medium-short interval on 'hard'", () => {
		const result = computeReschedule("hard", 2.5, 6, 3, 50, NOW, NOW);
		expect(result.nextIntervalDays).toBeLessThanOrEqual(1);
	});

	it("increases priority on failure", () => {
		const result = computeReschedule("again", 2.5, 1, 2, 50, NOW, NOW);
		expect(result.newPriority).toBeGreaterThan(50);
	});

	it("ease factor decreases but never below 1.3", () => {
		const result = computeReschedule("again", 1.35, 1, 0, 50, NOW, NOW);
		expect(result.newEaseFactor).toBeGreaterThanOrEqual(1.3);
	});
});

// ── Overdue Priority Boost (AC: 4) ─────────────────────────────────────────

describe("computeReschedule — urgency boost", () => {
	it("boosts priority for overdue tasks (AC: 4)", () => {
		const overdueMs = NOW - 48 * 60 * 60 * 1000; // 48h ago
		const result = computeReschedule("good", 2.5, 1, 2, 50, overdueMs, NOW);
		expect(result.newPriority).toBeGreaterThan(50);
	});

	it("does not boost priority for not-yet-due tasks", () => {
		const futureMs = NOW + 48 * 60 * 60 * 1000;
		const result = computeReschedule("good", 2.5, 1, 2, 50, futureMs, NOW);
		expect(result.newPriority).toBeLessThanOrEqual(50);
	});
});

// ── Heavy Task Burnout Protection (AC: 4) ──────────────────────────────────

describe("burnout protection", () => {
	it("identifies heavy source types", () => {
		expect(isHeavySourceType("writing_rewrite")).toBe(true);
		expect(isHeavySourceType("grammar_remediation")).toBe(true);
		expect(isHeavySourceType("listening_replay")).toBe(true);
		expect(isHeavySourceType("flashcard_review")).toBe(false);
		expect(isHeavySourceType("error_retry")).toBe(false);
	});

	it("postpones excess heavy tasks beyond daily cap (AC: 4)", () => {
		const tasks = [
			{ sourceType: "writing_rewrite", dueAt: new Date(NOW).toISOString() },
			{ sourceType: "grammar_remediation", dueAt: new Date(NOW).toISOString() },
			{ sourceType: "listening_replay", dueAt: new Date(NOW).toISOString() },
		];
		const protected_ = applyBurnoutProtection(tasks, 2);

		// First 2 heavy tasks stay on time
		expect(new Date(protected_[0]!.dueAt).getTime()).toBe(NOW);
		expect(new Date(protected_[1]!.dueAt).getTime()).toBe(NOW);

		// 3rd heavy task is postponed by 1 day
		expect(new Date(protected_[2]!.dueAt).getTime()).toBeGreaterThan(NOW);
	});

	it("does not postpone non-heavy tasks", () => {
		const tasks = [
			{ sourceType: "flashcard_review", dueAt: new Date(NOW).toISOString() },
			{ sourceType: "error_retry", dueAt: new Date(NOW).toISOString() },
			{ sourceType: "flashcard_review", dueAt: new Date(NOW).toISOString() },
		];
		const protected_ = applyBurnoutProtection(tasks, 2);
		for (const t of protected_) {
			expect(new Date(t.dueAt).getTime()).toBe(NOW);
		}
	});
});

// ── SM-2 Compatibility (AC: 3) ─────────────────────────────────────────────

describe("SM-2 compatibility", () => {
	it("first success → interval=1, second → interval=6", () => {
		const first = computeReschedule("good", 2.5, 0, 0, 50, NOW, NOW);
		expect(first.nextIntervalDays).toBe(1);

		const second = computeReschedule("good", first.newEaseFactor, first.nextIntervalDays, first.newAttemptCount, 50, NOW, NOW);
		expect(second.nextIntervalDays).toBe(6);
	});

	it("third success → interval = prev * newEaseFactor", () => {
		const third = computeReschedule("good", 2.5, 6, 2, 50, NOW, NOW);
		// EF after 'good' (q=3): 2.5 + (0.1 - 2*0.12) = 2.5 - 0.14 = 2.36
		// interval = round(6 * 2.36 * 10) / 10 = 14.2
		expect(third.nextIntervalDays).toBe(14.2);
	});
});
