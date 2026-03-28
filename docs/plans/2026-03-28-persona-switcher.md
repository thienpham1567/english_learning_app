# Persona / Mode Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "Cô Minh" system prompt with a user-selectable dropdown of 3 AI personas (Simon, Christine, Eddie), persisted per-conversation in the database.

**Architecture:** Persona definitions live in `lib/chat/personas.ts` as a typed constant. `buildChatInstructions` is updated to delegate to the selected persona. A new `personaId` column on the `conversation` table persists the choice. The chat page holds `selectedPersonaId` in state and sends it in every API call; switching personas mid-conversation appends a client-only divider message.

**Tech Stack:** Next.js 15 App Router, TypeScript, Drizzle ORM (PostgreSQL), Ant Design `<Select>`, Vitest + Testing Library

---

## File Map

| File | Status | Role |
|------|--------|------|
| `lib/chat/personas.ts` | **Create** | Persona definitions and `findPersona` helper |
| `lib/chat/__tests__/personas.test.ts` | **Create** | Unit tests for personas |
| `lib/chat/build-chat-instructions.ts` | **Modify** | Delegate to selected persona |
| `lib/chat/__tests__/build-chat-instructions.test.ts` | **Modify** | Update for new signature |
| `lib/chat/build-chat-input.ts` | **Modify** | Accept and forward `personaId` |
| `lib/db/schema.ts` | **Modify** | Add `personaId` column to `conversation` |
| `lib/db/migrations/<generated>.sql` | **Create** | Drizzle migration for new column |
| `app/api/conversations/route.ts` | **Modify** | Accept/store/return `personaId` |
| `app/api/conversations/__tests__/route.test.ts` | **Create** | Tests for conversations API |
| `app/api/chat/route.ts` | **Modify** | Accept `personaId`, pass to `buildChatRequest` |
| `app/api/chat/__tests__/route.test.ts` | **Modify** | Update to include `personaId` in call |
| `components/app/PersonaSwitcher.tsx` | **Create** | Ant Design `<Select>` dropdown |
| `components/app/__tests__/PersonaSwitcher.test.tsx` | **Create** | Component tests |
| `components/ChatMessage.tsx` | **Modify** | Handle `role === "divider"` |
| `components/__tests__/ChatMessage.test.tsx` | **Modify** | Test divider rendering |
| `components/app/ConversationList.tsx` | **Modify** | Add `personaId` to `ConversationItem` type |
| `app/(app)/english-chatbot/page.tsx` | **Modify** | Wire up persona state, switcher, divider, restore |
| `app/(app)/english-chatbot/__tests__/page.test.tsx` | **Modify** | Update for new welcome heading + persona tests |

---

## Task 1: Persona definitions

**Files:**
- Create: `lib/chat/personas.ts`
- Create: `lib/chat/__tests__/personas.test.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `lib/chat/__tests__/personas.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { findPersona, PERSONA_IDS, PERSONAS } from "@/lib/chat/personas";

describe("PERSONAS", () => {
  it("exports exactly 3 personas", () => {
    expect(PERSONAS).toHaveLength(3);
  });

  it("has simon as the first persona", () => {
    expect(PERSONAS[0].id).toBe("simon");
  });

  it("PERSONA_IDS contains simon, christine, eddie in order", () => {
    expect(PERSONA_IDS).toEqual(["simon", "christine", "eddie"]);
  });
});

describe("findPersona", () => {
  it("returns simon persona for 'simon'", () => {
    const p = findPersona("simon");
    expect(p.id).toBe("simon");
    expect(p.label).toBe("Simon Hosking — Native Fluency");
  });

  it("returns christine persona for 'christine'", () => {
    const p = findPersona("christine");
    expect(p.id).toBe("christine");
    expect(p.label).toBe("Christine Ho — IELTS Master");
  });

  it("returns eddie persona for 'eddie'", () => {
    const p = findPersona("eddie");
    expect(p.id).toBe("eddie");
    expect(p.label).toBe("Eddie Oliver — TOEIC Master");
  });

  it("falls back to simon for unknown id", () => {
    expect(findPersona("unknown").id).toBe("simon");
  });
});

