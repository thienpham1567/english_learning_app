/**
 * Error Improvement Trend (Story 23.4, AC: 1-4)
 *
 * Computes whether error categories are improving, worsening, or need review
 * by comparing recent vs older error frequencies. Works additively with
 * existing data — no historical backfill required (AC: 3).
 */

import { classifyError, type ErrorCategory } from "./error-category";

// ── Types ───────────────────────────────────────────────────────────────────

export interface TrendInput {
	id: string;
	sourceModule: string;
	grammarTopic: string | null;
	isResolved: boolean;
	createdAt: string;
}

export type TrendDirection = "improved" | "worsened" | "stable" | "new";

export interface CategoryTrend {
	category: ErrorCategory;
	direction: TrendDirection;
	/** Error count in the recent period */
	recentCount: number;
	/** Error count in the older period */
	olderCount: number;
	/** Resolution rate (0-1) for this category */
	resolutionRate: number;
	/** Total errors in this category */
	totalCount: number;
	/** Whether there's enough data for a confident trend (AC: 4) */
	confident: boolean;
	/** Human-readable explanation of the trend */
	explanation: string;
}

export interface TrendSummary {
	improved: CategoryTrend[];
	worsened: CategoryTrend[];
	needsReview: CategoryTrend[];
	/** True if there's enough data for any trend analysis */
	hasData: boolean;
}

// ── Config ──────────────────────────────────────────────────────────────────

/** Split point: errors from last N days are "recent" */
const RECENT_DAYS = 14;
/** Minimum errors in a category for confident trend */
const MIN_FOR_CONFIDENCE = 3;

// ── Trend Computation (AC: 1, 2, 3) ────────────────────────────────────────

/**
 * Computes improvement trends per error category.
 *
 * Strategy (AC: 3 — no backfill needed):
 * 1. Split all errors into "recent" (last 14 days) vs "older" (before that)
 * 2. Group by normalized category
 * 3. Compare recent vs older counts:
 *    - Improved: recent < older
 *    - Worsened: recent > older
 *    - Stable: recent ≈ older
 *    - New: no older errors (first appearance)
 *
 * AC: 4 — Categories with < 3 total errors are marked as low-confidence.
 *
 * @param errors All error entries (both resolved and unresolved)
 * @param nowMs Current timestamp for period calculations
 */
export function computeErrorTrends(
	errors: TrendInput[],
	nowMs?: number,
): TrendSummary {
	const now = nowMs ?? Date.now();
	const recentCutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;

	if (errors.length === 0) {
		return { improved: [], worsened: [], needsReview: [], hasData: false };
	}

	// Group by category
	const groups = new Map<string, {
		category: ErrorCategory;
		recentCount: number;
		olderCount: number;
		resolvedCount: number;
		totalCount: number;
	}>();

	for (const err of errors) {
		const category = classifyError({
			grammarTopic: err.grammarTopic,
			sourceModule: err.sourceModule,
		});

		const existing = groups.get(category.key) ?? {
			category,
			recentCount: 0,
			olderCount: 0,
			resolvedCount: 0,
			totalCount: 0,
		};

		const ts = new Date(err.createdAt).getTime();
		if (ts >= recentCutoff) {
			existing.recentCount++;
		} else {
			existing.olderCount++;
		}

		if (err.isResolved) existing.resolvedCount++;
		existing.totalCount++;

		groups.set(category.key, existing);
	}

	// Build trends
	const improved: CategoryTrend[] = [];
	const worsened: CategoryTrend[] = [];
	const needsReview: CategoryTrend[] = [];

	for (const [, g] of groups) {
		const resolutionRate = g.totalCount > 0 ? g.resolvedCount / g.totalCount : 0;
		const confident = g.totalCount >= MIN_FOR_CONFIDENCE;

		let direction: TrendDirection;
		let explanation: string;

		if (g.olderCount === 0) {
			// New category — only recent errors
			direction = "new";
			explanation = confident
				? `Lỗi mới xuất hiện gần đây (${g.recentCount} lỗi trong 2 tuần qua).`
				: `Chỉ có ${g.totalCount} lỗi — cần thêm dữ liệu để đánh giá xu hướng.`;
		} else if (g.recentCount < g.olderCount) {
			direction = "improved";
			const pct = Math.round((1 - g.recentCount / g.olderCount) * 100);
			explanation = confident
				? `Giảm ${pct}% so với trước đó (${g.olderCount} → ${g.recentCount}).`
				: `Có vẻ cải thiện nhưng chỉ có ${g.totalCount} lỗi — cần thêm dữ liệu.`;
		} else if (g.recentCount > g.olderCount) {
			direction = "worsened";
			const pct = Math.round((g.recentCount / g.olderCount - 1) * 100);
			explanation = confident
				? `Tăng ${pct}% so với trước đó (${g.olderCount} → ${g.recentCount}).`
				: `Có vẻ tăng nhưng chỉ có ${g.totalCount} lỗi — cần thêm dữ liệu.`;
		} else {
			direction = "stable";
			explanation = confident
				? `Ổn định (${g.recentCount} lỗi gần đây, ${g.olderCount} trước đó).`
				: `Chỉ có ${g.totalCount} lỗi — cần thêm dữ liệu để đánh giá.`;
		}

		const trend: CategoryTrend = {
			category: g.category,
			direction,
			recentCount: g.recentCount,
			olderCount: g.olderCount,
			resolutionRate,
			totalCount: g.totalCount,
			confident,
			explanation,
		};

		// AC: 2 — Classify into improved/worsened/needsReview
		if (direction === "improved") {
			improved.push(trend);
		} else if (direction === "worsened" || direction === "new") {
			worsened.push(trend);
		} else {
			// stable or low-confidence → needs review
			needsReview.push(trend);
		}
	}

	// Sort each group: highest count first
	const byCount = (a: CategoryTrend, b: CategoryTrend) => b.totalCount - a.totalCount;
	improved.sort(byCount);
	worsened.sort(byCount);
	needsReview.sort(byCount);

	return { improved, worsened, needsReview, hasData: true };
}
