"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api-client";

// ── Client Response Types (Task 1) ──────────────────────────────────────────
// These mirror the server response shape from /api/study-plan/daily without
// importing the zod schema (to keep client bundle lean).

export interface DailyPlanItem {
	id: string;
	title: string;
	reason: string;
	estimatedMinutes: number;
	actionUrl: string;
	skillIds: string[];
	priority: "high" | "medium" | "low";
	completed: boolean;
}

export interface DailyPlan {
	timeBudget: "5" | "10" | "20";
	items: DailyPlanItem[];
	generatedAt: string;
}

export interface DailyPlanStats {
	totalXP: number;
	level: string;
	levelNumber: number;
	nextLevelXP: number;
	currentLevelXP: number;
	completedToday: number;
	totalTasks: number;
	unresolvedErrors: number;
}

/** Legacy task shape preserved for backward compatibility (AC: 4). */
export interface LegacyTask {
	id: string;
	module: string;
	label: string;
	href: string;
	done: boolean;
	priority: "high" | "medium" | "low";
}

interface DailyPlanResponse {
	plan: DailyPlan;
	tasks: LegacyTask[];
	stats: DailyPlanStats;
}

// ── Hook State (AC: 1) ─────────────────────────────────────────────────────

export type DailyPlanState =
	| { status: "loading" }
	| { status: "error"; error: string }
	| { status: "empty" }
	| { status: "ready"; plan: DailyPlan; tasks: LegacyTask[]; stats: DailyPlanStats };

export interface UseDailyStudyPlanOptions {
	/** Time budget in minutes. Defaults to "20". */
	budget?: "5" | "10" | "20";
	/** If false, the hook will not fetch automatically on mount. */
	enabled?: boolean;
	/** If true, refetch when the tab/window regains focus (AC: 1, 2 — completion auto-refresh). Default: true. */
	refetchOnFocus?: boolean;
}

// ── Hook (Task 2, AC: 1-4) ─────────────────────────────────────────────────

export function useDailyStudyPlan(options: UseDailyStudyPlanOptions = {}) {
	const { budget = "20", enabled = true, refetchOnFocus = true } = options;
	const [state, setState] = useState<DailyPlanState>({ status: "loading" });
	const abortRef = useRef<AbortController | null>(null);

	const fetchPlan = useCallback(async () => {
		// Cancel any in-flight request
		abortRef.current?.abort();
		const controller = new AbortController();
		abortRef.current = controller;

		setState({ status: "loading" });

		try {
			const data = await api.get<DailyPlanResponse>("/study-plan/daily", {
				params: { budget },
				signal: controller.signal,
			});

			if (controller.signal.aborted) return;

			// AC: 1 — empty state when plan has no items
			if (!data.plan || data.plan.items.length === 0) {
				setState({ status: "empty" });
			} else {
				setState({
					status: "ready",
					plan: data.plan,
					tasks: data.tasks,
					stats: data.stats,
				});
			}
		} catch (err) {
			if (controller.signal.aborted) return;
			setState({
				status: "error",
				error: err instanceof Error ? err.message : "Failed to load daily plan",
			});
		}
	}, [budget]);

	// Auto-fetch on mount when enabled (AC: 1)
	useEffect(() => {
		if (!enabled) return;

		void fetchPlan();

		return () => {
			abortRef.current?.abort();
		};
	}, [fetchPlan, enabled]);

	// Auto-refetch when tab/window regains focus (Story 21.5, AC: 1, 2)
	// This ensures completed plan items are refreshed without manual action.
	useEffect(() => {
		if (!enabled || !refetchOnFocus) return;

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void fetchPlan();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [fetchPlan, enabled, refetchOnFocus]);

	// AC: 3 — retry is just a re-fetch
	const retry = useCallback(() => {
		void fetchPlan();
	}, [fetchPlan]);

	return { state, retry, refetch: retry };
}
