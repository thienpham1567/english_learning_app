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
} from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";

import type { Vocabulary } from "@/lib/schemas/vocabulary";

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  personaId: text("persona_id").notNull().default("simon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const message = pgTable("message", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vocabularyCache = pgTable("vocabulary_cache", {
  query: text("query").primaryKey(),
  data: jsonb("data").$type<Vocabulary>().notNull(),
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
  },
  (table) => [
    uniqueIndex("user_vocabulary_user_query_idx").on(table.userId, table.query),
  ],
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
  (table) => [
    uniqueIndex("flashcard_progress_user_query_idx").on(table.userId, table.query),
  ],
);

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
});

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
});

export const userStreak = pgTable("user_streak", {
  userId: text("user_id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  lastCompletedDate: text("last_completed_date"), // YYYY-MM-DD (VN timezone)
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Conversation = typeof conversation.$inferSelect;
export type Message = typeof message.$inferSelect;
export type VocabularyCache = typeof vocabularyCache.$inferSelect;
export type UserVocabulary = typeof userVocabulary.$inferSelect;
export type FlashcardProgress = typeof flashcardProgress.$inferSelect;
export type WritingSubmissionRow = typeof writingSubmission.$inferSelect;
export type DailyChallengeRow = typeof dailyChallenge.$inferSelect;
export type UserStreakRow = typeof userStreak.$inferSelect;
