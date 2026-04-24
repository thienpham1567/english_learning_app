/**
 * Lesson Summary Builders (Story 25.2, AC: 1-3)
 *
 * Factory functions that produce LessonSummary objects from raw module
 * completion data. Covers grammar, listening, and writing modules.
 *
 * Each builder:
 * - Computes outcome, explanation, and top issue (AC: 1)
 * - Generates next actions linking to retry, review, dictionary, chatbot, or daily plan (AC: 2)
 * - Preserves existing detailed feedback — this layer adds structure on top (AC: 3)
 */

import type { LessonSummary, LessonModuleTypeValue, TopIssue, NextAction, ReviewCandidate } from "@repo/contracts";

// ── Outcome Helpers ─────────────────────────────────────────────────────────

function computeOutcome(score: number): LessonSummary["outcome"] {
	if (score >= 70) return "passed";
	if (score >= 50) return "needs_review";
	return "failed";
}

function computeExplanation(
	moduleName: string,
	score: number,
	correctCount: number,
	totalCount: number,
): string {
	if (score >= 90) return `Xuất sắc! Bạn trả lời đúng ${correctCount}/${totalCount} câu ${moduleName}.`;
	if (score >= 70) return `Khá tốt! ${correctCount}/${totalCount} câu ${moduleName} đúng. Hãy ôn lại phần sai nhé.`;
	if (score >= 50) return `Cần cải thiện. Bạn đúng ${correctCount}/${totalCount} câu ${moduleName}. Hãy luyện thêm.`;
	return `Chưa đạt. Chỉ ${correctCount}/${totalCount} câu ${moduleName} đúng. Hãy ôn lại kiến thức cơ bản.`;
}

// ── Next Action Templates (AC: 2) ──────────────────────────────────────────

const NEXT_ACTIONS = {
	retry: (href: string): NextAction => ({ label: "Làm lại", href, priority: "primary" }),
	review: { label: "Ôn tập", href: "/vocab-review", priority: "secondary" as const },
	dictionary: { label: "Tra từ điển", href: "/dictionary", priority: "secondary" as const },
	chatbot: { label: "Hỏi AI Coach", href: "/english-chatbot", priority: "secondary" as const },
	dailyPlan: { label: "Về kế hoạch hôm nay", href: "/", priority: "secondary" as const },
	errorNotebook: { label: "Xem lỗi sai", href: "/error-notebook", priority: "secondary" as const },
};

function buildNextActions(score: number, retryHref: string): NextAction[] {
	const actions: NextAction[] = [];

	if (score < 70) {
		actions.push(NEXT_ACTIONS.retry(retryHref));
		actions.push(NEXT_ACTIONS.errorNotebook);
	} else if (score < 90) {
		actions.push(NEXT_ACTIONS.dailyPlan);
		actions.push(NEXT_ACTIONS.retry(retryHref));
	} else {
		actions.push(NEXT_ACTIONS.dailyPlan);
		actions.push(NEXT_ACTIONS.chatbot);
	}

	return actions;
}

// ── Common Input ────────────────────────────────────────────────────────────

export interface SummaryBuilderInput {
	sessionId: string;
	correctCount: number;
	totalCount: number;
	durationSeconds: number;
	/** The most common error topic (if any) */
	topErrorTopic?: string;
	/** The error category key */
	topErrorCategory?: string;
	/** How many times the top error occurred */
	topErrorOccurrences?: number;
	/** Completed timestamp (ISO) */
	completedAt?: string;
}

// ── Grammar Quiz Summary (AC: 1) ───────────────────────────────────────────

export function buildGrammarQuizSummary(input: SummaryBuilderInput): LessonSummary {
	const score = input.totalCount > 0
		? Math.round((input.correctCount / input.totalCount) * 100) : 0;

	const topIssue: TopIssue | null = input.topErrorTopic
		? { description: input.topErrorTopic, category: input.topErrorCategory ?? "grammar", occurrences: input.topErrorOccurrences ?? 1 }
		: null;

	const reviewCandidates: ReviewCandidate[] = topIssue
		? [{ skillId: "grammar", topic: topIssue.description, urgency: score < 50 ? "immediate" as const : "soon" as const }]
		: [];

	return {
		moduleType: "grammar-quiz",
		sessionId: input.sessionId,
		completedAt: input.completedAt ?? new Date().toISOString(),
		outcome: computeOutcome(score),
		score,
		correctCount: input.correctCount,
		totalCount: input.totalCount,
		durationSeconds: input.durationSeconds,
		explanation: computeExplanation("ngữ pháp", score, input.correctCount, input.totalCount),
		topIssue,
		nextActions: buildNextActions(score, "/grammar-quiz"),
		skillIds: ["grammar"],
		reviewCandidates,
	};
}

