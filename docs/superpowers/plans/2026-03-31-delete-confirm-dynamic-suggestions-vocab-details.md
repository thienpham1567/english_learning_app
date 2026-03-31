# Delete Confirmation, Dynamic Suggestions & Vocabulary View Details — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline delete confirmation to conversation list, make chat suggestions dynamic per persona, and add a "View Details" dictionary link in the vocabulary detail sheet.

**Architecture:** Three independent, small features touching separate files. Feature 1 adds confirmation state to ConversationList. Feature 2 adds a `suggestions` field to each Persona and wires it into ChatWindow with random sampling. Feature 3 adds a navigation button to VocabularyDetailSheet.

**Tech Stack:** React, Next.js, TypeScript, Vitest, Lucide icons, Framer Motion

---

### File Map

| Feature | Create | Modify | Test |
|---------|--------|--------|------|
| 1. Delete Confirmation | — | `components/app/ConversationList.tsx` | `components/app/__tests__/ConversationList.test.tsx` |
| 2. Dynamic Suggestions | — | `lib/chat/personas.ts`, `components/app/ChatWindow.tsx` | `test/components/ChatWindow-suggestions.test.tsx` |
| 3. View Details Link | — | `components/app/VocabularyDetailSheet.tsx` | `components/app/__tests__/VocabularyDetailSheet.test.tsx` |

---

### Task 1: Inline Delete Confirmation (ConversationList)

**Files:**
- Modify: `components/app/ConversationList.tsx`
- Modify: `components/app/__tests__/ConversationList.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add these tests to `components/app/__tests__/ConversationList.test.tsx`:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ConversationList, truncateTitle } from "../ConversationList";

// (keep existing mocks for next/navigation, ChatConversationProvider)

// Add to existing describe("ConversationList"):

  it("shows inline confirmation when delete button is clicked", () => {
    render(<ConversationList activeId={null} />);
    const deleteButtons = screen.getAllByLabelText("Delete conversation");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm delete")).toBeInTheDocument();
    expect(screen.getByLabelText("Cancel delete")).toBeInTheDocument();
  });

  it("calls deleteConversation when confirm is clicked", () => {
    render(<ConversationList activeId={null} />);
    fireEvent.click(screen.getAllByLabelText("Delete conversation")[0]);
    fireEvent.click(screen.getByLabelText("Confirm delete"));
    expect(mockDeleteConversation).toHaveBeenCalledWith("1");
  });

  it("restores row when cancel is clicked", () => {
    render(<ConversationList activeId={null} />);
    fireEvent.click(screen.getAllByLabelText("Delete conversation")[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Cancel delete"));
    expect(screen.queryByText("Xoá?")).not.toBeInTheDocument();
    expect(screen.getByText("Thread one")).toBeInTheDocument();
  });

  it("only shows confirmation on one row at a time", () => {
    render(<ConversationList activeId={null} />);
    const deleteButtons = screen.getAllByLabelText("Delete conversation");
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByText("Xoá?")).toBeInTheDocument();
    // Click delete on second row
    fireEvent.click(deleteButtons[1]);
    // Only one "Xoá?" should be visible
    expect(screen.getAllByText("Xoá?")).toHaveLength(1);
    // First row should be restored
    expect(screen.getByText("Thread one")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/ConversationList.test.tsx`
Expected: 4 new tests FAIL (cannot find "Xoá?", "Confirm delete", "Cancel delete")

- [ ] **Step 3: Implement inline confirmation in ConversationList**

In `components/app/ConversationList.tsx`:

1. Add `useState` import (already has `useCallback`):
```tsx
import { useCallback, useState } from "react";
```

2. Add imports for `Check` and `X` icons:
```tsx
import { Plus, Trash2, GraduationCap, Check, X } from "lucide-react";
```

3. Inside `ConversationList`, add state:
```tsx
const [confirmingId, setConfirmingId] = useState<string | null>(null);
```

4. Replace the existing conversation row rendering (the `return` inside `conversations.map`) — when `conv.id === confirmingId`, show the confirmation UI instead of the normal row content:

```tsx
return (
  <div key={conv.id} className="group relative">
    {conv.id === confirmingId ? (
      <div className="flex w-full items-center justify-between rounded-(--radius) border-l-2 border-red-400 bg-red-500/10 px-3 py-2.5">
        <span className="text-sm font-medium text-red-300">Xoá?</span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              deleteConversation(conv.id);
              setConfirmingId(null);
              if (conv.id === activeId) {
                router.push("/english-chatbot");
              }
            }}
            className="grid size-6 place-items-center rounded text-red-400 transition hover:bg-white/10"
            aria-label="Confirm delete"
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => setConfirmingId(null)}
            className="grid size-6 place-items-center rounded text-white/50 transition hover:bg-white/10"
            aria-label="Cancel delete"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    ) : (
      <>
        <Link
          href={`/english-chatbot/${conv.id}`}
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
        </Link>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirmingId(conv.id);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded text-white/30 opacity-0 transition hover:bg-white/8 hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete conversation"
        >
          <Trash2 size={13} />
        </button>
      </>
    )}
  </div>
);
```

