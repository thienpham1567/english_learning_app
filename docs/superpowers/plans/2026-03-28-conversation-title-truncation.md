# Conversation Title Truncation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Truncate conversation titles in the sidebar at 40 characters with `…` and show the full title in an Ant Design Tooltip only when truncated.

**Architecture:** Single-file change to `components/app/ConversationList.tsx`. Add an exported `truncateTitle` pure function, import `Tooltip` from `antd`, replace the `line-clamp-2` title span with a conditional Tooltip wrapper. Tests are added to the existing `ConversationList.test.tsx`.

**Tech Stack:** React, Ant Design (`antd`), Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/app/__tests__/ConversationList.test.tsx` | Modify | Add tests for `truncateTitle` and truncated rendering |
| `components/app/ConversationList.tsx` | Modify | Add `truncateTitle`, `Tooltip` import, update title span |

---

### Task 1: Write failing tests for `truncateTitle`

**Files:**
- Modify: `components/app/__tests__/ConversationList.test.tsx`

- [ ] **Step 1: Add `truncateTitle` import and unit tests**

Open `components/app/__tests__/ConversationList.test.tsx`. Add the `truncateTitle` import at line 4 (alongside the existing `ConversationList` import) and add a new `describe` block at the end of the file:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList, truncateTitle } from "../ConversationList";

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

  it("renders a long title truncated with ellipsis in the sidebar", () => {
    const longTitle = "A".repeat(41); // 41 chars — over limit
    render(
      <ConversationList
        conversations={[{ id: "1", title: longTitle, updatedAt: new Date().toISOString() }]}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("A".repeat(40) + "…")).toBeInTheDocument();
    expect(screen.queryByText(longTitle)).not.toBeInTheDocument();
  });

  it("renders a short title without truncation", () => {
    const shortTitle = "Short title"; // under 40 chars
    render(
      <ConversationList
        conversations={[{ id: "1", title: shortTitle, updatedAt: new Date().toISOString() }]}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(shortTitle)).toBeInTheDocument();
  });

  it("renders a title of exactly 40 chars without truncation", () => {
    const exactTitle = "B".repeat(40); // exactly at limit — should NOT truncate
    render(
      <ConversationList
        conversations={[{ id: "1", title: exactTitle, updatedAt: new Date().toISOString() }]}
        activeId={null}
        onSelect={vi.fn()}
        onNew={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(exactTitle)).toBeInTheDocument();
    expect(screen.queryByText("B".repeat(40) + "…")).not.toBeInTheDocument();
  });
});

describe("truncateTitle", () => {
  it("returns truncated text and truncated=true when title exceeds 40 chars", () => {
    const result = truncateTitle("A".repeat(41));
    expect(result.text).toBe("A".repeat(40) + "…");
    expect(result.truncated).toBe(true);
  });

  it("returns full text and truncated=false when title is exactly 40 chars", () => {
    const result = truncateTitle("A".repeat(40));
    expect(result.text).toBe("A".repeat(40));
    expect(result.truncated).toBe(false);
  });

  it("returns full text and truncated=false when title is under 40 chars", () => {
    const result = truncateTitle("Hello");
    expect(result.text).toBe("Hello");
    expect(result.truncated).toBe(false);
  });

  it("respects a custom max parameter", () => {
    const result = truncateTitle("Hello world", 5);
    expect(result.text).toBe("Hello…");
    expect(result.truncated).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/ConversationList.test.tsx`

Expected: 7 failures — all new tests fail because `truncateTitle` is not exported yet and the rendering tests fail because `line-clamp-2` still shows the full title. The original 4 tests should still PASS.

- [ ] **Step 3: Commit the failing tests**

```bash
git add components/app/__tests__/ConversationList.test.tsx
git commit -m "test: add truncateTitle unit tests and truncation rendering tests"
```

---

### Task 2: Implement `truncateTitle` and update ConversationList rendering

**Files:**
- Modify: `components/app/ConversationList.tsx`

- [ ] **Step 1: Add `Tooltip` import and `truncateTitle` function**

Replace the full `components/app/ConversationList.tsx` with:

```tsx
"use client";

import { Tooltip } from "antd";
import { Plus, Trash2, GraduationCap } from "lucide-react";

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

export function truncateTitle(
  title: string,
  max = 40,
): { text: string; truncated: boolean } {
  return title.length > max
    ? { text: title.slice(0, max) + "…", truncated: true }
    : { text: title, truncated: false };
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: Props) {
  return (
    <div className="relative flex h-full w-[220px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-(--ink)">
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Header identity row */}
      <div className="relative px-4 pt-5 pb-3">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-(--accent-light) text-(--accent)">
            <GraduationCap size={13} strokeWidth={2} />
          </div>
          <span className="text-sm italic text-white/80 [font-family:var(--font-display)]">
            Cô Minh
          </span>
        </div>
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-(--radius) border border-white/15 px-3 py-2 text-sm font-medium text-white/70 transition hover:bg-white/8 hover:text-white/90"
        >
          <Plus size={15} strokeWidth={2} />
          New chat
        </button>
      </div>

      <div className="relative flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-xs text-white/30">
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const { text, truncated } = truncateTitle(conv.title);
            const titleSpan = (
              <span className="pr-5 text-sm font-medium leading-snug">
                {text}
              </span>
            );
            return (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={[
                    "flex w-full flex-col gap-0.5 rounded-(--radius) border-l-2 px-3 py-2.5 text-left transition",
                    isActive
                      ? "border-(--accent) bg-white/6 text-white/90"
                      : "border-transparent text-white/65 hover:bg-white/5 hover:text-white/80",
                  ].join(" ")}
                >
                  {truncated ? (
                    <Tooltip title={conv.title}>{titleSpan}</Tooltip>
                  ) : (
                    titleSpan
                  )}
                  <span className="text-[11px] text-white/30">
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-white/30 opacity-0 transition hover:bg-white/8 hover:text-red-400 group-hover:opacity-100"
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

- [ ] **Step 2: Run tests to verify all pass**

Run: `npx vitest run components/app/__tests__/ConversationList.test.tsx`

Expected: all 11 tests PASS.

- [ ] **Step 3: Run full test suite to check for regressions**

Run: `npx vitest run`

Expected: same pass/fail count as before (88/89 — the pre-existing AppShell failure remains, nothing new breaks).

- [ ] **Step 4: Commit**

```bash
git add components/app/ConversationList.tsx
git commit -m "feat: truncate conversation titles at 40 chars with Tooltip on hover"
```
