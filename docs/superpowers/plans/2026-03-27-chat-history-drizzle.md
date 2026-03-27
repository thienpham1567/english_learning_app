# Chat History with Drizzle ORM — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist chat conversations in Supabase using Drizzle ORM, with a named-threads UI panel in the chatbot page.

**Architecture:** Drizzle ORM sits on top of the existing `pg` package (no extra driver). Two new tables — `conversation` and `message` — hold threads and their messages. The existing `/api/chat` SSE route is extended to persist messages after the stream completes. The chatbot page gains a left-panel thread list.

**Tech Stack:** `drizzle-orm`, `drizzle-kit`, `pg` (existing), Next.js Route Handlers, React state

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `drizzle.config.ts` | drizzle-kit CLI config |
| Create | `lib/db/schema.ts` | Drizzle table + enum definitions, inferred types |
| Create | `lib/db/index.ts` | `db` client (Drizzle over existing pg Pool) |
| Create | `lib/db/migrations/` | Generated SQL — **do not edit by hand** |
| Create | `lib/chat/derive-title.ts` | Pure fn: truncate first message to 60 chars for thread title |
| Create | `lib/chat/derive-title.test.ts` | Unit tests for `deriveTitle` |
| Create | `app/api/conversations/route.ts` | `GET` list + `POST` create |
| Create | `app/api/conversations/[id]/route.ts` | `DELETE` thread |
| Create | `app/api/conversations/[id]/messages/route.ts` | `GET` message history |
| Create | `components/app/ConversationList.tsx` | Thread list panel UI |
| Create | `components/app/ConversationList.test.tsx` | Component tests |
| Modify | `package.json` | Add `drizzle-orm`, `drizzle-kit`, `db:generate`, `db:migrate` scripts |
| Modify | `app/api/chat/route.ts` | Accept `conversationId`, persist messages after stream |
| Modify | `app/(app)/english-chatbot/page.tsx` | Add thread panel + conversation lifecycle |

---

## Task 1: Install Drizzle

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

```bash
npm install drizzle-orm
npm install --save-dev drizzle-kit
```

- [ ] **Step 2: Add scripts to `package.json`**

Add inside `"scripts"`:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate"
```

- [ ] **Step 3: Verify**

```bash
npx drizzle-kit --version
```

Expected: prints a version like `drizzle-kit v0.x.x`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add drizzle-orm and drizzle-kit"
```

---

## Task 2: Drizzle Config + Schema + Client

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`

- [ ] **Step 1: Create `drizzle.config.ts`**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 2: Create `lib/db/schema.ts`**

```ts
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
```

- [ ] **Step 3: Create `lib/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts lib/db/schema.ts lib/db/index.ts
git commit -m "feat: add Drizzle schema and db client"
```

---

## Task 3: Generate and Run Migration

**Files:**
- Create: `lib/db/migrations/` (generated)

- [ ] **Step 1: Generate migration SQL**

```bash
npm run db:generate
```

Expected: `lib/db/migrations/` directory created with a `.sql` file containing `CREATE TABLE conversation`, `CREATE TABLE message`, and the `message_role` enum.

- [ ] **Step 2: Apply migration to the database**

```bash
npm run db:migrate
```

Expected: output like `[✓] migrations applied` with no errors.

- [ ] **Step 3: Commit migration files**

```bash
git add lib/db/migrations/
git commit -m "feat: add conversation and message table migrations"
```

---

## Task 4: `deriveTitle` Utility

**Files:**
- Create: `lib/chat/derive-title.ts`
- Create: `lib/chat/derive-title.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/chat/derive-title.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { deriveTitle } from "./derive-title";

