/**
 * Error Remediation Recommender (Story 23.5, AC: 1-3)
 *
 * Converts high-priority error patterns into RecommendationCandidate objects
 * that the daily plan scorer can rank alongside other learning activities.
 *
 * Also provides drill completion → review task rescheduling logic (AC: 3).
 */

import type { RecommendationCandidate } from "@repo/contracts";
import type { ErrorPattern } from "./error-pattern-summary";

// ── Config ──────────────────────────────────────────────────────────────────

/** Minimum unresolved errors to generate a recommendation */
const MIN_UNRESOLVED_FOR_RECOMMENDATION = 2;
/** Max recommendations generated from error patterns */
const MAX_ERROR_RECOMMENDATIONS = 3;
/** Estimated minutes for an error drill */
const DRILL_ESTIMATED_MINUTES = 8;

// ── Skill Difficulty Mapping ────────────────────────────────────────────────

const SKILL_DIFFICULTY: Record<string, RecommendationCandidate["difficulty"]> = {
	grammar: "intermediate",
	vocabulary: "elementary",
	writing: "upper_intermediate",
	listening: "intermediate",
	pronunciation: "intermediate",
	reading: "intermediate",
	speaking: "upper_intermediate",
};

// ── Pattern → Candidate Conversion (AC: 1) ─────────────────────────────────

/**
 * Converts error patterns into recommendation candidates for the daily plan.
 *
 * AC: 1 — High-priority repeated errors become high/medium priority tasks.
 * AC: 2 — Reason text names the pattern in learner-friendly Vietnamese.
 *
 * @param patterns Output from `summarizeErrorPatterns()`
 * @param nowMs Current timestamp
 * @returns RecommendationCandidate[] ready for the scorer
 */
export function errorPatternsToRecommendations(
	patterns: ErrorPattern[],
	nowMs?: number,
): RecommendationCandidate[] {
	const now = nowMs ?? Date.now();
	const candidates: RecommendationCandidate[] = [];

	// Filter to patterns with enough unresolved errors
	const eligible = patterns.filter(
		(p) => p.unresolvedCount >= MIN_UNRESOLVED_FOR_RECOMMENDATION,
	);

	// Take top N by unresolved count
	const topPatterns = eligible.slice(0, MAX_ERROR_RECOMMENDATIONS);

	for (const pattern of topPatterns) {
		// Compute proficiency as inverse of error frequency (more errors = lower proficiency)
		// Capped at 0–100
		const proficiency = Math.max(0, Math.min(100,
			100 - Math.min(pattern.unresolvedCount * 15, 90),
		));

		// Confidence inversely proportional to unresolved ratio
		const confidence = pattern.totalCount > 0
			? 1 - (pattern.unresolvedCount / pattern.totalCount)
			: 0.5;

		// Recency: how many hours since last error
		const lastSeenMs = new Date(pattern.lastSeenAt).getTime();
		const hoursSince = Math.max(0, (now - lastSeenMs) / (1000 * 60 * 60));

		candidates.push({
			id: `error-drill-${pattern.category.key}`,
			skillIds: pattern.affectedSkillIds,
			moduleType: "error-drill",
			actionUrl: `/error-notebook`,
			label: `Luyện sửa lỗi: ${pattern.category.labelVi}`,
			estimatedMinutes: DRILL_ESTIMATED_MINUTES,
			isDueReview: pattern.unresolvedCount >= 3,
			dueAt: pattern.unresolvedCount >= 3 ? new Date(now).toISOString() : null,
			currentProficiency: proficiency,
			currentConfidence: confidence,
			difficulty: SKILL_DIFFICULTY[pattern.category.skillId] ?? "intermediate",
			goalAligned: true,
			hoursSinceLastPractice: hoursSince,
		});
	}

	return candidates;
}

// ── Reason Text Generator (AC: 2) ──────────────────────────────────────────

/**
 * Generates learner-friendly reason text naming the error pattern.
 *
 * AC: 2 — Names the pattern in learner-friendly language.
 */
export function generateErrorDrillReason(pattern: ErrorPattern): string {
	const parts: string[] = [];

	parts.push(`Lỗi "${pattern.category.labelVi}" lặp lại ${pattern.unresolvedCount} lần`);

	if (pattern.recentCount > 0) {
		parts.push(`${pattern.recentCount} lần gần đây`);
	}

	return parts.join(" · ");
}

// ── Drill Completion Effects (AC: 3) ────────────────────────────────────────

export interface DrillCompletionEffect {
	/** Error IDs to mark as resolved */
	resolveErrorIds: string[];
	/** Category key to reschedule review for */
	categoryKey: string;
	/** Whether to create a learning event */
	createLearningEvent: boolean;
	/** Score achieved (0-1) */
	score: number;
}

/**
 * Computes the effects of completing an error drill session (AC: 3).
 *
 * - If score >= 0.7: resolve source errors, reschedule review
 * - If score < 0.7: keep errors unresolved, don't reschedule
 * - Always create a learning event
 */
export function computeDrillCompletionEffects(
	categoryKey: string,
	sourceErrorIds: string[],
	correctCount: number,
	totalCount: number,
): DrillCompletionEffect {
	const score = totalCount > 0 ? correctCount / totalCount : 0;
	const passThreshold = 0.7;

	return {
		resolveErrorIds: score >= passThreshold ? sourceErrorIds : [],
		categoryKey,
		createLearningEvent: true,
		score,
	};
}
