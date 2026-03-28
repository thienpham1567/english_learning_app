# Persona / Mode Switcher — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Overview

Replace the hardcoded "Cô Minh" persona with a user-selectable persona switcher. Users choose from three AI tutors, each injecting a distinct system prompt into the LLM. The selected persona is persisted per-conversation in the database and restored when loading a previous conversation.

---

## Personas

| ID         | Display Name   | Mode Title        | Focus                                                                 |
|------------|----------------|-------------------|-----------------------------------------------------------------------|
| `simon`    | Simon Hosking  | Native Fluency    | Natural idioms, slang, conversational flow — speak like a native      |
| `christine`| Christine Ho   | IELTS Master      | Academic English, IELTS rubrics (Task Response, Coherence, Lexical Resource, Grammatical Range) |
| `eddie`    | Eddie Oliver   | TOEIC Master      | Business vocabulary, workplace communication, TOEIC listening/reading structures |

`simon` is the default persona for all new conversations.

---

## Architecture

### 1. Persona Definitions — `lib/chat/personas.ts`

A plain typed constant (no DB, no API). Each entry has:
- `id: string`
- `label: string` — display name shown in the dropdown
- `buildInstructions(input: { consecutiveVietnameseTurns: number }): string` — returns the full system prompt, including the Vietnamese nudge logic carried over from the existing `buildChatInstructions`.

`buildChatInstructions` in `lib/chat/build-chat-instructions.ts` is updated to delegate to the correct persona by `personaId`.

### 2. Database — `conversation` table

Add one column:

```sql
ALTER TABLE conversation ADD COLUMN persona_id TEXT NOT NULL DEFAULT 'simon';
```

A new Drizzle migration handles this. Existing rows default to `'simon'`.

### 3. API Changes

**`POST /api/conversations`**
- Accepts optional `personaId: string` in the request body.
- Saves it to the new `personaId` column. Defaults to `'simon'` if omitted or invalid.

**`POST /api/chat`**
- Accepts `personaId: string` in the request body.
- Passes it to `buildChatRequest`, which passes it to the instruction builder.
- Unknown `personaId` values fall back silently to `'simon'`.

**`GET /api/conversations` (list) and `GET /api/conversations/:id`**
- Return `personaId` alongside existing fields so the UI can restore it on load.

### 4. `buildChatRequest` — `lib/chat/build-chat-input.ts`

Updated signature:

```ts
buildChatRequest(messages: ChatMessage[], personaId: string)
```

Passes `personaId` and `consecutiveVietnameseTurns` to the instruction builder.

---

## UI

### PersonaSwitcher Component — `components/app/PersonaSwitcher.tsx`

- Ant Design `<Select>` component, compact size.
- Renders 3 options from the personas constant.
- Placed inside the input bar, to the left of the textarea.
- Fires `onChange(personaId: string)` prop.

### State in `EnglishChatbotPage`

- New state: `selectedPersonaId` — defaults to `'simon'`.
- Set from conversation record when loading an existing conversation.
- Passed to `PersonaSwitcher` as `value` and `onChange`.
- Sent as `personaId` in all `/api/chat` and `/api/conversations` POST requests.

### Persona Change Mid-Conversation (Divider)

When the user switches persona while `messages.length > 0`, a **client-only divider entry** is appended to the local messages array:

```ts
{ id: crypto.randomUUID(), role: 'divider', text: 'Switched to Christine Ho (IELTS Master)' }
```

- Never sent to the API.
- `ChatMessage` is updated to handle `role === 'divider'` — renders a centered horizontal rule with the text label.
- `ChatRole` in `lib/chat/types.ts` is **not changed**. Instead, `EnglishChatbotPage` defines a local `DividerMessage = { id: string; role: 'divider'; text: string }` type and uses `PageMessage = AppChatMessage | DividerMessage` for its local messages array. Divider entries are never sent to the API (the existing `isChatMessage` guard already rejects non-user/assistant roles).

### Loading an Existing Conversation

`handleSelectConversation` reads `personaId` from the conversation record and calls `setSelectedPersonaId`. If the field is absent (pre-migration rows), defaults to `'simon'`.

---

## Error Handling

- Unknown `personaId` in any API request silently falls back to `'simon'`. No 400 errors.
- Missing `personaId` on old conversation records (pre-migration) defaults to `'simon'` in the UI.
- Divider messages are display-only and never reach the API.

---

## Testing

| Area | Coverage |
|------|----------|
| `lib/chat/personas.ts` | Unit tests: each persona's `buildInstructions` returns correct prompt strings |
| `lib/chat/build-chat-instructions.ts` | Update existing tests to cover persona-aware delegation |
| `POST /api/chat` | `personaId` accepted and passed to instruction builder |
| `POST /api/conversations` | `personaId` stored; defaults to `'simon'` when omitted |
| `GET /api/conversations` | `personaId` returned in list |
| `PersonaSwitcher` | Renders 3 options; `onChange` fires correctly |
| `EnglishChatbotPage` | Persona switch inserts divider; persona restored on conversation load |

---

## Files Touched

| File | Change |
|------|--------|
| `lib/chat/personas.ts` | **New** — persona definitions |
| `lib/chat/build-chat-instructions.ts` | Updated to delegate to persona |
| `lib/chat/build-chat-input.ts` | Updated to accept and pass `personaId` |
| `lib/chat/types.ts` | No change — `ChatRole` stays `"user" \| "assistant"` |
| `lib/db/schema.ts` | Add `personaId` column to `conversation` table |
| `lib/db/migrations/<drizzle-generated>.sql` | New Drizzle migration (filename auto-generated by `drizzle-kit generate`) |
| `app/api/chat/route.ts` | Accept and pass `personaId` |
| `app/api/conversations/route.ts` | Accept and store `personaId`; return it in list |
| `app/api/conversations/[id]/route.ts` | Return `personaId` |
| `components/app/PersonaSwitcher.tsx` | **New** — dropdown component |
| `components/ChatMessage.tsx` | Handle `role === 'divider'` |
| `app/(app)/english-chatbot/page.tsx` | Wire up persona state, switcher, divider logic |
