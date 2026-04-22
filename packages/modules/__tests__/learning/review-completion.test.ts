import { describe, expect, it } from "vitest";
import { completeReview } from "../../src/learning/review-completion";
import type { ReviewCompletionInput } from "../../src/learning/review-completion";

const NOW = Date.now();

function makeInput(overrides: Partial<ReviewCompletionInput> = {}): ReviewCompletionInput {
	return {
		taskId: "task-1",
		userId: "u1",
		sourceType: "flashcard_review",
		sourceId: "vocab-42",
		skillIds: ["vocabulary"],
		outcome: "good",
		durationMs: 5000,
		currentEaseFactor: 2.5,
		currentIntervalDays: 1,
		currentAttemptCount: 1,
		currentPriority: 50,
		currentSuccessStreak: 0,
		dueAtMs: NOW - 1000,
		nowMs: NOW,
		...overrides,
	};
}

// ── Schedule Updates (AC: 1) ────────────────────────────────────────────────

describe("completeReview — schedule updates", () => {
	it("returns new schedule with interval and ease factor (AC: 1)", () => {
		const result = completeReview(makeInput());
		expect(result.schedule.nextIntervalDays).toBeGreaterThan(0);
		expect(result.schedule.newEaseFactor).toBeGreaterThanOrEqual(1.3);
		expect(result.schedule.nextDueAt).toBeTruthy();
		expect(result.schedule.newAttemptCount).toBe(2);
	});

	it("updates task status and interval (AC: 1)", () => {
		const result = completeReview(makeInput());
		expect(result.taskStatus).toBe("pending"); // reschedule, not mastered
	});
});

// ── Failed vs Successful Interval (AC: 2) ──────────────────────────────────

describe("completeReview — failure returns sooner", () => {
	it("'again' produces shorter interval than 'good' (AC: 2)", () => {
		const again = completeReview(makeInput({ outcome: "again" }));
		const good = completeReview(makeInput({ outcome: "good" }));
		expect(again.schedule.nextIntervalDays).toBeLessThan(good.schedule.nextIntervalDays);
	});

	it("'hard' produces shorter interval than 'easy' (AC: 2)", () => {
		const hard = completeReview(makeInput({ outcome: "hard" }));
		const easy = completeReview(makeInput({ outcome: "easy" }));
		expect(hard.schedule.nextIntervalDays).toBeLessThan(easy.schedule.nextIntervalDays);
	});
});

// ── Stable / Mastered (AC: 3) ───────────────────────────────────────────────

describe("completeReview — stable and mastered", () => {
	it("marks stable after 3+ consecutive successes (AC: 3)", () => {
		const result = completeReview(makeInput({
			outcome: "good",
			currentSuccessStreak: 2, // this will become 3
		}));
		expect(result.isStable).toBe(true);
		expect(result.isMastered).toBe(false);
	});

	it("marks mastered after 5+ consecutive easy successes (AC: 3)", () => {
		const result = completeReview(makeInput({
			outcome: "easy",
			currentSuccessStreak: 4, // this will become 5
		}));
		expect(result.isMastered).toBe(true);
		expect(result.taskStatus).toBe("completed");
	});

	it("does not mark stable on failure", () => {
		const result = completeReview(makeInput({
			outcome: "again",
			currentSuccessStreak: 10,
		}));
		expect(result.isStable).toBe(false);
		expect(result.isMastered).toBe(false);
	});
});

// ── Learning Event Emission (AC: 1) ─────────────────────────────────────────

describe("completeReview — learning event", () => {
	it("emits a review_completed event (AC: 1)", () => {
		const result = completeReview(makeInput());
		expect(result.learningEvent.eventType).toBe("review_completed");
		expect(result.learningEvent.userId).toBe("u1");
		expect(result.learningEvent.contentId).toBe("vocab-42");
		expect(result.learningEvent.skillIds).toEqual(["vocabulary"]);
		expect(result.learningEvent.durationMs).toBe(5000);
		expect(result.learningEvent.timestamp).toBeTruthy();
	});

	it("maps outcome 'again' to result 'incorrect'", () => {
		const result = completeReview(makeInput({ outcome: "again" }));
		expect(result.learningEvent.result).toBe("incorrect");
		expect(result.learningEvent.errorTags).toContain("review_failed");
	});

	it("maps outcome 'good' to result 'correct'", () => {
		const result = completeReview(makeInput({ outcome: "good" }));
		expect(result.learningEvent.result).toBe("correct");
	});

	it("maps outcome 'hard' to result 'partial'", () => {
		const result = completeReview(makeInput({ outcome: "hard" }));
		expect(result.learningEvent.result).toBe("partial");
	});
});

