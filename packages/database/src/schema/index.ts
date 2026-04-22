import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  real,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";

/** Generic vocabulary cache data shape — full type lives in apps/web */
// biome-ignore lint/suspicious/noExplicitAny: jsonb stores arbitrary dictionary API response
export type VocabularyCacheData = Record<string, any>;

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const activityTypeEnum = pgEnum("activity_type", [
  "flashcard_review",
  "grammar_quiz",
  "grammar_lesson",
  "study_set",
  "writing_practice",
  "daily_challenge",
  "chatbot_session",
  "voice_practice",
  "listening_practice",
  "diagnostic_test",
]);

export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  personaId: text("persona_id").notNull().default("simon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("conversation_user_updated_idx").on(table.userId, table.updatedAt),
]);

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("message_conversation_created_idx").on(table.conversationId, table.createdAt),
]);

export const vocabularyCache = pgTable("vocabulary_cache", {
  query: text("query").primaryKey(),
  data: jsonb("data").$type<VocabularyCacheData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const userVocabulary = pgTable(
  "user_vocabulary",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    query: text("query")
      .notNull()
      .references(() => vocabularyCache.query, { onDelete: "cascade" }),
    saved: boolean("saved").default(false).notNull(),
    lookedUpAt: timestamp("looked_up_at", { withTimezone: true }).defaultNow().notNull(),
    // SRS fields for vocabulary-level spaced repetition (Story 12.1)
    masteryLevel: text("mastery_level").notNull().default("new"), // new | learning | reviewing | mastered
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(0),
    reviewCount: integer("review_count").notNull().default(0),
    nextReview: timestamp("next_review", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_vocabulary_user_query_idx").on(table.userId, table.query)],
);

export const flashcardProgress = pgTable(
  "flashcard_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    query: text("query")
      .notNull()
      .references(() => vocabularyCache.query, { onDelete: "cascade" }),
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    nextReview: timestamp("next_review", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("flashcard_progress_user_query_idx").on(table.userId, table.query)],
);

/** User Skill Profile — tracks per-module adaptive difficulty (Story 12.4) */
export const userSkillProfile = pgTable(
  "user_skill_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    module: text("module").notNull(), // 'grammar' | 'listening' | 'reading' | 'writing' | 'speaking'
    currentLevel: real("current_level").notNull().default(5.0), // 1.0–10.0 scale
    accuracyLast10: real("accuracy_last_10").notNull().default(0.7),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_skill_profile_user_module_idx").on(table.userId, table.module)],
);

export type UserSkillProfileRow = typeof userSkillProfile.$inferSelect;

export const writingSubmission = pgTable("writing_submission", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  prompt: text("prompt").notNull(),
  text: text("text").notNull(),
  wordCount: integer("word_count").notNull(),
  overallBand: real("overall_band").notNull(),
  scores: jsonb("scores").notNull(),
  feedback: jsonb("feedback").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("writing_submission_user_created_idx").on(table.userId, table.createdAt),
]);

export const dailyChallenge = pgTable("daily_challenge", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  challengeDate: text("challenge_date").notNull(), // YYYY-MM-DD (VN timezone)
  exercises: jsonb("exercises").notNull(),
  answers: jsonb("answers"),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  timeElapsedMs: integer("time_elapsed_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("daily_challenge_user_date_idx").on(table.userId, table.challengeDate),
  index("daily_challenge_user_completed_idx").on(table.userId, table.completedAt),
]);

export const userStreak = pgTable("user_streak", {
  userId: text("user_id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastCompletedDate: text("last_completed_date"), // YYYY-MM-DD (VN timezone)
  xpTotal: integer("xp_total").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  xpEarned: integer("xp_earned").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activity_log_user_created_idx").on(table.userId, table.createdAt),
]);

export type Conversation = typeof conversation.$inferSelect;
export type Message = typeof message.$inferSelect;
export type VocabularyCache = typeof vocabularyCache.$inferSelect;
export type UserVocabulary = typeof userVocabulary.$inferSelect;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type WritingSubmissionRow = typeof writingSubmission.$inferSelect;
export type DailyChallengeRow = typeof dailyChallenge.$inferSelect;
export type UserStreakRow = typeof userStreak.$inferSelect;
export type ActivityLogRow = typeof activityLog.$inferSelect;

/** Listening Exercise — generated audio passage with MCQ questions */
export interface ListeningQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

/** Multi-speaker dialogue turn (Story 19.3.1). */
export type DialogueSpeaker = "A" | "B" | "C";
export type DialogueAccent = "us" | "uk" | "au";
export interface DialogueTurn {
  speaker: DialogueSpeaker;
  accent: DialogueAccent;
  voiceName: string;
  text: string;
}

export const listeningExercise = pgTable("listening_exercise", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  level: text("level").notNull(),
  exerciseType: text("exercise_type").notNull(),
  passage: text("passage").notNull(),
  audioUrl: text("audio_url").notNull(),
  questions: jsonb("questions").$type<ListeningQuestion[]>().notNull(),
  answers: jsonb("answers").$type<number[]>(),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  dialogueTurnsJson: jsonb("dialogue_turns_json").$type<DialogueTurn[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("listening_exercise_user_created_idx").on(table.userId, table.createdAt),
]);

export type ListeningExerciseRow = typeof listeningExercise.$inferSelect;

/** Push Subscription — Web Push notification endpoints */
export const pushSubscription = pgTable("push_subscription", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("push_subscription_user_enabled_idx").on(table.userId, table.enabled),
]);

export type PushSubscriptionRow = typeof pushSubscription.$inferSelect;

/** Exam Mode — TOEIC or IELTS */
export const examModeEnum = pgEnum("exam_mode", ["toeic", "ielts"]);

/** User Preferences — global settings per user */
export const userPreferences = pgTable("user_preferences", {
  userId: text("user_id").primaryKey(),
  examMode: examModeEnum("exam_mode").notNull().default("toeic"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserPreferencesRow = typeof userPreferences.$inferSelect;

/** Error Log — tracks wrong answers across all modules */
export const errorLog = pgTable("error_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  sourceModule: text("source_module").notNull(), // 'grammar-quiz' | 'mock-test' | 'daily-challenge' | 'listening'
  questionStem: text("question_stem").notNull(),
  options: jsonb("options").$type<string[]>(),
  userAnswer: text("user_answer").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  explanationEn: text("explanation_en"),
  explanationVi: text("explanation_vi"),
  grammarTopic: text("grammar_topic"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  // SRS Review Queue
  reviewCount: integer("review_count").notNull().default(0),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("error_log_user_review_idx").on(table.userId, table.isResolved, table.nextReviewAt),
  index("error_log_user_topic_idx").on(table.userId, table.grammarTopic),
]);

export type ErrorLogRow = typeof errorLog.$inferSelect;

/** Diagnostic Result — stores CEFR placement test results (Story 15.1) */
export const diagnosticResult = pgTable("diagnostic_result", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  overallCefr: text("overall_cefr").notNull(),
  confidence: real("confidence").notNull(),
  skillBreakdown: jsonb("skill_breakdown").$type<Record<string, { level: number; cefr: string; correct: number; total: number }>>().notNull(),
  answers: jsonb("answers").$type<Array<{ skill: string; level: string; correct: boolean; timeMs: number }>>(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("diagnostic_result_user_completed_idx").on(table.userId, table.completedAt),
]);

export type DiagnosticResultRow = typeof diagnosticResult.$inferSelect;

/** Scenario Progress — tracks user progress through immersive scenarios (Story 15.2) */
export const scenarioProgress = pgTable("scenario_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  scenarioId: text("scenario_id").notNull(),
  stepIndex: integer("step_index").notNull(),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("scenario_progress_user_scenario_idx").on(table.userId, table.scenarioId),
]);

export type ScenarioProgressRow = typeof scenarioProgress.$inferSelect;

/** Pronunciation Attempt — deterministic phoneme-level score per attempt (Story 19.1.2) */
export const pronunciationAttempt = pgTable("pronunciation_attempt", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  referenceText: text("reference_text").notNull(),
  transcript: text("transcript").notNull(),
  overall: integer("overall").notNull(),
  accent: text("accent").notNull().default("us"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("pronunciation_attempt_user_created_idx").on(table.userId, table.createdAt),
]);

export type PronunciationAttemptRow = typeof pronunciationAttempt.$inferSelect;

/** Speaking Attempt — free-talk session with AI feedback scores (Story 19.1.3) */
export const speakingAttempt = pgTable("speaking_attempt", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  topic: text("topic").notNull(),
  level: text("level").notNull(), // a2 | b1 | b2 | c1
  durationMs: integer("duration_ms").notNull(),
  transcript: text("transcript").notNull(),
  overall: integer("overall").notNull(),
  fluencyScore: integer("fluency_score").notNull(),
  grammarScore: integer("grammar_score").notNull(),
  vocabScore: integer("vocab_score").notNull(),
  coherenceScore: integer("coherence_score").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("speaking_attempt_user_created_idx").on(table.userId, table.createdAt),
]);

export type SpeakingAttemptRow = typeof speakingAttempt.$inferSelect;

/** Minimal Pairs Session — listen/speak drill results (Story 19.1.4) */
export const minimalPairsSession = pgTable("minimal_pairs_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull(), // listen | speak
  total: integer("total").notNull(),
  correct: integer("correct").notNull(),
  focusTags: jsonb("focus_tags").$type<string[]>().notNull().default([]),
  tagStats: jsonb("tag_stats").$type<Array<{ tag: string; total: number; correct: number }>>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("minimal_pairs_session_user_created_idx").on(table.userId, table.createdAt),
]);

export type MinimalPairsSessionRow = typeof minimalPairsSession.$inferSelect;

/** Writing Attempt — rubric-scored essay submission (Story 19.2.1) */
export const writingAttempt = pgTable("writing_attempt", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  exam: text("exam").notNull(), // ielts-task2 | ielts-task1 | toefl-independent
  prompt: text("prompt"),
  text: text("text").notNull(),
  overall: real("overall").notNull(),
  criteriaJson: jsonb("criteria_json").notNull(),
  inlineIssuesJson: jsonb("inline_issues_json").notNull().default([]),
  guidedPromptJson: jsonb("guided_prompt_json"), // nullable — set when using guided writing (19.2.3)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("writing_attempt_user_created_idx").on(table.userId, table.createdAt),
]);

export type WritingAttemptRow = typeof writingAttempt.$inferSelect;

/** Writing Error Pattern — tracks recurring error tag occurrences per user (Story 19.2.4, AC1) */
export const writingErrorPattern = pgTable("writing_error_pattern", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  tag: text("tag").notNull(), // one of ERROR_TAGS from lib/writing/error-tags.ts
  count: integer("count").notNull().default(1),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
  quizGeneratedAt: timestamp("quiz_generated_at", { withTimezone: true }), // when quiz was last auto-generated
}, (table) => [
  index("writing_error_pattern_user_tag_idx").on(table.userId, table.tag),
  index("writing_error_pattern_user_count_idx").on(table.userId, table.count),
]);

