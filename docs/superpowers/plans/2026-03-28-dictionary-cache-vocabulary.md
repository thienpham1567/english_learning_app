# Dictionary Cache + Vocabulary History + Saved Words — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory dictionary cache with Supabase, auto-track every user lookup, and let users bookmark words with a star icon and browse their history on a dedicated page.

**Architecture:** Two new Drizzle tables — `vocabulary_cache` (shared, JSONB) and `user_vocabulary` (per-user, upserted on every lookup) — live in the existing `lib/db/schema.ts`. The dictionary API route swaps the in-memory Map for DB reads/writes and upserts a `user_vocabulary` row when a session exists. Three new Next.js route handlers serve the vocabulary list and save toggle. The `DictionaryResultCard` receives optional `saved`/`onToggleSaved` props to show a bookmark button.

**Tech Stack:** Drizzle ORM, `drizzle-orm/pg-core` (`jsonb`, `boolean`, `uniqueIndex`), Next.js Route Handlers, React state, lucide-react (`Bookmark`, `BookmarkCheck`), Tailwind v4

---

## File Map

| Action  | Path                                             | Responsibility |
|---------|--------------------------------------------------|----------------|
| Modify  | `lib/db/schema.ts`                               | Add `vocabularyCache` + `userVocabulary` tables |
| Run     | `npm run db:generate && npm run db:migrate`      | Apply tables |
| Delete  | `lib/dictionary/cache.ts`                        | Replaced by DB |
| Delete  | `lib/dictionary/cache.test.ts`                   | No longer needed |
| Modify  | `app/api/dictionary/route.ts`                    | DB cache + user_vocabulary upsert |
| Modify  | `app/api/dictionary/route.test.ts`               | New DB mocks |
| Create  | `app/api/vocabulary/route.ts`                    | GET history list |
| Create  | `app/api/vocabulary/[query]/saved/route.ts`      | PATCH save toggle |
| Modify  | `components/dictionary/DictionaryResultCard.tsx` | Add bookmark button |
| Modify  | `app/(app)/co-lanh-dictionary/page.tsx`          | Wire `saved` state |
| Modify  | `components/app/AppSidebar.tsx`                  | Add "Từ vựng" nav item |
| Create  | `app/(app)/my-vocabulary/page.tsx`               | History + saved page |

---

## Task 1: Extend Drizzle Schema

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Replace `lib/db/schema.ts` with the extended version**

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat: add vocabulary_cache and user_vocabulary tables to schema"
```

---

## Task 2: Generate and Run Migration

**Files:**
- Create: `lib/db/migrations/` (generated)

- [ ] **Step 1: Generate migration**

```bash
npm run db:generate
```

Expected: new `.sql` file in `lib/db/migrations/` containing `CREATE TABLE vocabulary_cache`, `CREATE TABLE user_vocabulary`, and the unique index.

- [ ] **Step 2: Apply migration**

```bash
npm run db:migrate
```

Expected: migration applied with no errors.

- [ ] **Step 3: Commit migration files**

```bash
git add lib/db/migrations/
git commit -m "feat: add vocabulary_cache and user_vocabulary table migrations"
```

---

## Task 3: Replace In-Memory Cache with DB

**Files:**
- Delete: `lib/dictionary/cache.ts`
- Delete: `lib/dictionary/cache.test.ts`
- Modify: `app/api/dictionary/route.ts`
- Modify: `app/api/dictionary/route.test.ts`

- [ ] **Step 1: Delete the old cache files**

```bash
rm lib/dictionary/cache.ts lib/dictionary/cache.test.ts
```

- [ ] **Step 2: Replace `app/api/dictionary/route.ts`**

```ts
import { NextResponse } from "next/server";
import { toJSONSchema } from "zod";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vocabularyCache, userVocabulary } from "@/lib/db/schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VocabularySchema } from "@/lib/schemas/vocabulary";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";
import { buildDictionaryInstructions } from "@/lib/dictionary/prompt";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

