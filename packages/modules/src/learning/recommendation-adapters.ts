import type { RecommendationCandidate, UserSkillState } from "@repo/contracts";

/**
 * Candidate adapter: convert due reviews from user skill states into
 * recommendation candidates (AC: 1, 3).
 */
export function candidatesFromDueReviews(
	skillStates: UserSkillState[],
	nowMs: number,
): RecommendationCandidate[] {
	return skillStates
		.filter((s) => {
			const dueMs = new Date(s.nextReviewAt).getTime();
			return dueMs <= nowMs;
		})
		.map((s) => ({
			id: `review-${s.skillId}`,
			skillIds: [s.skillId],
			moduleType: SKILL_TO_MODULE[s.skillId] ?? "flashcard",
			actionUrl: SKILL_TO_URL[s.skillId] ?? "/flashcards",
			label: `Review: ${SKILL_LABELS[s.skillId] ?? s.skillId}`,
			estimatedMinutes: 10,
			isDueReview: true,
			dueAt: s.nextReviewAt,
			currentProficiency: s.proficiency,
			currentConfidence: s.confidence,
			difficulty: proficiencyToDifficulty(s.proficiency),
			goalAligned: true, // reviews are always goal-aligned
			hoursSinceLastPractice: (nowMs - new Date(s.lastPracticedAt).getTime()) / (1000 * 60 * 60),
		}));
}

/**
 * Candidate adapter: convert weak skills into study candidates (AC: 1, 3).
 */
export function candidatesFromWeakSkills(
	skillStates: UserSkillState[],
	nowMs: number,
	goalSkillIds?: string[],
): RecommendationCandidate[] {
	return skillStates
		.filter((s) => s.proficiency < 50 || s.confidence < 0.4)
		.map((s) => ({
			id: `study-${s.skillId}`,
			skillIds: [s.skillId],
			moduleType: SKILL_TO_MODULE[s.skillId] ?? "flashcard",
			actionUrl: SKILL_TO_URL[s.skillId] ?? "/flashcards",
			label: `Practice: ${SKILL_LABELS[s.skillId] ?? s.skillId}`,
			estimatedMinutes: 15,
			isDueReview: false,
			dueAt: null,
			currentProficiency: s.proficiency,
			currentConfidence: s.confidence,
			difficulty: proficiencyToDifficulty(s.proficiency),
			goalAligned: goalSkillIds ? goalSkillIds.includes(s.skillId) : false,
			hoursSinceLastPractice: (nowMs - new Date(s.lastPracticedAt).getTime()) / (1000 * 60 * 60),
		}));
}

/**
 * Candidate adapter: generate default study actions for skills with no state (new learner).
 */
export function candidatesFromDefaultActions(
	existingSkillIds: Set<string>,
	goalSkillIds?: string[],
): RecommendationCandidate[] {
	return DEFAULT_STUDY_ACTIONS
		.filter((a) => !existingSkillIds.has(a.skillId))
		.map((a) => ({
			id: `default-${a.skillId}`,
			skillIds: [a.skillId],
			moduleType: a.moduleType,
			actionUrl: a.actionUrl,
			label: a.label,
			estimatedMinutes: a.estimatedMinutes,
			isDueReview: false,
			dueAt: null,
			currentProficiency: 0,
			currentConfidence: 0.5,
			difficulty: "beginner" as const,
			goalAligned: goalSkillIds ? goalSkillIds.includes(a.skillId) : false,
			hoursSinceLastPractice: 999,
		}));
}

// ── Lookup tables ───────────────────────────────────────────────────────────

const SKILL_TO_MODULE: Record<string, string> = {
	vocabulary: "flashcard",
	grammar: "grammar_quiz",
	listening: "listening",
	speaking: "chatbot",
	pronunciation: "pronunciation",
	reading: "reading",
	writing: "writing",
	exam_strategy: "grammar_quiz",
};

const SKILL_TO_URL: Record<string, string> = {
	vocabulary: "/flashcards",
	grammar: "/grammar-quiz",
	listening: "/listening",
	speaking: "/chatbot",
	pronunciation: "/pronunciation",
	reading: "/reading",
	writing: "/writing-practice",
	exam_strategy: "/review-quiz",
};

const SKILL_LABELS: Record<string, string> = {
	vocabulary: "Vocabulary",
	grammar: "Grammar",
	listening: "Listening",
	speaking: "Speaking",
	pronunciation: "Pronunciation",
	reading: "Reading",
	writing: "Writing",
	exam_strategy: "Exam Strategy",
};

const DEFAULT_STUDY_ACTIONS = [
	{ skillId: "vocabulary", moduleType: "flashcard", actionUrl: "/flashcards", label: "Build your vocabulary", estimatedMinutes: 10 },
	{ skillId: "grammar", moduleType: "grammar_quiz", actionUrl: "/grammar-quiz", label: "Practice grammar", estimatedMinutes: 15 },
	{ skillId: "listening", moduleType: "listening", actionUrl: "/listening", label: "Train your ear", estimatedMinutes: 15 },
	{ skillId: "reading", moduleType: "reading", actionUrl: "/reading", label: "Read and comprehend", estimatedMinutes: 20 },
	{ skillId: "writing", moduleType: "writing", actionUrl: "/writing-practice", label: "Improve your writing", estimatedMinutes: 20 },
	{ skillId: "speaking", moduleType: "chatbot", actionUrl: "/chatbot", label: "Practice speaking", estimatedMinutes: 10 },
];

function proficiencyToDifficulty(proficiency: number): RecommendationCandidate["difficulty"] {
	if (proficiency < 20) return "beginner";
	if (proficiency < 40) return "elementary";
	if (proficiency < 60) return "intermediate";
	if (proficiency < 80) return "upper_intermediate";
	return "advanced";
}
