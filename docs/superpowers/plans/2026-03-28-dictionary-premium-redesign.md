# Dictionary Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace antd Card wrappers, antd Input/Button/Tabs in the dictionary search panel and result card with premium native elements — bottom-border input, full-width amber pill button, left-border tips, custom tab pill-switcher, elevated shadows, and display-font headword.

**Architecture:** Two component files are changed in isolation (`DictionarySearchPanel.tsx`, `DictionaryResultCard.tsx`). Tests are rewritten first (TDD). The page layout and hero banner are untouched. Both components keep identical props interfaces.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, motion/react, antd v6 (Tag only in result card), vitest + @testing-library/react

---

## File Map

| File | Action |
|---|---|
| `components/dictionary/DictionarySearchPanel.tsx` | Modify — remove antd Card/Input/Button, add native input + motion button + bordered div shell |
| `components/dictionary/DictionaryResultCard.tsx` | Modify — remove antd Card/Tabs, add plain div shells + useState tab switcher + useEffect reset |
| `components/dictionary/__tests__/DictionarySearchPanel.test.tsx` | Rewrite — 4 tests for new native elements |
| `components/dictionary/__tests__/DictionaryResultCard.test.tsx` | Rewrite — 5 tests for new div shell, pill tabs, simplified empty state |

---

## Task 1: Rewrite DictionarySearchPanel tests and implementation

**Files:**
- Modify: `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`
- Modify: `components/dictionary/DictionarySearchPanel.tsx`

### Context

`DictionarySearchPanel` currently wraps everything in two antd `Card` components and uses antd `Input` + antd `Button`. We are replacing them with:
- Plain `div` with `rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6`
- Native `<input>` with bottom-border-only styling (same as sign-in page)
- Full-width `rounded-full` amber `motion.button`
- Tips as `border-l-2 border-[rgba(196,109,46,0.3)] pl-4` list items (no background box)

The props interface (`value`, `onChange`, `onSearch`, `isLoading`) does not change.

---

- [ ] **Step 1: Rewrite the test file with 4 failing tests**

Replace the entire content of `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("renders the accent label, input placeholder, and search button", () => {
    const { getByText, getByPlaceholderText, getByRole } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toBeInTheDocument();
  });

  it("input has bottom-border-only styling and no antd card wrapper", () => {
    const { getByPlaceholderText, container } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const input = getByPlaceholderText("Ví dụ: take off");
    expect(input).toHaveClass("border-b", "bg-transparent");
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("search button is full-width rounded pill", () => {
    const { getByRole } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const button = getByRole("button", { name: "Tra cứu" });
    expect(button).toHaveClass("rounded-full", "w-full");
  });

  it("tips render as 3 list items with left-border accent styling", () => {
    const { container } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    const tips = container.querySelectorAll("li");
    expect(tips).toHaveLength(3);
    tips.forEach((tip) => {
      expect(tip).toHaveClass("border-l-2");
      expect(tip).toHaveClass("pl-4");
    });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx vitest run components/dictionary/__tests__/DictionarySearchPanel.test.tsx
```

Expected: 4 failures — the current component still has antd Card, antd Input, antd Button.

- [ ] **Step 3: Rewrite DictionarySearchPanel.tsx**

Replace the entire file content:

```tsx
"use client";

import { BookOpenText, Sparkles } from "lucide-react";
import { motion } from "motion/react";

type DictionarySearchPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  isLoading: boolean;
};

const HELPER_TIPS = [
  "Bạn có thể nhập từ đơn, collocation, phrasal verb hoặc idiom.",
  "Nhấn Enter để tra cứu nhanh mà không cần bấm nút.",
  "Mỗi nghĩa sẽ có giải thích song ngữ và ví dụ chỉ bằng tiếng Việt.",
];

export function DictionarySearchPanel({
  value,
  onChange,
  onSearch,
  isLoading,
}: DictionarySearchPanelProps) {
  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-[1121px]:sticky min-[1121px]:top-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          <Sparkles size={14} />
          <span>Tra cứu có cấu trúc</span>
        </div>

        <h2 className="mt-4 text-3xl italic [font-family:var(--font-display)] text-(--ink)">
          Nhập mục từ cần tra cứu
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
          Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
        </p>

        <input
          type="text"
          className="mt-5 w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
          placeholder="Ví dụ: take off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          disabled={isLoading}
          maxLength={80}
          autoComplete="off"
        />

        <motion.button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="mt-5 w-full rounded-full bg-(--accent) py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        >
          {isLoading ? "Đang tra cứu..." : "Tra cứu"}
        </motion.button>

        <p className="mt-4 text-sm text-[var(--text-muted)]">
          Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
          <BookOpenText size={16} />
          <span>Mẹo sử dụng</span>
        </div>
        <ul className="mt-4 space-y-3">
          {HELPER_TIPS.map((tip, i) => (
            <motion.li
              key={tip}
              className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm leading-6 text-[var(--text-secondary)]"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
            >
              {tip}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run the tests to confirm all 4 pass**

```bash
npx vitest run components/dictionary/__tests__/DictionarySearchPanel.test.tsx
```

Expected: 4/4 PASS

- [ ] **Step 5: Commit**

```bash
git add components/dictionary/__tests__/DictionarySearchPanel.test.tsx components/dictionary/DictionarySearchPanel.tsx
git commit -m "feat: redesign DictionarySearchPanel — native input, pill button, border-l tips"
```

---

## Task 2: Rewrite DictionaryResultCard tests and implementation

**Files:**
- Modify: `components/dictionary/__tests__/DictionaryResultCard.test.tsx`
- Modify: `components/dictionary/DictionaryResultCard.tsx`

### Context

`DictionaryResultCard` currently wraps loading, empty, and result states in antd `Card` and uses antd `Tabs` for the sense switcher. We are:

- Replacing all `<Card>` with `<div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">`
- Growing the headword to `text-4xl italic [font-family:var(--font-display)]`
- Wrapping phonetic in a `bg-[var(--bg-deep)] rounded px-2 py-0.5` pill
- Updating antd `Tag` entries to `variant="outlined"` (antd v6 supports this)
- Replacing antd `Tabs` with a `useState`-controlled custom pill-switcher (`<button>` row + filtered sense panel)
- Adding a `useEffect` to reset the active tab when `vocabulary.headword` changes
- Simplifying the pre-search empty state to a centered `BookOpen` icon + `"Nhập từ cần tra"` text
- In `SensePanel`: keeping the `bg-[var(--bg-deep)]` box for definition sections, converting examples/patterns/related/mistakes to `border-l-2 border-[rgba(196,109,46,0.3)] pl-4 italic` list items

The props interface and `AnimatePresence` / `motion.div` wrappers are unchanged.

---

- [ ] **Step 1: Rewrite the test file with 5 failing tests**

Replace the entire content of `components/dictionary/__tests__/DictionaryResultCard.test.tsx`:

```tsx
import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";

const singleSenseEntry = {
  query: "take off",
  headword: "take off",
  entryType: "phrasal_verb" as const,
  phonetic: "/teɪk ˈɒf/",
  level: "B1" as const,
  register: null,
  overviewVi: "Có nhiều nghĩa thông dụng trong giao tiếp.",
  overviewEn: "A common phrasal verb with multiple senses.",
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
        "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh.",
      ],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

const multiSenseEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: "/rʌn/",
  level: "A2" as const,
  register: null,
  overviewVi: "Từ nhiều nghĩa phổ biến.",
  overviewEn: "A very common word with many senses.",
  senses: [
    {
      id: "sense-1",
      label: "Nghĩa 1",
      definitionVi: "Chạy bộ",
      definitionEn: "To move fast on foot.",
      usageNoteVi: null,
      examplesVi: ["Tôi chạy mỗi sáng."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
    {
      id: "sense-2",
      label: "Nghĩa 2",
      definitionVi: "Vận hành",
      definitionEn: "To operate or manage.",
      usageNoteVi: null,
      examplesVi: ["Cô ấy điều hành công ty."],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

describe("DictionaryResultCard", () => {
  it("shows result heading, custom tab buttons, and active sense content", () => {
    const { getByText, getByRole, container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
    );

    expect(getByText("Kết quả tra cứu")).toBeInTheDocument();
    // Tab is a plain <button>, not an antd tab
    expect(getByRole("button", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
    // No antd card or tabs
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
    expect(container.querySelector(".ant-tabs")).not.toBeInTheDocument();
  });

  it("switches visible sense when a tab button is clicked", () => {
    const { getByRole, getByText, queryByText } = renderUi(
      <DictionaryResultCard vocabulary={multiSenseEntry} hasSearched isLoading={false} />,
    );

    // First sense visible by default
    expect(getByText("Chạy bộ")).toBeInTheDocument();
    expect(queryByText("Vận hành")).not.toBeInTheDocument();

    // Click second tab
    fireEvent.click(getByRole("button", { name: "Nghĩa 2" }));

    expect(getByText("Vận hành")).toBeInTheDocument();
    expect(queryByText("Chạy bộ")).not.toBeInTheDocument();
  });

  it("loading state shows animate-pulse skeleton and no antd card", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched isLoading />,
    );

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(container.querySelector(".ant-card")).not.toBeInTheDocument();
  });

  it("pre-search empty state shows simplified BookOpen icon and prompt text", () => {
    const { getByText } = renderUi(
      <DictionaryResultCard vocabulary={null} hasSearched={false} isLoading={false} />,
    );

    expect(getByText("Nhập từ cần tra")).toBeInTheDocument();
  });

  it("populated header row wraps to column on phones", () => {
    const { container } = renderUi(
      <DictionaryResultCard vocabulary={singleSenseEntry} hasSearched isLoading={false} />,
    );

    expect(
      container.querySelector(".flex.items-start.justify-between.gap-4"),
    ).toHaveClass("max-[720px]:flex-col");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx vitest run components/dictionary/__tests__/DictionaryResultCard.test.tsx
```