// ── Mastery Updates (AC: 1) ─────────────────────────────────────────────────

describe("completeReview — mastery updates", () => {
	it("updates mastery for each affected skill (AC: 1)", () => {
		const result = completeReview(makeInput({ skillIds: ["vocabulary", "reading"] }));
		expect(result.masteryUpdates).toHaveLength(2);
		expect(result.masteryUpdates[0]!.skillId).toBe("vocabulary");
		expect(result.masteryUpdates[1]!.skillId).toBe("reading");
	});

	it("success increases proficiency", () => {
		const result = completeReview(makeInput({ outcome: "good" }));
		expect(result.masteryUpdates[0]!.delta).toBeGreaterThan(0);
	});

	it("failure decreases proficiency", () => {
		const result = completeReview(makeInput({ outcome: "again" }));
		expect(result.masteryUpdates[0]!.delta).toBeLessThan(0);
	});

	it("uses existing skill state when provided", () => {
		const existingStates = new Map([
			["vocabulary", {
				proficiency: 70,
				confidence: 0.8,
				successStreak: 5,
				failureStreak: 0,
				decayRate: 0.05,
				signalCount: 10,
				lastPracticedAt: new Date(NOW - 3600000).toISOString(),
				lastUpdatedAt: new Date(NOW - 3600000).toISOString(),
				nextReviewAt: new Date(NOW).toISOString(),
			}],
		]);
		const result = completeReview(makeInput(), existingStates);
		expect(result.masteryUpdates[0]!.previousProficiency).toBe(70);
	});
});

// ── Next Action Message (AC: 4) ─────────────────────────────────────────────

describe("completeReview — next action message", () => {
	it("returns encouraging message on failure (AC: 4)", () => {
		const result = completeReview(makeInput({ outcome: "again" }));
		expect(result.nextActionMessage).toContain("again soon");
	});

	it("returns mastered message when mastered (AC: 4)", () => {
		const result = completeReview(makeInput({
			outcome: "easy",
			currentSuccessStreak: 4,
		}));
		expect(result.nextActionMessage).toContain("Mastered");
	});

	it("returns stable message when stable (AC: 4)", () => {
		const result = completeReview(makeInput({
			outcome: "good",
			currentSuccessStreak: 2,
		}));
		expect(result.nextActionMessage).toContain("solid");
	});

	it("always returns non-empty message", () => {
		for (const outcome of ["again", "hard", "good", "easy"] as const) {
			const result = completeReview(makeInput({ outcome }));
			expect(result.nextActionMessage.length).toBeGreaterThan(0);
		}
	});
});

// ── Integration: Full Loop (AC: 5) ──────────────────────────────────────────

describe("completeReview — full loop integration", () => {
	it("completion updates event + mastery + schedule in one call (AC: 5)", () => {
		const result = completeReview(makeInput({
			outcome: "good",
			skillIds: ["grammar", "vocabulary"],
		}));

		// Schedule updated
		expect(result.schedule.nextDueAt).toBeTruthy();
		expect(result.schedule.newAttemptCount).toBe(2);

		// Event emitted
		expect(result.learningEvent.eventType).toBe("review_completed");
		expect(result.learningEvent.skillIds).toEqual(["grammar", "vocabulary"]);

		// Mastery updated for each skill
		expect(result.masteryUpdates).toHaveLength(2);
		for (const update of result.masteryUpdates) {
			expect(update.delta).not.toBe(0);
		}

		// Message present
		expect(result.nextActionMessage).toBeTruthy();
	});
});
