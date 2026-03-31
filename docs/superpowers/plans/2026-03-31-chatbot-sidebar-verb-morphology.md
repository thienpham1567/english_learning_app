# Chatbot Sidebar Persistence & Dictionary Verb Morphology — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix chatbot sidebar flickering during navigation and add verb morphology breakdown to the dictionary.

**Architecture:** Feature 1 lifts the conversation sidebar into a shared Next.js layout at `/english-chatbot/layout.tsx` with a React context for shared state, so only the chat window re-renders on navigation. Feature 2 extends the Vocabulary Zod schema with an optional `verbForms` array, updates the AI prompt, and adds a `VerbFormsSection` UI component.

**Tech Stack:** Next.js 16 App Router, React 19, Ant Design 6, Zod 4, Vitest, Testing Library, Motion (Framer Motion), Web Speech API

---

## File Map

### Feature 1: Chatbot Sidebar Persistence

| File | Action | Responsibility |
|------|--------|----------------|
| `components/app/ChatConversationProvider.tsx` | Create | React context: conversations list, loadConversations, deleteConversation, activeConversationId |
| `app/(app)/english-chatbot/layout.tsx` | Create | Persistent layout: renders ConversationList + wraps children in provider |
| `components/app/ChatWindow.tsx` | Create | Chat area extracted from EnglishChatbotView (messages, input, streaming, skeleton) |
| `app/(app)/english-chatbot/page.tsx` | Modify | Render `<ChatWindow conversationId={null} />` |
| `app/(app)/english-chatbot/[conversationId]/page.tsx` | Modify | Render `<ChatWindow conversationId={id} />` |
| `components/app/ConversationList.tsx` | Modify | Read from context instead of props |
| `components/app/EnglishChatbotView.tsx` | Delete | Replaced by layout + ChatWindow |

### Feature 2: Dictionary Verb Morphology

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/schemas/vocabulary.ts` | Modify | Add `VerbFormSchema` and `verbForms` field |
| `lib/dictionary/prompt.ts` | Modify | Add verb forms instruction |
| `components/dictionary/VerbFormsSection.tsx` | Create | Render verb form cards with IPA + audio |
| `components/dictionary/DictionaryResultCard.tsx` | Modify | Import and render VerbFormsSection |

### Tests

| File | Action |
|------|--------|
| `test/components/ChatConversationProvider.test.tsx` | Create |
| `test/lib/schemas/vocabulary.test.ts` | Create |
| `test/components/VerbFormsSection.test.tsx` | Create |

---

## Task 1: Create ChatConversationProvider Context

**Files:**
- Create: `components/app/ChatConversationProvider.tsx`
- Test: `test/components/ChatConversationProvider.test.tsx`

- [ ] **Step 1: Write the failing test for the context provider**

Create `test/components/ChatConversationProvider.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ChatConversationProvider,
  useChatConversations,
} from "@/components/app/ChatConversationProvider";

