/**
 * Mixed Review Session State Machine (Story 22.3, AC: 1-5)
 *
 * Pure-function session logic for a mixed-source review session.
 * The UI layer drives this machine by calling advance/skip/exit.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReviewSessionTask {
	id: string;
	sourceType: string;
	sourceId: string;
	skillIds: string[];
	priority: number;
	estimatedMinutes: number;
	reviewMode: string;
	reason: string;
}

export type TaskOutcome = "correct" | "incorrect" | "skipped";

export interface SessionTaskResult {
	taskId: string;
	sourceType: string;
	outcome: TaskOutcome;
}

export interface ReviewSessionState {
	tasks: ReviewSessionTask[];
	currentIndex: number;
	results: SessionTaskResult[];
	status: "in-progress" | "completed" | "exited";
}

// ── Supported Source Types (AC: 2, 3) ───────────────────────────────────────

const SUPPORTED_SOURCE_TYPES = new Set([
	"vocabulary",
	"flashcard",
	"error_log",
	"grammar_quiz",
]);

export function isSupported(sourceType: string): boolean {
	return SUPPORTED_SOURCE_TYPES.has(sourceType);
}

/**
 * Returns the delegate route for supported source types (AC: 2, 3).
 * For unsupported types, returns a fallback route to the source module (AC: 4).
 */
export function getDelegateRoute(sourceType: string): string {
	switch (sourceType) {
		case "vocabulary":
		case "flashcard":
			return "/flashcards";
		case "error_log":
			return "/review-quiz";
		case "grammar_quiz":
			return "/grammar-quiz";
		case "listening":
			return "/listening";
		case "reading":
			return "/reading";
		case "writing":
			return "/writing-practice";
		case "pronunciation":
			return "/pronunciation";
		default:
			return "/review";
	}
}

// ── Session Factory ─────────────────────────────────────────────────────────

export function createSession(tasks: ReviewSessionTask[]): ReviewSessionState {
	return {
		tasks,
		currentIndex: 0,
		results: [],
		status: tasks.length === 0 ? "completed" : "in-progress",
	};
}

// ── State Transitions ───────────────────────────────────────────────────────

export function advance(
	state: ReviewSessionState,
	outcome: TaskOutcome,
): ReviewSessionState {
	if (state.status !== "in-progress") return state;

	const task = state.tasks[state.currentIndex];
	if (!task) return { ...state, status: "completed" };

	const result: SessionTaskResult = {
		taskId: task.id,
		sourceType: task.sourceType,
		outcome,
	};

	const newResults = [...state.results, result];
	const nextIndex = state.currentIndex + 1;

	if (nextIndex >= state.tasks.length) {
		return {
			...state,
			results: newResults,
			currentIndex: nextIndex,
			status: "completed",
		};
	}

	return {
		...state,
		results: newResults,
		currentIndex: nextIndex,
	};
}

export function exitSession(state: ReviewSessionState): ReviewSessionState {
	return { ...state, status: "exited" };
}

// ── Progress Helpers ────────────────────────────────────────────────────────

export function progressPercent(state: ReviewSessionState): number {
	if (state.tasks.length === 0) return 100;
	return Math.round((state.results.length / state.tasks.length) * 100);
}

export function currentTask(state: ReviewSessionState): ReviewSessionTask | null {
	if (state.status !== "in-progress") return null;
	return state.tasks[state.currentIndex] ?? null;
}

export function sessionSummary(state: ReviewSessionState): {
	total: number;
	correct: number;
	incorrect: number;
	skipped: number;
} {
	return {
		total: state.results.length,
		correct: state.results.filter((r) => r.outcome === "correct").length,
		incorrect: state.results.filter((r) => r.outcome === "incorrect").length,
		skipped: state.results.filter((r) => r.outcome === "skipped").length,
	};
}
