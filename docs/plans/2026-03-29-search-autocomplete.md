# Search Autocomplete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add search autocomplete to the dictionary search panel — debounced suggestions from the vocabulary cache, keyboard navigation, and query prefix highlighting.

**Architecture:** Two-part change: a new GET route that queries `vocabularyCache` for prefix matches, and UI changes inside `DictionarySearchPanel` that debounce fetches, render a dropdown, and handle keyboard navigation. No new files beyond the route — autocomplete state lives directly in the existing panel component.

**Tech Stack:** Next.js App Router, Drizzle ORM (ilike/desc), React hooks (useState/useEffect/useRef), Vitest + Testing Library, global fetch

---

## Files

- Create: `app/api/dictionary/suggestions/route.ts`
- Create: `app/api/dictionary/suggestions/__tests__/route.test.ts`
- Modify: `components/dictionary/DictionarySearchPanel.tsx`
- Modify: `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`

---

### Task 1: Suggestions API route

**Files:**
- Create: `app/api/dictionary/suggestions/route.ts`
- Create: `app/api/dictionary/suggestions/__tests__/route.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `app/api/dictionary/suggestions/__tests__/route.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
    })),
  },
}));

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/dictionary/suggestions", () => {
  it("returns empty suggestions for query shorter than 2 chars", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=t"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns empty suggestions for invalid pattern", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=he@llo"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });

  it("returns matching suggestions from vocabularyCache", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              { query: "take off" },
              { query: "take on" },
            ]),
          })),
        })),
      })),
    } as ReturnType<typeof db.select>);

    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions?q=take"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: ["take off", "take on"] });
  });

  it("returns empty suggestions when no q param is provided", async () => {
    const { GET } = await import("@/app/api/dictionary/suggestions/route");
    const response = await GET(
      new Request("http://localhost/api/dictionary/suggestions"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ suggestions: [] });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run app/api/dictionary/suggestions/__tests__/route.test.ts
```

Expected: all 4 tests fail (module not found).

- [ ] **Step 3: Implement the suggestions route**

Create `app/api/dictionary/suggestions/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { ilike, desc } from "drizzle-orm";

import { db } from "@/lib/db";
import { vocabularyCache } from "@/lib/db/schema";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q") ?? "";
  const q = raw.trim().toLowerCase();

  if (q.length < 2 || !allowedQueryPattern.test(q)) {
    return NextResponse.json({ suggestions: [] });
  }

  const rows = await db
    .select({ query: vocabularyCache.query })
    .from(vocabularyCache)
    .where(ilike(vocabularyCache.query, `${q}%`))
    .orderBy(desc(vocabularyCache.expiresAt))
    .limit(6);

  return NextResponse.json({ suggestions: rows.map((r) => r.query) });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run app/api/dictionary/suggestions/__tests__/route.test.ts
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/dictionary/suggestions/route.ts app/api/dictionary/suggestions/__tests__/route.test.ts
git commit -m "feat: add GET /api/dictionary/suggestions for autocomplete"
```

---

### Task 2: Autocomplete UI in DictionarySearchPanel

**Files:**
- Modify: `components/dictionary/DictionarySearchPanel.tsx`
- Modify: `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add these tests to `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`:

```typescript
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
// replace the existing vitest import to add: afterEach
import { afterEach, describe, expect, it, vi } from "vitest";

// Add this block after the existing describe block's closing brace — or
// as additional it() calls inside the existing describe block:

it("shows autocomplete suggestions after debounce when value has 2+ chars", async () => {
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ suggestions: ["take off", "take on"] }),
  } as Response);

  const { getByPlaceholderText, getByText } = renderUi(
    <DictionarySearchPanel
      value="ta"
      onChange={() => {}}
      onSearch={() => {}}
      isLoading={false}
    />,
  );

  await act(async () => {
    vi.advanceTimersByTime(250);
  });

  await waitFor(() => {
    expect(getByText("take off")).toBeInTheDocument();
    expect(getByText("take on")).toBeInTheDocument();
  });

  vi.useRealTimers();
});

it("calls onChange and onSearch when a suggestion is clicked", async () => {
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ suggestions: ["take off"] }),
  } as Response);

  const onChange = vi.fn();
  const onSearch = vi.fn();

  renderUi(
    <DictionarySearchPanel
      value="ta"
      onChange={onChange}
      onSearch={onSearch}
      isLoading={false}
    />,
  );

  await act(async () => {
    vi.advanceTimersByTime(250);
  });

  await waitFor(() => screen.getByText("take off"));
  fireEvent.mouseDown(screen.getByText("take off"));

  expect(onChange).toHaveBeenCalledWith("take off");
  expect(onSearch).toHaveBeenCalled();

  vi.useRealTimers();
});

it("ArrowDown highlights the first suggestion", async () => {
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ suggestions: ["take off", "take on"] }),
  } as Response);

  const { getByPlaceholderText } = renderUi(
    <DictionarySearchPanel
      value="ta"
      onChange={() => {}}
      onSearch={() => {}}
      isLoading={false}
    />,
  );

  await act(async () => { vi.advanceTimersByTime(250); });
  await waitFor(() => screen.getByText("take off"));

  fireEvent.keyDown(getByPlaceholderText("Ví dụ: take off"), { key: "ArrowDown" });

  expect(screen.getByRole("option", { name: "take off" })).toHaveAttribute("aria-selected", "true");

  vi.useRealTimers();
});

it("Escape clears suggestions", async () => {
  vi.useFakeTimers();
  global.fetch = vi.fn().mockResolvedValue({
    json: async () => ({ suggestions: ["take off"] }),
  } as Response);

  const { getByPlaceholderText, queryByText } = renderUi(
    <DictionarySearchPanel
      value="ta"
      onChange={() => {}}
      onSearch={() => {}}
      isLoading={false}
    />,
  );

  await act(async () => { vi.advanceTimersByTime(250); });
  await waitFor(() => screen.getByText("take off"));

  fireEvent.keyDown(getByPlaceholderText("Ví dụ: take off"), { key: "Escape" });

  expect(queryByText("take off")).not.toBeInTheDocument();

  vi.useRealTimers();
});

it("does not fetch suggestions when value is less than 2 chars", async () => {
  vi.useFakeTimers();
  global.fetch = vi.fn();

  renderUi(
    <DictionarySearchPanel
      value="t"
      onChange={() => {}}
      onSearch={() => {}}
      isLoading={false}
    />,
  );

  await act(async () => { vi.advanceTimersByTime(250); });

  expect(global.fetch).not.toHaveBeenCalled();

  vi.useRealTimers();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run components/dictionary/__tests__/DictionarySearchPanel.test.tsx
```

Expected: 5 new tests fail (autocomplete features not yet implemented).

- [ ] **Step 3: Implement autocomplete in DictionarySearchPanel**

Replace the full content of `components/dictionary/DictionarySearchPanel.tsx`:

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
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

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  if (!query || !lowerText.startsWith(lowerQuery)) {
    return <span>{text}</span>;
  }
  return (
    <span>
      <strong>{text.slice(0, query.length)}</strong>
      {text.slice(query.length)}
    </span>
  );
}

export function DictionarySearchPanel({
  value,
  onChange,
  onSearch,
  isLoading,
}: DictionarySearchPanelProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    if (value.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/dictionary/suggestions?q=${encodeURIComponent(value)}`,
        );
        const data = (await res.json()) as { suggestions: string[] };
        setSuggestions(data.suggestions ?? []);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value]);

  // Outside click dismiss
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        onChange(suggestions[highlightedIndex]);
        setSuggestions([]);
        setHighlightedIndex(-1);
        onSearch();
      } else if (!isLoading) {
        onSearch();
      }
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }

  function selectSuggestion(s: string) {
    onChange(s);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onSearch();
  }

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

        <div ref={containerRef} className="relative mt-5">
          <input
            type="text"
            className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
            placeholder="Ví dụ: take off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Nhập từ cần tra cứu"
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={80}
            autoComplete="off"
          />

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-(--border) bg-[var(--surface)] shadow-[var(--shadow-lg)]"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(s);
                  }}
                  className={[
                    "cursor-pointer px-4 py-2.5 text-sm text-[var(--text-primary)] transition",
                    i === highlightedIndex
                      ? "bg-[var(--surface-hover)]"
                      : "hover:bg-[var(--surface-hover)]",
                  ].join(" ")}
                >
                  <HighlightMatch text={s} query={value} />
                </li>
              ))}
            </ul>
          )}
        </div>

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

- [ ] **Step 4: Run all DictionarySearchPanel tests**

```bash
npx vitest run components/dictionary/__tests__/DictionarySearchPanel.test.tsx
```

Expected: all 9 tests pass (4 existing + 5 new).

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/dictionary/DictionarySearchPanel.tsx components/dictionary/__tests__/DictionarySearchPanel.test.tsx
git commit -m "feat: add search autocomplete with keyboard navigation and query highlighting"
```
