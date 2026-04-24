/**
 * Pathway Context for Home View (Story 24.4, AC: 1-4)
 *
 * Computes the UI state for the pathway progress display on the Home page.
 * Pure functions — no side effects.
 */

import type { StarterPathway, PathwayDay } from "./starter-pathway";

// ── Types ───────────────────────────────────────────────────────────────────

export interface PathwayContext {
	/** Whether a pathway is available */
	hasPathway: boolean;
	/** Current day number (1-7) */
	currentDay: number;
	/** Goal label in Vietnamese */
	goalLabel: string;
	/** Today's pathway day */
	today: PathwayDay | null;
	/** Number of completed days */
	completedDays: number;
	/** Total days */
	totalDays: number;
	/** Progress percentage (0-100) */
	progressPercent: number;
	/** Next milestone text */
	nextMilestone: string;
	/** Whether onboarding was skipped (AC: 4) */
	onboardingSkipped: boolean;
}

// ── Milestone Texts ─────────────────────────────────────────────────────────

function getNextMilestone(currentDay: number, totalDays: number): string {
	if (currentDay >= totalDays) return "🎉 Hoàn thành lộ trình tuần đầu tiên!";
	const remaining = totalDays - currentDay;
	if (remaining === 1) return "🏁 Ngày cuối cùng — hoàn thành lộ trình!";
	if (remaining <= 3) return `⚡ Còn ${remaining} ngày — sắp hoàn thành!`;
	return `📅 Ngày ${currentDay + 1}: Tiếp tục lộ trình`;
}

// ── Context Builder (AC: 1) ─────────────────────────────────────────────────

/**
 * Builds the pathway context for the Home page display (AC: 1).
 *
 * @param pathway The learner's starter pathway (null if none exists)
 * @param completedDayNumbers Array of day numbers that the learner has completed
 * @param startDate The date the pathway was started (ISO string)
 * @param nowMs Current timestamp
 */
export function buildPathwayContext(
	pathway: StarterPathway | null,
	completedDayNumbers: number[],
	startDate?: string,
	nowMs?: number,
): PathwayContext {
	// AC: 4 — Empty state for skipped onboarding
	if (!pathway) {
		return {
			hasPathway: false,
			currentDay: 0,
			goalLabel: "",
			today: null,
			completedDays: 0,
			totalDays: 0,
			progressPercent: 0,
			nextMilestone: "",
			onboardingSkipped: true,
		};
	}

	const now = nowMs ?? Date.now();
	const start = startDate ? new Date(startDate).getTime() : now;
	const daysSinceStart = Math.floor((now - start) / (24 * 60 * 60 * 1000));
	const currentDay = Math.min(Math.max(daysSinceStart + 1, 1), pathway.days.length);
	const completedDays = completedDayNumbers.length;
	const totalDays = pathway.days.length;
	const progressPercent = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

	return {
		hasPathway: true,
		currentDay,
		goalLabel: pathway.goalLabel,
		today: pathway.days[currentDay - 1] ?? null,
		completedDays,
		totalDays,
		progressPercent,
		nextMilestone: getNextMilestone(currentDay, totalDays),
		onboardingSkipped: false,
	};
}
