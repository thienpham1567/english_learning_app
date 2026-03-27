# Cô Lành Dictionary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an app-level sidebar shell and a new `Từ điển Cô Lành` page that performs structured AI vocabulary lookup with Zod validation and Ant Design rendering, while keeping the existing English chatbot as a separate feature page.

**Architecture:** Introduce an app shell via a route-group layout, move the existing chatbot under that shell, and add a new dictionary page plus a dedicated `/api/dictionary` endpoint. The server will enforce the vocabulary schema with `generateObject`, and the client will render the validated object in a structured Ant Design interface with screenshot-inspired styling layered on top of the current warm visual system.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Ant Design, Vercel AI SDK v6, OpenAI provider, Zod

---

## File Structure

**Create**
- `app/(app)/layout.tsx` - shared app shell layout
- `app/(app)/english-chatbot/page.tsx` - chatbot page moved under the shared app shell
- `app/(app)/co-lanh-dictionary/page.tsx` - dictionary feature page
- `app/api/dictionary/route.ts` - structured dictionary API endpoint
- `components/app/AppSidebar.tsx` - left sidebar navigation
- `components/app/AppShell.tsx` - shell wrapper with responsive layout
- `components/dictionary/DictionarySearchPanel.tsx` - search form and helper card
- `components/dictionary/DictionaryResultCard.tsx` - empty, loading, and success result UI
- `lib/schemas/vocabulary.ts` - Zod schema and exported type

**Modify**
- `app/layout.tsx` - global metadata/font cleanup if needed, keep root layout minimal
- `app/page.tsx` - keep redirect behavior aimed at the shell-backed route
- `app/globals.css` - add app shell, sidebar, dictionary gradients, and responsive styles
- `package.json` - add direct `zod` dependency if not already declared

**Delete**
- `app/english-chatbot/page.tsx` - replaced by the route-group version at the same URL

**Verification**
- `npm run lint`
- `npm run build`

Note: no automated tests are included because the user explicitly asked not to add them.

### Task 1: Add the schema and structured API contract

**Files:**
- Create: `lib/schemas/vocabulary.ts`
- Create: `app/api/dictionary/route.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a direct `zod` dependency**

Update `package.json` so `zod` is a first-class dependency instead of relying on a transitive install.

```json
{
  "dependencies": {
    "zod": "^4.3.6"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: lockfile updated and install completes without errors

- [ ] **Step 3: Create the vocabulary schema**

Add `lib/schemas/vocabulary.ts`:

```ts
import { z } from "zod";

export const VocabularySchema = z.object({
  word: z.string(),
  phonetic: z.string(),
  meaning: z.string(),
  example: z.string(),
  grammar_notes: z.array(z.string()),
  level: z.enum(["Dễ", "Trung bình", "Khó"]),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
```

- [ ] **Step 4: Implement the dictionary API route**

Add `app/api/dictionary/route.ts` with strict object generation and validation:

```ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

import { VocabularySchema } from "@/lib/schemas/vocabulary";

export async function POST(request: Request) {
  try {
    const { word } = (await request.json()) as { word?: string };
    const normalizedWord = word?.trim();

    if (!normalizedWord) {
      return NextResponse.json(
        { error: "Vui long nhap mot tu vung tieng Anh." },
        { status: 400 },
      );
    }

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: VocabularySchema,
      prompt: `You are a lively dictionary named Co Minh. Analyze the word "${normalizedWord}" and return data strictly in the required JSON format.`,
    });

    return NextResponse.json({ data: result.object });
  } catch (error) {
    console.error("Dictionary API error:", error);

    return NextResponse.json(
      { error: "Khong the tra cuu tu nay luc nay. Thu lai sau." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Verify the API code compiles**

Run: `npm run lint`
Expected: no new errors from `lib/schemas/vocabulary.ts` or `app/api/dictionary/route.ts`

### Task 2: Introduce the shared app shell and sidebar navigation

**Files:**
- Create: `components/app/AppSidebar.tsx`
- Create: `components/app/AppShell.tsx`
- Create: `app/(app)/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create the sidebar component**

Add `components/app/AppSidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageCircleMore } from "lucide-react";

const items = [
  { href: "/english-chatbot", label: "English Chatbot", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Tu dien Co Lanh", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__badge">CM</div>
        <div>
          <p className="app-sidebar__eyebrow">English Learning App</p>
          <h1 className="app-sidebar__title">Co Minh Studio</h1>
        </div>
      </div>

      <nav className="app-sidebar__nav">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={active ? "app-sidebar__link is-active" : "app-sidebar__link"}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create the shell wrapper**

Add `components/app/AppShell.tsx`:

```tsx
import { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create the route-group layout**

Add `app/(app)/layout.tsx`:

```tsx
import { AppShell } from "@/components/app/AppShell";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
```

- [ ] **Step 4: Keep the root redirect simple**

Ensure `app/page.tsx` stays as:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/english-chatbot");
}
```

- [ ] **Step 5: Add global shell styles**

Extend `app/globals.css` with the shell classes:

```css
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(232, 98, 58, 0.08), transparent 28%),
    linear-gradient(180deg, #f8f4ef 0%, #f6f1eb 100%);
}

.app-sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px 18px;
  border-right: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(16px);
}

