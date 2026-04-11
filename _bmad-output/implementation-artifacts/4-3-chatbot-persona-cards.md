# Story 4.3: Chatbot Persona Cards

Status: ready-for-dev

## Story

As a new user starting a conversation,
I want to see visual persona cards for each AI tutor,
so that I can choose the right tutor for my learning goal.

## Acceptance Criteria

1. **Given** a new conversation with no messages **When** the conversation starts **Then** visual persona cards are displayed showing: avatar icon, persona name, specialty, and 1-line description.

2. **Given** a persona card is tapped **Then** it selects it as the conversation partner (sets `selectedPersonaId`).

3. **Given** a persona is selected **Then** the selected persona is used for the first message and subsequent messages.

4. **Given** the persona cards are displayed **Then** the persona cards replace the current dropdown selector in the empty state (suggestion cards remain below the selected persona's suggestions).

## Tasks / Subtasks

- [ ] Task 1: Add `specialty` and `description` fields to Persona type
  - [ ] In `lib/chat/personas.ts`, add `specialty: string` and `description: string` to the `Persona` type
  - [ ] Add data for each persona:
    - Simon: specialty="Native Fluency", description="Luyện nói tự nhiên như người bản xứ."
    - Christine: specialty="IELTS Master", description="Chấm bài, luyện Writing & Speaking theo chuẩn IELTS."
    - Eddie: specialty="TOEIC Master", description="Tiếng Anh thương mại, email, và luyện TOEIC."

- [ ] Task 2: Create persona card grid in empty state (AC: #1, #4)
  - [ ] In `ChatWindow.tsx`, replace the current hero section (big avatar + title + description) with a persona card grid
  - [ ] Each persona card shows: avatar (48px), name (bold), specialty tag, 1-line description
  - [ ] Use Ant Design `<Card>`, `<Flex>`, `<Typography>`, `<Tag>`
  - [ ] Selected persona card has accent border + subtle background
  - [ ] Cards animate in with `anim-fade-up anim-delay-{i}`

- [ ] Task 3: Wire persona selection (AC: #2, #3)
  - [ ] Clicking a persona card calls `setSelectedPersonaId(persona.id)` + updates suggestions
  - [ ] The selected card gets visual highlight (border-color, background)
  - [ ] Suggestion cards below update to show the selected persona's suggestions

- [ ] Task 4: Keep PersonaSwitcher in input bar (no removal)
  - [ ] PersonaSwitcher in the input bar remains — it's still useful for switching mid-conversation
  - [ ] AC says "replace the current dropdown selector" — this refers to the empty state hero, not the input bar

## Dev Notes

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `lib/chat/personas.ts` | 130 | Add `specialty` and `description` fields to type + data |
| `components/app/english-chatbot/ChatWindow.tsx` | 748 | Replace empty-state hero with persona card grid |

### CRITICAL: Do NOT
- **Do NOT** remove `PersonaSwitcher` from the input bar.
- **Do NOT** modify the `ChatMessage` component.
- **Do NOT** change the streaming or message-sending logic.
- **Do NOT** use Tailwind or framer-motion.

### Current Empty State Structure (ChatWindow.tsx, lines 443–553)
```tsx
{!hasMessages && !isLoadingMessages && (
  <div className="anim-fade-in" ...>
    {/* Big avatar + online dot */}
    <ActiveAvatar size={64} />
    
    {/* Title: "Xin chào! Chọn gia sư để bắt đầu" */}
    <h2>...</h2>
    
    {/* Description */}
    <p>Chọn gia sư phù hợp...</p>
    
    {/* Suggestion cards grid */}
    {suggestions.map((s, i) => (
      <button onClick={() => send(s.text)}>...</button>
    ))}
  </div>
)}
```

**Replace:** The avatar + title + description section  
**Keep:** The suggestion cards grid (but update to selected persona's suggestions)

### Persona Data Structure (Current)
```ts
type Persona = {
  id: string;
  label: string;  // "Simon Hosking — Native Fluency"
  avatar: ComponentType<{ size?: number }>;
  buildInstructions: (input) => string;
  suggestions: readonly { text: string; icon: ComponentType }[];
};
```

### Target Card Design
```
┌─────────────────────────────┐
│  [Avatar]  Simon Hosking    │
│           (Native Fluency)  │
│  Luyện nói tự nhiên như     │
│  người bản xứ.             │
└─────────────────────────────┘
```
- 3 cards in a row (responsive: 1 on mobile)
- Selected: accent border + light accent background
- Unselected: default border + surface background

### Previous Learnings
- Ant Design v6: `styles={{ body: { padding: ... } }}` not `bodyStyle`
- Build verify with `npm run build`
- CSS animations: `anim-fade-up`, `anim-pop-in`, `anim-delay-N`

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3] — AC definition
- [Source: lib/chat/personas.ts] — Persona type + data
- [Source: components/app/english-chatbot/ChatWindow.tsx#L443-553] — Current empty state
- [Source: components/app/english-chatbot/PersonaSwitcher.tsx] — Current dropdown

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
