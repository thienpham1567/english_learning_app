/**
 * Coach Summary Builder (Story 25.4, AC: 1-3)
 *
 * Produces a concise coaching summary from lesson summaries and error patterns
 * for integration into the AI chatbot context.
 */

import type { LessonSummary, TopIssue } from "@repo/contracts";

// ── Types ───────────────────────────────────────────────────────────────────

export interface CoachSummary {
	/** Concise summary for the AI coach context */
	contextText: string;
	/** Top issues to focus coaching on */
	focusAreas: string[];
	/** Recent performance level */
	performanceLevel: "strong" | "moderate" | "struggling";
	/** Suggested coaching tone */
	tone: "encouraging" | "supportive" | "corrective";
}

// ── Builder (AC: 1) ────────────────────────────────────────────────────────

/**
 * Builds a coach summary from recent lesson summaries (AC: 1).
 *
 * AC: 1 — Summary includes performance context for the AI coach
 * AC: 2 — Integrates with chatbot system prompt
 * AC: 3 — Degrades gracefully with no data
 */
export function buildCoachSummary(recentSummaries: LessonSummary[]): CoachSummary {
	if (recentSummaries.length === 0) {
		return {
			contextText: "Người học mới bắt đầu. Chưa có dữ liệu bài tập gần đây.",
			focusAreas: [],
			performanceLevel: "moderate",
			tone: "encouraging",
		};
	}

	// Compute average score
	const avgScore = Math.round(
		recentSummaries.reduce((sum, s) => sum + s.score, 0) / recentSummaries.length,
	);

	// Collect top issues
	const issues: TopIssue[] = recentSummaries
		.map((s) => s.topIssue)
		.filter((issue): issue is TopIssue => issue !== null);

	const focusAreas = [...new Set(issues.map((i) => i.description))].slice(0, 3);

	// Determine performance level and tone
	let performanceLevel: CoachSummary["performanceLevel"];
	let tone: CoachSummary["tone"];

	if (avgScore >= 75) {
		performanceLevel = "strong";
		tone = "encouraging";
	} else if (avgScore >= 50) {
		performanceLevel = "moderate";
		tone = "supportive";
	} else {
		performanceLevel = "struggling";
		tone = "corrective";
	}

	// Build context text
	const modules = [...new Set(recentSummaries.map((s) => s.moduleType))];
	const parts = [
		`Điểm trung bình gần đây: ${avgScore}/100 (${recentSummaries.length} bài).`,
		`Modules: ${modules.join(", ")}.`,
	];

	if (focusAreas.length > 0) {
		parts.push(`Vấn đề cần chú ý: ${focusAreas.join(", ")}.`);
	}

	return {
		contextText: parts.join(" "),
		focusAreas,
		performanceLevel,
		tone,
	};
}

/**
 * Formats coach summary into a system prompt snippet for the AI chatbot (AC: 2).
 */
export function coachSummaryToPrompt(summary: CoachSummary): string {
	const toneInstruction: Record<CoachSummary["tone"], string> = {
		encouraging: "Hãy khen ngợi và động viên, nhấn mạnh tiến bộ.",
		supportive: "Hãy hỗ trợ và đề xuất cách cải thiện cụ thể.",
		corrective: "Hãy nhẹ nhàng chỉ ra lỗi sai và hướng dẫn sửa từng bước.",
	};

	return [
		"[Thông tin người học]",
		summary.contextText,
		`Phong cách hướng dẫn: ${toneInstruction[summary.tone]}`,
	].join("\n");
}