.app-shell__content {
  min-width: 0;
  min-height: 100vh;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .app-sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }
}
```

- [ ] **Step 6: Verify shell layout styling**

Run: `npm run build`
Expected: app router accepts the new route-group layout and build succeeds

### Task 3: Move the chatbot into the app shell cleanly

**Files:**
- Create: `app/(app)/english-chatbot/page.tsx`
- Delete: `app/english-chatbot/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Move the chatbot page under the shell**

Copy the current chatbot page into `app/(app)/english-chatbot/page.tsx` so it stays at `/english-chatbot` while inheriting the shared app layout.

- [ ] **Step 2: Remove full-viewport assumptions**

Update `app/(app)/english-chatbot/page.tsx` so the outer container uses shell-friendly sizing:

```tsx
<div
  style={{
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "transparent",
  }}
>
```

Replace the message area flex section with:

```tsx
<div
  style={{
    flex: 1,
    overflowY: "auto",
    padding: "24px 20px",
    display: "flex",
    flexDirection: "column",
  }}
>
```

- [ ] **Step 3: Preserve existing chatbot behavior**

Do not replace the current tutor flow, typing indicator, or persona. Only make layout adjustments required for the shared shell.

- [ ] **Step 4: Delete the old route file**

Remove `app/english-chatbot/page.tsx` after the moved version is in place so there is only one route definition for `/english-chatbot`.

- [ ] **Step 5: Verify the chatbot still renders under the shell**

Run: `npm run build`
Expected: `/english-chatbot` still appears in the route list and compiles successfully

### Task 4: Build the dictionary page and structured UI