export type WritingErrorPatternRow = typeof writingErrorPattern.$inferSelect;

/** Listening Summary Attempt — summarize-mode submission with AI scoring (Story 19.3.3, AC6) */
export const listeningSummaryAttempt = pgTable("listening_summary_attempt", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => listeningExercise.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  overall: real("overall").notNull(),
  accuracyScore: real("accuracy_score").notNull(),
  coverageScore: real("coverage_score").notNull(),
  concisenessScore: real("conciseness_score").notNull(),
  keyIdeasJson: jsonb("key_ideas_json").$type<string[]>().notNull().default([]),
  coverageJson: jsonb("coverage_json")
    .$type<Array<{ idea: string; covered: boolean; whereInSummary?: string }>>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("listening_summary_attempt_user_created_idx").on(table.userId, table.createdAt),
  index("listening_summary_attempt_exercise_idx").on(table.exerciseId),
]);

export type ListeningSummaryAttemptRow = typeof listeningSummaryAttempt.$inferSelect;

/** Key vocabulary item extracted from an imported audio */
export type ImportKeyVocab = {
  term: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
};

/** Listening Import — user-imported podcast/YouTube content with Whisper transcription (Story 19.3.4, AC4) */
export const listeningImport = pgTable("listening_import", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  sourceUrl: text("source_url").notNull(),
  title: text("title").notNull(),
  durationSec: integer("duration_sec").notNull(),
  transcriptJson: jsonb("transcript_json")
    .$type<Array<{ start: number; end: number; text: string }>>()
    .notNull()
    .default([]),
  keyVocabJson: jsonb("key_vocab_json")
    .$type<ImportKeyVocab[]>()
    .notNull()
    .default([]),
  quizJson: jsonb("quiz_json")
    .$type<Array<{ question: string; options: string[]; correctIndex: number }>>()
    .notNull()
    .default([]),
  audioKey: text("audio_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("listening_import_user_created_idx").on(table.userId, table.createdAt),
]);

