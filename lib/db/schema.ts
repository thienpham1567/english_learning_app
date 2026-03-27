import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

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

export type Conversation = typeof conversation.$inferSelect;
export type Message = typeof message.$inferSelect;
