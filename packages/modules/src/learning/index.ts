export {
	TAXONOMY_VERSION,
	SKILLS,
	SUBSKILLS,
	MODULE_SKILL_MAP,
	ACTIVITY_SKILL_MAP,
	getSkillById,
	getSubskillsForSkill,
	resolveSkillsForModule,
	resolveSkillsForActivity,
} from "./skill-taxonomy";

export { recordLearningEvent } from "./record-learning-event";
export type { RecordLearningEventInput } from "./record-learning-event";

export { defaultSkillState, applyDecay, computeMasteryUpdate } from "./mastery-engine";

export { scoreAndRank } from "./recommendation-scorer";
export {
	candidatesFromDueReviews,
	candidatesFromWeakSkills,
	candidatesFromDefaultActions,
} from "./recommendation-adapters";

export { generateDailyPlan } from "./daily-plan-generator";

export {
	computeInitialSchedule,
	computeReschedule,
	isHeavySourceType,
	applyBurnoutProtection,
	DEFAULT_ESTIMATED_MINUTES,
	DEFAULT_REVIEW_MODE,
	MAX_HEAVY_PER_DAY,
} from "./review-scheduler";

export {
	produceReviewTask,
	produceVocabularyReviewTask,
	produceWritingReviewTask,
	producePronunciationReviewTask,
	produceGrammarReviewTask,
	produceListeningReviewTask,
	produceClozeReviewTask,
} from "./review-producers";
export type {
	ReviewTaskProducerInput,
	ReviewTaskProducerOutput,
} from "./review-producers";

export { completeReview } from "./review-completion";
export type {
	ReviewCompletionInput,
	ReviewCompletionOutput,
} from "./review-completion";

export {
	hashPrompt,
	registerFeedbackTemplate,
	getFeedbackTemplate,
	wrapFeedbackCall,
} from "./ai-feedback-wrapper";
export type { FeedbackTemplateEntry } from "./ai-feedback-wrapper";

export {
	validateFeedbackOutput,
	issuesAsReviewTasks,
	recordFeedbackAction,
	isMeaningfulFeedbackAction,
} from "./feedback-quality-gates";
export type { FeedbackActionRecord } from "./feedback-quality-gates";

export {
	createBaseline,
	createSkippedBaseline,
	baselineToMasteryStates,
	getGoalRelevantSkills,
	isGoalRelevant,
} from "./onboarding-baseline";
export type { CreateBaselineInput } from "./onboarding-baseline";
