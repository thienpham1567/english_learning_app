/**
 * 7-Day Starter Pathway Generator (Story 24.3, AC: 1-4)
 *
 * Generates a goal-based 7-day learning pathway for new learners.
 * Adapts to time budget and can convert into daily plan candidates.
 */

import type { LearnerGoalValue, DailyTimeBudgetValue, RecommendationCandidate } from "@repo/contracts";

// ── Types (AC: 1) ──────────────────────────────────────────────────────────

export interface PathwayAction {
	label: string;
	moduleType: string;
	actionUrl: string;
	skillIds: string[];
	estimatedMinutes: number;
	emoji: string;
}

export interface PathwayDay {
	day: number;
	theme: string;
	actions: PathwayAction[];
	totalMinutes: number;
}

export interface StarterPathway {
	goalKey: LearnerGoalValue;
	goalLabel: string;
	days: PathwayDay[];
	timeBudget: DailyTimeBudgetValue;
}

// ── Action Templates ────────────────────────────────────────────────────────

const ACTIONS: Record<string, PathwayAction> = {
	grammarQuiz: { label: "Bài tập ngữ pháp", moduleType: "grammar-quiz", actionUrl: "/grammar-quiz", skillIds: ["grammar"], estimatedMinutes: 5, emoji: "📐" },
	grammarLesson: { label: "Bài học ngữ pháp", moduleType: "grammar-lessons", actionUrl: "/grammar-lessons", skillIds: ["grammar"], estimatedMinutes: 8, emoji: "📖" },
	vocabFlashcard: { label: "Ôn từ vựng", moduleType: "flashcards", actionUrl: "/flashcards", skillIds: ["vocabulary"], estimatedMinutes: 5, emoji: "📚" },
	vocabReview: { label: "Ôn tập từ vựng", moduleType: "vocab-review", actionUrl: "/vocab-review", skillIds: ["vocabulary"], estimatedMinutes: 5, emoji: "🔁" },
	listeningPractice: { label: "Luyện nghe", moduleType: "listening", actionUrl: "/listening", skillIds: ["listening"], estimatedMinutes: 8, emoji: "🎧" },
	readingArticle: { label: "Đọc bài viết", moduleType: "reading", actionUrl: "/reading", skillIds: ["reading"], estimatedMinutes: 8, emoji: "📰" },
	writingPractice: { label: "Luyện viết", moduleType: "writing", actionUrl: "/writing-practice", skillIds: ["writing"], estimatedMinutes: 10, emoji: "✏️" },
	pronunciationDrill: { label: "Luyện phát âm", moduleType: "pronunciation", actionUrl: "/pronunciation", skillIds: ["pronunciation"], estimatedMinutes: 5, emoji: "🔊" },
	mockTest: { label: "Thi thử", moduleType: "mock-test", actionUrl: "/mock-test", skillIds: ["grammar", "reading", "listening"], estimatedMinutes: 15, emoji: "📝" },
	dailyChallenge: { label: "Thử thách hàng ngày", moduleType: "daily-challenge", actionUrl: "/daily-challenge", skillIds: ["grammar"], estimatedMinutes: 5, emoji: "⚡" },
	errorReview: { label: "Ôn lỗi sai", moduleType: "error-notebook", actionUrl: "/error-notebook", skillIds: ["grammar"], estimatedMinutes: 5, emoji: "🔍" },
};

// ── Pathway Templates (AC: 3) ──────────────────────────────────────────────

type DayTemplate = { theme: string; actions: PathwayAction[] };