**Files:**
- Create: `components/dictionary/DictionarySearchPanel.tsx`
- Create: `components/dictionary/DictionaryResultCard.tsx`
- Create: `app/(app)/co-lanh-dictionary/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Create the search panel**

Add `components/dictionary/DictionarySearchPanel.tsx`:

```tsx
import { Button, Card, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

type DictionarySearchPanelProps = {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function DictionarySearchPanel({
  value,
  loading,
  onChange,
  onSubmit,
}: DictionarySearchPanelProps) {
  return (
    <Card className="dictionary-search-card" bordered={false}>
      <div className="dictionary-search-card__header">
        <h2>Tra cuu tu vung</h2>
        <p>Nhap mot tu tieng Anh de xem nghia va giai thich chi tiet.</p>
      </div>

      <div className="dictionary-search-card__controls">
        <Input
          size="large"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPressEnter={onSubmit}
          placeholder="learn"
          disabled={loading}
        />
        <Button
          type="primary"
          size="large"
          icon={<SearchOutlined />}
          onClick={onSubmit}
          loading={loading}
        >
          Tra cuu
        </Button>
      </div>

      <Card className="dictionary-search-card__tips" bordered={false}>
        <strong>Meo su dung:</strong>
        <ul>
          <li>Chi nhap mot tu vung tieng Anh.</li>
          <li>Xem nghia, vi du va ghi chu ngu phap.</li>
        </ul>
      </Card>
    </Card>
  );
}
```

- [ ] **Step 2: Create the result card**

Add `components/dictionary/DictionaryResultCard.tsx`:

```tsx
import { Card, Descriptions, Skeleton, Tag } from "antd";

import { Vocabulary } from "@/lib/schemas/vocabulary";

type DictionaryResultCardProps = {
  data: Vocabulary | null;
  loading: boolean;
};

export function DictionaryResultCard({
  data,
  loading,
}: DictionaryResultCardProps) {
  if (loading) {
    return (
      <Card className="dictionary-result-card" bordered={false}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="dictionary-result-card dictionary-result-card--empty" bordered={false}>
        <h2>Tu dien Co Lanh</h2>
        <p>Nhap mot tu tieng Anh o khung ben trai de nhan giai nghia co cau truc ro rang.</p>
      </Card>
    );
  }

  return (
    <Card className="dictionary-result-card" bordered={false}>
      <div className="dictionary-result-card__hero">
        <div>
          <h2>{data.word}</h2>
          <p>{data.phonetic}</p>
        </div>
        <Tag color="orange">{data.level}</Tag>
      </div>

      <Descriptions column={1} className="dictionary-result-card__descriptions">
        <Descriptions.Item label="Nghia">{data.meaning}</Descriptions.Item>
        <Descriptions.Item label="Vi du">{data.example}</Descriptions.Item>
        <Descriptions.Item label="Ghi chu ngu phap">
          <ul className="dictionary-result-card__notes">
            {data.grammar_notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
```

- [ ] **Step 3: Create the dictionary page container**

Add `app/(app)/co-lanh-dictionary/page.tsx`:

```tsx
"use client";

import { message } from "antd";
import { useState } from "react";

import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";
import { Vocabulary } from "@/lib/schemas/vocabulary";

export default function CoLanhDictionaryPage() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Vocabulary | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleLookup = async () => {
    const normalizedWord = word.trim();

    if (!normalizedWord) {
      messageApi.error("Vui long nhap mot tu tieng Anh.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: normalizedWord }),
      });

      const payload = (await response.json()) as {
        data?: Vocabulary;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Khong tim thay dinh nghia phu hop.");
      }

      setResult(payload.data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Khong the tra cuu tu nay.";
      messageApi.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <section className="dictionary-page">
        <header className="dictionary-page__hero">
          <p className="dictionary-page__eyebrow">AI Dictionary</p>
          <h1>Tu dien Co Lanh</h1>
          <p>
            Tra cuu tu vung bang du lieu co cau truc ro rang, de doc, de hoc, de nho.
          </p>
        </header>

        <div className="dictionary-page__grid">
          <DictionarySearchPanel
            value={word}
            loading={loading}
            onChange={setWord}
            onSubmit={handleLookup}
          />
          <DictionaryResultCard data={result} loading={loading} />
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: Add dictionary-specific styles**

Extend `app/globals.css` with classes for:

```css
.dictionary-page {
  padding: 40px 28px 32px;
}

.dictionary-page__hero {
  padding: 28px 32px;
  border-radius: 32px;
  background:
    radial-gradient(circle at top center, rgba(232, 98, 58, 0.12), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(247, 244, 239, 0.92));
  border: 1px solid rgba(232, 98, 58, 0.12);
}

.dictionary-page__grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.dictionary-result-card,
.dictionary-search-card {
  border-radius: 28px;
  box-shadow: 0 18px 48px rgba(94, 66, 40, 0.08);
}
```

- [ ] **Step 5: Verify the dictionary UI builds**

Run: `npm run lint`
Expected: no type or lint errors in the new dictionary page and components

### Task 5: Final polish and verification

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Clear the custom-font warning if practical**

If convenient, replace the manual Google Fonts `<link>` usage in `app/layout.tsx` with `next/font/google`:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout(...) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no new errors; warnings reduced if the font cleanup was applied

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: `/english-chatbot`, `/co-lanh-dictionary`, and `/api/dictionary` appear in the final route output

- [ ] **Step 4: Manual verification**

Check these behaviors in the browser:

```text
1. Sidebar is visible and routes between both pages.
2. English Chatbot still works as before.
3. Dictionary lookup shows Skeleton while loading.
4. Successful lookup renders word, phonetic, meaning, example, grammar notes, and level tag.
5. Empty input shows Ant message error.
6. API failure shows Ant message error without crashing the page.
7. Layout remains readable on mobile width.
```
