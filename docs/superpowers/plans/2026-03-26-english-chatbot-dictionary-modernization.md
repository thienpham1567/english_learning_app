# English Chatbot And Dictionary Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the app with official OpenAI Responses API integration, Vietnamese UI copy with proper diacritics, English-first chatbot behavior, and a richer cached dictionary for words and multi-word expressions.

**Architecture:** Keep the current Next.js App Router feature split, but move AI logic into focused server-side helper modules. Replace the current AI SDK-dependent chat flow with app-owned OpenAI streaming and a strict dictionary JSON contract, then update the UI to consume those app-owned contracts.

**Tech Stack:** Next.js 16, React 19, TypeScript, Ant Design, OpenAI official Node SDK, Vitest, Testing Library, Zod

---

## File Structure

### Existing files to modify

- `package.json` - add test scripts and OpenAI SDK dependency, then remove unused AI SDK packages after migration
- `package-lock.json` - lockfile updates from dependency changes
- `.gitignore` - ignore `.superpowers/`
- `app/layout.tsx` - Vietnamese metadata and `lang="vi"`
- `app/page.tsx` - preserve redirect
- `app/api/chat/route.ts` - replace AI SDK transport with app-owned OpenAI Responses streaming
- `app/api/dictionary/route.ts` - replace AI SDK object generation with OpenAI Responses structured output
- `app/(app)/english-chatbot/page.tsx` - move from `useChat` to app-owned streaming state
- `app/(app)/co-lanh-dictionary/page.tsx` - updated validation copy and richer result handling
- `components/ChatMessage.tsx` - consume local chat message shape
- `components/TypingIndicator.tsx` - Vietnamese accessibility text if added
- `components/app/AppSidebar.tsx` - Vietnamese labels with proper diacritics
- `components/dictionary/DictionarySearchPanel.tsx` - accented copy and broader query guidance
- `components/dictionary/DictionaryResultCard.tsx` - sense tabs, richer entry rendering
- `app/globals.css` - styles for sense tabs, richer result layout, and any shared UI copy polish
- `lib/schemas/vocabulary.ts` - replace minimal schema with richer dictionary entry schema
- `README.md` - short setup notes for required env vars and test commands

### New files to create

- `vitest.config.ts`
- `test/setup.ts`
- `test/render.tsx`
- `test/mocks/openai.ts`
- `lib/openai/client.ts`
- `lib/openai/config.ts`
- `lib/chat/types.ts`
- `lib/chat/detect-language.ts`
- `lib/chat/build-chat-instructions.ts`
- `lib/chat/build-chat-input.ts`
- `lib/chat/create-chat-sse.ts`
- `lib/chat/detect-language.test.ts`
- `lib/chat/build-chat-instructions.test.ts`
- `lib/dictionary/normalize-query.ts`
- `lib/dictionary/classify-entry.ts`
- `lib/dictionary/cache.ts`
- `lib/dictionary/prompt.ts`
- `lib/dictionary/normalize-query.test.ts`
- `lib/dictionary/classify-entry.test.ts`
- `lib/dictionary/cache.test.ts`
- `app/api/dictionary/route.test.ts`
- `app/api/chat/route.test.ts`
- `components/app/AppSidebar.test.tsx`
- `components/dictionary/DictionarySearchPanel.test.tsx`
- `components/dictionary/DictionaryResultCard.test.tsx`

### Files to delete after migration

- none required, but remove unused imports and uninstall unused AI SDK packages when chat and dictionary no longer depend on them

### Implementation order

1. Test harness and config
2. Shared OpenAI config
3. Chatbot language-detection domain
4. Chat route and frontend streaming migration
5. Dictionary normalization, classification, schema, and cache
6. Dictionary API migration
7. UI copy pass and dictionary results UI
8. Cleanup, docs, and verification

### Task 1: Bootstrap Tests And Repo Hygiene

**Files:**
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Create: `test/render.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Test: `components/app/AppSidebar.test.tsx`

- [ ] **Step 1: Add test tooling and scripts**

Update `package.json` so the repo has a runnable test harness before production changes:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "antd": "^6.3.4",
    "lucide-react": "^1.6.0",
    "next": "16.2.1",
    "openai": "^5.0.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-markdown": "^10.1.0",
    "zod-to-json-schema": "^3.24.6",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.1",
    "jsdom": "^25.0.1",
    "tailwindcss": "^4",
    "typescript": "^5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `added` / `removed` package summary and an updated `package-lock.json`

- [ ] **Step 3: Add Vitest configuration**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

Create `test/setup.ts` and `test/render.tsx`:

```ts
// test/setup.ts
import "@testing-library/jest-dom/vitest";
```

```tsx
// test/render.tsx
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