const PATHWAY_TEMPLATES: Record<string, DayTemplate[]> = {
	exam_prep: [
		{ theme: "Ngữ pháp cơ bản", actions: [ACTIONS.grammarLesson!, ACTIONS.grammarQuiz!, ACTIONS.vocabFlashcard!] },
		{ theme: "Nghe & Đọc", actions: [ACTIONS.listeningPractice!, ACTIONS.readingArticle!, ACTIONS.vocabReview!] },
		{ theme: "Viết & Ngữ pháp", actions: [ACTIONS.writingPractice!, ACTIONS.grammarQuiz!, ACTIONS.errorReview!] },
		{ theme: "Thi thử", actions: [ACTIONS.mockTest!, ACTIONS.errorReview!] },
		{ theme: "Ôn từ vựng & Nghe", actions: [ACTIONS.vocabFlashcard!, ACTIONS.listeningPractice!, ACTIONS.dailyChallenge!] },
		{ theme: "Đọc & Viết", actions: [ACTIONS.readingArticle!, ACTIONS.writingPractice!, ACTIONS.grammarQuiz!] },
		{ theme: "Tổng ôn tuần", actions: [ACTIONS.mockTest!, ACTIONS.errorReview!, ACTIONS.vocabReview!] },
	],
	career: [
		{ theme: "Viết email & giao tiếp", actions: [ACTIONS.writingPractice!, ACTIONS.vocabFlashcard!] },
		{ theme: "Nghe họp & thuyết trình", actions: [ACTIONS.listeningPractice!, ACTIONS.pronunciationDrill!] },
		{ theme: "Ngữ pháp công sở", actions: [ACTIONS.grammarLesson!, ACTIONS.grammarQuiz!] },
		{ theme: "Đọc tài liệu", actions: [ACTIONS.readingArticle!, ACTIONS.vocabFlashcard!] },
		{ theme: "Viết báo cáo", actions: [ACTIONS.writingPractice!, ACTIONS.grammarQuiz!] },
		{ theme: "Nghe & Phát âm", actions: [ACTIONS.listeningPractice!, ACTIONS.pronunciationDrill!] },
		{ theme: "Ôn tập tuần", actions: [ACTIONS.dailyChallenge!, ACTIONS.errorReview!, ACTIONS.vocabReview!] },
	],
	travel: [
		{ theme: "Giao tiếp cơ bản", actions: [ACTIONS.vocabFlashcard!, ACTIONS.pronunciationDrill!] },
		{ theme: "Nghe & hiểu", actions: [ACTIONS.listeningPractice!, ACTIONS.vocabFlashcard!] },
		{ theme: "Hỏi đường & mua sắm", actions: [ACTIONS.grammarQuiz!, ACTIONS.pronunciationDrill!] },
		{ theme: "Đọc & đặt phòng", actions: [ACTIONS.readingArticle!, ACTIONS.vocabFlashcard!] },
		{ theme: "Giao tiếp nhà hàng", actions: [ACTIONS.listeningPractice!, ACTIONS.pronunciationDrill!] },
		{ theme: "Ngữ pháp giao tiếp", actions: [ACTIONS.grammarLesson!, ACTIONS.dailyChallenge!] },
		{ theme: "Ôn tập tuần", actions: [ACTIONS.vocabReview!, ACTIONS.errorReview!] },
	],
	daily_conversation: [
		{ theme: "Chào hỏi & giới thiệu", actions: [ACTIONS.vocabFlashcard!, ACTIONS.pronunciationDrill!] },
		{ theme: "Nghe hội thoại", actions: [ACTIONS.listeningPractice!, ACTIONS.grammarQuiz!] },
		{ theme: "Phát âm tự nhiên", actions: [ACTIONS.pronunciationDrill!, ACTIONS.vocabFlashcard!] },
		{ theme: "Đọc tin tức", actions: [ACTIONS.readingArticle!, ACTIONS.vocabReview!] },
		{ theme: "Ngữ pháp giao tiếp", actions: [ACTIONS.grammarLesson!, ACTIONS.dailyChallenge!] },
		{ theme: "Nghe & Phát âm", actions: [ACTIONS.listeningPractice!, ACTIONS.pronunciationDrill!] },
		{ theme: "Ôn tập tuần", actions: [ACTIONS.errorReview!, ACTIONS.vocabReview!] },
	],
	academic: [
		{ theme: "Đọc học thuật", actions: [ACTIONS.readingArticle!, ACTIONS.vocabFlashcard!] },
		{ theme: "Viết luận", actions: [ACTIONS.writingPractice!, ACTIONS.grammarQuiz!] },
		{ theme: "Nghe bài giảng", actions: [ACTIONS.listeningPractice!, ACTIONS.vocabFlashcard!] },
		{ theme: "Ngữ pháp học thuật", actions: [ACTIONS.grammarLesson!, ACTIONS.grammarQuiz!] },
		{ theme: "Đọc & Tóm tắt", actions: [ACTIONS.readingArticle!, ACTIONS.writingPractice!] },
		{ theme: "Từ vựng chuyên ngành", actions: [ACTIONS.vocabFlashcard!, ACTIONS.vocabReview!] },
		{ theme: "Ôn tập tuần", actions: [ACTIONS.mockTest!, ACTIONS.errorReview!] },
	],
	general_improvement: [
		{ theme: "Khởi đầu", actions: [ACTIONS.grammarQuiz!, ACTIONS.vocabFlashcard!] },
		{ theme: "Nghe & Đọc", actions: [ACTIONS.listeningPractice!, ACTIONS.readingArticle!] },
		{ theme: "Ngữ pháp", actions: [ACTIONS.grammarLesson!, ACTIONS.dailyChallenge!] },
		{ theme: "Từ vựng & Phát âm", actions: [ACTIONS.vocabFlashcard!, ACTIONS.pronunciationDrill!] },
		{ theme: "Viết & Đọc", actions: [ACTIONS.writingPractice!, ACTIONS.readingArticle!] },
		{ theme: "Nghe & Thử thách", actions: [ACTIONS.listeningPractice!, ACTIONS.dailyChallenge!] },
		{ theme: "Ôn tập tuần", actions: [ACTIONS.errorReview!, ACTIONS.vocabReview!, ACTIONS.grammarQuiz!] },
	],
};