export type ListeningImportRow = typeof listeningImport.$inferSelect;

/** Reading Passage — CEFR-graded reading content with lexical analysis (Story 19.4.1, AC1) */
export const readingPassage = pgTable("reading_passage", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  cefrLevel: text("cefr_level").notNull(), // A2 | B1 | B2 | C1 | C2
  section: text("section").notNull().default("general"), // topic category
  wordCount: integer("word_count").notNull().default(0),
  lexicalTagsJson: jsonb("lexical_tags_json").$type<string[]>().notNull().default([]), // normalized lemmas
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("reading_passage_level_idx").on(table.cefrLevel),
]);

export type ReadingPassageRow = typeof readingPassage.$inferSelect;

/** Reading Progress — tracks user read/unread state per passage (Story 19.4.1, AC3) */
export const readingProgress = pgTable("reading_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  passageId: uuid("passage_id")
    .notNull()
    .references(() => readingPassage.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("reading_progress_user_passage_idx").on(table.userId, table.passageId),
]);

export type ReadingProgressRow = typeof readingProgress.$inferSelect;

/** Reading Session — tracks engagement per passage visit (Story 19.4.3, AC1) */
export const readingSession = pgTable("reading_session", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  passageId: uuid("passage_id")
    .notNull()
    .references(() => readingPassage.id, { onDelete: "cascade" }),
  wordCount: integer("word_count").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  scrollPct: integer("scroll_pct").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
}, (table) => [
  index("reading_session_user_completed_idx").on(table.userId, table.completedAt),
  index("reading_session_user_started_idx").on(table.userId, table.startedAt),
]);