describe("deriveTitle", () => {
  it("returns the text unchanged when 60 chars or fewer", () => {
    expect(deriveTitle("Hello world")).toBe("Hello world");
  });

  it("returns exactly 60 chars unchanged", () => {
    const exact = "a".repeat(60);
    expect(deriveTitle(exact)).toBe(exact);
  });

  it("truncates to 60 chars and appends ellipsis when over 60", () => {
    const long = "a".repeat(80);
    const result = deriveTitle(long);
    expect(result).toBe("a".repeat(60) + "…");
  });

  it("trims leading and trailing whitespace before measuring", () => {
    expect(deriveTitle("  hello  ")).toBe("hello");
  });

  it("trims trailing whitespace before appending ellipsis", () => {
    // 58 chars + space + extra chars → truncates at 60, trailing space trimmed
    const text = "a".repeat(58) + " " + "b".repeat(10);
    const result = deriveTitle(text);
    expect(result.endsWith("…")).toBe(true);
    expect(result.slice(0, -1).trimEnd()).toBe(result.slice(0, -1));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- lib/chat/derive-title.test.ts
```

Expected: FAIL — `Cannot find module './derive-title'`

- [ ] **Step 3: Implement `lib/chat/derive-title.ts`**

```ts
export function deriveTitle(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= 60) return trimmed;
  return trimmed.slice(0, 60).trimEnd() + "…";
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- lib/chat/derive-title.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/chat/derive-title.ts lib/chat/derive-title.test.ts
git commit -m "feat: add deriveTitle utility for conversation thread titles"
```

---

## Task 5: Conversation API Routes

**Files:**
- Create: `app/api/conversations/route.ts`
- Create: `app/api/conversations/[id]/route.ts`
- Create: `app/api/conversations/[id]/messages/route.ts`

- [ ] **Step 1: Create `app/api/conversations/route.ts`**

```ts
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/db/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
    })
    .from(conversation)
    .where(eq(conversation.userId, session.user.id))
    .orderBy(desc(conversation.updatedAt));

  return Response.json(rows);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as { title?: unknown } | null;
  const title =
    typeof body?.title === "string" && body.title.trim().length > 0
      ? body.title.trim()
      : "New conversation";

  const [created] = await db
    .insert(conversation)
    .values({ userId: session.user.id, title })
    .returning({ id: conversation.id, title: conversation.title });

  return Response.json(created, { status: 201 });
}
```

- [ ] **Step 2: Create `app/api/conversations/[id]/route.ts`**

```ts
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/db/schema";

type Params = Promise<{ id: string }>;

export async function DELETE(
  _req: Request,
  { params }: { params: Params },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [existing] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(conversation).where(eq(conversation.id, id));

  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Create `app/api/conversations/[id]/messages/route.ts`**

```ts
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/db/schema";

type Params = Promise<{ id: string }>;

export async function GET(
  _req: Request,
  { params }: { params: Params },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [conv] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, id))
    .limit(1);

  if (!conv) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  if (conv.userId !== session.user.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.conversationId, id))
    .orderBy(asc(message.createdAt));

  return Response.json(messages);
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/conversations/
git commit -m "feat: add conversation CRUD API routes"
```

---

## Task 6: Extend `/api/chat` to Persist Messages

**Files:**
- Modify: `app/api/chat/route.ts`

- [ ] **Step 1: Replace `app/api/chat/route.ts` with the persisting version**

```ts
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/db/schema";
import { buildChatRequest } from "@/lib/chat/build-chat-input";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import type { ChatMessage } from "@/lib/chat/types";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const CHAT_ERROR_MESSAGE =
  "Cô Minh đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

function writeSseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  payload:
    | { type: "assistant_start" }
    | { type: "assistant_delta"; delta: string }
    | { type: "assistant_done" }
    | { type: "assistant_error"; message: string },
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

function createErrorSseResponse() {
  const encoder = new TextEncoder();
  return createChatSse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        writeSseEvent(controller, encoder, {
          type: "assistant_error",
          message: CHAT_ERROR_MESSAGE,
        });
        controller.close();
      },
    }),
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.text === "string"
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
      conversationId?: unknown;
    } | null;

    const messages = Array.isArray(body?.messages)
      ? body.messages.filter(isChatMessage)
      : [];

    const conversationId =
      typeof body?.conversationId === "string" ? body.conversationId : null;

    const { instructions, input } = buildChatRequest(messages);
    const encoder = new TextEncoder();

    return createChatSse(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          let streamStarted = false;
          let doneSent = false;
          let fullAssistantText = "";

          try {
            const stream = openAiClient.responses.stream({
              model: openAiConfig.chatModel,
              instructions,
              input,
            });

            writeSseEvent(controller, encoder, { type: "assistant_start" });
            streamStarted = true;

            for await (const event of stream) {
              if (event.type === "response.output_text.delta" && event.delta) {
                fullAssistantText += event.delta;
                writeSseEvent(controller, encoder, {
                  type: "assistant_delta",
                  delta: event.delta,
                });
              }

              if (event.type === "response.completed" && !doneSent) {
                // Persist both messages if we have a conversationId and a session
                if (conversationId && session && fullAssistantText) {
                  const lastUserMessage = messages[messages.length - 1];
                  if (lastUserMessage) {
                    await db.insert(message).values([
                      {
                        conversationId,
                        role: "user",
                        content: lastUserMessage.text,
                      },
                      {
                        conversationId,
                        role: "assistant",
                        content: fullAssistantText,
                      },
                    ]);
                    await db
                      .update(conversation)
                      .set({ updatedAt: new Date() })
                      .where(eq(conversation.id, conversationId));
                  }
                }

                writeSseEvent(controller, encoder, { type: "assistant_done" });
                doneSent = true;
              }

              if (
                (event.type === "response.failed" || event.type === "error") &&
                !doneSent
              ) {
                throw new Error("OpenAI chat stream failed");
              }
            }

            if (streamStarted && !doneSent) {
              writeSseEvent(controller, encoder, { type: "assistant_done" });
            }
          } catch (error) {
            console.error("Chat API error:", error);
            writeSseEvent(controller, encoder, {
              type: "assistant_error",
              message: CHAT_ERROR_MESSAGE,
            });
          } finally {
            controller.close();
          }
        },
      }),
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return createErrorSseResponse();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: persist messages to DB after chat stream completes"
```

---

## Task 7: `ConversationList` Component

**Files:**
- Create: `components/app/ConversationList.tsx`
- Create: `components/app/ConversationList.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/app/ConversationList.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList } from "./ConversationList";

const threads = [
  { id: "1", title: "Thread one", updatedAt: new Date().toISOString() },
  { id: "2", title: "Thread two", updatedAt: new Date().toISOString() },
];

describe("ConversationList", () => {
  it("renders all thread titles", () => {
    render(
      <ConversationList
        conversations={threads}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Thread one")).toBeInTheDocument();
    expect(screen.getByText("Thread two")).toBeInTheDocument();
  });

  it("calls onSelect with the thread id when a thread is clicked", () => {
    const onSelect = vi.fn();
    render(
      <ConversationList
        conversations={threads}
        activeId={null}
        onSelect={onSelect}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Thread one"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("calls onNew when the New chat button is clicked", () => {
    const onNew = vi.fn();
    render(
      <ConversationList
        conversations={[]}
        activeId={null}
        onSelect={vi.fn()}
        onNew={onNew}
        onDelete={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));
    expect(onNew).toHaveBeenCalled();
  });

  it("shows empty state text when there are no conversations", () => {
    render(
      <ConversationList
        conversations={[]}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no conversations yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- components/app/ConversationList.test.tsx
```

Expected: FAIL — `Cannot find module './ConversationList'`

- [ ] **Step 3: Create `components/app/ConversationList.tsx`**

```tsx
"use client";

import { Plus, Trash2 } from "lucide-react";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

type Props = {
  conversations: ConversationItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col gap-1 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)]">
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-[var(--text-muted)]">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            return (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={[
                    "flex w-full flex-col gap-0.5 rounded-[var(--radius)] px-3 py-2.5 text-left transition",
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  <span className="line-clamp-2 text-sm font-medium leading-snug pr-5">
                    {conv.title}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-[var(--text-muted)] opacity-0 transition hover:bg-[var(--surface-hover)] hover:text-[rgb(239,68,68)] group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- components/app/ConversationList.test.tsx
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/app/ConversationList.tsx components/app/ConversationList.test.tsx
git commit -m "feat: add ConversationList component with thread panel UI"
```

---

## Task 8: Wire Up the Chatbot Page

**Files:**
- Modify: `app/(app)/english-chatbot/page.tsx`

- [ ] **Step 1: Replace `app/(app)/english-chatbot/page.tsx` with the full updated version**

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import { ConversationList } from "@/components/app/ConversationList";
import type { ConversationItem } from "@/components/app/ConversationList";
import { deriveTitle } from "@/lib/chat/derive-title";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

const SUGGESTED = [
  { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
  { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
  { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
  { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
];

const CHAT_ERROR_MESSAGE =
  "Cô Minh đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

type AssistantStreamEvent =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string };

function parseSsePayloads(chunk: string) {
  return chunk
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

export function getMessageSpacingClassName(
  currentMessage: AppChatMessage,
  previousMessage?: AppChatMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[22px]";
}

export default function EnglishChatbotPage() {
  const [messages, setMessages] = useState<AppChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversation list on mount
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json() as ConversationItem[];
        setConversations(data);
      }
    } catch {
      // non-fatal: thread list just won't show
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, error]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const removeEmptyAssistantMessage = (messageId: string) => {
    setMessages((curr) =>
      curr.filter((m) => m.id !== messageId || m.text.trim().length > 0),
    );
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setActiveConversationId(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const rows = await res.json() as Array<{
        id: string;
        role: "user" | "assistant";
        content: string;
      }>;
      setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
    } catch {
      setError("Không thể tải cuộc trò chuyện này.");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((curr) => curr.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      handleNewChat();
    }
  };

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    // Create conversation on first message
    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: deriveTitle(t) }),
        });
        if (res.ok) {
          const created = await res.json() as { id: string; title: string };
          convId = created.id;
          setActiveConversationId(convId);
          setConversations((curr) => [
            {
              id: created.id,
              title: created.title,
              updatedAt: new Date().toISOString(),
            },
            ...curr,
          ]);
        }
      } catch {
        // proceed without persistence if conversation creation fails
      }
    }

    const userMessage: AppChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: t,
    };
    const assistantMessageId = crypto.randomUUID();
    const requestMessages = [...messages, userMessage];

    setMessages([
      ...requestMessages,
      { id: assistantMessageId, role: "assistant", text: "" },
    ]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, conversationId: convId }),
      });

      if (!response.ok || !response.body) {
        throw new Error(CHAT_ERROR_MESSAGE);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let eventBoundary = buffer.indexOf("\n\n");

        while (eventBoundary !== -1) {
          const rawEvent = buffer.slice(0, eventBoundary);
          buffer = buffer.slice(eventBoundary + 2);

          for (const payload of parseSsePayloads(rawEvent)) {
            const event = JSON.parse(payload) as AssistantStreamEvent;

            if (event.type === "assistant_delta" && event.delta) {
              setMessages((curr) =>
                curr.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, text: m.text + event.delta }
                    : m,
                ),
              );
            }

            if (event.type === "assistant_error") {
              setError(event.message);
              removeEmptyAssistantMessage(assistantMessageId);
              finished = true;
            }

            if (event.type === "assistant_done") {
              // Refresh conversation list to update updatedAt ordering
              if (convId) {
                loadConversations();
              }
              finished = true;
            }
          }

          eventBoundary = buffer.indexOf("\n\n");
        }
      }
    } catch (streamError) {
      console.error("Chat page stream error:", streamError);
      setError(CHAT_ERROR_MESSAGE);
      removeEmptyAssistantMessage(assistantMessageId);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-[var(--shadow-md)]">
      {/* Thread list */}
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      {/* Chat area */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
            <AnimatePresence>
              {!hasMessages && (
                <motion.div
                  className="mx-auto my-auto flex max-w-3xl flex-col items-center text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <motion.div
                    className="relative grid size-24 place-items-center rounded-full bg-[var(--surface)] text-4xl shadow-[var(--shadow-lg)]"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                  >
                    <span>👩‍🏫</span>
                    <span className="absolute bottom-2 right-2 size-3 rounded-full bg-[var(--sage)] ring-4 ring-[var(--surface)]" />
                  </motion.div>

                  <motion.h2
                    className="mt-6 text-4xl [font-family:var(--font-display)] text-[var(--ink)]"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Xin chào! Cô Minh đây
                  </motion.h2>

                  <motion.p
                    className="mt-3 max-w-2xl text-base text-[var(--text-secondary)]"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    Hãy trả lời bằng tiếng Anh để luyện phản xạ. Cô sẽ sửa lỗi rõ
                    ràng, giải thích ngắn gọn và giữ cuộc trò chuyện tiếp tục.
                  </motion.p>

                  <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                    {SUGGESTED.map((s, i) => {
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={s.text}
                          className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                          onClick={() => send(s.text)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.08, duration: 0.35, ease: "easeOut" }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                        >
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <span className="text-sm leading-6 text-[var(--text-primary)]">
                            {s.text}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {hasMessages && (
              <div className="flex flex-col">
                {messages.map((m, index) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    className={getMessageSpacingClassName(m, messages[index - 1])}
                  />
                ))}
                {isLoading && (
                  <div className="mt-[22px]">
                    <TypingIndicator />
                  </div>
                )}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  className="mt-5 rounded-[var(--radius)] border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <p>{error}</p>
                  <button
                    className="mt-2 font-medium underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                    onClick={() => setError(null)}
                  >
                    Đóng
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-[var(--border)] bg-[rgba(255,255,255,0.72)] px-4 py-4 backdrop-blur md:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
            <div className="flex items-end gap-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200 focus-within:border-[var(--accent)] focus-within:ring-2 focus-within:ring-[var(--accent-muted)] focus-within:shadow-[var(--shadow-md)]">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Nhập câu hỏi hoặc câu trả lời bằng tiếng Anh..."
                disabled={isLoading}
                rows={1}
                className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed focus:outline-none"
              />
              <motion.button
                className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-white shadow-[var(--shadow-sm)] transition enabled:hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--border-strong)]"
                onClick={() => send()}
                disabled={!input.trim() || isLoading}
                whileTap={{ scale: 0.88 }}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Enter để gửi · Shift+Enter để xuống dòng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to verify nothing is broken**

```bash
npm run test:run
```

Expected: all existing tests + new tests pass, no regressions.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/english-chatbot/page.tsx
git commit -m "feat: add conversation thread panel to chatbot page"
```

---

## Task 9: End-to-End Smoke Test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify thread list loads**

Open `http://localhost:3000/english-chatbot`. The left panel should show "No conversations yet" and a "New chat" button.

- [ ] **Step 3: Verify new conversation is created**

Send a message. The thread list should gain a new entry with the title derived from your message.

- [ ] **Step 4: Verify messages persist across reload**

Reload the page, click the thread. Messages should load from the database.

- [ ] **Step 5: Verify delete**

Hover a thread and click the trash icon. The thread should disappear and the chat should clear.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: chat history with Drizzle ORM and named threads"
```