async function upsertUserVocabulary(userId: string, query: string): Promise<boolean> {
  const [row] = await db
    .insert(userVocabulary)
    .values({ userId, query, saved: false, lookedUpAt: new Date() })
    .onConflictDoUpdate({
      target: [userVocabulary.userId, userVocabulary.query],
      set: { lookedUpAt: new Date() },
    })
    .returning({ saved: userVocabulary.saved });
  return row?.saved ?? false;
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const body = (await req.json().catch(() => null)) as { word?: unknown } | null;
    const rawQuery = typeof body?.word === "string" ? body.word : "";
    const { normalized, cacheKey } = normalizeDictionaryQuery(rawQuery);

    if (!normalized) {
      return NextResponse.json(
        { error: "Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu." },
        { status: 400 },
      );
    }

    if (!allowedQueryPattern.test(normalized)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ." },
        { status: 400 },
      );
    }

    const [hit] = await db
      .select({ data: vocabularyCache.data })
      .from(vocabularyCache)
      .where(and(eq(vocabularyCache.query, cacheKey), gt(vocabularyCache.expiresAt, new Date())))
      .limit(1);

    if (hit) {
      const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
      return NextResponse.json({ data: hit.data, cached: true, saved });
    }

    const entryType = classifyDictionaryEntry(normalized);
    const response = await openAiClient.responses.create({
      model: openAiConfig.dictionaryModel,
      instructions: buildDictionaryInstructions(entryType),
      input: normalized,
      text: {
        format: {
          type: "json_schema",
          name: "dictionary_entry",
          strict: true,
          schema: toJSONSchema(VocabularySchema),
        },
      },
    });

    const parsed = VocabularySchema.parse(JSON.parse(response.output_text));
    const expiresAt = new Date(Date.now() + openAiConfig.dictionaryCacheTtlMs);

    await db
      .insert(vocabularyCache)
      .values({ query: cacheKey, data: parsed, expiresAt })
      .onConflictDoUpdate({
        target: vocabularyCache.query,
        set: { data: parsed, expiresAt },
      });

    const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;

    return NextResponse.json({ data: parsed, cached: false, saved });
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Replace `app/api/dictionary/route.test.ts`**

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ saved: false }]),
        })),
      })),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/openai/client", () => ({
  openAiClient: {
    responses: {
      create: vi.fn(async () => ({
        output_text: JSON.stringify({
          query: "take off",
          headword: "take off",
          entryType: "phrasal_verb",
          phonetic: null,
          level: null,
          register: null,
          overviewVi: "Một cụm động từ thông dụng.",
          overviewEn: "A common phrasal verb.",
          senses: [
            {
              id: "sense-1",
              label: "Nghĩa 1",
              definitionVi: "Cất cánh",
              definitionEn: "To leave the ground and begin flying.",
              usageNoteVi: null,
              examplesVi: [
                "Máy bay cất cánh đúng giờ.",
                "Chuyến bay cất cánh lúc bình minh.",
                "Tôi nhìn qua cửa sổ khi máy bay cất cánh.",
              ],
              patterns: [],
              relatedExpressions: [],
              commonMistakesVi: [],
            },
          ],
        }),
      })),
    },
  },
}));

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;

function restoreOpenAiEnv() {
  if (originalOpenAiApiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiApiKey;
  }
}

beforeEach(() => {
  vi.resetModules();
  process.env.OPENAI_API_KEY = "test";
});

afterEach(() => {
  restoreOpenAiEnv();
  vi.resetModules();
});

describe("/api/dictionary", () => {
  it("accepts a phrasal verb query and returns data with cached:false", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data.headword", "take off");
    expect(body).toHaveProperty("cached", false);
  });

  it("rejects empty input", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects invalid characters", async () => {
    const { POST } = await import("@/app/api/dictionary/route");
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "hello@world" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run -- app/api/dictionary/route.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npm run test:run
```

Expected: all tests pass (the old `lib/dictionary/cache.test.ts` is gone, all others pass).

- [ ] **Step 6: Commit**

```bash
git add app/api/dictionary/route.ts app/api/dictionary/route.test.ts
git commit -m "feat: replace in-memory dictionary cache with Supabase DB"
```

---

## Task 4: Vocabulary List and Save Toggle API Routes

**Files:**
- Create: `app/api/vocabulary/route.ts`
- Create: `app/api/vocabulary/[query]/saved/route.ts`

- [ ] **Step 1: Create `app/api/vocabulary/route.ts`**

```ts
import { headers } from "next/headers";
import { desc, eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary, vocabularyCache } from "@/lib/db/schema";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: userVocabulary.id,
      query: userVocabulary.query,
      saved: userVocabulary.saved,
      lookedUpAt: userVocabulary.lookedUpAt,
      headword: sql<string>`${vocabularyCache.data}->>'headword'`,
      level: sql<string | null>`${vocabularyCache.data}->>'level'`,
      entryType: sql<string>`${vocabularyCache.data}->>'entryType'`,
    })
    .from(userVocabulary)
    .leftJoin(vocabularyCache, eq(userVocabulary.query, vocabularyCache.query))
    .where(eq(userVocabulary.userId, session.user.id))
    .orderBy(desc(userVocabulary.lookedUpAt));

  return Response.json(rows);
}
```

- [ ] **Step 2: Create `app/api/vocabulary/[query]/saved/route.ts`**

```ts
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userVocabulary } from "@/lib/db/schema";

