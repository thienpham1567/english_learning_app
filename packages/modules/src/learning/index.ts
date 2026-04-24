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

export { groupReviewTasks } from "./review-group-mapper";
export type { ReviewGroup, DueReviewItem as ReviewDueItem } from "./review-group-mapper";

export {
	createSession,
	advance,
	exitSession,
	progressPercent,
	currentTask,
	sessionSummary,
	isSupported,
	getDelegateRoute,
} from "./review-session";
export type {
	ReviewSessionTask,
	ReviewSessionState,
	SessionTaskResult,
	TaskOutcome,
} from "./review-session";

export {
	classifyError,
	getCategoryByKey,
	getAllCategories,
	categoryToSkillIds,
	ERROR_CATEGORIES,
} from "./error-category";
export type { ErrorCategory } from "./error-category";

export { summarizeErrorPatterns } from "./error-pattern-summary";
export type { ErrorPatternInput, ErrorPattern, ErrorPatternExample } from "./error-pattern-summary";

export {
	validateDrillItem,
	validateDrillItems,
	generateDrillsFromErrors,
	buildDrillPrompt,
	canGenerateDrill,
	MIN_ERRORS_FOR_DRILL,
} from "./error-drill-generator";
export type {
	DrillItem,
	DrillSession,
	DrillSourceError,
	DrillGenerationInput,
	DrillValidationResult,
} from "./error-drill-generator";

export { computeErrorTrends } from "./error-trend";
export type { TrendInput, TrendDirection, CategoryTrend, TrendSummary } from "./error-trend";

export {
	errorPatternsToRecommendations,
	generateErrorDrillReason,
	computeDrillCompletionEffects,
} from "./error-remediation-recommender";
export type { DrillCompletionEffect } from "./error-remediation-recommender";

export {
	ONBOARDING_STEPS,
	GOAL_OPTIONS,
	TIME_OPTIONS,
	WEAK_SKILL_OPTIONS,
	STYLE_OPTIONS,
	ONBOARDING_DEFAULTS,
	mergeWithDefaults,
	shouldShowOnboarding,
	ESTIMATED_COMPLETION_SECONDS,
	UNDER_TWO_MINUTES,
} from "./onboarding-flow";
export type { OnboardingOption, OnboardingStep, OnboardingAnswers } from "./onboarding-flow";

export {
	diagnosticToBaselineScore,
	diagnosticToBaselineScores,
	baselineScoresToSkillStates,
	mergeSkillStates,
	processDiagnosticSafely,
} from "./diagnostic-bridge";
export type { DiagnosticSkillResult, DiagnosticResult, DiagnosticProcessingResult } from "./diagnostic-bridge";

export { generateStarterPathway, pathwayDayToCandidates } from "./starter-pathway";
export type { PathwayAction, PathwayDay, StarterPathway } from "./starter-pathway";

export { buildPathwayContext } from "./pathway-context";
export type { PathwayContext } from "./pathway-context";

export { replanPathway, isReplanNeeded } from "./pathway-replanner";
export type { ReplanInput, ReplanResult } from "./pathway-replanner";

export {
	buildGrammarQuizSummary,
	buildListeningSummary,
	buildWritingSummary,
	buildGenericSummary,
} from "./lesson-summary-builder";
export type { SummaryBuilderInput, WritingSummaryInput } from "./lesson-summary-builder";

export {
	computeNextVersion,
	createFeedbackRunRecord,
	getLatestRun,
	getSuccessfulRuns,
	computeRunMetrics,
} from "./feedback-run-persistence";
export type { FeedbackRunRecord, CreateFeedbackRunInput, FeedbackRunMetrics } from "./feedback-run-persistence";

export { buildCoachSummary, coachSummaryToPrompt } from "./coach-summary";
export type { CoachSummary } from "./coach-summary";

export { extractChatCorrections, estimateCorrectionSeverity } from "./chat-correction-signals";
export type { ChatCorrection, ChatCorrectionSignal, CorrectionSeverity } from "./chat-correction-signals";

export { buildSkillProgressPanel, generateRecommendationExplanation, CORE_SKILLS } from "./skill-progress-panel";
export type { SkillProgressItem, SkillProgressPanel, CoreSkill } from "./skill-progress-panel";

export { generateImprovementStatements } from "./improvement-statements";
export type { EvidenceData, ImprovementStatement } from "./improvement-statements";

export { computeReviewDebt } from "./review-debt-insight";
export type { ReviewDebtCategory, ReviewDebtInsight } from "./review-debt-insight";

export { generateWeeklyRetrospective } from "./weekly-retrospective";
export type { WeeklyActivityData, WeeklyRetrospective } from "./weekly-retrospective";

export { buildWidgetLayout, getMobileVisibleWidgets, getPrimaryWidgets, getActiveWidgets } from "./widget-layout";
export type { WidgetCategory, WidgetSlot } from "./widget-layout";
