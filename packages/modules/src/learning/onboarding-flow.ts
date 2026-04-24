/**
 * Onboarding Flow Config (Story 24.1, AC: 1-4)
 *
 * Defines a short onboarding flow for goal, daily time budget,
 * weak skill, and learning style. Designed to complete in < 2 minutes (AC: 4).
 *
 * Pure functions — no side effects. Persistence handled by caller.
 */

import type {
	LearnerGoalValue,
	DailyTimeBudgetValue,
	WeakSkillSelfReportValue,
	LearningStyleValue,
} from "@repo/contracts";

// ── Step Definitions (AC: 1) ────────────────────────────────────────────────

export interface OnboardingOption<T extends string = string> {
	value: T;
	label: string;
	emoji: string;
	description: string;
}

export interface OnboardingStep<T extends string = string> {
	key: string;
	title: string;
	subtitle: string;
	options: OnboardingOption<T>[];
	required: boolean;
}

// ── Goal Step ───────────────────────────────────────────────────────────────

export const GOAL_OPTIONS: OnboardingOption<LearnerGoalValue>[] = [
	{ value: "career", label: "Công việc", emoji: "💼", description: "Nâng cao tiếng Anh cho sự nghiệp" },
	{ value: "travel", label: "Du lịch", emoji: "✈️", description: "Giao tiếp khi đi du lịch" },
	{ value: "academic", label: "Học thuật", emoji: "🎓", description: "Nghiên cứu, đọc tài liệu" },
	{ value: "daily_conversation", label: "Giao tiếp", emoji: "💬", description: "Trò chuyện hàng ngày" },
	{ value: "exam_prep", label: "Luyện thi", emoji: "📝", description: "TOEIC, IELTS, hoặc chứng chỉ" },
	{ value: "general_improvement", label: "Cải thiện chung", emoji: "🌟", description: "Nâng cao toàn diện" },
];

export const GOAL_STEP: OnboardingStep<LearnerGoalValue> = {
	key: "goal",
	title: "Mục tiêu của bạn là gì?",
	subtitle: "Chọn lý do chính bạn muốn học tiếng Anh",
	options: GOAL_OPTIONS,
	required: false,
};

// ── Time Budget Step ────────────────────────────────────────────────────────

export const TIME_OPTIONS: OnboardingOption<DailyTimeBudgetValue>[] = [
	{ value: "5", label: "5 phút", emoji: "⚡", description: "Nhanh gọn mỗi ngày" },
	{ value: "10", label: "10 phút", emoji: "☕", description: "Một tách cà phê" },
	{ value: "15", label: "15 phút", emoji: "📖", description: "Học đều đặn" },
	{ value: "20", label: "20 phút", emoji: "🎯", description: "Luyện chuyên sâu" },
	{ value: "30", label: "30 phút", emoji: "🚀", description: "Tiến bộ nhanh" },
];

export const TIME_STEP: OnboardingStep<DailyTimeBudgetValue> = {
	key: "time",
	title: "Mỗi ngày bạn có bao nhiêu phút?",
	subtitle: "Chúng tôi sẽ điều chỉnh lượng bài phù hợp",
	options: TIME_OPTIONS,
	required: false,
};

// ── Weak Skill Step ─────────────────────────────────────────────────────────

export const WEAK_SKILL_OPTIONS: OnboardingOption<WeakSkillSelfReportValue>[] = [
	{ value: "grammar", label: "Ngữ pháp", emoji: "📐", description: "Cấu trúc câu, thì, giới từ" },
	{ value: "vocabulary", label: "Từ vựng", emoji: "📚", description: "Thiếu từ vựng cần thiết" },
	{ value: "listening", label: "Nghe", emoji: "🎧", description: "Khó nghe hiểu người bản ngữ" },
	{ value: "speaking", label: "Nói", emoji: "🗣️", description: "Ngại nói, chưa tự tin" },
	{ value: "pronunciation", label: "Phát âm", emoji: "🔊", description: "Phát âm chưa chuẩn" },
	{ value: "reading", label: "Đọc", emoji: "📖", description: "Đọc chậm, khó hiểu" },
	{ value: "writing", label: "Viết", emoji: "✏️", description: "Viết chưa mạch lạc" },
];