// Mock http module
vi.mock("@/lib/http", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import http from "@/lib/http";

const mockHttp = http as unknown as {
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

function TestConsumer() {
  const { conversations, loadConversations, deleteConversation } =
    useChatConversations();
  return (
    <div>
      <span data-testid="count">{conversations.length}</span>
      {conversations.map((c) => (
        <span key={c.id} data-testid={`conv-${c.id}`}>
          {c.title}
        </span>
      ))}
      <button onClick={loadConversations}>reload</button>
      <button onClick={() => deleteConversation("abc")}>delete</button>
    </div>
  );
}

describe("ChatConversationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads conversations on mount", async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: [
        { id: "1", title: "Hello", updatedAt: "2026-01-01", personaId: "simon" },
      ],
    });

    render(
      <ChatConversationProvider>
        <TestConsumer />
      </ChatConversationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
    expect(screen.getByTestId("conv-1").textContent).toBe("Hello");
  });

  it("deleteConversation removes item from list and calls API", async () => {
    mockHttp.get.mockResolvedValueOnce({
      data: [
        { id: "abc", title: "Chat 1", updatedAt: "2026-01-01", personaId: "simon" },
        { id: "def", title: "Chat 2", updatedAt: "2026-01-01", personaId: "simon" },
      ],
    });
    mockHttp.delete.mockResolvedValueOnce({});

    render(
      <ChatConversationProvider>
        <TestConsumer />
      </ChatConversationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("2");
    });

    await userEvent.click(screen.getByText("delete"));

    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("1");
    });
    expect(mockHttp.delete).toHaveBeenCalledWith("/conversations/abc");
  });

  it("throws when useChatConversations is used outside provider", () => {
    // Suppress React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/ChatConversationProvider.test.tsx`
Expected: FAIL — module `@/components/app/ChatConversationProvider` not found

- [ ] **Step 3: Implement ChatConversationProvider**

Create `components/app/ChatConversationProvider.tsx`:

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type { ConversationItem } from "@/components/app/ConversationList";
import http from "@/lib/http";

type ChatConversationContextValue = {
  conversations: ConversationItem[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
};

const ChatConversationContext =
  createContext<ChatConversationContextValue | null>(null);

export function useChatConversations(): ChatConversationContextValue {
  const ctx = useContext(ChatConversationContext);
  if (!ctx) {
    throw new Error(
      "useChatConversations must be used within ChatConversationProvider",
    );
  }
  return ctx;
}

export function ChatConversationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await http.get<ConversationItem[]>("/conversations");
      setConversations(data);
    } catch {
      // non-fatal: thread list just won't show
    }
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await http.delete(`/conversations/${id}`);
        setConversations((curr) => curr.filter((c) => c.id !== id));
      } catch {
        // Keep the current list if deletion fails.
      }
    },
    [],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <ChatConversationContext.Provider
      value={{ conversations, setConversations, loadConversations, deleteConversation }}
    >
      {children}
    </ChatConversationContext.Provider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/components/ChatConversationProvider.test.tsx`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/app/ChatConversationProvider.tsx test/components/ChatConversationProvider.test.tsx
git commit -m "feat: add ChatConversationProvider context for persistent sidebar state"
```

---

## Task 2: Create Chatbot Layout and Refactor ConversationList

**Files:**
- Create: `app/(app)/english-chatbot/layout.tsx`
- Modify: `components/app/ConversationList.tsx`

- [ ] **Step 1: Create the shared chatbot layout**

Create `app/(app)/english-chatbot/layout.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { ChatConversationProvider } from "@/components/app/ChatConversationProvider";
import { ConversationList } from "@/components/app/ConversationList";

export default function EnglishChatbotLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Extract conversationId from path: /english-chatbot/{id}
  const segments = pathname.split("/").filter(Boolean);
  const activeId = segments.length >= 2 ? segments[1] : null;

  return (
    <ChatConversationProvider>
      <div className="flex h-full max-h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
        <ConversationList activeId={activeId} />
        {children}
      </div>
    </ChatConversationProvider>
  );
}
```

- [ ] **Step 2: Refactor ConversationList to read from context**

Modify `components/app/ConversationList.tsx`. Replace the props-based interface with context:

Replace the entire type and function signature section (lines 13-45):

Old:
```tsx
type Props = {
  conversations: ConversationItem[];
  activeId: string | null;
  onNew: () => void;
  onDelete: (id: string) => void;
};

// ... (formatRelativeTime and truncateTitle remain unchanged)

export function ConversationList({
  conversations,
  activeId,
  onNew,
  onDelete,
}: Props) {
```

New:
```tsx
type Props = {
  activeId: string | null;
};

// ... (formatRelativeTime and truncateTitle remain unchanged)

export function ConversationList({ activeId }: Props) {
  const router = useRouter();
  const { conversations, deleteConversation } = useChatConversations();

  const handleNew = useCallback(() => {
    router.push("/english-chatbot");
  }, [router]);
```

Add these imports at the top:
```tsx
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChatConversations } from "@/components/app/ChatConversationProvider";
```

Replace `onNew` with `handleNew` and `onDelete` with `deleteConversation` in the JSX:

- `onClick={onNew}` → `onClick={handleNew}`
- `onDelete(conv.id)` → `deleteConversation(conv.id)`

- [ ] **Step 3: Verify the build compiles**

Run: `npx next build 2>&1 | head -30`

