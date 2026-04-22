// Common
export { PaginationSchema, ApiErrorResponseSchema } from "./common";
export type { Pagination, ApiErrorResponse } from "./common";

// Dashboard
export {
	BadgeSchema,
	DailyChallengeStatusSchema,
	StreakSchema,
	RecentVocabularyItemSchema,
	WeeklyActivityItemSchema,
	DashboardResponseSchema,
} from "./dashboard";
export type {
	Badge,
	DailyChallengeStatus,
	Streak,
	RecentVocabularyItem,
	WeeklyActivityItem,
	DashboardResponse,
} from "./dashboard";

// Learning
export {
	LearningEventSchema,
	LearningEventType,
	LearningModuleType,
	LearningResult,
	LearningDifficulty,
	SkillSchema,
	SubskillSchema,
	SkillTaxonomyVersionSchema,
	ModuleSkillMappingSchema,
} from "./learning";
export type {
	LearningEvent,
	LearningEventTypeValue,
	LearningModuleTypeValue,
	LearningResultValue,
	LearningDifficultyValue,
	Skill,
	Subskill,
	SkillTaxonomyVersion,
	ModuleSkillMapping,
} from "./learning";
