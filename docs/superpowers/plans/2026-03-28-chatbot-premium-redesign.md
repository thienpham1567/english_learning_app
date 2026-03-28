# Chatbot Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the English chatbot page to feel premium — dark ink sidebar, grain/glow scroll area, editorial welcome state, and a floating elevated input bar — while keeping all chat logic untouched.

**Architecture:** Pure visual rewrite across three files. `ConversationList.tsx` gets a dark `--ink` background with grain overlay and a header identity row. `ChatMessage.tsx` replaces the emoji AI avatar with an ink seal. `page.tsx` adds grain/glow overlays to the scroll container, upgrades the welcome state avatar and heading size, bumps role-switch spacing, and floats the input bar with backdrop blur.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS v4, `motion/react`, Lucide React

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/(app)/english-chatbot/__tests__/page.test.tsx` | Modify | Fix pre-existing focus-visible syntax failure; update spacing assertion for `mt-[28px]` |
| `app/(app)/english-chatbot/page.tsx` | Modify | Grain/glow overlays, welcome seal avatar, `text-5xl` heading, `mt-[28px]` spacing, floating input bar |
| `components/app/ConversationList.tsx` | Modify | Dark ink background, grain overlay, header identity row, dark item styles |
| `components/ChatMessage.tsx` | Modify | AI avatar: emoji → ink seal with GraduationCap |

---

### Task 1: Update chatbot page tests

**Files:**
- Modify: `app/(app)/english-chatbot/__tests__/page.test.tsx`

- [ ] **Step 1: Update the spacing test to expect `mt-[28px]`**

Open `app/(app)/english-chatbot/__tests__/page.test.tsx` and replace the spacing assertion:

```tsx
  it("keeps grouped spacing between same-role and role-switch messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "assistant", text: "Second assistant" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[4px]");

    expect(
      getMessageSpacingClassName(
        { id: "2", role: "user", text: "User reply" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[28px]");
  });
```

- [ ] **Step 2: Fix the pre-existing focus-visible class assertion**

In the same file, replace the `focus-visible` class check (the test currently uses Tailwind v3 `outline-[var(--accent)]` syntax but the code uses v4 `outline-(--accent)` — update the test to match the code):

```tsx
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(
      screen.getByRole("heading", { name: "Xin chào! Cô Minh đây" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I goed to school/i })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });
```

- [ ] **Step 3: Run tests to verify the spacing test now fails**

Run: `npx vitest run app/\(app\)/english-chatbot/__tests__/page.test.tsx`

Expected: 1 failure — `"keeps grouped spacing"` fails with `expected 'mt-[22px]' to equal 'mt-[28px]'`. The welcome state test should now pass.

- [ ] **Step 4: Commit the test changes**

```bash
git add app/\(app\)/english-chatbot/__tests__/page.test.tsx
git commit -m "test: update spacing assertion to mt-[28px], fix focus-visible syntax"
```

---

### Task 2: Update `getMessageSpacingClassName` — role-switch gap

**Files:**
- Modify: `app/(app)/english-chatbot/page.tsx:42-44`

- [ ] **Step 1: Update the role-switch spacing return value**

In `app/(app)/english-chatbot/page.tsx`, replace:

```tsx
export function getMessageSpacingClassName(
  currentMessage: AppChatMessage,
  previousMessage?: AppChatMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[22px]";
}
```

With:

```tsx
export function getMessageSpacingClassName(
  currentMessage: AppChatMessage,
  previousMessage?: AppChatMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[28px]";
}
```

- [ ] **Step 2: Run tests to verify spacing test now passes**

Run: `npx vitest run app/\(app\)/english-chatbot/__tests__/page.test.tsx`

Expected: both tests PASS

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/english-chatbot/page.tsx
git commit -m "style: bump role-switch message gap to mt-[28px]"
```

---

### Task 3: Rewrite `ConversationList.tsx` — dark ink sidebar

**Files:**
- Modify: `components/app/ConversationList.tsx`

- [ ] **Step 1: Replace the full file**

Write `components/app/ConversationList.tsx`:

```tsx
"use client";

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
                  <span className="line-clamp-2 pr-5 text-sm font-medium leading-snug">
                    {conv.title}
                  </span>
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

- [ ] **Step 2: Run ConversationList tests**

Run: `npx vitest run components/app/__tests__/ConversationList.test.tsx`

Expected: all 4 tests PASS (behavioral tests don't depend on styling)

- [ ] **Step 3: Commit**

```bash
git add components/app/ConversationList.tsx
git commit -m "style: dark ink sidebar for ConversationList — grain overlay, identity row, editorial items"
```

---

### Task 4: Update `ChatMessage.tsx` — AI avatar ink seal

**Files:**
- Modify: `components/ChatMessage.tsx`

- [ ] **Step 1: Add `GraduationCap` to the Lucide import**

In `components/ChatMessage.tsx`, replace:

```tsx
import { Check, Copy } from "lucide-react";
```

With:

```tsx
import { Check, Copy, GraduationCap } from "lucide-react";
```

- [ ] **Step 2: Replace the AI avatar div**

In `components/ChatMessage.tsx`, replace the AI avatar (the emoji circle before the message bubble in the non-user branch):

```tsx
      {!isUser && (
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--accent-light)] text-lg shadow-[var(--shadow-sm)]">
          👩‍🏫
        </div>
      )}