Note: The build may show errors for pages still importing `EnglishChatbotView` — that's expected and will be fixed in Task 3.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/english-chatbot/layout.tsx components/app/ConversationList.tsx
git commit -m "feat: add persistent chatbot layout and refactor ConversationList to use context"
```

---

## Task 3: Create ChatWindow and Update Page Routes

**Files:**
- Create: `components/app/ChatWindow.tsx`
- Modify: `app/(app)/english-chatbot/page.tsx`
- Modify: `app/(app)/english-chatbot/[conversationId]/page.tsx`
- Delete: `components/app/EnglishChatbotView.tsx`

- [ ] **Step 1: Create ChatWindow component**

Create `components/app/ChatWindow.tsx`. This is `EnglishChatbotView` with the sidebar removed and context integrated. Key changes from `EnglishChatbotView`:

1. Remove `ConversationList` import and rendering
2. Remove `conversations` state — use `useChatConversations()` context
3. Remove `loadConversations` — use context's `loadConversations`
4. Remove `handleDeleteConversation` — handled by sidebar via context
5. Remove the outer `<div className="flex h-full...">` wrapper (layout owns that now)
6. Add a skeleton loading state when switching conversations
7. Update `handleNewChat` to only reset local state (navigation handled by sidebar)

```tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { PageMessage } from "@/components/ChatMessage";
import { PersonaSwitcher } from "@/components/app/PersonaSwitcher";
import { ChatHeader } from "@/components/app/ChatHeader";
import { useChatConversations } from "@/components/app/ChatConversationProvider";
import { deriveTitle } from "@/lib/chat/derive-title";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";
import http from "@/lib/http";

const SUGGESTED = [
  { text: "Sửa ngữ pháp giúp mình: I goed to school.", icon: BookOpen },
  { text: "Cho mình một bài luyện nhanh bằng tiếng Anh.", icon: Sparkles },
  { text: "Giải thích một từ lóng của người Úc nhé.", icon: MessageCircle },
  { text: "Vì sao phải nói 'I am' chứ không phải 'I is'?", icon: Lightbulb },
];

const CHAT_ERROR_MESSAGE =
  "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

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
  currentMessage: PageMessage,
  previousMessage?: PageMessage,
) {
  if (!previousMessage) return "";
  return currentMessage.role === previousMessage.role ? "mt-[4px]" : "mt-[28px]";
}

function ChatSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl animate-pulse space-y-6 py-6">
      {/* Simulated assistant message */}
      <div className="flex gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--bg-deep)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-[var(--bg-deep)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--bg-deep)]" />
        </div>
      </div>
      {/* Simulated user message */}
      <div className="flex justify-end">
        <div className="space-y-2 w-2/3">
          <div className="h-4 w-full rounded bg-[var(--bg-deep)]" />
          <div className="h-4 w-4/5 rounded bg-[var(--bg-deep)]" />
        </div>
      </div>
      {/* Simulated assistant message */}
      <div className="flex gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--bg-deep)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-full rounded bg-[var(--bg-deep)]" />
          <div className="h-4 w-2/3 rounded bg-[var(--bg-deep)]" />
          <div className="h-4 w-4/5 rounded bg-[var(--bg-deep)]" />
        </div>
      </div>
      {/* Simulated user message */}
      <div className="flex justify-end">
        <div className="space-y-2 w-1/2">
          <div className="h-4 w-full rounded bg-[var(--bg-deep)]" />
        </div>
      </div>
    </div>
  );
}

