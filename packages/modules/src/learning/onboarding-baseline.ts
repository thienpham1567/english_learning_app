import type {
	LearnerGoalValue,
	WeakSkillSelfReportValue,
	LearningStyleValue,
	BaselineSkillScore,
	OnboardingBaseline,
} from "@repo/contracts/src/learning/onboarding-baseline";
import type { UserSkillState } from "@repo/contracts";
import { defaultSkillState } from "./mastery-engine";

// ── Core Skills ─────────────────────────────────────────────────────────────

const CORE_SKILLS = [
	"grammar",
	"vocabulary",
	"listening",
	"speaking",
	"pronunciation",
	"reading",
	"writing",
] as const;

// ── Conservative Defaults (AC: 4) ──────────────────────────────────────────

const DEFAULT_BASELINE_SCORES: BaselineSkillScore[] = CORE_SKILLS.map((skill) => ({
	skillId: skill,
	score: 30,
	confidence: 0.3,
}));

const DEFAULT_GOAL: LearnerGoalValue = "general_improvement";
const DEFAULT_STYLE: LearningStyleValue = "mixed";
const DEFAULT_BUDGET = "10" as const;

// ── Goal → Skill Priority Mapping (AC: 3) ──────────────────────────────────

const GOAL_SKILL_BOOST: Record<LearnerGoalValue, string[]> = {
	career: ["writing", "speaking", "vocabulary"],
	travel: ["speaking", "listening", "vocabulary"],
	academic: ["reading", "writing", "grammar"],
	daily_conversation: ["speaking", "listening", "pronunciation"],
	exam_prep: ["grammar", "reading", "listening", "writing"],
	general_improvement: [],
};

// ── Create Baseline from Placement (AC: 1, 2) ──────────────────────────────

export interface CreateBaselineInput {
	userId: string;
	primaryGoal: LearnerGoalValue;
	dailyTimeBudgetMinutes: string;
	selfReportedWeakSkill?: WeakSkillSelfReportValue;
	preferredLearningStyle?: LearningStyleValue;
	placementScores?: BaselineSkillScore[];
}

/**
 * Create an onboarding baseline from placement results.
 * Pure function — persistence handled by caller.
 */
export function createBaseline(input: CreateBaselineInput): OnboardingBaseline {
	const now = new Date().toISOString();
	const scores = input.placementScores && input.placementScores.length > 0
		? input.placementScores
		: DEFAULT_BASELINE_SCORES;

	return {
		userId: input.userId,
		primaryGoal: input.primaryGoal,
		dailyTimeBudgetMinutes: input.dailyTimeBudgetMinutes as OnboardingBaseline["dailyTimeBudgetMinutes"],
		selfReportedWeakSkill: input.selfReportedWeakSkill ?? null,
		preferredLearningStyle: input.preferredLearningStyle ?? DEFAULT_STYLE,
		baselineScores: scores,
		placementSkipped: !input.placementScores || input.placementScores.length === 0,
		createdAt: now,
		updatedAt: now,
	};
}

// ── Skip Placement → Conservative Defaults (AC: 4) ─────────────────────────

/**
 * Create a conservative baseline when placement is skipped.
 */
export function createSkippedBaseline(
	userId: string,
	goal?: LearnerGoalValue,
	budget?: string,
): OnboardingBaseline {
	return createBaseline({
		userId,
		primaryGoal: goal ?? DEFAULT_GOAL,
		dailyTimeBudgetMinutes: budget ?? DEFAULT_BUDGET,
	});
}

// ── Baseline → Initial Mastery States (AC: 2) ──────────────────────────────

/**
 * Convert baseline scores into initial UserSkillState entries
 * for the mastery engine from Story 20.4.
 */
export function baselineToMasteryStates(
	baseline: OnboardingBaseline,
): UserSkillState[] {
	return baseline.baselineScores.map((score) => {
		const state = defaultSkillState(baseline.userId, score.skillId);
		return {
			...state,
			proficiency: score.score,
			confidence: score.confidence,
		};
	});
}

// ── Goal Relevance Boost (AC: 3) ───────────────────────────────────────────

/**
 * Get skill IDs that are boosted by the learner's primary goal.
 * Used by the recommendation scorer (20.5) and daily plan generator (20.6).
 */
export function getGoalRelevantSkills(goal: LearnerGoalValue): string[] {
	return GOAL_SKILL_BOOST[goal] ?? [];
}

/**
 * Check if a skill is relevant to the learner's goal.
 */
export function isGoalRelevant(goal: LearnerGoalValue, skillId: string): boolean {
	const relevant = GOAL_SKILL_BOOST[goal];
	if (!relevant || relevant.length === 0) return true; // general → all relevant
	return relevant.includes(skillId);
}