Key changes from the original:
- The trash button now calls `setConfirmingId(conv.id)` instead of directly deleting.
- When confirming, the row shows "Xoá?" with Check/X buttons.
- Clicking delete on another row automatically replaces the previous confirmation (only one `confirmingId` at a time).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/app/__tests__/ConversationList.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/app/ConversationList.tsx components/app/__tests__/ConversationList.test.tsx
git commit -m "feat: add inline delete confirmation to conversation list"
```

---

### Task 2: Add Suggestions to Persona Type and Data

**Files:**
- Modify: `lib/chat/personas.ts`

- [ ] **Step 1: Add `suggestions` field to the `Persona` type and populate each persona**

In `lib/chat/personas.ts`:

1. Add Lucide imports at the top:
```tsx
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

import { SimonAvatar } from "@/components/app/persona-avatars/SimonAvatar";
import { ChristineAvatar } from "@/components/app/persona-avatars/ChristineAvatar";
import { EddieAvatar } from "@/components/app/persona-avatars/EddieAvatar";
```

2. Update the `Persona` type to add `suggestions`:
```tsx
export type Persona = {
  id: string;
  label: string;
  avatar: ComponentType<{ size?: number }>;
  buildInstructions: (input: PersonaInstructionInput) => string;
  suggestions: readonly { text: string; icon: ComponentType<LucideProps> }[];
};
```

3. Add suggestions to each persona in the `PERSONAS` array. The icons will be imported in ChatWindow where they're rendered, so use a lazy approach — store icon names and resolve them at render time. Actually, since `personas.ts` is not a client component and Lucide icons are just components, import them directly:

Add at the top of `lib/chat/personas.ts`:
```tsx
import {
  BookOpen,
  Sparkles,
  MessageCircle,
  Lightbulb,
  PenLine,
  ListChecks,
  FileText,
  GraduationCap,
  BriefcaseBusiness,
  Mail,
  Headphones,
  BarChart3,
} from "lucide-react";
```

4. Add `suggestions` to Simon:
```tsx
suggestions: [
  { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
  { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
  { text: "'Break a leg' nghĩa là gì vậy?", icon: Lightbulb },
  { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
  { text: "Sự khác nhau giữa 'fun' và 'funny' là gì?", icon: Lightbulb },
  { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
  { text: "Dạy mình cách chào hỏi tự nhiên như người bản xứ.", icon: MessageCircle },
  { text: "Cho mình 5 phrasal verb thông dụng nhất nhé.", icon: ListChecks },
],
```

5. Add `suggestions` to Christine:
```tsx
suggestions: [
  { text: "Chấm đoạn Writing Task 2 này theo tiêu chí IELTS.", icon: PenLine },
  { text: "Cho mình từ vựng học thuật thay cho 'very good'.", icon: BookOpen },
  { text: "Viết lại câu này cho giống band 7+.", icon: Sparkles },
  { text: "Luyện Speaking Part 2: Describe a memorable trip.", icon: MessageCircle },
  { text: "Giải thích cách dùng 'Although' và 'Despite'.", icon: Lightbulb },
  { text: "Cho mình cấu trúc mở bài Writing Task 1.", icon: FileText },
  { text: "Mình cần cải thiện Coherence & Cohesion, bắt đầu từ đâu?", icon: GraduationCap },
  { text: "Chữa lỗi ngữ pháp phổ biến band 5-6 giúp mình.", icon: ListChecks },
],
```

6. Add `suggestions` to Eddie:
```tsx
suggestions: [
  { text: "Viết email xin nghỉ phép bằng tiếng Anh.", icon: Mail },
  { text: "Cho mình một bài luyện TOEIC Part 5.", icon: ListChecks },
  { text: "Giải thích từ vựng kinh doanh: revenue vs. profit.", icon: BriefcaseBusiness },
  { text: "Luyện nghe: tóm tắt đoạn hội thoại văn phòng.", icon: Headphones },
  { text: "Viết báo cáo ngắn bằng tiếng Anh về doanh số tháng.", icon: BarChart3 },
  { text: "Dạy mình cách trình bày ý kiến trong cuộc họp.", icon: MessageCircle },
  { text: "Cho mình mẫu email follow-up sau cuộc họp.", icon: Mail },
  { text: "Phân biệt 'make' và 'do' trong ngữ cảnh công việc.", icon: Lightbulb },
],
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit 2>&1 | grep personas`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/chat/personas.ts
git commit -m "feat: add suggestion pools to each persona"
```

---

### Task 3: Wire Dynamic Suggestions into ChatWindow

**Files:**
- Modify: `components/app/ChatWindow.tsx`
- Create: `test/components/ChatWindow-suggestions.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `test/components/ChatWindow-suggestions.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { PERSONAS } from "@/lib/chat/personas";
import { sampleSuggestions } from "@/components/app/ChatWindow";

describe("sampleSuggestions", () => {
  it("returns exactly `count` items", () => {
    const result = sampleSuggestions(PERSONAS[0], 4);
    expect(result).toHaveLength(4);
  });

  it("returns items from the persona's suggestions pool", () => {
    const persona = PERSONAS[0];
    const result = sampleSuggestions(persona, 4);
    for (const item of result) {
      expect(persona.suggestions.some((s) => s.text === item.text)).toBe(true);
    }
  });

  it("returns all items when count >= pool size", () => {
    const persona = PERSONAS[0];
    const result = sampleSuggestions(persona, persona.suggestions.length + 5);
    expect(result).toHaveLength(persona.suggestions.length);
  });

  it("returns no duplicates", () => {
    const result = sampleSuggestions(PERSONAS[0], 4);
    const texts = result.map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/ChatWindow-suggestions.test.tsx`
Expected: FAIL — `sampleSuggestions` is not exported from ChatWindow

- [ ] **Step 3: Implement sampleSuggestions and wire it into ChatWindow**

In `components/app/ChatWindow.tsx`:

1. Remove the hardcoded `SUGGESTED` constant (lines 27-32) and the unused icon imports (`BookOpen`, `Sparkles`, `MessageCircle`, `Lightbulb`):

Replace the imports:
```tsx
import {
  ArrowDown,
  ArrowUp,
} from "lucide-react";
```

2. Add the `useMemo` import — update the existing import line:
```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
```

3. Add and export the `sampleSuggestions` function (place it before the `ChatWindow` component):
```tsx
export function sampleSuggestions(
  persona: Persona,
  count: number,
): typeof persona.suggestions[number][] {
  const pool = [...persona.suggestions];
  const n = Math.min(count, pool.length);
  // Fisher-Yates shuffle (partial)
  for (let i = pool.length - 1; i > pool.length - n - 1 && i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(pool.length - n);
}
```

4. Add `Persona` type import:
```tsx
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { Persona } from "@/lib/chat/personas";
```

5. Inside `ChatWindow`, add a memoized sample that re-shuffles only when persona changes:
```tsx
const suggestions = useMemo(
  () => sampleSuggestions(activePersona, 4),
  [activePersona],
);
```

6. In the JSX, replace `SUGGESTED.map((s, i) => {` with `suggestions.map((s, i) => {` — the rest of the rendering stays the same (it already uses `s.icon` and `s.text`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/components/ChatWindow-suggestions.test.tsx`
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/app/ChatWindow.tsx test/components/ChatWindow-suggestions.test.tsx
git commit -m "feat: dynamic suggestions per persona in ChatWindow"
```

---

### Task 4: "View Details" Button in VocabularyDetailSheet

**Files:**
- Modify: `components/app/VocabularyDetailSheet.tsx`
- Modify: `components/app/__tests__/VocabularyDetailSheet.test.tsx`

- [ ] **Step 1: Write the failing test**

Add to `components/app/__tests__/VocabularyDetailSheet.test.tsx`:

```tsx
// Add at top with other mocks:
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Add inside describe("VocabularyDetailSheet"):

  it("renders 'Tra cứu trong từ điển' button when data is loaded", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("take off")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Tra cứu trong từ điển")).toBeInTheDocument();
  });

  it("navigates to dictionary page when 'Tra cứu trong từ điển' is clicked", async () => {
    vi.mocked(http.get).mockResolvedValueOnce({ data: mockVocab });
    render(
      <VocabularyDetailSheet
        query="take off"
        onClose={vi.fn()}
        saved={false}
        onToggleSaved={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("take off")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Tra cứu trong từ điển"));
    expect(mockPush).toHaveBeenCalledWith("/dictionary?q=take%20off");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/VocabularyDetailSheet.test.tsx`
Expected: 2 new tests FAIL

- [ ] **Step 3: Implement the "View Details" button**

In `components/app/VocabularyDetailSheet.tsx`:

1. Add `useRouter` import:
```tsx
import { useRouter } from "next/navigation";
```

2. Inside the `VocabularyDetailSheet` function, add:
```tsx
const router = useRouter();
```

3. In the sticky header bar (the `<div className="sticky top-0 ...">` element), add a button between the save button and the close button:
```tsx
<button
  onClick={() => router.push(`/dictionary?q=${encodeURIComponent(query ?? "")}`)}
  className="flex items-center gap-1.5 text-sm text-(--text-secondary) transition hover:text-(--accent)"
  aria-label="Tra cứu trong từ điển"
>
  <ExternalLink size={16} />
  Tra cứu
</button>
```

Note: `ExternalLink` is already imported in the file.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/app/__tests__/VocabularyDetailSheet.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add components/app/VocabularyDetailSheet.tsx components/app/__tests__/VocabularyDetailSheet.test.tsx
git commit -m "feat: add dictionary lookup button in vocabulary detail sheet"
```