interface ChatWindowProps {
  conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const router = useRouter();
  const { conversations, setConversations, loadConversations } = useChatConversations();
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA_ID);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const lastMsg = messages.at(-1);
  const streamingHasStarted = isLoading && lastMsg?.role === "assistant";
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  // Load messages when conversationId changes (from URL)
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setError(null);
      setSelectedPersonaId(DEFAULT_PERSONA_ID);
      return;
    }

    const conv = conversations.find((c) => c.id === conversationId);
    if (conv?.personaId) {
      setSelectedPersonaId(conv.personaId);
    }

    let cancelled = false;
    setIsLoadingMessages(true);
    (async () => {
      try {
        const { data: rows } = await http.get<Array<{
          id: string;
          role: "user" | "assistant";
          content: string;
        }>>(`/conversations/${conversationId}/messages`);
        if (cancelled) return;
        setMessages(rows.map((r) => ({ id: r.id, role: r.role, text: r.content })));
        setError(null);
      } catch {
        if (!cancelled) {
          setError("Không thể tải cuộc trò chuyện này.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [conversationId, conversations]);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (isNearBottomRef.current && bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, error]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distFromBottom < 80;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = () => {
    isNearBottomRef.current = true;
    const bottom = bottomRef.current;
    if (bottom && typeof bottom.scrollIntoView === "function") {
      bottom.scrollIntoView({ behavior: "smooth" });
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };

  const removeEmptyAssistantMessage = (messageId: string) => {
    setMessages((curr) =>
      curr.filter((m) => m.id !== messageId || (m.role !== "divider" && m.text.trim().length > 0)),
    );
  };

  const handlePersonaChange = useCallback((personaId: string) => {
    setSelectedPersonaId(personaId);
    setMessages((curr) => {
      if (curr.length === 0) return curr;
      const persona = PERSONAS.find((p) => p.id === personaId);
      if (!persona) return curr;
      return [
        ...curr,
        {
          id: crypto.randomUUID(),
          role: "divider" as const,
          text: `Switched to ${persona.label}`,
        },
      ];
    });
  }, []);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const { data: created } = await http.post<{ id: string; title: string; personaId: string }>(
          "/conversations",
          { title: deriveTitle(t), personaId: selectedPersonaId },
        );
        convId = created.id;
        setConversations((curr) => [
          {
            id: created.id,
            title: created.title,
            updatedAt: new Date().toISOString(),
            personaId: created.personaId,
          },
          ...curr,
        ]);
        router.replace(`/english-chatbot/${created.id}`);
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

    // Filter out client-only dividers before sending to API
    const requestMessages = [...messages, userMessage].filter(
      (m): m is AppChatMessage => m.role === "user" || m.role === "assistant",
    );

    setMessages((curr) => [
      ...curr,
      userMessage,
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
        body: JSON.stringify({
          messages: requestMessages,
          conversationId: convId,
          personaId: selectedPersonaId,
        }),
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
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ChatHeader personaId={selectedPersonaId} />
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
          {isLoadingMessages && conversationId && (
            <ChatSkeleton />
          )}

          <AnimatePresence>
            {!hasMessages && !isLoadingMessages && (
              <motion.div
                className="mx-auto my-auto flex max-w-3xl flex-col items-center text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <motion.div
                  className="relative"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
                >
                  <Image
                    src="/english-logo-app.svg"
                    alt="English Tutor"
                    width={250}
                    height={150}
                    className="h-16 w-auto rounded-2xl shadow-(--shadow-lg)"
                  />
                  <span className="absolute bottom-1 right-1 size-3 rounded-full bg-(--sage) ring-2 ring-(--bg)" />
                </motion.div>

                <motion.h2
                  className="mt-6 text-5xl italic [font-family:var(--font-display)] text-(--ink)"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  Xin chào! Chọn gia sư để bắt đầu
                </motion.h2>

                <motion.p
                  className="mt-3 max-w-sm text-base text-(--text-secondary)"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  Chọn gia sư phù hợp với mục tiêu của bạn, rồi bắt đầu luyện tập nhé.
                </motion.p>

                <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
                  {SUGGESTED.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.button
                        key={s.text}
                        className="flex items-start gap-3 rounded-lg border border-(--border) bg-(--surface) p-4 text-left shadow-(--shadow-sm) transition hover:-translate-y-0.5 hover:border-(--accent)/40 hover:bg-(--surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
                        onClick={() => send(s.text)}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 + i * 0.08, duration: 0.35, ease: "easeOut" }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-(--accent-light) text-(--accent)">
                          <Icon size={16} strokeWidth={2} />
                        </span>
                        <span className="text-sm leading-6 text-(--text-primary)">
                          {s.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasMessages && !isLoadingMessages && (
            <div className="flex flex-col">
              {messages.map((m, index) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  className={getMessageSpacingClassName(m, messages[index - 1])}
                  isStreaming={isLoading && index === messages.length - 1 && m.role === "assistant"}
                />
              ))}
              <AnimatePresence>
                {isLoading && !streamingHasStarted && (
                  <motion.div
                    className="mt-[28px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TypingIndicator personaName={activePersona.label.split(" —")[0]} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-5 rounded-(--radius) border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                <p>{error}</p>
                <button
                  className="mt-2 font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
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

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            className="absolute bottom-[88px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-(--border) bg-(--surface) px-3 py-1.5 text-xs font-medium text-(--text-secondary) shadow-(--shadow-lg) transition hover:bg-(--surface-hover) hover:text-(--ink)"
            onClick={scrollToBottom}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            transition={{ duration: 0.18 }}
          >
            <ArrowDown size={12} strokeWidth={2.5} />
            Xuống cuối
          </motion.button>
        )}
      </AnimatePresence>

      <div className="shrink-0 bg-(--bg)/80 px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          <div className="flex items-end gap-3 rounded-2xl border border-(--border) bg-(--surface) p-3 shadow-(--shadow-md) transition-[border-color,box-shadow] duration-200 focus-within:border-(--accent) focus-within:ring-2 focus-within:ring-(--accent-muted) focus-within:shadow-(--shadow-lg)">
            <PersonaSwitcher
              value={selectedPersonaId}
              onChange={handlePersonaChange}
              disabled={isLoading}
            />
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
              className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[15px] leading-6 text-(--text-primary) outline-none placeholder:text-(--text-muted) disabled:cursor-not-allowed focus:outline-none"
            />
            <motion.button
              className={[
                "grid size-11 shrink-0 place-items-center rounded-full text-white shadow-(--shadow-sm) transition-[background-color,transform] duration-200 enabled:hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:bg-(--border-strong)",
                input.trim() && !isLoading ? "bg-(--accent)" : "bg-(--ink)",
              ].join(" ")}
              onClick={() => send()}
              disabled={!input.trim() || isLoading}
              whileTap={{ scale: 0.88 }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </motion.button>
          </div>
          <p className="text-sm text-(--text-muted)">
            Enter để gửi · Shift+Enter để xuống dòng
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update the page routes**

Replace `app/(app)/english-chatbot/page.tsx`:

```tsx
import { ChatWindow } from "@/components/app/ChatWindow";

export default function EnglishChatbotPage() {
  return <ChatWindow conversationId={null} />;
}
```

Replace `app/(app)/english-chatbot/[conversationId]/page.tsx`:

```tsx
"use client";

import { use } from "react";
import { ChatWindow } from "@/components/app/ChatWindow";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  return <ChatWindow conversationId={conversationId} />;
}
```

- [ ] **Step 3: Delete EnglishChatbotView**

```bash
rm components/app/EnglishChatbotView.tsx
```

- [ ] **Step 4: Verify no remaining imports of EnglishChatbotView**

Run: `grep -r "EnglishChatbotView" --include="*.ts" --include="*.tsx" .` (excluding node_modules)
Expected: no results

- [ ] **Step 5: Verify the build compiles**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add components/app/ChatWindow.tsx app/\(app\)/english-chatbot/page.tsx app/\(app\)/english-chatbot/\[conversationId\]/page.tsx
git rm components/app/EnglishChatbotView.tsx
git commit -m "feat: extract ChatWindow from EnglishChatbotView, sidebar now persistent via layout"
```

---

## Task 4: Extend Vocabulary Schema with Verb Forms

**Files:**
- Modify: `lib/schemas/vocabulary.ts`
- Test: `test/lib/schemas/vocabulary.test.ts`

- [ ] **Step 1: Write failing tests for the schema extension**

Create `test/lib/schemas/vocabulary.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { VocabularySchema, VerbFormSchema, normalizeVocabulary } from "@/lib/schemas/vocabulary";

const BASE_ENTRY = {
  query: "sustain",
  headword: "sustain",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/səˈsteɪn/",
  phoneticsUk: "/səˈsteɪn/",
  partOfSpeech: "verb",
  level: "B2" as const,
  register: null,
  overviewVi: "Duy trì, chống đỡ",
  overviewEn: "To maintain or support over a period of time",
  senses: [
    {
      id: "s1",
      label: "Duy trì",
      definitionVi: "Giữ cho tiếp tục",
      definitionEn: "To keep going",
      usageNoteVi: null,
      examples: [{ en: "She sustained her effort.", vi: "Cô ấy duy trì nỗ lực." }],
      examplesVi: [],
      collocations: [],
      synonyms: ["maintain"],
      antonyms: ["abandon"],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
    },
  ],
};

describe("VerbFormSchema", () => {
  it("parses a valid verb form", () => {
    const form = VerbFormSchema.parse({
      label: "Past Simple",
      form: "sustained",
      phoneticsUs: "/səˈsteɪnd/",
      phoneticsUk: "/səˈsteɪnd/",
      isIrregular: false,
    });
    expect(form.label).toBe("Past Simple");
    expect(form.isIrregular).toBe(false);
  });

  it("allows null phonetics", () => {
    const form = VerbFormSchema.parse({
      label: "Infinitive",
      form: "go",
      phoneticsUs: null,
      phoneticsUk: null,
      isIrregular: false,
    });
    expect(form.phoneticsUs).toBeNull();
  });
});

describe("VocabularySchema with verbForms", () => {
  it("defaults verbForms to null when not provided", () => {
    const entry = VocabularySchema.parse(BASE_ENTRY);
    expect(entry.verbForms).toBeNull();
  });

  it("parses entry with verbForms array", () => {
    const entry = VocabularySchema.parse({
      ...BASE_ENTRY,
      verbForms: [
        { label: "Infinitive", form: "sustain", phoneticsUs: "/səˈsteɪn/", phoneticsUk: "/səˈsteɪn/", isIrregular: false },
        { label: "Past Simple", form: "sustained", phoneticsUs: "/səˈsteɪnd/", phoneticsUk: "/səˈsteɪnd/", isIrregular: false },
      ],
    });
    expect(entry.verbForms).toHaveLength(2);
    expect(entry.verbForms![0].form).toBe("sustain");
  });

  it("accepts explicit null verbForms", () => {
    const entry = VocabularySchema.parse({ ...BASE_ENTRY, verbForms: null });
    expect(entry.verbForms).toBeNull();
  });

  it("normalizeVocabulary handles legacy entries without verbForms", () => {
    const legacy = { ...BASE_ENTRY };
    const result = normalizeVocabulary(legacy);
    expect(result.verbForms).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/lib/schemas/vocabulary.test.ts`
Expected: FAIL — `VerbFormSchema` is not exported

- [ ] **Step 3: Add VerbFormSchema and verbForms to VocabularySchema**

Modify `lib/schemas/vocabulary.ts`. Add after line 3 (after `VocabularyEntryTypeSchema`):

```typescript
export const VerbFormSchema = z.object({
  label: z.string(),
  form: z.string(),
  phoneticsUs: z.string().nullable(),
  phoneticsUk: z.string().nullable(),
  isIrregular: z.boolean(),
});
```

Add to `VocabularySchema` object, after the `senses` field (before the closing `)`):

```typescript
  verbForms: z.array(VerbFormSchema).nullable().default(null),
```

Also add the type export after the existing type exports:

```typescript
export type VerbForm = z.infer<typeof VerbFormSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/lib/schemas/vocabulary.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/schemas/vocabulary.ts test/lib/schemas/vocabulary.test.ts
git commit -m "feat: add VerbFormSchema and verbForms field to vocabulary schema"
```

---

## Task 5: Update Dictionary AI Prompt for Verb Forms

**Files:**
- Modify: `lib/dictionary/prompt.ts`

- [ ] **Step 1: Add verb forms instruction to buildDictionaryInstructions**

In `lib/dictionary/prompt.ts`, add the following line to the array in `buildDictionaryInstructions`, before the final `` `Entry type: ${entryType}` `` line:

```typescript
"If the entry is a verb (partOfSpeech contains 'verb'), populate `verbForms` with exactly 5 entries in this order: Infinitive, 3rd Person Singular, Past Simple, Past Participle, Present Participle. For each form, provide its own US IPA (phoneticsUs) and UK IPA (phoneticsUk) — pronunciation can differ between forms (e.g., read /riːd/ vs read /rɛd/). Set `isIrregular` to true for any form that does not follow standard English conjugation rules (adding -s, -ed, -ing). For non-verb entries, set `verbForms` to null.",
```

- [ ] **Step 2: Verify the prompt file is correct**

Run: `cat lib/dictionary/prompt.ts` and confirm the new instruction is present and the file has no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add lib/dictionary/prompt.ts
git commit -m "feat: add verb forms instruction to dictionary AI prompt"
```

---

## Task 6: Create VerbFormsSection Component

**Files:**
- Create: `components/dictionary/VerbFormsSection.tsx`
- Test: `test/components/VerbFormsSection.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `test/components/VerbFormsSection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VerbFormsSection } from "@/components/dictionary/VerbFormsSection";
import type { VerbForm } from "@/lib/schemas/vocabulary";

// Mock Web Speech API
beforeEach(() => {
  window.speechSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
  } as unknown as SpeechSynthesis;
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    text = "";
    lang = "";
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(text: string) {
      this.text = text;
    }
  });
});

const REGULAR_FORMS: VerbForm[] = [
  { label: "Infinitive", form: "sustain", phoneticsUs: "/səˈsteɪn/", phoneticsUk: "/səˈsteɪn/", isIrregular: false },
  { label: "3rd Person Singular", form: "sustains", phoneticsUs: "/səˈsteɪnz/", phoneticsUk: "/səˈsteɪnz/", isIrregular: false },
  { label: "Past Simple", form: "sustained", phoneticsUs: "/səˈsteɪnd/", phoneticsUk: "/səˈsteɪnd/", isIrregular: false },
  { label: "Past Participle", form: "sustained", phoneticsUs: "/səˈsteɪnd/", phoneticsUk: "/səˈsteɪnd/", isIrregular: false },
  { label: "Present Participle", form: "sustaining", phoneticsUs: "/səˈsteɪnɪŋ/", phoneticsUk: "/səˈsteɪnɪŋ/", isIrregular: false },
];

const IRREGULAR_FORMS: VerbForm[] = [
  { label: "Infinitive", form: "go", phoneticsUs: "/ɡoʊ/", phoneticsUk: "/ɡəʊ/", isIrregular: false },
  { label: "3rd Person Singular", form: "goes", phoneticsUs: "/ɡoʊz/", phoneticsUk: "/ɡəʊz/", isIrregular: false },
  { label: "Past Simple", form: "went", phoneticsUs: "/wɛnt/", phoneticsUk: "/wɛnt/", isIrregular: true },
  { label: "Past Participle", form: "gone", phoneticsUs: "/ɡɔːn/", phoneticsUk: "/ɡɒn/", isIrregular: true },
  { label: "Present Participle", form: "going", phoneticsUs: "/ˈɡoʊɪŋ/", phoneticsUk: "/ˈɡəʊɪŋ/", isIrregular: false },
];

describe("VerbFormsSection", () => {
  it("renders all verb form labels and forms", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("Infinitive")).toBeInTheDocument();
    expect(screen.getByText("sustain")).toBeInTheDocument();
    expect(screen.getByText("Past Simple")).toBeInTheDocument();
    expect(screen.getByText("sustained")).toBeInTheDocument();
    expect(screen.getByText("Present Participle")).toBeInTheDocument();
    expect(screen.getByText("sustaining")).toBeInTheDocument();
  });

  it("renders IPA transcriptions", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("/səˈsteɪn/")).toBeInTheDocument();
    expect(screen.getByText("/səˈsteɪnd/")).toBeInTheDocument();
  });

  it("shows irregular badge for irregular forms", () => {
    render(<VerbFormsSection verbForms={IRREGULAR_FORMS} />);
    const badges = screen.getAllByText("Bất quy tắc");
    // "went" and "gone" are irregular
    expect(badges).toHaveLength(2);
  });

  it("does not show irregular badge for regular forms", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.queryByText("Bất quy tắc")).not.toBeInTheDocument();
  });

  it("renders section header", () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    expect(screen.getByText("DẠNG ĐỘNG TỪ")).toBeInTheDocument();
  });

  it("has audio buttons for each form", async () => {
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    const audioButtons = screen.getAllByRole("button", { name: /Play pronunciation/i });
    // One audio button per form
    expect(audioButtons.length).toBe(REGULAR_FORMS.length);
  });

  it("calls speechSynthesis.speak when audio button clicked", async () => {
    const user = userEvent.setup();
    render(<VerbFormsSection verbForms={REGULAR_FORMS} />);
    const audioButtons = screen.getAllByRole("button", { name: /Play pronunciation/i });
    await user.click(audioButtons[0]);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/components/VerbFormsSection.test.tsx`
Expected: FAIL — module `@/components/dictionary/VerbFormsSection` not found

- [ ] **Step 3: Implement VerbFormsSection**

Create `components/dictionary/VerbFormsSection.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Tag } from "antd";
import { Loader2, Volume2 } from "lucide-react";
import { motion } from "motion/react";

import type { VerbForm } from "@/lib/schemas/vocabulary";

type Props = {
  verbForms: VerbForm[];
};

// Module-level: ensures only one utterance plays at a time
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function VerbFormsSection({ verbForms }: Props) {
  const [speakingForm, setSpeakingForm] = useState<string | null>(null);

  function speak(form: string) {
    if (activeUtterance) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    }
    const utterance = new SpeechSynthesisUtterance(form);
    utterance.lang = "en-US";
    utterance.onstart = () => setSpeakingForm(form);
    utterance.onend = () => {
      setSpeakingForm(null);
      activeUtterance = null;
    };
    utterance.onerror = () => {
      setSpeakingForm(null);
      activeUtterance = null;
    };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <motion.div
      className="mt-5"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.3 }}
    >
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
        DẠNG ĐỘNG TỪ
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {verbForms.map((vf) => (
          <div
            key={vf.label}
            className="flex flex-col gap-1.5 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-3.5 py-3"
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {vf.label}
            </span>
            <span className="text-sm font-semibold text-[var(--ink)]">
              {vf.form}
            </span>
            {vf.phoneticsUs && (
              <span className="text-xs [font-family:var(--font-mono)] text-[var(--accent)]">
                {vf.phoneticsUs}
              </span>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Play pronunciation of ${vf.form}`}
                onClick={() => speak(vf.form)}
                className="grid size-6 place-items-center rounded text-[var(--text-muted)] transition hover:text-[var(--accent)]"
              >
                {speakingForm === vf.form ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Volume2 size={13} />
                )}
              </button>
              {vf.isIrregular && (
                <Tag color="orange" className="!m-0 !text-[10px] !px-1.5 !py-0 !leading-4">
                  Bất quy tắc
                </Tag>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run test/components/VerbFormsSection.test.tsx`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/dictionary/VerbFormsSection.tsx test/components/VerbFormsSection.test.tsx
git commit -m "feat: add VerbFormsSection component for dictionary verb morphology"
```

---

## Task 7: Integrate VerbFormsSection into DictionaryResultCard

**Files:**
- Modify: `components/dictionary/DictionaryResultCard.tsx`

- [ ] **Step 1: Add import**

Add at the top of `components/dictionary/DictionaryResultCard.tsx`, after the existing imports:

```tsx
import { VerbFormsSection } from "@/components/dictionary/VerbFormsSection";
```

- [ ] **Step 2: Render VerbFormsSection between phonetics and overview**

In the returned JSX of the `DictionaryResultCard` component, find the overview section (the `<motion.div className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)]...` block around line 421).

Insert the following **immediately before** that overview `<motion.div>`:

```tsx
          {vocabulary.verbForms && vocabulary.verbForms.length > 0 && (
            <VerbFormsSection verbForms={vocabulary.verbForms} />
          )}
```

- [ ] **Step 3: Verify the build compiles**

Run: `npx next build 2>&1 | tail -20`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add components/dictionary/DictionaryResultCard.tsx
git commit -m "feat: integrate VerbFormsSection into dictionary result card"
```

---

## Task 8: Run All Tests and Final Verification

- [ ] **Step 1: Run the full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run the linter**

Run: `npx eslint .`
Expected: No errors

- [ ] **Step 3: Run the build**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit any fixes if needed**

If any of the above steps produced fixable issues, fix and commit:

```bash
git add -A
git commit -m "fix: address lint/test/build issues"
```