Expected: 5 failures — current component still has antd Card, antd Tabs, old empty state text.

- [ ] **Step 3: Rewrite DictionaryResultCard.tsx**

Replace the entire file content:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Tag } from "antd";
import { Bookmark, BookmarkCheck, BookOpen } from "lucide-react";
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

function SensePanel({ sense }: { sense: DictionarySense }) {
  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Ví dụ
        </h3>
        <ul className="space-y-2">
          {sense.examplesVi.map((example) => (
            <li
              key={example}
              className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
            >
              {example}
            </li>
          ))}
        </ul>
      </section>

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.patterns.map((pattern) => (
              <li
                key={pattern}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
                {pattern}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className="space-y-2">
            {sense.relatedExpressions.map((expr) => (
              <li
                key={expr}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
                {expr}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.commonMistakesVi.map((mistake) => (
              <li
                key={mistake}
                className="border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
              >
                {mistake}
              </li>
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
  const [activeKey, setActiveKey] = useState(vocabulary?.senses[0]?.id ?? "");

  useEffect(() => {
    if (vocabulary) setActiveKey(vocabulary.senses[0]?.id ?? "");
  }, [vocabulary?.headword]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        <div className="animate-pulse space-y-5">
          <div>
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-deep)]" />
            <div className="mt-3 h-8 w-44 rounded-lg bg-[var(--bg-deep)]" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-[var(--bg-deep)]" />
              <div className="h-6 w-9 rounded-full bg-[var(--bg-deep)]" />
            </div>
          </div>
          <div className="h-3.5 w-28 rounded bg-[var(--bg-deep)]" />
          <div className="space-y-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-3/5 rounded bg-[var(--border-strong)]" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-16 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-2/3 rounded bg-[var(--border-strong)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        {!hasSearched ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <BookOpen size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Nhập từ cần tra</p>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
              Chưa có kết quả để hiển thị
            </h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc.
            </p>
          </div>
        )}
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-4xl italic leading-tight [font-family:var(--font-display)] text-(--ink)">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="gold" variant="outlined">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag
                  color={LEVEL_COLORS[vocabulary.level] ?? "default"}
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1"
                >
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
            <motion.span
              className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.span>
          )}

          <motion.div
            className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--accent-light)] text-[var(--accent)]">VI</span>
              <p>{vocabulary.overviewVi}</p>
            </div>
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--bg)] text-[var(--text-muted)]">EN</span>
              <p>{vocabulary.overviewEn}</p>
            </div>
          </motion.div>

          <div className="mt-6">
            <div className="flex gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
              {vocabulary.senses.map((sense) => (
                <button
                  key={sense.id}
                  type="button"
                  onClick={() => setActiveKey(sense.id)}
                  className={[
                    "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                    activeKey === sense.id
                      ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
                  ].join(" ")}
                >
                  {sense.label}
                </button>
              ))}
            </div>
            {activeSense && <SensePanel sense={activeSense} />}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run the tests to confirm all 5 pass**

```bash
npx vitest run components/dictionary/__tests__/DictionaryResultCard.test.tsx
```

Expected: 5/5 PASS

- [ ] **Step 5: Run the full test suite to confirm nothing else broke**

```bash
npx vitest run
```

Expected: all tests pass (106+ passing, 0 failing). If the page-level dictionary test fails, check it — it only tests the hero section and layout grid classes so it should still pass.

- [ ] **Step 6: Commit**

```bash
git add components/dictionary/__tests__/DictionaryResultCard.test.tsx components/dictionary/DictionaryResultCard.tsx
git commit -m "feat: redesign DictionaryResultCard — div shell, display headword, pill tabs, border-l senses"
```
