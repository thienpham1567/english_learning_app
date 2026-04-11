# Story 4.2: Chatbot Word Highlighting

Status: ready-for-dev

## Story

As a learner chatting with an AI tutor,
I want English vocabulary words to be highlighted and tappable in AI responses,
so that I can learn new words in context without leaving the conversation.

## Acceptance Criteria

1. **Given** an AI assistant message containing English vocabulary **When** the message renders **Then** English words (detected via regex with word boundary heuristics) are rendered as tappable spans with subtle underline styling.

2. **Given** highlighting **Then** a stopword list prevents common short/ambiguous words ("a", "an", "I", "me", "no", "am", "is", "the", etc.) from being highlighted.

3. **Given** a message with 200+ words **Then** highlighting renders within 100ms without visible layout shift.

4. **Given** a highlighted word is tapped **Then** the MiniDictionary component opens for that word.

5. **Given** a word has been previously saved **Then** it shows a subtle accent indicator (underline color change).

6. **Given** saving a word through MiniDictionary **Then** it adds to vocabulary AND creates a flashcard entry automatically.

## Tasks / Subtasks

- [ ] Task 1: Create `HighlightedText` component
  - [ ] Create `components/app/english-chatbot/HighlightedText.tsx`
  - [ ] Props: `{ text: string; onWordClick: (word: string, rect: DOMRect) => void; savedWords?: Set<string> }`
  - [ ] Regex: `/\b[A-Za-z]{3,}\b/g` — only match multi-letter English words
  - [ ] `STOPWORDS` set: "a", "an", "the", "and", "but", "for", "nor", "yet", "not", "can", "has", "had", "was", "are", "his", "her", "its", "our", "who", "how", "what", "that", "this", "with", "from", "into", "been", "have", "will", "they", "them", "then", "than", "also", "just", "very", "much", "more", "most", "some", "only", "each", "both", "such" — plus any word ≤2 chars
  - [ ] Split text into segments: plain text + highlighted spans
  - [ ] Highlighted spans: `cursor: pointer`, subtle dotted underline, `color: inherit`
  - [ ] Saved words: underline color → `var(--accent)` instead of `var(--text-muted)`
  - [ ] On word click: call `onWordClick(word, span.getBoundingClientRect())`

- [ ] Task 2: Create custom ReactMarkdown renderer for text nodes
  - [ ] In `ChatMessage.tsx`, create a custom `components` prop for `<ReactMarkdown>`
  - [ ] Override `p`, `li`, `strong`, `em` renderers to wrap their text children with `<HighlightedText>`
  - [ ] Only apply to assistant messages (not user messages)

- [ ] Task 3: Integrate MiniDictionary into ChatWindow
  - [ ] Import `useMiniDictionary` and `MiniDictionary` in `ChatWindow.tsx`
  - [ ] Pass `openForWord` down to `ChatMessage` via a new prop `onWordClick`
  - [ ] Render `<MiniDictionary>` at the end of the ChatWindow JSX
  - [ ] MiniDictionary floats over the chat using `position: fixed`

- [ ] Task 4: Fetch saved words for accent indicator (AC: #5)
  - [ ] On mount, fetch `GET /api/vocabulary` to get user's vocabulary list
  - [ ] Extract saved words into a `Set<string>` of lowercase queries
  - [ ] Pass to `HighlightedText` as `savedWords` prop
  - [ ] When a word is saved via MiniDictionary, add it to the Set

- [ ] Task 5: Performance optimization (AC: #3)
  - [ ] Memoize `HighlightedText` with `React.memo`
  - [ ] Memoize regex splitting with `useMemo`
  - [ ] Ensure no re-render on parent scroll

## Dev Notes

### Files to Create/Modify
| File | Action | What |
|------|--------|------|
| `components/app/english-chatbot/HighlightedText.tsx` | CREATE | Word highlighting + click spans |
| `components/ChatMessage.tsx` | MODIFY | Custom ReactMarkdown renderers for text nodes |
| `components/app/english-chatbot/ChatWindow.tsx` | MODIFY | Integrate MiniDictionary + pass onWordClick |

### CRITICAL: Do NOT
- **Do NOT** modify the MiniDictionary component — it was finalized in Story 4.1.
- **Do NOT** modify any API routes.
- **Do NOT** use Tailwind or framer-motion.
- **Do NOT** highlight words in user messages — only AI assistant responses.
- **Do NOT** break the existing streaming behavior.

### ChatMessage Current Architecture (from `components/ChatMessage.tsx`)
```tsx
// Line 176-201: AI message rendering
{isUser ? (
  <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>
) : (
  <div className="chat-markdown">
    <ReactMarkdown>{text}</ReactMarkdown>
    {isStreaming && <span className="cursor" />}
  </div>
)}
```
- AI messages are rendered via `<ReactMarkdown>` which parses markdown → HTML
- The `text` prop is raw markdown content
- `ReactMarkdown` can accept custom `components` to override default renderers

### ReactMarkdown Custom Components Pattern
```tsx
<ReactMarkdown
  components={{
    p: ({ children }) => <p>{highlightChildren(children)}</p>,
    li: ({ children }) => <li>{highlightChildren(children)}</li>,
  }}
>
  {text}
</ReactMarkdown>
```
Where `highlightChildren` recursively processes string children to inject `<HighlightedText>`.

### ChatWindow Message Flow (from `ChatWindow.tsx`)
```tsx
// Line 542-551: Message rendering loop
{messages.map((m, index) => (
  <div key={m.id}>
    <ChatMessage
      message={m}
      persona={activePersona}
      isStreaming={isLoading && index === messages.length - 1 && m.role === "assistant"}
    />
  </div>
))}
```
- ChatMessage needs a new `onWordClick` prop
- ChatWindow needs to render `<MiniDictionary>` as a sibling

### MiniDictionary API (from Story 4.1)
```tsx
import { useMiniDictionary } from "@/hooks/useMiniDictionary";
import { MiniDictionary } from "@/components/app/shared";

const { word, anchorRect, visible, openForWord, close } = useMiniDictionary();

<MiniDictionary word={word} anchorRect={anchorRect} visible={visible} onClose={close} />
```

### Vocabulary List API
```
GET /api/vocabulary → Array<{ query: string; saved: boolean; ... }>
```

### Previous Learnings
- `http` is `axios.create({ baseURL: "/api" })` — use `http.get("/vocabulary")`
- Build verify with `npm run build`
- Use `anim-*` CSS classes for animations
- Ant Design v6 patterns: `<Card>`, `<Flex>`, `<Typography>`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2] — AC definition
- [Source: components/ChatMessage.tsx] — Current message renderer
- [Source: components/app/english-chatbot/ChatWindow.tsx] — Chat orchestrator
- [Source: components/app/shared/MiniDictionary.tsx] — Floating dictionary
- [Source: hooks/useMiniDictionary.ts] — Hook API

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
