import { describe, expect, it } from "vitest";
import {
	createSession,
	advance,
	exitSession,
	progressPercent,
	currentTask,
	sessionSummary,
	isSupported,
	getDelegateRoute,
} from "../../src/learning/review-session";
import type { ReviewSessionTask } from "../../src/learning/review-session";

// ── Helper ──────────────────────────────────────────────────────────────────

function makeTask(overrides?: Partial<ReviewSessionTask>): ReviewSessionTask {
	return {
		id: "task-1",
		sourceType: "grammar_quiz",
		sourceId: "q-1",
		skillIds: ["grammar"],
		priority: 50,
		estimatedMinutes: 5,
		reviewMode: "recall",
		reason: "Ôn ngữ pháp",
		...overrides,
	};
}

// ── Session Creation ────────────────────────────────────────────────────────

describe("createSession", () => {
	it("creates in-progress session with tasks", () => {
		const session = createSession([makeTask()]);
		expect(session.status).toBe("in-progress");
		expect(session.currentIndex).toBe(0);
		expect(session.results).toEqual([]);
	});

	it("creates completed session for empty tasks", () => {
		const session = createSession([]);
		expect(session.status).toBe("completed");
	});
});

// ── Session Progress (AC: 1, 5) ────────────────────────────────────────────

describe("advance — Session Progress (AC: 1, 5)", () => {
	it("advances to next task on correct answer", () => {
		const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })];
		const session = createSession(tasks);
		const next = advance(session, "correct");

		expect(next.currentIndex).toBe(1);
		expect(next.results).toHaveLength(1);
		expect(next.results[0]!.outcome).toBe("correct");
		expect(next.status).toBe("in-progress");
	});

	it("advances to next task on incorrect answer", () => {
		const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })];
		const session = createSession(tasks);
		const next = advance(session, "incorrect");

		expect(next.currentIndex).toBe(1);
		expect(next.results[0]!.outcome).toBe("incorrect");
	});

	it("advances to next task on skip", () => {
		const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })];
		const session = createSession(tasks);
		const next = advance(session, "skipped");

		expect(next.currentIndex).toBe(1);
		expect(next.results[0]!.outcome).toBe("skipped");
	});

	it("completes session after last task", () => {
		const session = createSession([makeTask({ id: "t1" })]);
		const next = advance(session, "correct");

		expect(next.status).toBe("completed");
		expect(next.results).toHaveLength(1);
	});

	it("no-ops when session is already completed", () => {
		const session = createSession([makeTask()]);
		const completed = advance(session, "correct");
		const again = advance(completed, "correct");

		expect(again).toBe(completed); // Same reference
	});
});

// ── Exit Behavior (AC: 5) ──────────────────────────────────────────────────

describe("exitSession — Exit Behavior (AC: 5)", () => {
	it("marks session as exited", () => {
		const session = createSession([makeTask(), makeTask({ id: "t2" })]);
		const exited = exitSession(session);

		expect(exited.status).toBe("exited");
	});

	it("preserves partial results on exit", () => {
		const session = createSession([makeTask({ id: "t1" }), makeTask({ id: "t2" })]);
		const after1 = advance(session, "correct");
		const exited = exitSession(after1);

		expect(exited.results).toHaveLength(1);
		expect(exited.status).toBe("exited");
	});
});

// ── Progress Percent (AC: 5) ───────────────────────────────────────────────

describe("progressPercent", () => {
	it("returns 0 at start", () => {
		const session = createSession([makeTask(), makeTask({ id: "t2" })]);
		expect(progressPercent(session)).toBe(0);
	});

	it("returns 50 after 1 of 2", () => {
		const session = createSession([makeTask(), makeTask({ id: "t2" })]);
		const after1 = advance(session, "correct");
		expect(progressPercent(after1)).toBe(50);
	});

	it("returns 100 when complete", () => {
		const session = createSession([makeTask()]);
		const done = advance(session, "correct");
		expect(progressPercent(done)).toBe(100);
	});

	it("returns 100 for empty session", () => {
		expect(progressPercent(createSession([]))).toBe(100);
	});
});

