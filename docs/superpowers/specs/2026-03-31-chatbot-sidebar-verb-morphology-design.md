# Chatbot UI Stability & Dictionary Verb Morphology

**Date:** 2026-03-31
**Status:** Approved

---

## Feature 1: Chatbot UI Stability & Seamless Transitions

### Problem

Both `/english-chatbot/page.tsx` and `/english-chatbot/[conversationId]/page.tsx` render `<EnglishChatbotView>`, which includes `<ConversationList>` inline. Navigating between conversations (or starting a new one) remounts the entire component tree, causing the sidebar to flicker/disappear and remount.

### Solution: Shared Layout with Context

Create a persistent layout at `app/(app)/english-chatbot/layout.tsx` that owns the conversation sidebar. Only the chat content area changes on navigation.

### Architecture

```
english-chatbot/layout.tsx          ← NEW: persistent sidebar wrapper
├── ConversationList                ← lives here (never remounts)
├── ChatConversationProvider        ← NEW: React context for shared state
│   └── {children}                  ← dynamic route content
│       ├── page.tsx               ← renders ChatWindow (new chat)
│       └── [conversationId]/page.tsx ← renders ChatWindow (existing)

ChatWindow.tsx                      ← NEW: extracted from EnglishChatbotView
                                      (chat area only, no sidebar)
```

### Component Responsibilities

**`english-chatbot/layout.tsx`**
- Renders the outer flex container (currently the root div of `EnglishChatbotView`)
- Renders `<ConversationList>` persistently
- Wraps `{children}` in `<ChatConversationProvider>`

**`ChatConversationProvider` (new context)**
- Owns shared state: `conversations` list, `loadConversations()`, `handleDeleteConversation()`
- Fetches conversation list on mount
- Provides context to both the sidebar and the chat window
- The sidebar reads `conversations`, `activeId`, `onNew`, `onDelete` from context
- The chat window calls `loadConversations()` after sending a first message (to update the list)

**`ChatWindow.tsx` (new component, extracted from `EnglishChatbotView`)**
- Receives `conversationId` as prop
- Owns: `messages`, `input`, `isLoading`, `error`, `selectedPersonaId`, scroll state
- Contains: `ChatHeader`, message list, input area, `PersonaSwitcher`
- All streaming/sending logic lives here

**Changes to existing `EnglishChatbotView.tsx`**
- This component is effectively replaced by the layout + ChatWindow split
- Can be deleted once migration is complete

### Loading State

When navigating between conversations, `ChatWindow` shows a **skeleton loader** inside the chat area while messages are being fetched. The skeleton mimics the chat message layout:
- A header bar placeholder
- 3-4 alternating message bubble placeholders (left/right aligned)
- Uses the same `animate-pulse` + `bg-[var(--bg-deep)]` pattern from `DictionaryResultCard`

The sidebar remains fully interactive during loading. No full-page refresh.

### State Flow

```
User clicks conversation in sidebar
  → Next.js navigates to /english-chatbot/{id}
  → Layout stays mounted (sidebar persists)
  → ChatWindow remounts with new conversationId
  → Shows skeleton loader
  → Fetches messages from /api/conversations/{id}/messages
  → Replaces skeleton with message list

User clicks "New Chat"
  → router.push("/english-chatbot")
  → Layout stays mounted
  → ChatWindow remounts with conversationId=null
  → Shows welcome screen (no skeleton needed)

User sends first message in new chat
  → POST /api/conversations → creates conversation
  → router.replace(/english-chatbot/{newId})
  → Calls loadConversations() from context → sidebar updates
  → Layout stays mounted throughout
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `app/(app)/english-chatbot/layout.tsx` | Create |
| `components/app/ChatWindow.tsx` | Create (extracted from EnglishChatbotView) |
| `components/app/ChatConversationProvider.tsx` | Create |
| `app/(app)/english-chatbot/page.tsx` | Modify (render ChatWindow with null) |
| `app/(app)/english-chatbot/[conversationId]/page.tsx` | Modify (render ChatWindow with id) |
| `components/app/EnglishChatbotView.tsx` | Delete after migration |
| `components/app/ConversationList.tsx` | Minor: read from context instead of props |

---

## Feature 2: Dictionary Advanced Verb Morphology

### Problem

The dictionary currently has no verb form handling. Searching "took" and "take" produces separate, unlinked entries. Users don't see conjugation patterns or pronunciation differences across verb forms.

### Solution: Extend Schema + AI Prompt + New UI Section

Add an optional `verbForms` array to the `Vocabulary` schema. The AI populates it when the word is a verb. A new `VerbFormsSection` component renders the forms below the headword phonetics.

### Schema Extension

```typescript
const VerbFormSchema = z.object({
  label: z.string(),              // "Infinitive", "Past Simple", etc.
  form: z.string(),               // "sustained", "went", etc.
  phoneticsUs: z.string().nullable(),  // US IPA for this specific form
  phoneticsUk: z.string().nullable(),  // UK IPA for this specific form
  isIrregular: z.boolean(),       // true if form doesn't follow regular rules
});

// Added to VocabularySchema:
verbForms: z.array(VerbFormSchema).nullable().default(null)
```

### Verb Forms Included (5 forms)

| Label | Regular Example | Irregular Example |
|-------|----------------|-------------------|
| Infinitive | sustain | go |
| 3rd Person Singular | sustains | goes |
| Past Simple | sustained | went |
| Past Participle | sustained | gone |
| Present Participle | sustaining | going |

### AI Prompt Addition

Append to `buildDictionaryInstructions()`:

> "If the word is a verb, populate `verbForms` with exactly five entries: Infinitive, 3rd Person Singular, Past Simple, Past Participle, Present Participle. For each form provide its own US and UK IPA transcriptions (pronunciation can differ between forms, e.g. read /riːd/ vs read /rɛd/). Set `isIrregular` to true for any form that does not follow standard English conjugation rules. If the word is not a verb, set `verbForms` to null."

### UI: VerbFormsSection Component

**Placement:** In `DictionaryResultCard`, between the phonetics section and the overview section.

**Renders only when:** `vocabulary.verbForms` is non-null and non-empty.

**Layout:**
- Section header: "DẠNG ĐỘNG TỪ" (uppercase, same style as other section headers)
- Grid of form cards (3 columns on wide, 2 on narrow)
- Each card shows:
  - Label (e.g., "Past Simple") in muted text
  - Form text (e.g., "sustained") in semi-bold
  - IPA transcription in mono font, `bg-[var(--bg-deep)]` pill
  - Audio button (Web Speech API, speaks the specific form text)
  - If `isIrregular`: small orange "Bất quy tắc" Tag badge

**Audio:** Uses the existing `speak()` pattern but passes the specific verb form string instead of the headword.

### Cache Compatibility

- `verbForms` defaults to `null` via `.default(null)`
- Existing cached entries parse successfully with `verbForms: null`
- No cache migration or purge needed
- New verb lookups will populate the field automatically

### Files to Create/Modify

| File | Action |
|------|--------|
| `lib/schemas/vocabulary.ts` | Add `VerbFormSchema` and `verbForms` field |
| `lib/dictionary/prompt.ts` | Add verb forms instruction |
| `components/dictionary/VerbFormsSection.tsx` | Create |
| `components/dictionary/DictionaryResultCard.tsx` | Import and render `VerbFormsSection` |

---

## Out of Scope

- Linking different verb forms to the same dictionary entry (e.g., "took" → "take")
- External audio APIs (Web Speech API only, with architecture for future plug-in)
- Mobile-specific layout changes beyond responsive CSS
- Changes to the vocabulary tracking module
