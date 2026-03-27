import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
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

export type Conversation = typeof conversation.$inferSelect;
export type Message = typeof message.$inferSelect;
export type VocabularyCache = typeof vocabularyCache.$inferSelect;
export type UserVocabulary = typeof userVocabulary.$inferSelect;