// ── Current Task ────────────────────────────────────────────────────────────

describe("currentTask", () => {
	it("returns first task at start", () => {
		const task = makeTask({ id: "t1" });
		const session = createSession([task]);
		expect(currentTask(session)?.id).toBe("t1");
	});

	it("returns null when completed", () => {
		const session = createSession([makeTask()]);
		const done = advance(session, "correct");
		expect(currentTask(done)).toBeNull();
	});

	it("returns null when exited", () => {
		const session = createSession([makeTask()]);
		const exited = exitSession(session);
		expect(currentTask(exited)).toBeNull();
	});
});

// ── Session Summary ─────────────────────────────────────────────────────────

describe("sessionSummary", () => {
	it("counts correct, incorrect, and skipped outcomes", () => {
		const tasks = [
			makeTask({ id: "t1" }),
			makeTask({ id: "t2" }),
			makeTask({ id: "t3" }),
		];
		let session = createSession(tasks);
		session = advance(session, "correct");
		session = advance(session, "incorrect");
		session = advance(session, "skipped");

		const summary = sessionSummary(session);
		expect(summary.total).toBe(3);
		expect(summary.correct).toBe(1);
		expect(summary.incorrect).toBe(1);
		expect(summary.skipped).toBe(1);
	});
});

// ── Supported Source Types (AC: 2, 3) ───────────────────────────────────────

describe("isSupported (AC: 2, 3)", () => {
	it("supports vocabulary", () => expect(isSupported("vocabulary")).toBe(true));
	it("supports flashcard", () => expect(isSupported("flashcard")).toBe(true));
	it("supports error_log", () => expect(isSupported("error_log")).toBe(true));
	it("supports grammar_quiz", () => expect(isSupported("grammar_quiz")).toBe(true));
	it("does not support listening", () => expect(isSupported("listening")).toBe(false));
	it("does not support unknown types", () => expect(isSupported("future_module")).toBe(false));
});

// ── Unsupported Fallback (AC: 4) ────────────────────────────────────────────

describe("getDelegateRoute — Fallback (AC: 4)", () => {
	it("routes vocabulary to /flashcards", () => {
		expect(getDelegateRoute("vocabulary")).toBe("/flashcards");
	});

	it("routes error_log to /review-quiz", () => {
		expect(getDelegateRoute("error_log")).toBe("/review-quiz");
	});

	it("routes grammar_quiz to /grammar-quiz", () => {
		expect(getDelegateRoute("grammar_quiz")).toBe("/grammar-quiz");
	});

	it("routes listening to /listening", () => {
		expect(getDelegateRoute("listening")).toBe("/listening");
	});

	it("falls back to /review for unknown types", () => {
		expect(getDelegateRoute("future_module")).toBe("/review");
	});
});

// ── Mixed Source Ordering (AC: 1) ───────────────────────────────────────────

describe("Mixed source ordering (AC: 1)", () => {
	it("preserves task order through the session", () => {
		const tasks = [
			makeTask({ id: "vocab-1", sourceType: "vocabulary" }),
			makeTask({ id: "error-1", sourceType: "error_log" }),
			makeTask({ id: "grammar-1", sourceType: "grammar_quiz" }),
		];

		let session = createSession(tasks);
		expect(currentTask(session)?.id).toBe("vocab-1");

		session = advance(session, "correct");
		expect(currentTask(session)?.id).toBe("error-1");

		session = advance(session, "incorrect");
		expect(currentTask(session)?.id).toBe("grammar-1");

		session = advance(session, "skipped");
		expect(session.status).toBe("completed");
		expect(session.results).toHaveLength(3);
		expect(session.results[0]!.sourceType).toBe("vocabulary");
		expect(session.results[1]!.sourceType).toBe("error_log");
		expect(session.results[2]!.sourceType).toBe("grammar_quiz");
	});
});