// ── Budget Adaptation (AC: 4) ──────────────────────────────────────────────

/**
 * Trims a day's actions to fit within the time budget (AC: 4).
 * Keeps as many actions as fit, in order.
 */
function fitToBudget(actions: PathwayAction[], budgetMinutes: number): PathwayAction[] {
	const fitted: PathwayAction[] = [];
	let remaining = budgetMinutes;

	for (const action of actions) {
		if (action.estimatedMinutes <= remaining) {
			fitted.push(action);
			remaining -= action.estimatedMinutes;
		}
	}

	// Always include at least 1 action
	if (fitted.length === 0 && actions.length > 0) {
		fitted.push(actions[0]!);
	}

	return fitted;
}

// ── Generator (AC: 1, 3, 4) ────────────────────────────────────────────────

/**
 * Generates a 7-day starter pathway based on goal and time budget.
 *
 * AC: 1 — 7 days with estimated minutes and skill focus
 * AC: 3 — Pathways for all goal types
 * AC: 4 — Adjusts to 5/10/15/20/30 minute budgets
 *
 * Deterministic: same inputs → same outputs.
 */
export function generateStarterPathway(
	goal: LearnerGoalValue,
	timeBudget: DailyTimeBudgetValue,
): StarterPathway {
	const template = PATHWAY_TEMPLATES[goal] ?? PATHWAY_TEMPLATES.general_improvement!;
	const budget = parseInt(timeBudget, 10);

	const goalLabels: Record<LearnerGoalValue, string> = {
		career: "Tiếng Anh công việc",
		travel: "Tiếng Anh du lịch",
		academic: "Tiếng Anh học thuật",
		daily_conversation: "Giao tiếp hàng ngày",
		exam_prep: "Luyện thi",
		general_improvement: "Cải thiện toàn diện",
	};

	const days: PathwayDay[] = template.map((dayTemplate, i) => {
		const actions = fitToBudget(dayTemplate.actions, budget);
		return {
			day: i + 1,
			theme: dayTemplate.theme,
			actions,
			totalMinutes: actions.reduce((sum, a) => sum + a.estimatedMinutes, 0),
		};
	});

	return {
		goalKey: goal,
		goalLabel: goalLabels[goal] ?? goalLabels.general_improvement!,
		days,
		timeBudget,
	};
}

// ── Pathway → Candidates (AC: 2) ───────────────────────────────────────────

/**
 * Converts a pathway day into recommendation candidates
 * for the daily plan scorer (AC: 2).
 */
export function pathwayDayToCandidates(
	day: PathwayDay,
	userId: string,
): RecommendationCandidate[] {
	return day.actions.map((action, i) => ({
		id: `pathway-day${day.day}-${i}`,
		skillIds: action.skillIds,
		moduleType: action.moduleType,
		actionUrl: action.actionUrl,
		label: action.label,
		estimatedMinutes: action.estimatedMinutes,
		isDueReview: false,
		dueAt: null,
		currentProficiency: 30, // New learner default
		currentConfidence: 0.3,
		difficulty: "beginner" as const,
		goalAligned: true,
		hoursSinceLastPractice: 24,
	}));
}