export const WEAK_SKILL_STEP: OnboardingStep<WeakSkillSelfReportValue> = {
	key: "weak_skill",
	title: "Kỹ năng nào bạn muốn cải thiện nhất?",
	subtitle: "Chúng tôi sẽ ưu tiên kỹ năng này trong bài tập",
	options: WEAK_SKILL_OPTIONS,
	required: false,
};

// ── Learning Style Step ─────────────────────────────────────────────────────

export const STYLE_OPTIONS: OnboardingOption<LearningStyleValue>[] = [
	{ value: "visual", label: "Hình ảnh", emoji: "🎨", description: "Học qua hình ảnh, video" },
	{ value: "auditory", label: "Nghe", emoji: "🎵", description: "Học qua nghe, lặp lại" },
	{ value: "reading_writing", label: "Đọc viết", emoji: "📝", description: "Học qua đọc và viết" },
	{ value: "kinesthetic", label: "Thực hành", emoji: "🤝", description: "Học qua làm bài tập" },
	{ value: "mixed", label: "Kết hợp", emoji: "🔄", description: "Kết hợp nhiều phương pháp" },
];

export const STYLE_STEP: OnboardingStep<LearningStyleValue> = {
	key: "style",
	title: "Bạn thích học theo cách nào?",
	subtitle: "Chọn phong cách phù hợp với bạn",
	options: STYLE_OPTIONS,
	required: false,
};

// ── Full Flow ───────────────────────────────────────────────────────────────

export const ONBOARDING_STEPS = [GOAL_STEP, TIME_STEP, WEAK_SKILL_STEP, STYLE_STEP] as const;

// ── Answers Type ────────────────────────────────────────────────────────────

export interface OnboardingAnswers {
	goal?: LearnerGoalValue;
	time?: DailyTimeBudgetValue;
	weakSkill?: WeakSkillSelfReportValue;
	style?: LearningStyleValue;
}

// ── Defaults (AC: 2) ────────────────────────────────────────────────────────

export const ONBOARDING_DEFAULTS: Required<OnboardingAnswers> = {
	goal: "general_improvement",
	time: "10",
	weakSkill: "grammar",
	style: "mixed",
};

/**
 * Merges user answers with defaults for skipped questions (AC: 2).
 */
export function mergeWithDefaults(answers: OnboardingAnswers): Required<OnboardingAnswers> {
	return {
		goal: answers.goal ?? ONBOARDING_DEFAULTS.goal,
		time: answers.time ?? ONBOARDING_DEFAULTS.time,
		weakSkill: answers.weakSkill ?? ONBOARDING_DEFAULTS.weakSkill,
		style: answers.style ?? ONBOARDING_DEFAULTS.style,
	};
}

// ── Should Show Onboarding (AC: 1) ─────────────────────────────────────────

/**
 * Determines if onboarding should be shown (AC: 1).
 *
 * Returns true only if no onboarding baseline exists for the user.
 * Existing users are never blocked (AC: 2 — skip available).
 */
export function shouldShowOnboarding(hasBaseline: boolean): boolean {
	return !hasBaseline;
}

// ── Estimated Completion Time (AC: 4) ──────────────────────────────────────

/** Estimated seconds per step (tap one option) */
const SECONDS_PER_STEP = 8;
/** Total estimated completion time in seconds */
export const ESTIMATED_COMPLETION_SECONDS = ONBOARDING_STEPS.length * SECONDS_PER_STEP;
/** Should be under 2 minutes (120 seconds) per AC: 4 */
export const UNDER_TWO_MINUTES = ESTIMATED_COMPLETION_SECONDS <= 120;