```

With:

```tsx
      {!isUser && (
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-(--ink) text-white shadow-(--shadow-sm)">
          <GraduationCap size={14} strokeWidth={2} />
        </div>
      )}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/ChatMessage.tsx
git commit -m "style: replace emoji AI avatar with ink seal GraduationCap"
```

---

### Task 5: Update `page.tsx` — overlays, welcome state, input bar

**Files:**
- Modify: `app/(app)/english-chatbot/page.tsx`

- [ ] **Step 1: Add `relative` to the scroll container and insert grain/glow overlays**

In `app/(app)/english-chatbot/page.tsx`, replace:

```tsx
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8"
        >
          <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col">
```

With:

```tsx
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 min-h-0 overflow-y-auto px-4 py-6 md:px-8"
        >
          {/* Grain overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "128px 128px",
            }}
          />
          {/* Warm radial glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(196,109,46,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col">
```

Also close the extra `</div>` at the end of the scroll container content — the existing `<div className="mx-auto ...">` already has its closing `</div>`, so add a matching close for the new `relative` wrapper before `</div>` that closes the scroll container. The structure becomes:

```
<div ref={scrollContainerRef} ...>   ← scroll container (relative)
  <div grain />
  <div glow />
  <div relative mx-auto ...>         ← content wrapper (new)
    ...existing content...
  </div>                             ← closes content wrapper
</div>                               ← closes scroll container
```

- [ ] **Step 2: Replace the welcome state avatar and heading**

In `app/(app)/english-chatbot/page.tsx`, replace the `motion.div` avatar (the emoji circle):

```tsx
                  <motion.div
                    className="relative grid size-24 place-items-center rounded-full bg-(--surface) text-4xl shadow-(--shadow-lg)"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                  >
                    <span>👩‍🏫</span>
                    <span className="absolute bottom-2 right-2 size-3 rounded-full bg-(--sage) ring-4 ring-(--surface)" />
                  </motion.div>
```

With:

```tsx
                  <motion.div
                    className="relative grid size-16 place-items-center rounded-full bg-(--ink) text-white shadow-(--shadow-lg)"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                  >
                    <GraduationCap size={22} strokeWidth={2} />
                    <span className="absolute bottom-1 right-1 size-3 rounded-full bg-(--sage) ring-2 ring-(--bg)" />
                  </motion.div>
```

Then replace the heading `motion.h2` to bump to `text-5xl`:

```tsx
                  <motion.h2
                    className="mt-6 text-5xl italic [font-family:var(--font-display)] text-(--ink)"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    Xin chào! Cô Minh đây
                  </motion.h2>
```

- [ ] **Step 3: Ensure `GraduationCap` is imported in `page.tsx`**

In `app/(app)/english-chatbot/page.tsx`, the current import is:

```tsx
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
```

Replace with:

```tsx
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb, GraduationCap } from "lucide-react";
```

- [ ] **Step 4: Float the input bar — remove border-t and add backdrop-blur**

In `app/(app)/english-chatbot/page.tsx`, replace the input bar outer container:

```tsx
        <div className="border-t border-(--border) bg-[rgba(255,255,255,0.72)] px-4 py-4 backdrop-blur md:px-8">
```

With:

```tsx
        <div className="bg-(--bg)/80 px-4 py-4 backdrop-blur-md md:px-8">
```

- [ ] **Step 5: Elevate the textarea box shadow and border radius**

In `app/(app)/english-chatbot/page.tsx`, replace the textarea wrapper div:

```tsx
            <div className="flex items-end gap-3 rounded-xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-sm) transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--accent-muted) focus-within:shadow-(--shadow-md)">
```

With:

```tsx
            <div className="flex items-end gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-md) transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--accent-muted) focus-within:shadow-(--shadow-lg)">
```

- [ ] **Step 6: Run all tests**

Run: `npx vitest run`

Expected: the 5 sign-in tests pass, the 2 chatbot page tests pass, all ConversationList tests pass. The pre-existing AppShell and EnglishChatbot focus-visible failures (from other files on master) are unrelated to this task.

Confirm: `app/(app)/english-chatbot/__tests__/page.test.tsx` shows 2 passed.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/english-chatbot/page.tsx
git commit -m "feat: premium chatbot — grain/glow scroll area, ink seal welcome state, floating input bar"
```
