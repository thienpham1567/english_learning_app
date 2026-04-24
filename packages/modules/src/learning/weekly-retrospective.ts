/**
 * Weekly Learning Retrospective (Story 26.4, AC: 1-4)
 *
 * Deterministic weekly summary generation (no AI call required, AC: 3).
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface WeeklyActivityData {
	/** Total learning sessions completed */
	completedSessions: number;
	/** Total minutes studied */
	totalMinutes: number;
	/** Modules practiced (with counts) */
	moduleCounts: Record<string, number>;
	/** Skill proficiency at week end */
	skillProficiencies: Record<string, number>;
	/** Most repeated error topic */
	topRepeatedError?: string;
	/** Review debt count at week end */
	reviewDebtCount: number;
	/** Days active (0-7) */
	daysActive: number;
}

export interface WeeklyRetrospective {
	/** Week identifier (e.g. "2026-W17") */
	weekId: string;
	/** Summary sections */
	completedActions: string;
	strongestSkill: string | null;
	weakestSkill: string | null;
	repeatedErrorPattern: string | null;
	reviewDebtSummary: string;
	nextWeekRecommendation: string;
	/** Whether there's enough data for a meaningful retrospective */
	hasSufficientData: boolean;
	/** Overall tone */
	tone: "celebrating" | "encouraging" | "nudging";
}

// ── Generator (AC: 1, 2, 3) ────────────────────────────────────────────────

/**
 * Generates a deterministic weekly retrospective (AC: 1-4).
 *
 * AC: 1 — Summarizes completed actions, strongest/weakest skill, errors, debt, recommendation
 * AC: 2 — Can be displayed on Progress or sent as notification
 * AC: 3 — No AI call needed
 * AC: 4 — Handles sparse and rich data
 */
export function generateWeeklyRetrospective(
	weekId: string,
	data: WeeklyActivityData,
): WeeklyRetrospective {
	// Sparse data check (AC: 4)
	if (data.completedSessions < 1) {
		return {
			weekId,
			completedActions: "Không có hoạt động nào tuần này.",
			strongestSkill: null,
			weakestSkill: null,
			repeatedErrorPattern: null,
			reviewDebtSummary: data.reviewDebtCount > 0
				? `Có ${data.reviewDebtCount} mục ôn tập đang chờ.`
				: "Không có bài ôn tập chờ.",
			nextWeekRecommendation: "Hãy bắt đầu với 5-10 phút luyện tập mỗi ngày!",
			hasSufficientData: false,
			tone: "nudging",
		};
	}

	// Completed actions
	const moduleNames = Object.entries(data.moduleCounts)
		.sort((a, b) => b[1] - a[1])
		.map(([mod, count]) => `${mod} (${count}x)`)
		.join(", ");
	const completedActions = `${data.completedSessions} phiên, ${data.totalMinutes} phút, ${data.daysActive}/7 ngày. Modules: ${moduleNames}.`;

	// Strongest / weakest skill
	const skillEntries = Object.entries(data.skillProficiencies).filter(([, v]) => v > 0);
	let strongestSkill: string | null = null;
	let weakestSkill: string | null = null;

	if (skillEntries.length > 0) {
		skillEntries.sort((a, b) => b[1] - a[1]);
		strongestSkill = skillEntries[0]![0];
		weakestSkill = skillEntries[skillEntries.length - 1]![0];
	}

	// Repeated error pattern
	const repeatedErrorPattern = data.topRepeatedError ?? null;

	// Review debt
	const reviewDebtSummary = data.reviewDebtCount > 0
		? `Có ${data.reviewDebtCount} mục cần ôn tập.`
		: "Đã hoàn thành tất cả ôn tập! 🎉";

	// Next week recommendation
	let nextWeekRecommendation: string;
	if (weakestSkill && strongestSkill !== weakestSkill) {
		nextWeekRecommendation = `Tập trung cải thiện ${weakestSkill}. Duy trì thế mạnh ${strongestSkill}.`;
	} else if (data.daysActive < 5) {
		nextWeekRecommendation = `Tăng ngày luyện tập lên ${Math.min(data.daysActive + 2, 7)}/7 ngày.`;
	} else {
		nextWeekRecommendation = "Tiếp tục duy trì nhịp độ tuyệt vời!";
	}

	// Tone
	let tone: WeeklyRetrospective["tone"];
	if (data.daysActive >= 5 && data.completedSessions >= 10) {
		tone = "celebrating";
	} else if (data.daysActive >= 3) {
		tone = "encouraging";
	} else {
		tone = "nudging";
	}

	return {
		weekId,
		completedActions,
		strongestSkill,
		weakestSkill,
		repeatedErrorPattern,
		reviewDebtSummary,
		nextWeekRecommendation,
		hasSufficientData: true,
		tone,
	};
}
