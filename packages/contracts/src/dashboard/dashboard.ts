import { z } from "zod/v4";

export const BadgeSchema = z.object({
	id: z.string(),
	emoji: z.string(),
	label: z.string(),
	requiredStreak: z.number().int(),
	unlocked: z.boolean(),
});

export const DailyChallengeStatusSchema = z.object({
	completed: z.boolean(),
	score: z.number().nullable(),
});

export const StreakSchema = z.object({
	currentStreak: z.number().int(),
	bestStreak: z.number().int(),
	lastCompletedDate: z.string().nullable(),
});

export const RecentVocabularyItemSchema = z.object({
	query: z.string(),
	headword: z.string(),
	level: z.string(),
	lookedUpAt: z.string(),
});

export const WeeklyActivityItemSchema = z.object({
	day: z.string(),
	count: z.number().int(),
});

export const DashboardResponseSchema = z.object({
	flashcardsDue: z.number().int(),
	vocabDue: z.number().int(),
	dailyChallenge: DailyChallengeStatusSchema,
	streak: StreakSchema,
	badges: z.array(BadgeSchema),
	recentVocabulary: z.array(RecentVocabularyItemSchema),
	weeklyActivity: z.array(WeeklyActivityItemSchema),
	totalXP: z.number().int(),
});

export type Badge = z.infer<typeof BadgeSchema>;
export type DailyChallengeStatus = z.infer<typeof DailyChallengeStatusSchema>;
export type Streak = z.infer<typeof StreakSchema>;
export type RecentVocabularyItem = z.infer<typeof RecentVocabularyItemSchema>;
export type WeeklyActivityItem = z.infer<typeof WeeklyActivityItemSchema>;
export type DashboardResponse = z.infer<typeof DashboardResponseSchema>;