export function renderUi(ui: ReactElement) {
  return render(ui);
}
```

- [ ] **Step 4: Write the first failing UI-copy smoke test**

Create `components/app/AppSidebar.test.tsx`:

```tsx
import { renderUi } from "@/test/render";
import { AppSidebar } from "@/components/app/AppSidebar";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders Vietnamese navigation labels with proper diacritics", () => {
    const { getByText } = renderUi(<AppSidebar />);

    expect(getByText("Trò chuyện tiếng Anh")).toBeInTheDocument();
    expect(getByText("Từ điển cô Lành")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the smoke test to verify it fails**

Run: `npm run test:run -- components/app/AppSidebar.test.tsx`
Expected: FAIL because current sidebar labels are still `English Chatbot` and `Từ điển Cô Lành`

- [ ] **Step 6: Ignore brainstorming artifacts**

Update `.gitignore`:

```gitignore
.superpowers/
```

- [ ] **Step 7: Commit the harness setup**

```bash
git add package.json package-lock.json .gitignore vitest.config.ts test/setup.ts test/render.tsx components/app/AppSidebar.test.tsx
git commit -m "test: add vitest harness"
```

### Task 2: Add Shared OpenAI Configuration

**Files:**
- Create: `lib/openai/config.ts`
- Create: `lib/openai/client.ts`
- Create: `test/mocks/openai.ts`
- Modify: `README.md`
- Test: `app/api/chat/route.test.ts`

- [ ] **Step 1: Write the failing config test**

Create `app/api/chat/route.test.ts` with an env-config assertion first:

```ts
import { describe, expect, it, vi } from "vitest";

describe("openai config", () => {
  it("throws when OPENAI_API_KEY is missing", async () => {
    vi.resetModules();
    delete process.env.OPENAI_API_KEY;

    await expect(import("@/lib/openai/config")).rejects.toThrow(
      "Missing OPENAI_API_KEY",
    );
  });
});
```

- [ ] **Step 2: Run the config test to verify it fails**

Run: `npm run test:run -- app/api/chat/route.test.ts`
Expected: FAIL because `lib/openai/config.ts` does not exist yet

- [ ] **Step 3: Add env-backed OpenAI config**

Create `lib/openai/config.ts`:

```ts
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("Missing OPENAI_API_KEY");
}

export const openAiConfig = {
  apiKey,
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini",
  dictionaryModel: process.env.OPENAI_DICTIONARY_MODEL ?? "gpt-4.1-mini",
  dictionaryCacheTtlMs:
    Number(process.env.DICTIONARY_CACHE_TTL_MS ?? 14 * 24 * 60 * 60 * 1000),
};
```

Create `lib/openai/client.ts`:

```ts
import OpenAI from "openai";
import { openAiConfig } from "@/lib/openai/config";

export const openAiClient = new OpenAI({
  apiKey: openAiConfig.apiKey,
});
```

Create `test/mocks/openai.ts`:

```ts
export function createMockResponseStream(chunks: string[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield {
          type: "response.output_text.delta",
          delta: chunk,
        };
      }
    },
  };
}
```

- [ ] **Step 4: Document required env vars**

Append to `README.md`:

```md
## Local setup

Required environment variables:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL` optional, defaults to `gpt-4.1-mini`
- `OPENAI_DICTIONARY_MODEL` optional, defaults to `gpt-4.1-mini`
- `DICTIONARY_CACHE_TTL_MS` optional, defaults to 14 days

Useful commands:

- `npm run dev`
- `npm run lint`
- `npm run test:run`
```

- [ ] **Step 5: Run the config test to verify it passes**

Run: `OPENAI_API_KEY=test npm run test:run -- app/api/chat/route.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/openai/config.ts lib/openai/client.ts test/mocks/openai.ts README.md app/api/chat/route.test.ts
git commit -m "chore: add shared openai config"
```

### Task 3: Add Chatbot Language Detection And Reminder Logic

**Files:**
- Create: `lib/chat/types.ts`
- Create: `lib/chat/detect-language.ts`
- Create: `lib/chat/build-chat-instructions.ts`
- Create: `lib/chat/detect-language.test.ts`
- Create: `lib/chat/build-chat-instructions.test.ts`

- [ ] **Step 1: Write the failing language-detection tests**

Create `lib/chat/detect-language.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/lib/chat/detect-language";

describe("detectLanguage", () => {
  it("returns english for an English-only message", () => {
    expect(detectLanguage("I want to practice speaking every day.")).toBe("english");
  });

  it("returns vietnamese for a clearly Vietnamese message", () => {
    expect(detectLanguage("Mình muốn hỏi về cách dùng thì hiện tại đơn.")).toBe("vietnamese");
  });

  it("returns mixed for bilingual messages", () => {
    expect(detectLanguage("Cô ơi, what does this sentence mean?")).toBe("mixed");
  });
});
```

Create `lib/chat/build-chat-instructions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";

describe("buildChatInstructions", () => {
  it("adds a reminder after two consecutive Vietnamese turns", () => {
    const instructions = buildChatInstructions({
      consecutiveVietnameseTurns: 2,
    });

    expect(instructions).toContain("gently remind the learner to switch back to English");
  });

  it("does not add a reminder before the threshold", () => {
    const instructions = buildChatInstructions({
      consecutiveVietnameseTurns: 1,
    });

    expect(instructions).not.toContain("gently remind the learner to switch back to English");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `OPENAI_API_KEY=test npm run test:run -- lib/chat/detect-language.test.ts lib/chat/build-chat-instructions.test.ts`
Expected: FAIL because the modules do not exist

- [ ] **Step 3: Add shared chat types and language detection**

Create `lib/chat/types.ts`:

```ts
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type DetectedLanguage = "english" | "vietnamese" | "mixed" | "unknown";
```

Create `lib/chat/detect-language.ts`:

```ts
import type { DetectedLanguage } from "@/lib/chat/types";

const vietnameseChars = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const englishWords = /\b(the|and|is|are|what|how|why|when|where|practice|english|sentence|grammar)\b/i;
const vietnameseWords = /\b(và|là|mình|bạn|cô|nghĩa|tiếng|anh|việt|giúp|cách)\b/i;

export function detectLanguage(input: string): DetectedLanguage {
  const text = input.trim();
  if (!text) return "unknown";

  const hasVietnameseSignal = vietnameseChars.test(text) || vietnameseWords.test(text);
  const hasEnglishSignal = englishWords.test(text);

  if (hasVietnameseSignal && hasEnglishSignal) return "mixed";
  if (hasVietnameseSignal) return "vietnamese";
  if (hasEnglishSignal) return "english";
  return "unknown";
}
```

- [ ] **Step 4: Add instruction builder**

Create `lib/chat/build-chat-instructions.ts`:

```ts
export function buildChatInstructions(input: {
  consecutiveVietnameseTurns: number;
}) {
  const base = [
    "You are Cô Minh, an English practice coach.",
    "Prefer English in your replies.",
    "Use Vietnamese only briefly when clarification genuinely helps.",
    "Be serious, friendly, concise, and low on teasing.",
    "Correct mistakes clearly and keep the learner talking.",
  ];

  if (input.consecutiveVietnameseTurns >= 2) {
    base.push(
      "In this reply, gently remind the learner to switch back to English for speaking practice.",
    );
  }

  return base.join("\n");
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `OPENAI_API_KEY=test npm run test:run -- lib/chat/detect-language.test.ts lib/chat/build-chat-instructions.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/chat/types.ts lib/chat/detect-language.ts lib/chat/build-chat-instructions.ts lib/chat/detect-language.test.ts lib/chat/build-chat-instructions.test.ts
git commit -m "feat: add chat language detection rules"
```

### Task 4: Migrate Chat Route And Frontend Streaming

**Files:**
- Modify: `app/api/chat/route.ts`
- Modify: `app/(app)/english-chatbot/page.tsx`
- Modify: `components/ChatMessage.tsx`
- Modify: `app/layout.tsx`
- Create: `lib/chat/build-chat-input.ts`
- Create: `lib/chat/create-chat-sse.ts`
- Modify: `app/api/chat/route.test.ts`

- [ ] **Step 1: Write the failing reminder-route test**

Extend `app/api/chat/route.test.ts`:

```ts
import { POST } from "@/app/api/chat/route";

describe("/api/chat", () => {
  it("returns a streaming response", async () => {
    process.env.OPENAI_API_KEY = "test";

    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          { id: "1", role: "user", text: "Mình muốn hỏi bằng tiếng Việt." },
          { id: "2", role: "assistant", text: "Bạn cứ hỏi nhé." },
          { id: "3", role: "user", text: "Mình chưa biết nói sao cho đúng." }
        ],
      }),
    });

    const response = await POST(request);

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `OPENAI_API_KEY=test npm run test:run -- app/api/chat/route.test.ts`
Expected: FAIL because the existing route expects AI SDK message shape and still depends on the old transport

- [ ] **Step 3: Add helper to convert app messages into Responses API input**

Create `lib/chat/build-chat-input.ts`:

```ts
import type { ChatMessage } from "@/lib/chat/types";
import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";
import { detectLanguage } from "@/lib/chat/detect-language";

export function buildChatRequest(messages: ChatMessage[]) {
  const recentMessages = messages.slice(-20);
  let consecutiveVietnameseTurns = 0;

  for (let index = recentMessages.length - 1; index >= 0; index -= 1) {
    const message = recentMessages[index];
    if (message.role !== "user") continue;

    const detected = detectLanguage(message.text);
    if (detected === "vietnamese") {
      consecutiveVietnameseTurns += 1;
      continue;
    }

    if (detected === "english") {
      break;
    }

    if (detected === "mixed" || detected === "unknown") {
      break;
    }
  }

  return {
    instructions: buildChatInstructions({ consecutiveVietnameseTurns }),
    input: recentMessages.map((message) => ({
      role: message.role,
      content: [{ type: "input_text", text: message.text }],
    })),
  };
}
```

- [ ] **Step 4: Add SSE helper for app-owned chat streaming**

Create `lib/chat/create-chat-sse.ts`:

```ts
export function createChatSse(stream: ReadableStream<string>) {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 5: Replace the chat route with official OpenAI Responses streaming**

Update `app/api/chat/route.ts`:

```ts
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { buildChatRequest } from "@/lib/chat/build-chat-input";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import type { ChatMessage } from "@/lib/chat/types";

function encodeEvent(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const chatRequest = buildChatRequest(messages);

    const openAiStream = await openAiClient.responses.stream({
      model: openAiConfig.chatModel,
      instructions: chatRequest.instructions,
      input: chatRequest.input,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream<string>({
      async start(controller) {
        controller.enqueue(encodeEvent({ type: "assistant_start" }));

        for await (const event of openAiStream) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(
              encodeEvent({ type: "assistant_delta", delta: event.delta }),
            );
          }
        }

        controller.enqueue(encodeEvent({ type: "assistant_done" }));
        controller.close();
      },
    }).pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(encoder.encode(chunk));
        },
      }),
    );

    return createChatSse(stream);
  } catch (error) {
    console.error("Chat API error:", error);

    return new Response(
      `data: ${JSON.stringify({
        type: "assistant_error",
        message: "Cô Minh đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.",
      })}\n\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      },
    );
  }
}
```

- [ ] **Step 6: Replace AI SDK frontend chat state with app-owned streaming**

Update `app/(app)/english-chatbot/page.tsx` around local state and send flow:

```tsx
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState("");
const [status, setStatus] = useState<"idle" | "loading">("idle");
const [error, setError] = useState<string | null>(null);

async function send(text?: string) {
  const nextText = (text ?? input).trim();
  if (!nextText || status === "loading") return;

  const nextUserMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: "user",
    text: nextText,
  };

  const assistantId = crypto.randomUUID();
  setMessages((current) => [
    ...current,
    nextUserMessage,
    { id: assistantId, role: "assistant", text: "" },
  ]);
  setInput("");
  setStatus("loading");
  setError(null);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [...messages, nextUserMessage],
    }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      if (!event.startsWith("data: ")) continue;
      const payload = JSON.parse(event.slice(6)) as
        | { type: "assistant_delta"; delta: string }
        | { type: "assistant_error"; message: string };

      if (payload.type === "assistant_delta") {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, text: message.text + payload.delta }
              : message,
          ),
        );
      }

      if (payload.type === "assistant_error") {
        setError(payload.message);
      }
    }
  }

  setStatus("idle");
}
```

- [ ] **Step 7: Update message rendering and metadata copy**

Update `components/ChatMessage.tsx`:

```tsx
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

export function ChatMessage({ message }: { message: AppChatMessage }) {
  const isUser = message.role === "user";
  const text = message.text;
  if (!text) return null;
  // keep the existing bubble rendering, but use the app-owned message type
}
```

Update `app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  title: "Cô Minh Studio",
  description: "Ứng dụng luyện tiếng Anh với chatbot và từ điển học sâu.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body style={{ fontFamily: inter.style.fontFamily }}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Run focused tests**

Run: `OPENAI_API_KEY=test npm run test:run -- lib/chat/detect-language.test.ts lib/chat/build-chat-instructions.test.ts app/api/chat/route.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add app/api/chat/route.ts app/(app)/english-chatbot/page.tsx components/ChatMessage.tsx app/layout.tsx lib/chat/build-chat-input.ts lib/chat/create-chat-sse.ts app/api/chat/route.test.ts
git commit -m "feat: migrate chat flow to openai responses"
```

### Task 5: Add Dictionary Normalization, Classification, Schema, And Cache

**Files:**
- Modify: `lib/schemas/vocabulary.ts`
- Create: `lib/dictionary/normalize-query.ts`
- Create: `lib/dictionary/classify-entry.ts`
- Create: `lib/dictionary/cache.ts`
- Create: `lib/dictionary/normalize-query.test.ts`
- Create: `lib/dictionary/classify-entry.test.ts`
- Create: `lib/dictionary/cache.test.ts`

- [ ] **Step 1: Write failing dictionary helper tests**

Create `lib/dictionary/normalize-query.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";

describe("normalizeDictionaryQuery", () => {
  it("collapses repeated whitespace", () => {
    expect(normalizeDictionaryQuery("  take   off  ")).toEqual({
      normalized: "take off",
      cacheKey: "take off",
    });
  });
});
```

Create `lib/dictionary/classify-entry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";

describe("classifyDictionaryEntry", () => {
  it("classifies a single token as a word", () => {
    expect(classifyDictionaryEntry("sustain")).toBe("word");
  });

  it("classifies a phrasal verb candidate", () => {
    expect(classifyDictionaryEntry("take off")).toBe("phrasal_verb");
  });
});
```

Create `lib/dictionary/cache.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createDictionaryCache } from "@/lib/dictionary/cache";

describe("dictionary cache", () => {
  it("returns a cached value before ttl expiry", () => {
    const cache = createDictionaryCache(() => 1000);
    cache.set("take off", { headword: "take off" });

    expect(cache.get("take off")).toEqual({ headword: "take off" });
  });
});
```

- [ ] **Step 2: Run the helper tests to verify they fail**

Run: `OPENAI_API_KEY=test npm run test:run -- lib/dictionary/normalize-query.test.ts lib/dictionary/classify-entry.test.ts lib/dictionary/cache.test.ts`
Expected: FAIL because the helper files do not exist

- [ ] **Step 3: Add query normalization and classification**

Create `lib/dictionary/normalize-query.ts`:

```ts
export function normalizeDictionaryQuery(input: string) {
  const normalized = input.trim().replace(/\s+/g, " ");

  return {
    normalized,
    cacheKey: normalized.toLowerCase(),
  };
}
```

Create `lib/dictionary/classify-entry.ts`:

```ts
export type DictionaryEntryType =
  | "word"
  | "collocation"
  | "phrasal_verb"
  | "idiom";

const phrasalVerbParticles = new Set([
  "up",
  "down",
  "off",
  "on",
  "out",
  "away",
  "back",
  "over",
  "through",
]);

export function classifyDictionaryEntry(query: string): DictionaryEntryType {
  const parts = query.toLowerCase().split(" ");
  if (parts.length === 1) return "word";
  if (parts.length === 2 && phrasalVerbParticles.has(parts[1])) return "phrasal_verb";
  if (parts.length >= 3) return "idiom";
  return "collocation";
}
```

- [ ] **Step 4: Replace the schema with the richer dictionary contract**

Update `lib/schemas/vocabulary.ts`:

```ts
import { z } from "zod";

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().optional(),
  examplesVi: z.array(z.string()).min(3).max(5),
  patterns: z.array(z.string()).default([]),
  relatedExpressions: z.array(z.string()).default([]),
  commonMistakesVi: z.array(z.string()).default([]),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: z.enum(["word", "collocation", "phrasal_verb", "idiom"]),
  phonetic: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  register: z.string().optional(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;
```

- [ ] **Step 5: Add a simple in-memory cache abstraction**

Create `lib/dictionary/cache.ts`:

```ts
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export function createDictionaryCache(now = Date.now) {
  const store = new Map<string, CacheEntry<unknown>>();

  return {
    get<T>(key: string): T | null {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expiresAt <= now()) {
        store.delete(key);
        return null;
      }
      return hit.value as T;
    },
    set<T>(key: string, value: T, ttlMs = 14 * 24 * 60 * 60 * 1000) {
      store.set(key, {
        value,
        expiresAt: now() + ttlMs,
      });
    },
  };
}

export const dictionaryCache = createDictionaryCache();
```

- [ ] **Step 6: Run the helper tests to verify they pass**

Run: `OPENAI_API_KEY=test npm run test:run -- lib/dictionary/normalize-query.test.ts lib/dictionary/classify-entry.test.ts lib/dictionary/cache.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/schemas/vocabulary.ts lib/dictionary/normalize-query.ts lib/dictionary/classify-entry.ts lib/dictionary/cache.ts lib/dictionary/normalize-query.test.ts lib/dictionary/classify-entry.test.ts lib/dictionary/cache.test.ts
git commit -m "feat: add dictionary domain helpers"
```

### Task 6: Migrate The Dictionary API To Structured OpenAI Responses

**Files:**
- Modify: `app/api/dictionary/route.ts`
- Create: `lib/dictionary/prompt.ts`
- Modify: `app/api/dictionary/route.test.ts`

- [ ] **Step 1: Write the failing dictionary route tests**

Create `app/api/dictionary/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/dictionary/route";

vi.mock("@/lib/openai/client", () => ({
  openAiClient: {
    responses: {
      create: vi.fn(async () => ({
        output_text: JSON.stringify({
          query: "take off",
          headword: "take off",
          entryType: "phrasal_verb",
          overviewVi: "Một cụm động từ thông dụng.",
          overviewEn: "A common phrasal verb.",
          senses: [
            {
              id: "sense-1",
              label: "Nghĩa 1",
              definitionVi: "Cất cánh",
              definitionEn: "To leave the ground and begin flying.",
              examplesVi: [
                "Máy bay cất cánh đúng giờ.",
                "Chuyến bay cất cánh lúc bình minh.",
                "Tôi nhìn qua cửa sổ khi máy bay cất cánh."
              ],
              patterns: [],
              relatedExpressions: [],
              commonMistakesVi: []
            }
          ]
        }),
      })),
    },
  },
}));

describe("/api/dictionary", () => {
  it("accepts a phrasal verb query", async () => {
    const response = await POST(
      new Request("http://localhost/api/dictionary", {
        method: "POST",
        body: JSON.stringify({ word: "take off" }),
      }),
    );

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the route test to verify it fails**

Run: `OPENAI_API_KEY=test npm run test:run -- app/api/dictionary/route.test.ts`
Expected: FAIL because the current route rejects multi-word entries like `take off`

- [ ] **Step 3: Add the dictionary prompt builder**

Create `lib/dictionary/prompt.ts`:

```ts
import type { DictionaryEntryType } from "@/lib/dictionary/classify-entry";

export function buildDictionaryPrompt(input: {
  query: string;
  entryType: DictionaryEntryType;
}) {
  return [
    "You are Từ điển cô Lành, a learner-focused English dictionary.",
    "Return valid JSON matching the provided schema.",
    "Provide Vietnamese and English explanations for every sense.",
    "All examples must be Vietnamese only.",
    "Return 3 to 5 Vietnamese examples per sense.",
    `Entry type: ${input.entryType}`,
    `Query: ${input.query}`,
  ].join("\n");
}
```

- [ ] **Step 4: Replace the route with normalized, cached, structured output handling**

Update `app/api/dictionary/route.ts`:

```ts
import { NextResponse } from "next/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { VocabularySchema } from "@/lib/schemas/vocabulary";
import { normalizeDictionaryQuery } from "@/lib/dictionary/normalize-query";
import { classifyDictionaryEntry } from "@/lib/dictionary/classify-entry";
import { dictionaryCache } from "@/lib/dictionary/cache";
import { buildDictionaryPrompt } from "@/lib/dictionary/prompt";

const allowedQueryPattern = /^[A-Za-z][A-Za-z\s'-]{0,79}$/;

export async function POST(req: Request) {
  try {
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

    const cached = dictionaryCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ data: cached, cached: true });
    }

    const entryType = classifyDictionaryEntry(normalized);

    const response = await openAiClient.responses.create({
      model: openAiConfig.dictionaryModel,
      input: buildDictionaryPrompt({ query: normalized, entryType }),
      text: {
        format: {
          type: "json_schema",
          name: "dictionary_entry",
          strict: true,
          schema: zodToJsonSchema(VocabularySchema),
        },
      },
    });

    const parsed = VocabularySchema.parse(JSON.parse(response.output_text));
    dictionaryCache.set(cacheKey, parsed, openAiConfig.dictionaryCacheTtlMs);

    return NextResponse.json({ data: parsed, cached: false });
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Không thể tra cứu mục này lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Run the dictionary route tests**

Run: `OPENAI_API_KEY=test npm run test:run -- app/api/dictionary/route.test.ts lib/dictionary/normalize-query.test.ts lib/dictionary/classify-entry.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/api/dictionary/route.ts app/api/dictionary/route.test.ts lib/dictionary/prompt.ts
git commit -m "feat: migrate dictionary api to structured responses"
```

### Task 7: Update Vietnamese UI Copy And Dictionary Result UX

**Files:**
- Modify: `components/app/AppSidebar.tsx`
- Modify: `app/(app)/english-chatbot/page.tsx`
- Modify: `app/(app)/co-lanh-dictionary/page.tsx`
- Modify: `components/dictionary/DictionarySearchPanel.tsx`
- Modify: `components/dictionary/DictionaryResultCard.tsx`
- Modify: `app/globals.css`
- Create: `components/dictionary/DictionarySearchPanel.test.tsx`
- Create: `components/dictionary/DictionaryResultCard.test.tsx`

- [ ] **Step 1: Write the failing dictionary UI tests**

Create `components/dictionary/DictionarySearchPanel.test.tsx`:

```tsx
import { renderUi } from "@/test/render";
import { DictionarySearchPanel } from "@/components/dictionary/DictionarySearchPanel";

describe("DictionarySearchPanel", () => {
  it("shows accented Vietnamese helper copy", () => {
    const { getByText, getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu từ hoặc cụm từ")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
  });
});
```

Create `components/dictionary/DictionaryResultCard.test.tsx`:

```tsx
import { renderUi } from "@/test/render";
import { DictionaryResultCard } from "@/components/dictionary/DictionaryResultCard";

describe("DictionaryResultCard", () => {
  it("renders sense tabs for a rich dictionary entry", () => {
    const entry = {
      query: "take off",
      headword: "take off",
      entryType: "phrasal_verb",
      overviewVi: "Có nhiều nghĩa thông dụng trong giao tiếp.",
      overviewEn: "A common phrasal verb with multiple senses.",
      senses: [
        {
          id: "sense-1",
          label: "Nghĩa 1",
          definitionVi: "Cất cánh",
          definitionEn: "To leave the ground and begin flying.",
          examplesVi: [
            "Máy bay cất cánh đúng giờ.",
            "Chuyến bay cất cánh lúc bình minh.",
            "Tôi luôn nhìn qua cửa sổ khi máy bay cất cánh."
          ],
          patterns: [],
          relatedExpressions: [],
          commonMistakesVi: []
        }
      ]
    };

    const { getByRole, getByText } = renderUi(
      <DictionaryResultCard vocabulary={entry} hasSearched isLoading={false} />,
    );

    expect(getByRole("tab", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run: `OPENAI_API_KEY=test npm run test:run -- components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx components/app/AppSidebar.test.tsx`
Expected: FAIL because the current UI copy and result shape do not match the richer contract

- [ ] **Step 3: Fix global Vietnamese copy**

Update `components/app/AppSidebar.tsx`:

```tsx
const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện tiếng Anh", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển cô Lành", icon: BookOpen },
];
```

Update the chatbot page copy in `app/(app)/english-chatbot/page.tsx`:

```tsx
const SUGGESTED = [
  "Hãy sửa lỗi ngữ pháp cho câu này: I goed to school.",
  "Cho mình một bài luyện nói ngắn bằng tiếng Anh.",
  "Giải thích giúp mình một từ lóng của người Úc.",
  "Vì sao phải nói I am chứ không phải I is?",
];
```

And replace visible labels such as:

```tsx
<div>Cô Minh English</div>
<div>Đang hoạt động</div>
<h2>Cô Minh sẵn sàng luyện cùng bạn</h2>
<Input.TextArea placeholder="Nhập câu hỏi hoặc câu trả lời bằng tiếng Anh..." />
```

- [ ] **Step 4: Expand the dictionary search panel copy**

Update `components/dictionary/DictionarySearchPanel.tsx`:

```tsx
const HELPER_TIPS = [
  "Bạn có thể nhập từ đơn, collocation, phrasal verb hoặc idiom.",
  "Nhấn Enter để tra cứu nhanh mà không cần bấm nút.",
  "Mỗi nghĩa sẽ có giải thích song ngữ và ví dụ chỉ bằng tiếng Việt.",
];
```

And replace the header/body copy:

```tsx
<span>Tra cứu từ hoặc cụm từ</span>
<h2 className="dictionary-search-panel__title">Nhập mục từ cần tra cứu</h2>
<p className="dictionary-search-panel__description">
  Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
</p>
<Input placeholder="Ví dụ: take off" />
<p className="dictionary-search-panel__hint">
  Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
</p>
```

- [ ] **Step 5: Rebuild the result card around tabs and rich senses**

Update `components/dictionary/DictionaryResultCard.tsx`:

```tsx
import { Card, Empty, Skeleton, Tabs, Tag } from "antd";

const ENTRY_TYPE_LABELS = {
  word: "Từ đơn",
  collocation: "Cụm từ cố định",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
} as const;

const items = vocabulary.senses.map((sense) => ({
  key: sense.id,
  label: sense.label,
  children: (
    <div className="dictionary-sense-panel">
      <section>
        <h3>Nghĩa tiếng Việt</h3>
        <p>{sense.definitionVi}</p>
      </section>
      <section>
        <h3>Definition in English</h3>
        <p>{sense.definitionEn}</p>
      </section>
      <section>
        <h3>Ví dụ</h3>
        <ul>
          {sense.examplesVi.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
      </section>
    </div>
  ),
}));
```

Use metadata header content like:

```tsx
<p className="dictionary-result-card__eyebrow">Kết quả tra cứu</p>
<h2>{vocabulary.headword}</h2>
<span>{ENTRY_TYPE_LABELS[vocabulary.entryType]}</span>
```

- [ ] **Step 6: Update page-level dictionary validation and messages**

Update `app/(app)/co-lanh-dictionary/page.tsx` so client validation matches the new input rules:

```tsx
const QUERY_PATTERN = /^[A-Za-z][A-Za-z\\s'-]{0,79}$/;

if (!normalizedWord) {
  messageApi.error("Vui lòng nhập từ hoặc cụm từ tiếng Anh trước khi tra cứu.");
  return;
}

if (!QUERY_PATTERN.test(normalizedWord)) {
  messageApi.error("Chỉ hỗ trợ từ hoặc cụm từ tiếng Anh hợp lệ.");
  return;
}
```

Also replace the hero copy with accented Vietnamese:

```tsx
<p className="dictionary-hero__eyebrow">Từ điển cô Lành</p>
<h1>Tra cứu từ vựng và cụm từ theo cách rõ ràng, dễ học lại</h1>
<p className="dictionary-hero__description">
  Xem giải thích song ngữ, ví dụ tiếng Việt và ghi chú dùng cho từng nghĩa trong cùng một khung học tập.
</p>
```

- [ ] **Step 7: Add the CSS hooks for tabs and richer sense panels**

Extend `app/globals.css` with the dictionary tab styles:

```css
.dictionary-result-card__tabs .ant-tabs-tab {
  border-radius: 999px;
  padding-inline: 14px;
}

.dictionary-sense-panel {
  display: grid;
  gap: 20px;
}

.dictionary-sense-panel h3 {
  margin: 0 0 8px;
  color: #5f4335;
  font-size: 0.95rem;
}

.dictionary-sense-panel ul {
  margin: 0;
  padding-left: 18px;
  line-height: 1.75;
}
```

- [ ] **Step 8: Run the UI tests to verify they pass**

Run: `OPENAI_API_KEY=test npm run test:run -- components/app/AppSidebar.test.tsx components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add components/app/AppSidebar.tsx app/(app)/english-chatbot/page.tsx app/(app)/co-lanh-dictionary/page.tsx components/dictionary/DictionarySearchPanel.tsx components/dictionary/DictionaryResultCard.tsx app/globals.css components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx
git commit -m "feat: upgrade vietnamese ui and dictionary results"
```

### Task 8: Remove Unused AI SDK Dependencies And Run Full Verification

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Verify: entire app

- [ ] **Step 1: Remove old AI SDK packages if they are unused**

Run: `npm uninstall ai @ai-sdk/openai @ai-sdk/react @ai-sdk/google`
Expected: package removal summary and updated `package.json` / `package-lock.json`

- [ ] **Step 2: Run the full test suite**

Run: `OPENAI_API_KEY=test npm run test:run`
Expected: PASS

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: PASS with no new ESLint errors

- [ ] **Step 4: Run production build**

Run: `OPENAI_API_KEY=test npm run build`
Expected: PASS with the app routes including `/english-chatbot`, `/co-lanh-dictionary`, `/api/chat`, and `/api/dictionary`

- [ ] **Step 5: Sanity-check the running UI**

Run: `OPENAI_API_KEY=test npm run dev`
Expected:

- the sidebar labels show accented Vietnamese
- the chatbot page streams assistant text from the app-owned backend
- the dictionary accepts `sustain`, `take off`, and a longer idiom-format query
- invalid dictionary input shows Vietnamese error messaging

- [ ] **Step 6: Commit the final cleanup**

```bash
git add package.json package-lock.json
git commit -m "chore: remove unused ai sdk packages"
```

## Self-Review

### Spec coverage

- Official OpenAI API usage: covered in Tasks 2, 4, and 6
- Vietnamese UI copy with proper diacritics: covered in Tasks 1 and 7
- English-first chatbot with Vietnamese-threshold reminder: covered in Tasks 3 and 4
- Dictionary support for words, collocations, phrasal verbs, and idioms: covered in Tasks 5, 6, and 7
- Rich dictionary output with bilingual definitions and Vietnamese-only examples: covered in Tasks 5, 6, and 7
- Shared dictionary cache: covered in Tasks 2 and 5
- Verification and cleanup: covered in Task 8

### Placeholder scan

- No `TODO`, `TBD`, or deferred “implement later” placeholders remain
- Commands are concrete and tied to exact files
- Every behavior-heavy change has a test-first step

### Type consistency

- Chat frontend and backend use the same `ChatMessage` type from `lib/chat/types.ts`
- Dictionary schema and UI both consume the `Vocabulary` type from `lib/schemas/vocabulary.ts`
- Dictionary entry-type names are consistent across schema, classifier, and UI labels