export type ReadingSessionRow = typeof readingSession.$inferSelect;

/** Learning Event — normalized telemetry for personalization (Story 20.3) */
export const learningEvent = pgTable("learning_event", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  moduleType: text("module_type").notNull(),
  contentId: text("content_id").notNull(),
  skillIds: jsonb("skill_ids").$type<string[]>().notNull().default([]),
  attemptId: text("attempt_id").notNull(),
  eventType: text("event_type").notNull(),
  result: text("result").notNull(),
  score: real("score"),
  durationMs: integer("duration_ms").notNull().default(0),
  difficulty: text("difficulty").notNull(),
  errorTags: jsonb("error_tags").$type<string[]>().notNull().default([]),
  aiVersion: text("ai_version"),
  rubricVersion: text("rubric_version"),
  taxonomyVersion: text("taxonomy_version").notNull().default("1.0.0"),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("learning_event_user_created_idx").on(table.userId, table.createdAt),
  index("learning_event_user_module_idx").on(table.userId, table.moduleType),
  uniqueIndex("learning_event_idempotency_idx").on(table.idempotencyKey),
]);

export type LearningEventRow = typeof learningEvent.$inferSelect;

/** User Skill State — fine-grained per-skill mastery (Story 20.4) */
export const userSkillState = pgTable("user_skill_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  skillId: text("skill_id").notNull(),
  proficiency: real("proficiency").notNull().default(0),
  confidence: real("confidence").notNull().default(0.5),
  successStreak: integer("success_streak").notNull().default(0),
  failureStreak: integer("failure_streak").notNull().default(0),
  decayRate: real("decay_rate").notNull().default(0.05),
  signalCount: integer("signal_count").notNull().default(0),
  lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }).defaultNow().notNull(),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }).defaultNow().notNull(),
  nextReviewAt: timestamp("next_review_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_skill_state_user_skill_idx").on(table.userId, table.skillId),
  index("user_skill_state_next_review_idx").on(table.userId, table.nextReviewAt),
]);

