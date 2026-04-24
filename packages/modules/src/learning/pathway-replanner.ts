/**
 * Pathway Replanner (Story 24.5, AC: 1-4)
 *
 * Handles goal/time budget changes by regenerating the starter pathway
 * while preserving completed historical activities.
 */

import type { LearnerGoalValue, DailyTimeBudgetValue } from "@repo/contracts";
import { generateStarterPathway } from "./starter-pathway";
import type { StarterPathway, PathwayDay } from "./starter-pathway";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReplanInput {
	/** New goal (may be same as current) */
	newGoal: LearnerGoalValue;
	/** New time budget (may be same as current) */
	newTimeBudget: DailyTimeBudgetValue;
	/** Current pathway (null if none) */
	currentPathway: StarterPathway | null;
	/** Day numbers that have been completed */
	completedDayNumbers: number[];
	/** Current day number (1-7) */
	currentDay: number;
}

export interface ReplanResult {
	/** Whether anything actually changed */
	changed: boolean;
	/** The (possibly new) pathway */
	pathway: StarterPathway;
	/** Completed days preserved from the old plan */
	preservedDays: PathwayDay[];
	/** New days generated from the new settings */
	newDays: PathwayDay[];
	/** Change summary in Vietnamese */
	changeSummary: string;
}

// ── Replan Logic (AC: 1, 2, 3) ─────────────────────────────────────────────

/**
 * Replans the starter pathway after goal/time budget changes (AC: 1-3).
 *
 * AC: 1 — Future plan uses new settings
 * AC: 2 — Completed historical activities remain intact
 * AC: 3 — Current-day tasks are refreshed safely
 *
 * Deterministic: same inputs → same outputs.
 */
export function replanPathway(input: ReplanInput): ReplanResult {
	const { newGoal, newTimeBudget, currentPathway, completedDayNumbers, currentDay } = input;

	// Check if anything actually changed
	const goalChanged = !currentPathway || currentPathway.goalKey !== newGoal;
	const budgetChanged = !currentPathway || currentPathway.timeBudget !== newTimeBudget;
	const changed = goalChanged || budgetChanged;

	if (!changed && currentPathway) {
		return {
			changed: false,
			pathway: currentPathway,
			preservedDays: currentPathway.days.filter((d) => completedDayNumbers.includes(d.day)),
			newDays: [],
			changeSummary: "Không có thay đổi",
		};
	}

	// Generate fresh pathway with new settings
	const freshPathway = generateStarterPathway(newGoal, newTimeBudget);

	// AC: 2 — Preserve completed days from old pathway
	const preservedDays: PathwayDay[] = [];
	const mergedDays: PathwayDay[] = [];

	for (let i = 0; i < freshPathway.days.length; i++) {
		const dayNum = i + 1;
		const isCompleted = completedDayNumbers.includes(dayNum);

		if (isCompleted && currentPathway) {
			// Keep the old day's data for completed days (AC: 2)
			const oldDay = currentPathway.days[i];
			if (oldDay) {
				preservedDays.push(oldDay);
				mergedDays.push(oldDay);
				continue;
			}
		}

		// Use new pathway for uncompleted or current/future days (AC: 1, 3)
		mergedDays.push(freshPathway.days[i]!);
	}

	const newDays = mergedDays.filter((d) => !completedDayNumbers.includes(d.day));

	// Build change summary (AC: 1)
	const summaryParts: string[] = [];
	if (goalChanged) {
		summaryParts.push(`Mục tiêu: ${freshPathway.goalLabel}`);
	}
	if (budgetChanged) {
		summaryParts.push(`Thời gian: ${newTimeBudget} phút/ngày`);
	}

	return {
		changed: true,
		pathway: {
			...freshPathway,
			days: mergedDays,
		},
		preservedDays,
		newDays,
		changeSummary: summaryParts.length > 0
			? `Đã cập nhật: ${summaryParts.join(" · ")}`
			: "Đã tạo lộ trình mới",
	};
}

// ── Detect If Replan Needed ────────────────────────────────────────────────

/**
 * Quick check if a replan is needed (useful for UI indicators).
 */
export function isReplanNeeded(
	currentGoal: LearnerGoalValue,
	currentBudget: DailyTimeBudgetValue,
	pathway: StarterPathway | null,
): boolean {
	if (!pathway) return true;
	return pathway.goalKey !== currentGoal || pathway.timeBudget !== currentBudget;
}
