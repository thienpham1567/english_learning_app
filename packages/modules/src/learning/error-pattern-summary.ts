/**
 * Error Pattern Summary (Story 23.2, AC: 1-4)
 *
 * Aggregates error entries into patterns grouped by normalized category,
 * ranked by frequency and recency. Returns examples, affected skill,
 * and recommended next actions.
 */

import { classifyError, type ErrorCategory } from "./error-category";

// ── Input / Output Types ────────────────────────────────────────────────────

export interface ErrorPatternInput {
	id: string;
	sourceModule: string;
	grammarTopic: string | null;
	questionStem: string;
	userAnswer: string;
	correctAnswer: string;
	isResolved: boolean;
	createdAt: string;
}

export interface ErrorPatternExample {
	id: string;
	questionStem: string;
	userAnswer: string;
	correctAnswer: string;
	createdAt: string;
}

export interface ErrorPattern {
	category: ErrorCategory;
	totalCount: number;
	unresolvedCount: number;
	recentCount: number;
	lastSeenAt: string;
	examples: ErrorPatternExample[];
	affectedSkillIds: string[];
	nextAction: {
		label: string;
		href: string;
	};
}

// ── Config ──────────────────────────────────────────────────────────────────

/** Consider errors from the last N days as "recent" */
const RECENT_DAYS = 7;
/** Max examples per pattern */
const MAX_EXAMPLES = 3;

// ── Next Action Recommendations (AC: 2) ─────────────────────────────────────

function getNextAction(category: ErrorCategory): { label: string; href: string } {
	switch (category.skillId) {
		case "grammar":
			return { label: "Luyện ngữ pháp", href: "/grammar-quiz" };
		case "vocabulary":
			return { label: "Ôn từ vựng", href: "/flashcards" };
		case "writing":
			return { label: "Luyện viết", href: "/writing-practice" };
		case "listening":
			return { label: "Luyện nghe", href: "/listening" };
		case "pronunciation":
			return { label: "Luyện phát âm", href: "/pronunciation" };
		case "reading":
			return { label: "Luyện đọc", href: "/reading" };
		default:
			return { label: "Ôn tập", href: "/review" };
	}
}

// ── Aggregation (AC: 1, 2, 3) ───────────────────────────────────────────────

/**
 * Aggregates error entries into patterns by normalized category.
 *
 * AC: 1 — Shows top patterns by frequency (totalCount) and recency (recentCount).
 * AC: 2 — Each pattern includes examples, affected skill, and next action.
 * AC: 3 — Resolved errors are included in trend calculations (not hidden).
 *
 * @param errors All error entries to aggregate (both resolved and unresolved).
 * @param nowMs Current timestamp for recency calculations.
 * @returns Patterns sorted by: unresolvedCount desc, totalCount desc, recency desc.
 */
export function summarizeErrorPatterns(
	errors: ErrorPatternInput[],
	nowMs?: number,
): ErrorPattern[] {
	const now = nowMs ?? Date.now();
	const recentCutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;

	// Group by category key
	const groups = new Map<string, {
		category: ErrorCategory;
		entries: ErrorPatternInput[];
	}>();

	for (const err of errors) {
		const category = classifyError({
			grammarTopic: err.grammarTopic,
			sourceModule: err.sourceModule,
		});

		const existing = groups.get(category.key);
		if (existing) {
			existing.entries.push(err);
		} else {
			groups.set(category.key, { category, entries: [err] });
		}
	}

	// Build patterns
	const patterns: ErrorPattern[] = [];

	for (const [, group] of groups) {
		const entries = group.entries;

		// Sort entries by createdAt desc for examples
		const sorted = [...entries].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		const unresolvedCount = entries.filter((e) => !e.isResolved).length;
		const recentCount = entries.filter(
			(e) => new Date(e.createdAt).getTime() >= recentCutoff,
		).length;
		const lastSeenAt = sorted[0]?.createdAt ?? new Date(now).toISOString();

		// Top examples (most recent, prefer unresolved)
		const unresolvedFirst = [
			...sorted.filter((e) => !e.isResolved),
			...sorted.filter((e) => e.isResolved),
		].slice(0, MAX_EXAMPLES);

		const examples: ErrorPatternExample[] = unresolvedFirst.map((e) => ({
			id: e.id,
			questionStem: e.questionStem,
			userAnswer: e.userAnswer,
			correctAnswer: e.correctAnswer,
			createdAt: e.createdAt,
		}));

		const affectedSkillIds = [group.category.skillId];
		if (group.category.subskillId) affectedSkillIds.push(group.category.subskillId);

		patterns.push({
			category: group.category,
			totalCount: entries.length,
			unresolvedCount,
			recentCount,
			lastSeenAt,
			examples,
			affectedSkillIds,
			nextAction: getNextAction(group.category),
		});
	}

	// Sort: unresolved first, then by total count, then by recency (AC: 1)
	patterns.sort((a, b) => {
		if (a.unresolvedCount !== b.unresolvedCount) return b.unresolvedCount - a.unresolvedCount;
		if (a.totalCount !== b.totalCount) return b.totalCount - a.totalCount;
		return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
	});

	return patterns;
}