export type UserSkillStateRow = typeof userSkillState.$inferSelect;

/** Unified Review Task — cross-module review queue (Story 20.7) */
export const reviewTask = pgTable("review_task", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  skillIds: text("skill_ids").array().notNull(),
  priority: integer("priority").notNull().default(50),
  dueAt: timestamp("due_at", { withTimezone: true }).defaultNow().notNull(),
  estimatedMinutes: real("estimated_minutes").notNull().default(5),
  reviewMode: text("review_mode").notNull().default("recall"),
  status: text("status").notNull().default("pending"),
  lastOutcome: text("last_outcome"),
  attemptCount: integer("attempt_count").notNull().default(0),
  nextIntervalDays: real("next_interval_days").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  suppressionReason: text("suppression_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("review_task_user_source_idx").on(table.userId, table.sourceType, table.sourceId),
  index("review_task_due_idx").on(table.userId, table.status, table.dueAt),
]);

export type ReviewTaskRow = typeof reviewTask.$inferSelect;

/** AI Feedback Run — versioned AI feedback metadata (Story 20.10) */
export const aiFeedbackRun = pgTable("ai_feedback_run", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  templateId: text("template_id").notNull(),
  templateVersion: text("template_version").notNull(),
  rubricVersion: text("rubric_version").notNull(),
  modelName: text("model_name").notNull(),
  promptHash: text("prompt_hash").notNull(),
  inputSnapshot: jsonb("input_snapshot").$type<Record<string, unknown>>().notNull(),
  structuredOutput: jsonb("structured_output").$type<Record<string, unknown>>().notNull(),
  latencyMs: integer("latency_ms").notNull(),
  costEstimate: real("cost_estimate"),
  safetyFlags: jsonb("safety_flags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("ai_feedback_run_user_created_idx").on(table.userId, table.createdAt),
  index("ai_feedback_run_template_version_idx").on(table.templateId, table.templateVersion),
]);

export type AiFeedbackRunRow = typeof aiFeedbackRun.$inferSelect;

/** Onboarding Baseline — learner goal, time budget, placement results (Story 20.12) */
export const onboardingBaseline = pgTable("onboarding_baseline", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  primaryGoal: text("primary_goal").notNull(),
  dailyTimeBudgetMinutes: text("daily_time_budget_minutes").notNull().default("10"),
  selfReportedWeakSkill: text("self_reported_weak_skill"),
  preferredLearningStyle: text("preferred_learning_style").notNull().default("mixed"),
  baselineScores: jsonb("baseline_scores").$type<Array<{ skillId: string; score: number; confidence: number }>>().notNull().default([]),
  placementSkipped: boolean("placement_skipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("onboarding_baseline_user_idx").on(table.userId),
]);

export type OnboardingBaselineRow = typeof onboardingBaseline.$inferSelect;
