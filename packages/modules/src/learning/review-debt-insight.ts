/**
 * Review Debt & Memory Risk Insight (Story 26.3, AC: 1-4)
 *
 * Computes review debt by category and surfaces high memory-risk items.
 */

import type { ReviewTask } from "@repo/contracts";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ReviewDebtCategory {
	category: string;
	label: string;
	emoji: string;
	overdueCount: number;
	dueCount: number;
	estimatedMinutes: number;
}

export interface ReviewDebtInsight {
	/** Total review debt items */
	totalDebt: number;
	/** Total estimated minutes to clear debt */
	totalMinutes: number;
	/** Debt broken down by category */
	categories: ReviewDebtCategory[];
	/** High memory-risk item IDs (overdue > 48h) */
	highRiskItemIds: string[];
	/** Display message */
	message: string;
	/** Whether there's any debt */
	hasDebt: boolean;
	/** Link to review hub */
	reviewHubUrl: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
	vocabulary: { label: "Từ vựng", emoji: "📚" },
	grammar: { label: "Ngữ pháp", emoji: "📐" },
	listening: { label: "Nghe", emoji: "🎧" },
	reading: { label: "Đọc", emoji: "📰" },
	writing: { label: "Viết", emoji: "✏️" },
	speaking: { label: "Nói", emoji: "🗣️" },
	pronunciation: { label: "Phát âm", emoji: "🔊" },
};

/** Average minutes per review item */
const MINUTES_PER_REVIEW = 2;

/** Hours overdue before an item is "high risk" (AC: 2) */
const HIGH_RISK_HOURS = 48;

// ── Debt Calculator (AC: 1, 2) ─────────────────────────────────────────────

/**
 * Computes review debt from due/overdue tasks (AC: 1-4).
 *
 * AC: 1 — Shows debt by category and estimated minutes
 * AC: 2 — High memory-risk items can appear in daily plan
 * AC: 3 — Links to review hub
 * AC: 4 — Tests cover overdue priority
 */
export function computeReviewDebt(
	tasks: ReviewTask[],
	nowMs?: number,
): ReviewDebtInsight {
	const now = nowMs ?? Date.now();

	// Filter to pending tasks that are due or overdue
	const relevantTasks = tasks.filter(
		(t) => t.status === "pending" && t.scheduledAt && new Date(t.scheduledAt).getTime() <= now,
	);

	if (relevantTasks.length === 0) {
		return {
			totalDebt: 0,
			totalMinutes: 0,
			categories: [],
			highRiskItemIds: [],
			message: "Không có bài ôn tập nào đang chờ. Tuyệt vời! 🎉",
			hasDebt: false,
			reviewHubUrl: "/vocab-review",
		};
	}

	// Categorize
	const categoryMap = new Map<string, { overdue: number; due: number; ids: string[] }>();

	const highRiskIds: string[] = [];

	for (const task of relevantTasks) {
		const cat = task.skillId ?? "grammar";
		if (!categoryMap.has(cat)) {
			categoryMap.set(cat, { overdue: 0, due: 0, ids: [] });
		}
		const entry = categoryMap.get(cat)!;

		const scheduledMs = new Date(task.scheduledAt!).getTime();
		const hoursOverdue = (now - scheduledMs) / (1000 * 60 * 60);

		if (hoursOverdue > HIGH_RISK_HOURS) {
			entry.overdue++;
			highRiskIds.push(task.id);
		} else {
			entry.due++;
		}
		entry.ids.push(task.id);
	}

	const categories: ReviewDebtCategory[] = [];
	for (const [cat, data] of categoryMap) {
		const meta = CATEGORY_META[cat] ?? { label: cat, emoji: "📊" };
		categories.push({
			category: cat,
			label: meta.label,
			emoji: meta.emoji,
			overdueCount: data.overdue,
			dueCount: data.due,
			estimatedMinutes: (data.overdue + data.due) * MINUTES_PER_REVIEW,
		});
	}

	// Sort by overdue count descending (AC: 4)
	categories.sort((a, b) => b.overdueCount - a.overdueCount);

	const totalDebt = relevantTasks.length;
	const totalMinutes = totalDebt * MINUTES_PER_REVIEW;

	let message: string;
	if (highRiskIds.length > 0) {
		message = `⚠️ Có ${highRiskIds.length} mục sắp quên! Hãy ôn tập ngay (~${totalMinutes} phút).`;
	} else {
		message = `Có ${totalDebt} mục cần ôn tập (~${totalMinutes} phút).`;
	}

	return {
		totalDebt,
		totalMinutes,
		categories,
		highRiskItemIds: highRiskIds,
		message,
		hasDebt: true,
		reviewHubUrl: "/vocab-review",
	};
}