// ── Listening Summary (AC: 1) ──────────────────────────────────────────────

export function buildListeningSummary(input: SummaryBuilderInput): LessonSummary {
	const score = input.totalCount > 0
		? Math.round((input.correctCount / input.totalCount) * 100) : 0;

	const topIssue: TopIssue | null = input.topErrorTopic
		? { description: input.topErrorTopic, category: input.topErrorCategory ?? "listening", occurrences: input.topErrorOccurrences ?? 1 }
		: null;

	return {
		moduleType: "listening",
		sessionId: input.sessionId,
		completedAt: input.completedAt ?? new Date().toISOString(),
		outcome: computeOutcome(score),
		score,
		correctCount: input.correctCount,
		totalCount: input.totalCount,
		durationSeconds: input.durationSeconds,
		explanation: computeExplanation("nghe", score, input.correctCount, input.totalCount),
		topIssue,
		nextActions: buildNextActions(score, "/listening"),
		skillIds: ["listening"],
		reviewCandidates: [],
	};
}

// ── Writing Summary (AC: 1) ────────────────────────────────────────────────

export interface WritingSummaryInput {
	sessionId: string;
	score: number;
	durationSeconds: number;
	topIssueDescription?: string;
	topIssueCategory?: string;
	completedAt?: string;
}

export function buildWritingSummary(input: WritingSummaryInput): LessonSummary {
	const score = Math.max(0, Math.min(100, input.score));

	const topIssue: TopIssue | null = input.topIssueDescription
		? { description: input.topIssueDescription, category: input.topIssueCategory ?? "writing", occurrences: 1 }
		: null;

	const reviewCandidates: ReviewCandidate[] = topIssue
		? [{ skillId: "writing", topic: topIssue.description, urgency: score < 50 ? "immediate" as const : "later" as const }]
		: [];

	const nextActions: NextAction[] = score < 70
		? [NEXT_ACTIONS.retry("/writing-practice"), NEXT_ACTIONS.chatbot]
		: [NEXT_ACTIONS.dailyPlan, NEXT_ACTIONS.chatbot];

	return {
		moduleType: "writing",
		sessionId: input.sessionId,
		completedAt: input.completedAt ?? new Date().toISOString(),
		outcome: computeOutcome(score),
		score,
		correctCount: 0, // Writing uses score directly, not correct/total
		totalCount: 1,
		durationSeconds: input.durationSeconds,
		explanation: score >= 70
			? `Bài viết tốt! Điểm: ${score}/100.`
			: `Bài viết cần cải thiện. Điểm: ${score}/100. Hãy chú ý cấu trúc và ngữ pháp.`,
		topIssue,
		nextActions,
		skillIds: ["writing", "grammar"],
		reviewCandidates,
	};
}

// ── Generic Builder (for other modules) ────────────────────────────────────

export function buildGenericSummary(
	moduleType: LessonModuleTypeValue,
	input: SummaryBuilderInput,
): LessonSummary {
	const score = input.totalCount > 0
		? Math.round((input.correctCount / input.totalCount) * 100) : 0;

	const topIssue: TopIssue | null = input.topErrorTopic
		? { description: input.topErrorTopic, category: input.topErrorCategory ?? moduleType, occurrences: input.topErrorOccurrences ?? 1 }
		: null;

	return {
		moduleType,
		sessionId: input.sessionId,
		completedAt: input.completedAt ?? new Date().toISOString(),
		outcome: computeOutcome(score),
		score,
		correctCount: input.correctCount,
		totalCount: input.totalCount,
		durationSeconds: input.durationSeconds,
		explanation: computeExplanation("bài tập", score, input.correctCount, input.totalCount),
		topIssue,
		nextActions: buildNextActions(score, "/"),
		skillIds: [moduleType],
		reviewCandidates: [],
	};
}
