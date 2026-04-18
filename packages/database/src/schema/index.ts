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
