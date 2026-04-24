import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useDailyStudyPlan } from "@/hooks/useDailyStudyPlan";
import type { DailyPlanState } from "@/hooks/useDailyStudyPlan";

// ── Mock api-client ─────────────────────────────────────────────────────────

const mockGet = vi.fn();
vi.mock("@/lib/api-client", () => ({
	api: { get: (...args: unknown[]) => mockGet(...args) },
}));

// ── Fixtures ────────────────────────────────────────────────────────────────

const PLAN_RESPONSE = {
	plan: {
		timeBudget: "20",
		items: [
			{
				id: "review-grammar",
				title: "Review Grammar",
				reason: "Due for review",
				estimatedMinutes: 10,
				actionUrl: "/grammar-quiz",
				skillIds: ["grammar"],
				priority: "high" as const,
				completed: false,
			},
		],
		generatedAt: "2026-04-24T00:00:00.000Z",
	},
	tasks: [
		{
			id: "review-grammar",
			module: "grammar",
			label: "Review Grammar",
			href: "/grammar-quiz",
			done: false,
			priority: "high" as const,
		},
	],
	stats: {
		totalXP: 500,
		level: "Intermediate",
		levelNumber: 4,
		nextLevelXP: 1200,
		currentLevelXP: 600,
		completedToday: 0,
		totalTasks: 1,
		unresolvedErrors: 2,
	},
};

const EMPTY_PLAN_RESPONSE = {
	plan: { timeBudget: "20", items: [], generatedAt: "2026-04-24T00:00:00.000Z" },
	tasks: [],
	stats: { ...PLAN_RESPONSE.stats, totalTasks: 0, completedToday: 0 },
};

// ── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
	mockGet.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("useDailyStudyPlan", () => {
	// ── AC: 1 — loading → ready state ───────────────────────────────────────

	it("starts in loading state then transitions to ready (AC: 1)", async () => {
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		const { result } = renderHook(() => useDailyStudyPlan());

		// Initial state should be loading
		expect(result.current.state.status).toBe("loading");

		// Wait for fetch to complete
		await waitFor(() => {
			expect(result.current.state.status).toBe("ready");
		});

		const readyState = result.current.state as Extract<DailyPlanState, { status: "ready" }>;
		expect(readyState.plan).toBeDefined();
		expect(readyState.tasks).toBeDefined();
		expect(readyState.stats).toBeDefined();
	});

	// ── AC: 2 — plan items preserve all required fields ─────────────────────

	it("preserves title, reason, estimatedMinutes, actionUrl, skillIds, priority, and completed (AC: 2)", async () => {
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("ready");
		});

		const readyState = result.current.state as Extract<DailyPlanState, { status: "ready" }>;
		const item = readyState.plan.items[0]!;

		expect(item.title).toBe("Review Grammar");
		expect(item.reason).toBe("Due for review");
		expect(item.estimatedMinutes).toBe(10);
		expect(item.actionUrl).toBe("/grammar-quiz");
		expect(item.skillIds).toEqual(["grammar"]);
		expect(item.priority).toBe("high");
		expect(item.completed).toBe(false);
	});

	// ── AC: 1 — empty state ─────────────────────────────────────────────────

	it("returns empty state when plan has no items (AC: 1)", async () => {
		mockGet.mockResolvedValueOnce(EMPTY_PLAN_RESPONSE);

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("empty");
		});
	});

	// ── AC: 1 — error state ─────────────────────────────────────────────────

	it("returns error state on API failure (AC: 1)", async () => {
		mockGet.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("error");
		});

		const errorState = result.current.state as Extract<DailyPlanState, { status: "error" }>;
		expect(errorState.error).toBe("Network error");
	});

	it("returns fallback error message for non-Error throws (AC: 1)", async () => {
		mockGet.mockRejectedValueOnce("random string");

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("error");
		});

		const errorState = result.current.state as Extract<DailyPlanState, { status: "error" }>;
		expect(errorState.error).toBe("Failed to load daily plan");
	});

	// ── AC: 3 — retry after failure ─────────────────────────────────────────

	it("can retry after a failed load (AC: 3)", async () => {
		mockGet.mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("error");
		});

		// Now mock a successful response and retry
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		act(() => {
			result.current.retry();
		});

		await waitFor(() => {
			expect(result.current.state.status).toBe("ready");
		});
	});

	// ── AC: 1 — budget parameter ────────────────────────────────────────────

	it("passes budget parameter to the API (AC: 1)", async () => {
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		renderHook(() => useDailyStudyPlan({ budget: "10" }));

		await waitFor(() => {
			expect(mockGet).toHaveBeenCalledWith(
				"/study-plan/daily",
				expect.objectContaining({ params: { budget: "10" } }),
			);
		});
	});

	it("defaults budget to 20 (AC: 1)", async () => {
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(mockGet).toHaveBeenCalledWith(
				"/study-plan/daily",
				expect.objectContaining({ params: { budget: "20" } }),
			);
		});
	});

	// ── AC: 4 — backward-compatible legacy tasks ────────────────────────────

	it("preserves legacy tasks with all required fields (AC: 4)", async () => {
		mockGet.mockResolvedValueOnce(PLAN_RESPONSE);

		const { result } = renderHook(() => useDailyStudyPlan());

		await waitFor(() => {
			expect(result.current.state.status).toBe("ready");
		});

		const readyState = result.current.state as Extract<DailyPlanState, { status: "ready" }>;
		const task = readyState.tasks[0]!;

		expect(task.id).toBe("review-grammar");
		expect(task.module).toBe("grammar");
		expect(task.label).toBe("Review Grammar");
		expect(task.href).toBe("/grammar-quiz");
		expect(task.done).toBe(false);
		expect(task.priority).toBe("high");
	});

	// ── enabled option ──────────────────────────────────────────────────────

	it("does not fetch when enabled is false", async () => {
		renderHook(() => useDailyStudyPlan({ enabled: false }));

		// Give some time for any potential fetch
		await new Promise((r) => setTimeout(r, 50));

		expect(mockGet).not.toHaveBeenCalled();
	});
});