type Params = Promise<{ query: string }>;

export async function PATCH(req: Request, { params }: { params: Params }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await params;
  const body = (await req.json().catch(() => null)) as { saved?: unknown } | null;

  if (typeof body?.saved !== "boolean") {
    return Response.json({ error: "saved must be a boolean" }, { status: 400 });
  }

  const [updated] = await db
    .update(userVocabulary)
    .set({ saved: body.saved })
    .where(
      and(
        eq(userVocabulary.userId, session.user.id),
        eq(userVocabulary.query, query),
      ),
    )
    .returning({ id: userVocabulary.id, query: userVocabulary.query, saved: userVocabulary.saved });

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(updated);
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/vocabulary/
git commit -m "feat: add vocabulary list and save toggle API routes"
```

---

## Task 5: Bookmark Button in DictionaryResultCard

**Files:**
- Modify: `components/dictionary/DictionaryResultCard.tsx`

- [ ] **Step 1: Replace the `DictionaryResultCard.tsx` with the version that has a bookmark button**

The only changes are: add `Bookmark` and `BookmarkCheck` to the lucide import, extend `DictionaryResultCardProps`, and add the button inside the card header.

```tsx
"use client";

import { Card, Skeleton, Tabs, Tag } from "antd";
import { Bookmark, BookmarkCheck, Search, SpellCheck2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  vocabulary: Vocabulary | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
};

const ENTRY_TYPE_LABELS: Record<Vocabulary["entryType"], string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

const SENSE_LIST_CLASS_NAME =
  "list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-primary)]";

function SensePanel({ sense }: { sense: DictionarySense }) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Ví dụ
        </h3>
        <ul className={SENSE_LIST_CLASS_NAME}>
          {sense.examplesVi.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.patterns.map((pattern) => (
              <li key={pattern}>{pattern}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.relatedExpressions.map((expr) => (
              <li key={expr}>{expr}</li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className={SENSE_LIST_CLASS_NAME}>
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </section>
      )}
    </motion.div>
  );
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
}: DictionaryResultCardProps) {
  if (isLoading) {
    return (
      <Card
        className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
        variant="borderless"
      >
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 1, width: ["45%"] }} title={false} />
          <Skeleton active paragraph={{ rows: 4 }} title={{ width: "28%" }} />
          <Skeleton active paragraph={{ rows: 3 }} title={{ width: "22%" }} />
        </div>
      </Card>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <Card
        className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
        variant="borderless"
      >
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
            {!hasSearched ? <Search size={24} /> : <SpellCheck2 size={24} />}
          </div>
          <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
            {!hasSearched
              ? "Sẵn sàng cho lần tra cứu đầu tiên"
              : "Chưa có kết quả để hiển thị"}
          </h3>
          <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
            {!hasSearched
              ? "Nhập một từ vựng ở khung bên trái để xem nghĩa, cách đọc và ghi chú ngữ pháp."
              : "Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc."}
          </p>
        </div>
      </Card>
    );
  }

  const tabItems = vocabulary.senses.map((sense) => ({
    key: sense.id,
    label: sense.label,
    children: <SensePanel sense={sense} />,
  }));

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card
          className="dictionary-card min-h-[400px] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]"
          variant="borderless"
        >
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-3xl leading-tight [font-family:var(--font-display)] text-[var(--ink)]">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="default">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag color={LEVEL_COLORS[vocabulary.level] ?? "default"} className="!rounded-full !px-3 !py-1">
                  {vocabulary.level}
                </Tag>
              )}
              {saved != null && onToggleSaved && (
                <button
                  onClick={onToggleSaved}
                  className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                  aria-label={saved ? "Bỏ lưu từ này" : "Lưu từ này"}
                >
                  {saved ? (
                    <BookmarkCheck size={18} className="text-[var(--accent)]" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          {vocabulary.phonetic && (
            <motion.p
              className="mt-4 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.p>
          )}

          <motion.div
            className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4 text-sm leading-6 text-[var(--text-secondary)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <p>{vocabulary.overviewVi}</p>
            <p>{vocabulary.overviewEn}</p>
          </motion.div>

          <Tabs
            className="mt-6 [&_.ant-tabs-nav]:mb-5 [&_.ant-tabs-tab]:rounded-full [&_.ant-tabs-tab]:px-3.5 [&_.ant-tabs-tab]:py-1.5 [&_.ant-tabs-tab]:font-medium [&_.ant-tabs-tab]:text-sm"
            items={tabItems}
            defaultActiveKey={vocabulary.senses[0]?.id}
          />
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Run existing DictionaryResultCard tests**

```bash
npm run test:run -- components/dictionary/DictionaryResultCard.test.tsx
```

Expected: all tests pass (new props are optional, existing tests unaffected).

- [ ] **Step 3: Commit**

```bash
git add components/dictionary/DictionaryResultCard.tsx
git commit -m "feat: add bookmark button to DictionaryResultCard"
```

---

## Task 6: Wire Save State in Dictionary Page

**Files:**
- Modify: `app/(app)/co-lanh-dictionary/page.tsx`

- [ ] **Step 1: Replace `app/(app)/co-lanh-dictionary/page.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";
import { message } from "antd";
import { motion } from "motion/react";

import axios from "axios";
import http from "@/lib/http";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

const QUERY_PATTERN = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export default function CoLanhDictionaryPage() {
  const [messageApi, contextHolder] = message.useMessage();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Vocabulary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const handleSearch = async () => {
    const normalizedWord = query.trim();

    if (!normalizedWord) {
      messageApi.error("Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu.");
      return;
    }

    if (!QUERY_PATTERN.test(normalizedWord)) {
      messageApi.error("Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ.");
      return;
    }

    setHasSearched(true);
    setIsLoading(true);
    setSaved(null);
    setCurrentQuery(null);
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    try {
      const { data: payload } = await http.post<{ data: Vocabulary; saved: boolean }>(
        "/dictionary",
        { word: normalizedWord },
      );

      if (requestId !== latestRequestIdRef.current) return;

      setResult(payload.data);
      setSaved(payload.saved);
      setCurrentQuery(normalizedWord.toLowerCase().trim().replace(/\s+/g, " "));
    } catch (error) {
      if (requestId !== latestRequestIdRef.current) return;

      if (axios.isAxiosError(error) && error.response?.data?.error) {
        messageApi.error(error.response.data.error);
      } else {
        messageApi.error("Đã xảy ra lỗi mạng. Vui lòng thử lại sau.");
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleToggleSaved = async () => {
    if (currentQuery === null || saved === null) return;
    const next = !saved;
    setSaved(next); // optimistic
    try {
      await fetch(`/api/vocabulary/${encodeURIComponent(currentQuery)}/saved`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
    } catch {
      setSaved(!next); // rollback
    }
  };

  return (
    <>
      {contextHolder}
      <div className="min-h-full overflow-y-auto px-8 pb-12 pt-9 max-[720px]:px-4 max-[720px]:pb-8 max-[720px]:pt-5">
        <motion.section
          className="relative mb-7 overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,243,235,0.9))] px-6 py-8 shadow-[var(--shadow-md)] md:px-8 md:py-10 max-[720px]:rounded-[var(--radius-xl)] max-[720px]:px-5 max-[720px]:py-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="relative max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Từ điển Cô Lành
            </p>
            <h1 className="mt-3 text-4xl [font-family:var(--font-display)] text-[var(--ink)]">
              Tra cứu từ vựng theo cách rõ ràng, dễ học lại
            </h1>
            <p className="mt-4 text-base text-[var(--text-secondary)]">
              Xem giải thích song ngữ, ví dụ tiếng Việt và ghi chú dùng cho từng nghĩa trong cùng một khung học tập.
            </p>
          </div>
        </motion.section>

        <section className="grid items-start gap-6 min-[1121px]:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
          >
            <DictionarySearchPanel
              value={query}
              onChange={setQuery}
              onSearch={handleSearch}
              isLoading={isLoading}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
          >
            <DictionaryResultCard
              vocabulary={result}
              hasSearched={hasSearched}
              isLoading={isLoading}
              saved={saved}
              onToggleSaved={handleToggleSaved}
            />
          </motion.div>
        </section>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Run existing dictionary page test**

```bash
npm run test:run -- app/\(app\)/co-lanh-dictionary/page.test.tsx
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/co-lanh-dictionary/page.tsx
git commit -m "feat: wire bookmark save state in dictionary page"
```

---

## Task 7: Sidebar Nav Item and My Vocabulary Page

**Files:**
- Modify: `components/app/AppSidebar.tsx`
- Create: `app/(app)/my-vocabulary/page.tsx`

- [ ] **Step 1: Add "Từ vựng" to `components/app/AppSidebar.tsx`**

Change the import line and `navItems` array only:

```ts
import { BookMarked, BookOpen, GraduationCap, MessageCircleMore } from "lucide-react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
  { href: "/my-vocabulary", label: "Từ vựng", icon: BookMarked },
];
```

- [ ] **Step 2: Run sidebar tests**

```bash
npm run test:run -- components/app/AppSidebar.test.tsx
```

Expected: passes.

- [ ] **Step 3: Create `app/(app)/my-vocabulary/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { motion } from "motion/react";

type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: string | null;
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "bg-green-100 text-green-800",
  A2: "bg-cyan-100 text-cyan-800",
  B1: "bg-blue-100 text-blue-800",
  B2: "bg-yellow-100 text-yellow-800",
  C1: "bg-orange-100 text-orange-800",
  C2: "bg-red-100 text-red-800",
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

export default function MyVocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "saved">("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vocabulary")
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggleSaved = async (entry: VocabularyEntry) => {
    const next = !entry.saved;
    setEntries((curr) =>
      curr.map((e) => (e.id === entry.id ? { ...e, saved: next } : e)),
    );
    try {
      await fetch(`/api/vocabulary/${encodeURIComponent(entry.query)}/saved`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
    } catch {
      setEntries((curr) =>
        curr.map((e) => (e.id === entry.id ? { ...e, saved: !next } : e)),
      );
    }
  };

  const visible = filter === "saved" ? entries.filter((e) => e.saved) : entries;

  return (
    <div className="min-h-full overflow-y-auto px-8 pb-12 pt-9 max-[720px]:px-4 max-[720px]:pb-8 max-[720px]:pt-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="mb-7 flex items-end justify-between gap-4 max-[560px]:flex-col max-[560px]:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Từ vựng của tôi
            </p>
            <h1 className="mt-2 text-3xl [font-family:var(--font-display)] text-[var(--ink)]">
              Lịch sử tra cứu
            </h1>
          </div>
          <div className="flex gap-2">
            {(["all", "saved"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "rounded-full px-4 py-1.5 text-sm font-medium transition",
                  filter === f
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                {f === "all" ? "Tất cả" : "Đã lưu"}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-muted)]">
            Đang tải...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
              <BookMarked size={24} />
            </div>
            <p className="text-[var(--text-secondary)]">
              {filter === "saved"
                ? "Chưa lưu từ nào. Hãy nhấn dấu ★ khi tra từ nhé!"
                : "Chưa tra từ nào. Hãy thử từ điển nhé!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visible.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-sm)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-[var(--ink)]">
                      {entry.headword ?? entry.query}
                    </span>
                    {entry.level && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[entry.level] ?? "bg-gray-100 text-gray-700"}`}>
                        {entry.level}
                      </span>
                    )}
                    {entry.entryType && (
                      <span className="rounded-full bg-[var(--bg-deep)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                        {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(entry.lookedUpAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleSaved(entry)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                  aria-label={entry.saved ? "Bỏ lưu" : "Lưu từ này"}
                >
                  {entry.saved ? (
                    <BookMarked size={17} className="text-[var(--accent)]" />
                  ) : (
                    <BookMarked size={17} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 4: Run full test suite**

```bash
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/app/AppSidebar.tsx app/\(app\)/my-vocabulary/page.tsx
git commit -m "feat: add My Vocabulary page and sidebar nav item"
```

---

## Task 8: End-to-End Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify DB cache**

Look up a word. Look up the same word again — second response should have `cached: true` in the network response body.

- [ ] **Step 3: Verify bookmark**

After lookup, click the bookmark icon. It should fill. Refresh the page and look up the same word — icon should still be filled (state persisted in DB).

- [ ] **Step 4: Verify My Vocabulary page**

Navigate to `/my-vocabulary`. The looked-up words should appear. Toggle the "Đã lưu" filter — only bookmarked words shown. Toggle a bookmark from this page — updates immediately.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: dictionary cache, vocabulary history, and saved words"
```