describe("persona buildInstructions", () => {
  it("simon: contains native fluency focus", () => {
    const instructions = findPersona("simon").buildInstructions({ consecutiveVietnameseTurns: 0 });
    expect(instructions).toContain("Simon Hosking");
    expect(instructions).toContain("idioms");
  });

  it("christine: contains IELTS rubric reference", () => {
    const instructions = findPersona("christine").buildInstructions({ consecutiveVietnameseTurns: 0 });
    expect(instructions).toContain("Christine Ho");
    expect(instructions).toContain("IELTS");
    expect(instructions).toContain("Task Response");
  });

  it("eddie: contains TOEIC and business focus", () => {
    const instructions = findPersona("eddie").buildInstructions({ consecutiveVietnameseTurns: 0 });
    expect(instructions).toContain("Eddie Oliver");
    expect(instructions).toContain("TOEIC");
    expect(instructions).toContain("workplace");
  });

  it("all personas include Vietnamese nudge after 2 consecutive turns", () => {
    for (const persona of PERSONAS) {
      const instructions = persona.buildInstructions({ consecutiveVietnameseTurns: 2 });
      expect(instructions).toContain("gently remind the learner to switch back to English");
    }
  });

  it("no persona includes Vietnamese nudge for 1 consecutive turn", () => {
    for (const persona of PERSONAS) {
      const instructions = persona.buildInstructions({ consecutiveVietnameseTurns: 1 });
      expect(instructions).not.toContain("gently remind the learner to switch back to English");
    }
  });
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
npx vitest run lib/chat/__tests__/personas.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/chat/personas'`

- [ ] **Step 1.3: Implement `lib/chat/personas.ts`**

```typescript
export type PersonaInstructionInput = {
  consecutiveVietnameseTurns: number;
};

export type Persona = {
  id: string;
  label: string;
  buildInstructions: (input: PersonaInstructionInput) => string;
};

function viNudge(): string {
  return "In this reply, gently remind the learner to switch back to English for speaking practice.";
}

export const PERSONAS: readonly Persona[] = [
  {
    id: "simon",
    label: "Simon Hosking — Native Fluency",
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Simon Hosking, a native English speaker and conversational fluency coach.",
        "Focus on natural idioms, slang, and conversational flow to help the learner speak like a native.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be friendly, concise, and encouraging.",
        "Correct mistakes naturally, as a native speaker would, and keep the conversation going.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
  },
  {
    id: "christine",
    label: "Christine Ho — IELTS Master",
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Christine Ho, an expert IELTS examiner and academic English tutor.",
        "Focus on Academic English and provide feedback based on IELTS rubrics: Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy.",
        "When correcting writing or speaking, reference the relevant IELTS band descriptor.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be precise, constructive, and professional.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
  },
  {
    id: "eddie",
    label: "Eddie Oliver — TOEIC Master",
    buildInstructions({ consecutiveVietnameseTurns }) {
      const lines = [
        "You are Eddie Oliver, a business English specialist and TOEIC expert.",
        "Focus on workplace communication, business vocabulary, and TOEIC-style listening and reading structures.",
        "Help the learner understand professional English used in emails, meetings, and business contexts.",
        "Prefer English in your replies.",
        "Use Vietnamese only briefly when clarification genuinely helps.",
        "Be professional, practical, and clear.",
      ];
      if (consecutiveVietnameseTurns >= 2) lines.push(viNudge());
      return lines.join("\n");
    },
  },
];

export const DEFAULT_PERSONA_ID = "simon";

export const PERSONA_IDS = PERSONAS.map((p) => p.id);

export function findPersona(id: string): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
npx vitest run lib/chat/__tests__/personas.test.ts
```

Expected: All PASS

- [ ] **Step 1.5: Commit**

```bash
git add lib/chat/personas.ts lib/chat/__tests__/personas.test.ts
git commit -m "feat: add persona definitions for Simon, Christine, Eddie"
```

---

## Task 2: Update buildChatInstructions to delegate to persona

**Files:**
- Modify: `lib/chat/build-chat-instructions.ts`
- Modify: `lib/chat/__tests__/build-chat-instructions.test.ts`

- [ ] **Step 2.1: Update the test file**

Replace the entire contents of `lib/chat/__tests__/build-chat-instructions.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";

describe("buildChatInstructions", () => {
  it("includes a reminder after two consecutive Vietnamese turns", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 2, personaId: "simon" }),
    ).toContain("gently remind the learner to switch back to English");
  });

  it("includes a reminder after three consecutive Vietnamese turns", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 3, personaId: "simon" }),
    ).toContain("gently remind the learner to switch back to English");
  });

  it("does not include a reminder after one consecutive Vietnamese turn", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 1, personaId: "simon" }),
    ).not.toContain("gently remind the learner to switch back to English");
  });

  it("returns christine persona instructions for 'christine'", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 0, personaId: "christine" }),
    ).toContain("Christine Ho");
  });

  it("falls back to simon for unknown personaId", () => {
    expect(
      buildChatInstructions({ consecutiveVietnameseTurns: 0, personaId: "unknown" }),
    ).toContain("Simon Hosking");
  });
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
npx vitest run lib/chat/__tests__/build-chat-instructions.test.ts
```

Expected: FAIL — old `buildChatInstructions` signature doesn't accept `personaId`

- [ ] **Step 2.3: Update `lib/chat/build-chat-instructions.ts`**

Replace the entire file:

```typescript
import { findPersona } from "@/lib/chat/personas";

export function buildChatInstructions(input: {
  consecutiveVietnameseTurns: number;
  personaId: string;
}) {
  const persona = findPersona(input.personaId);
  return persona.buildInstructions({
    consecutiveVietnameseTurns: input.consecutiveVietnameseTurns,
  });
}
```

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
npx vitest run lib/chat/__tests__/build-chat-instructions.test.ts
```

Expected: All PASS

- [ ] **Step 2.5: Commit**

```bash
git add lib/chat/build-chat-instructions.ts lib/chat/__tests__/build-chat-instructions.test.ts
git commit -m "refactor: buildChatInstructions delegates to selected persona"
```

---

## Task 3: Update buildChatRequest to accept personaId

**Files:**
- Modify: `lib/chat/build-chat-input.ts`

The existing route test verifies that `instructions` is passed to the OpenAI stream call. It will break in Task 7 when we update the route to pass `personaId`. For now, just update `buildChatRequest` — the route still calls it with the old signature temporarily.

- [ ] **Step 3.1: Update `lib/chat/build-chat-input.ts`**

Change only the `buildChatRequest` function signature and the call to `buildChatInstructions`. The rest of the file is unchanged:

```typescript
export function buildChatRequest(messages: ChatMessage[], personaId: string) {
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
  const consecutiveVietnameseTurns =
    countConsecutiveVietnameseTurns(recentMessages);

  return {
    instructions: buildChatInstructions({ consecutiveVietnameseTurns, personaId }),
    input: recentMessages.map(buildOpenAiHistoryItem),
  };
}
```

- [ ] **Step 3.2: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: The existing chat route test will FAIL because it calls `buildChatRequest(messages)` with 1 argument. That's expected — it will be fixed in Task 7. All other tests should PASS.

- [ ] **Step 3.3: Commit**

```bash
git add lib/chat/build-chat-input.ts
git commit -m "refactor: buildChatRequest accepts personaId"
```

---

## Task 4: DB schema — add personaId column and generate migration

**Files:**
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/<generated>.sql` (auto-created by drizzle-kit)

- [ ] **Step 4.1: Update `lib/db/schema.ts`**

Add `personaId` to the `conversation` table (after `title`):

```typescript
export const conversation = pgTable("conversation", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  personaId: text("persona_id").notNull().default("simon"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
```

The `Conversation` type export at the bottom of the file automatically picks up the new field — no change needed there.

- [ ] **Step 4.2: Generate the migration**

```bash
npx drizzle-kit generate
```

Expected output: a new `.sql` file created under `lib/db/migrations/`. Confirm the file contains:

```sql
ALTER TABLE "conversation" ADD COLUMN "persona_id" text DEFAULT 'simon' NOT NULL;
```

- [ ] **Step 4.3: Apply the migration to your development database**

```bash
npx drizzle-kit migrate
```

Expected: migration applied without errors.

- [ ] **Step 4.4: Commit**

```bash
git add lib/db/schema.ts lib/db/migrations/
git commit -m "feat: add persona_id column to conversation table"
```

---

## Task 5: Update conversations API — store and return personaId

**Files:**
- Modify: `app/api/conversations/route.ts`
- Create: `app/api/conversations/__tests__/route.test.ts`
- Modify: `components/app/ConversationList.tsx` (type only)

- [ ] **Step 5.1: Write failing tests**

Create `app/api/conversations/__tests__/route.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: { id: "user-1" },
      }),
    },
  },
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

vi.mock("@/lib/db/schema", () => ({
  conversation: {
    id: "id",
    title: "title",
    updatedAt: "updatedAt",
    personaId: "personaId",
    userId: "userId",
  },
}));

beforeEach(() => {
  vi.resetModules();
  mockSelect.mockReset();
  mockInsert.mockReset();
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /api/conversations", () => {
  it("returns conversations including personaId", async () => {
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "conv-1",
              title: "Test",
              updatedAt: "2026-01-01T00:00:00Z",
              personaId: "simon",
            },
          ]),
        }),
      }),
    });

    const { GET } = await import("@/app/api/conversations/route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].personaId).toBe("simon");
  });
});

describe("POST /api/conversations", () => {
  it("stores the personaId when provided", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        { id: "conv-1", title: "Test", personaId: "christine" },
      ]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", personaId: "christine" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.personaId).toBe("christine");
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ personaId: "christine" }),
    );
  });

  it("defaults personaId to 'simon' when omitted", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        { id: "conv-1", title: "Test", personaId: "simon" },
      ]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    await POST(request);

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ personaId: "simon" }),
    );
  });

  it("defaults personaId to 'simon' for unknown persona", async () => {
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        { id: "conv-1", title: "Test", personaId: "simon" },
      ]),
    });
    mockInsert.mockReturnValue({ values: insertValues });

    const { POST } = await import("@/app/api/conversations/route");
    const request = new Request("http://localhost/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", personaId: "hacker" }),
    });

    await POST(request);

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ personaId: "simon" }),
    );
  });
});
```

- [ ] **Step 5.2: Run tests to verify they fail**

```bash
npx vitest run app/api/conversations/__tests__/route.test.ts
```

Expected: FAIL — existing route doesn't return `personaId`

- [ ] **Step 5.3: Update `app/api/conversations/route.ts`**

Replace the entire file:

```typescript
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation } from "@/lib/db/schema";
import { DEFAULT_PERSONA_ID, PERSONA_IDS } from "@/lib/chat/personas";

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
      personaId: conversation.personaId,
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

  const body = (await req.json().catch(() => null)) as {
    title?: unknown;
    personaId?: unknown;
  } | null;

  const title =
    typeof body?.title === "string" && body.title.trim().length > 0
      ? body.title.trim()
      : "New conversation";

  const personaId =
    typeof body?.personaId === "string" && PERSONA_IDS.includes(body.personaId)
      ? body.personaId
      : DEFAULT_PERSONA_ID;

  const [created] = await db
    .insert(conversation)
    .values({ userId: session.user.id, title, personaId })
    .returning({
      id: conversation.id,
      title: conversation.title,
      personaId: conversation.personaId,
    });

  return Response.json(created, { status: 201 });
}
```

- [ ] **Step 5.4: Run tests to verify they pass**

```bash
npx vitest run app/api/conversations/__tests__/route.test.ts
```

Expected: All PASS

- [ ] **Step 5.5: Update `ConversationItem` type in `components/app/ConversationList.tsx`**

Change the `ConversationItem` type (line 6–10):

```typescript
export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  personaId: string;
};
```

No other changes to this file.

- [ ] **Step 5.6: Run full test suite**

```bash
npx vitest run
```

Expected: All pass except the chat route test (which still fails from Task 3 — will be fixed in Task 7).

- [ ] **Step 5.7: Commit**

```bash
git add app/api/conversations/route.ts app/api/conversations/__tests__/route.test.ts components/app/ConversationList.tsx
git commit -m "feat: conversations API stores and returns personaId"
```

---

## Task 6: Update chat API route to accept personaId

**Files:**
- Modify: `app/api/chat/route.ts`
- Modify: `app/api/chat/__tests__/route.test.ts`

- [ ] **Step 6.1: Update the chat route test**

In `app/api/chat/__tests__/route.test.ts`, add `personaId: "simon"` to the existing test request body (line 126 area):

```typescript
body: JSON.stringify({
  personaId: "simon",
  messages: [
    {
      id: "user-1",
      role: "user",
      text: "Mình muốn luyện nói tiếng Anh.",
    },
    {
      id: "assistant-1",
      role: "assistant",
      text: "Tell me what you want to practice.",
    },
    {
      id: "user-2",
      role: "user",
      text: "Can you fix my sentence?",
    },
  ],
}),
```

Also update the `expect(mockResponsesStream).toHaveBeenCalledWith(...)` assertion to verify the instructions contain Simon Hosking (instead of just `expect.any(String)`):

```typescript
expect(mockResponsesStream).toHaveBeenCalledWith(
  expect.objectContaining({
    model: "gpt-4.1-mini",
    instructions: expect.stringContaining("Simon Hosking"),
    input: expect.any(Array),
  }),
);
```

- [ ] **Step 6.2: Run tests to verify they fail**

```bash
npx vitest run app/api/chat/__tests__/route.test.ts
```

Expected: FAIL — `instructions` doesn't contain "Simon Hosking" yet (old `buildChatRequest` call)

- [ ] **Step 6.3: Update `app/api/chat/route.ts`**

Add imports and update the body parsing + `buildChatRequest` call. The `buildChatRequest` import already exists. Add persona imports and update the body type:

```typescript
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { conversation, message } from "@/lib/db/schema";
import { buildChatRequest } from "@/lib/chat/build-chat-input";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import { DEFAULT_PERSONA_ID, PERSONA_IDS } from "@/lib/chat/personas";
import type { ChatMessage } from "@/lib/chat/types";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
```

Update the body parsing block in `POST` (after `const body = ...`):

```typescript
const messages = Array.isArray(body?.messages)
  ? body.messages.filter(isChatMessage)
  : [];

const conversationId =
  typeof body?.conversationId === "string" ? body.conversationId : null;

const personaId =
  typeof body?.personaId === "string" && PERSONA_IDS.includes(body.personaId)
    ? body.personaId
    : DEFAULT_PERSONA_ID;

const { instructions, input } = buildChatRequest(messages, personaId);
```

Also update the body type annotation:

```typescript
const body = (await req.json().catch(() => null)) as {
  messages?: unknown;
  conversationId?: unknown;
  personaId?: unknown;
} | null;
```

- [ ] **Step 6.4: Run tests to verify they pass**

```bash
npx vitest run app/api/chat/__tests__/route.test.ts
```

Expected: All PASS

- [ ] **Step 6.5: Run full test suite**

```bash
npx vitest run
```

Expected: All tests PASS. The previously-failing chat route test is now fixed.

- [ ] **Step 6.6: Commit**

```bash
git add app/api/chat/route.ts app/api/chat/__tests__/route.test.ts
git commit -m "feat: chat API accepts personaId and uses it for instructions"
```

---

## Task 7: PersonaSwitcher component

**Files:**
- Create: `components/app/PersonaSwitcher.tsx`
- Create: `components/app/__tests__/PersonaSwitcher.test.tsx`

- [ ] **Step 7.1: Write the failing test**

Create `components/app/__tests__/PersonaSwitcher.test.tsx`:

```typescript
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PersonaSwitcher } from "@/components/app/PersonaSwitcher";
import { renderUi } from "@/test/render";

describe("PersonaSwitcher", () => {
  it("renders the current persona label", () => {
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} />);
    expect(screen.getByText("Simon Hosking — Native Fluency")).toBeInTheDocument();
  });

  it("renders christine label when value is christine", () => {
    renderUi(<PersonaSwitcher value="christine" onChange={vi.fn()} />);
    expect(screen.getByText("Christine Ho — IELTS Master")).toBeInTheDocument();
  });

  it("is disabled when the disabled prop is true", () => {
    renderUi(<PersonaSwitcher value="simon" onChange={vi.fn()} disabled />);
    // Ant Design Select renders a disabled .ant-select-disabled class
    expect(document.querySelector(".ant-select-disabled")).not.toBeNull();
  });
});
```

- [ ] **Step 7.2: Run tests to verify they fail**

```bash
npx vitest run components/app/__tests__/PersonaSwitcher.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/app/PersonaSwitcher'`

- [ ] **Step 7.3: Implement `components/app/PersonaSwitcher.tsx`**

```typescript
"use client";

import { Select } from "antd";

import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  value: string;
  onChange: (personaId: string) => void;
  disabled?: boolean;
};

export function PersonaSwitcher({ value, onChange, disabled }: Props) {
  return (
    <Select
      value={value}
      onChange={onChange}
      disabled={disabled}
      size="small"
      variant="borderless"
      className="shrink-0"
      style={{ minWidth: 190 }}
      options={PERSONAS.map((p) => ({ value: p.id, label: p.label }))}
    />
  );
}
```

- [ ] **Step 7.4: Run tests to verify they pass**

```bash
npx vitest run components/app/__tests__/PersonaSwitcher.test.tsx
```

Expected: All PASS

- [ ] **Step 7.5: Commit**

```bash
git add components/app/PersonaSwitcher.tsx components/app/__tests__/PersonaSwitcher.test.tsx
git commit -m "feat: add PersonaSwitcher dropdown component"
```

---

## Task 8: Update ChatMessage to render divider messages

**Files:**
- Modify: `components/ChatMessage.tsx`
- Modify: `components/__tests__/ChatMessage.test.tsx`

- [ ] **Step 8.1: Add failing test**

Add this test to `components/__tests__/ChatMessage.test.tsx` (append inside the `describe` block):

```typescript
it("renders a divider with the persona switch label", () => {
  renderUi(
    <ChatMessage
      message={{ id: "d1", role: "divider", text: "Switched to Christine Ho — IELTS Master" }}
    />,
  );
  expect(
    screen.getByText("Switched to Christine Ho — IELTS Master"),
  ).toBeInTheDocument();
});
```

- [ ] **Step 8.2: Run tests to verify the new test fails**

```bash
npx vitest run components/__tests__/ChatMessage.test.tsx
```

Expected: FAIL — TypeScript error and/or component doesn't render divider

- [ ] **Step 8.3: Update `components/ChatMessage.tsx`**

Add `DividerMessage` and `PageMessage` exports, and handle the divider case. Replace the component export and type import at the top:

```typescript
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion } from "motion/react";
import { Check, Copy, GraduationCap } from "lucide-react";
import { useUser } from "@/components/app/UserContext";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

export type DividerMessage = {
  id: string;
  role: "divider";
  text: string;
};

export type PageMessage = AppChatMessage | DividerMessage;
```

Then update the component signature and add a divider branch at the top of the render:

```typescript
export function ChatMessage({
  message,
  className = "",
  isStreaming = false,
}: {
  message: PageMessage;
  className?: string;
  isStreaming?: boolean;
}) {
  if (message.role === "divider") {
    return (
      <div className={["flex items-center gap-3 py-3", className].join(" ")}>
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)]">{message.text}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
    );
  }

  const isUser = message.role === "user";
  // ... rest of the component unchanged
```

- [ ] **Step 8.4: Run tests to verify they pass**

```bash
npx vitest run components/__tests__/ChatMessage.test.tsx
```

Expected: All PASS

- [ ] **Step 8.5: Commit**

```bash
git add components/ChatMessage.tsx components/__tests__/ChatMessage.test.tsx
git commit -m "feat: ChatMessage renders persona change divider"
```

---

## Task 9: Wire up EnglishChatbotPage

**Files:**
- Modify: `app/(app)/english-chatbot/page.tsx`
- Modify: `app/(app)/english-chatbot/__tests__/page.test.tsx`

- [ ] **Step 9.1: Update page tests**

Replace the entire contents of `app/(app)/english-chatbot/__tests__/page.test.tsx`:

```typescript
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EnglishChatbotPage, { getMessageSpacingClassName } from "@/app/(app)/english-chatbot/page";
import type { PageMessage } from "@/components/ChatMessage";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/UserContext", () => ({
  useUser: () => ({ name: "Người học", image: null }),
}));

describe("EnglishChatbotPage", () => {
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(
      screen.getByRole("heading", { name: "Xin chào! Chọn gia sư để bắt đầu" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I goed to school/i })).toHaveClass(
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-(--accent)",
    );
  });
});

describe("getMessageSpacingClassName", () => {
  it("returns empty string when there is no previous message", () => {
    const msg: PageMessage = { id: "1", role: "user", text: "Hello" };
    expect(getMessageSpacingClassName(msg, undefined)).toBe("");
  });

  it("returns mt-[4px] for consecutive same-role messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "assistant", text: "Second assistant" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[4px]");
  });

  it("returns mt-[28px] for role-switch messages", () => {
    expect(
      getMessageSpacingClassName(
        { id: "2", role: "user", text: "User reply" },
        { id: "1", role: "assistant", text: "First assistant" },
      ),
    ).toBe("mt-[28px]");
  });

  it("returns mt-[28px] for a divider following a user message", () => {
    expect(
      getMessageSpacingClassName(
        { id: "d1", role: "divider", text: "Switched to Christine Ho — IELTS Master" },
        { id: "1", role: "user", text: "Hello" },
      ),
    ).toBe("mt-[28px]");
  });
});
```

- [ ] **Step 9.2: Run tests to verify they fail**

```bash
npx vitest run app/\(app\)/english-chatbot/__tests__/page.test.tsx
```

Expected: FAIL — heading text doesn't match yet, `PageMessage` import doesn't exist from page

- [ ] **Step 9.3: Update `app/(app)/english-chatbot/page.tsx`**

Replace the entire file with the updated version. Key changes:
1. Import `PersonaSwitcher`, `DividerMessage`, `PageMessage`, `PERSONAS`, `DEFAULT_PERSONA_ID`
2. Update `messages` state to `PageMessage[]`
3. Update `getMessageSpacingClassName` signature to `PageMessage`
4. Add `selectedPersonaId` state
5. Add `handlePersonaChange` handler with divider insertion
6. Update `handleNewChat` to reset persona
7. Update `handleSelectConversation` to restore persona from conversation list
8. Filter dividers before sending to API in `send()`
9. Pass `personaId` in fetch calls
10. Add `PersonaSwitcher` to the input bar
11. Update welcome heading text

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Sparkles, BookOpen, MessageCircle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatMessage } from "@/components/ChatMessage";
import type { PageMessage } from "@/components/ChatMessage";
import { ConversationList } from "@/components/app/ConversationList";
import type { ConversationItem } from "@/components/app/ConversationList";
import { PersonaSwitcher } from "@/components/app/PersonaSwitcher";
import { deriveTitle } from "@/lib/chat/derive-title";
import { DEFAULT_PERSONA_ID, PERSONAS } from "@/lib/chat/personas";
import type { ChatMessage as AppChatMessage } from "@/lib/chat/types";

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

export default function EnglishChatbotPage() {
  const [messages, setMessages] = useState<PageMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState(DEFAULT_PERSONA_ID);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

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

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setActiveConversationId(null);
    setSelectedPersonaId(DEFAULT_PERSONA_ID);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    const conv = conversations.find((c) => c.id === id);
    if (conv?.personaId) {
      setSelectedPersonaId(conv.personaId);
    }
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
  }, [conversations]);

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

    let convId = activeConversationId;
    if (!convId) {
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: deriveTitle(t), personaId: selectedPersonaId }),
        });
        if (res.ok) {
          const created = await res.json() as { id: string; title: string; personaId: string };
          convId = created.id;
          setActiveConversationId(convId);
          setConversations((curr) => [
            {
              id: created.id,
              title: created.title,
              updatedAt: new Date().toISOString(),
              personaId: created.personaId,
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
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
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

            {hasMessages && (
              <div className="flex flex-col">
                {messages.map((m, index) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    className={getMessageSpacingClassName(m, messages[index - 1])}
                    isStreaming={isLoading && index === messages.length - 1 && m.role === "assistant"}
                  />
                ))}
                {isLoading && (
                  <div className="mt-[28px]">
                    <TypingIndicator />
                  </div>
                )}
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

        <div className="bg-(--bg)/80 px-4 py-4 backdrop-blur-md md:px-8">
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
    </div>
  );
}
```

- [ ] **Step 9.4: Run page tests to verify they pass**

```bash
npx vitest run "app/\(app\)/english-chatbot/__tests__/page.test.tsx"
```

Expected: All PASS

- [ ] **Step 9.5: Run full test suite**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 9.6: Commit**

```bash
git add app/\(app\)/english-chatbot/page.tsx app/\(app\)/english-chatbot/__tests__/page.test.tsx
git commit -m "feat: wire persona switcher into chatbot page"
```

---

## Done

All tasks complete. The persona switcher is fully implemented:

- 3 persona definitions with distinct system prompts
- `personaId` persisted in the `conversation` DB table
- Dropdown in the input bar, disabled while streaming
- Mid-conversation persona switch inserts a client-only divider
- Persona restored from conversation list when loading a past conversation
- Full test coverage across all layers
