import { z } from "zod/v4";

// ── Learner Goal (AC: 1) ───────────────────────────────────────────────────

export const LearnerGoal = z.enum([
	"career",
	"travel",
	"academic",
	"daily_conversation",
	"exam_prep",
	"general_improvement",
]);

// ── Daily Time Budget (AC: 1) ──────────────────────────────────────────────

export const DailyTimeBudget = z.enum(["5", "10", "15", "20", "30"]);

// ── Self-Reported Weak Skill (AC: 1) ───────────────────────────────────────

export const WeakSkillSelfReport = z.enum([
	"grammar",
	"vocabulary",
	"listening",
	"speaking",
	"pronunciation",
	"reading",
	"writing",
]);

// ── Preferred Learning Style (AC: 1) ───────────────────────────────────────

export const LearningStyle = z.enum([
	"visual",
	"auditory",
	"reading_writing",
	"kinesthetic",
	"mixed",
]);

// ── Baseline Skill Score (AC: 1) ───────────────────────────────────────────

export const BaselineSkillScoreSchema = z.object({
	skillId: z.string().min(1),
	score: z.number().min(0).max(100),
	confidence: z.number().min(0).max(1),
});

// ── Onboarding Baseline (AC: 1, 2, 4) ──────────────────────────────────────

export const OnboardingBaselineSchema = z.object({
	userId: z.string().min(1),
	primaryGoal: LearnerGoal,
	dailyTimeBudgetMinutes: DailyTimeBudget,
	selfReportedWeakSkill: WeakSkillSelfReport.nullable(),
	preferredLearningStyle: LearningStyle,
	baselineScores: z.array(BaselineSkillScoreSchema),
	placementSkipped: z.boolean(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type LearnerGoalValue = z.infer<typeof LearnerGoal>;
export type DailyTimeBudgetValue = z.infer<typeof DailyTimeBudget>;
export type WeakSkillSelfReportValue = z.infer<typeof WeakSkillSelfReport>;
export type LearningStyleValue = z.infer<typeof LearningStyle>;
export type BaselineSkillScore = z.infer<typeof BaselineSkillScoreSchema>;
export type OnboardingBaseline = z.infer<typeof OnboardingBaselineSchema>;
