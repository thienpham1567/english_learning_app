# Story 4.1: MiniDictionary Component

Status: ready-for-dev

## Story

As a user,
I want a floating dictionary popup that works across modules,
so that I can look up any English word without leaving my current context.

## Acceptance Criteria

1. **Given** a word is tapped in a supported context (chatbot, quiz) **When** the MiniDictionary opens **Then** it displays a floating card positioned near the tapped word with: headword, phonetic, part of speech, Vietnamese translation.

2. **Given** the MiniDictionary is open **Then** a "Lưu" button saves the word to vocabulary + flashcard pipeline via existing `PATCH /api/vocabulary/{query}/saved` endpoint with `{ saved: true }`.

3. **Given** the MiniDictionary is open **Then** a "Tra cứu" button navigates to the dictionary page with the word pre-filled (`/dictionary?q={word}`).

4. **Given** the MiniDictionary is open **Then** tapping/clicking outside the card closes it.

5. **Given** the tapped word is near the edge of the viewport **Then** the card adjusts its position to avoid going off-screen.

## Tasks / Subtasks

- [ ] Task 1: Create `MiniDictionary` component
  - [ ] Create `components/app/shared/MiniDictionary.tsx`
  - [ ] Props: `{ word: string; anchorRect: DOMRect | null; visible: boolean; onClose: () => void }`
  - [ ] When `visible && word`, call `GET /api/vocabulary/{word}/detail` to fetch word data
  - [ ] Show loading state (Ant Design `<Spin />`) while fetching
  - [ ] Show fetched data: headword, phonetic, part of speech, overviewVi
  - [ ] Use Ant Design `<Card>`, `<Typography>`, `<Tag>`, `<Button>`, `<Flex>`, `<Space>`
  - [ ] Position as floating card using `position: fixed` near `anchorRect`

- [ ] Task 2: Implement positioning logic (AC: #1, #5)
  - [ ] Calculate card position from `anchorRect`:
    - Default: below and centered on the word
    - If too close to bottom → show above
    - If too close to right edge → shift left
    - If too close to left edge → shift right
  - [ ] Card maxWidth: 320px, with subtle shadow and border-radius
  - [ ] Use `useEffect` with `anchorRect` to recalculate position

- [ ] Task 3: Add "Lưu" button (AC: #2)
  - [ ] Button calls `http.patch(/vocabulary/${encodeURIComponent(word)}/saved, { saved: true })`
  - [ ] Show success feedback: `message.success("Đã lưu từ!")` or button state change
  - [ ] Handle error: `message.error("Không thể lưu")`
  - [ ] After save, update button to disabled/checked state

- [ ] Task 4: Add "Tra cứu" button (AC: #3)
  - [ ] Use `useRouter().push(/dictionary?q=${encodeURIComponent(word)})`
  - [ ] Close the MiniDictionary after navigation

- [ ] Task 5: Click-outside-to-close (AC: #4)
  - [ ] Add `useEffect` with `mousedown` event listener on `document`
  - [ ] Check if click target is inside the card ref — if not, call `onClose()`
  - [ ] Clean up listener on unmount

- [ ] Task 6: Create `useMiniDictionary` hook
  - [ ] Manages state: `{ word, anchorRect, visible }`
  - [ ] Exposes `openForWord(word: string, rect: DOMRect)` and `close()`
  - [ ] Used by parent components (chatbot, quiz) to trigger the popup

- [ ] Task 7: Export from shared index
  - [ ] Add `MiniDictionary` and `useMiniDictionary` to `components/app/shared/index.ts`

## Dev Notes

### Files to Create/Modify
| File | Action | What |
|------|--------|------|
| `components/app/shared/MiniDictionary.tsx` | CREATE | Floating dictionary popup component |
| `hooks/useMiniDictionary.ts` | CREATE | State management hook |
| `components/app/shared/index.ts` | MODIFY | Add export |

### API Endpoints Used
```
GET /api/vocabulary/{query}/detail → VocabularyWithNearby (cached dictionary data)
PATCH /api/vocabulary/{query}/saved → { saved: true } (save to vocabulary)
```

### VocabularyWithNearby Response Shape
```ts
{
  query: string;
  headword: string;
  phonetic: string | null;
  phoneticsUs: string | null;
  phoneticsUk: string | null;
  partOfSpeech: string | null;
  level: string | null;          // CEFR
  overviewVi: string;
  overviewEn: string;
  senses: Array<{
    id: string;
    label: string;
    definitionVi: string;
    definitionEn: string;
    examples: Array<{ en: string; vi: string }>;
    collocations: Array<{ en: string; vi: string }>;
  }>;
  nearby: Array<{ query: string; headword: string }>;
}
```

### CRITICAL: Do NOT
- **Do NOT** modify dictionary page or any existing API routes.
- **Do NOT** integrate with chatbot yet — that's Story 4.2.
- **Do NOT** use Tailwind or framer-motion — Ant Design + CSS custom properties only.
- **Do NOT** create a context provider — the hook pattern is sufficient.

### Architecture Notes
- The component must be **reusable** — it will be consumed by chatbot (4.2), quiz, and potentially other modules.
- Use `position: fixed` (not `absolute`) so it works regardless of scroll context.
- The `anchorRect` prop uses `getBoundingClientRect()` from the tapped element.
- The lookup fetches from the **vocabulary detail API** which returns cached dictionary data.
- The save action uses the **vocabulary saved API** (PATCH) which was already in the dictionary page.

### CEFR Colors (reuse from FlashcardCard)
```ts
const LEVEL_COLORS: Record<string, string> = {
  A1: "green", A2: "cyan", B1: "blue", B2: "gold", C1: "orange", C2: "volcano",
};
```

### Previous Learnings
- Ant Design v6: `<Card>` body padding via `styles={{ body: { padding: ... } }}`.
- `http` is the project's HTTP client wrapper (`@/lib/http`) — not raw `fetch` or `axios`.
- Build verify with `npm run build` before submit.
- Animations: use `anim-fade-in`, `anim-scale-in` CSS classes.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1] — AC definition
- [Source: app/api/vocabulary/[query]/detail/route.ts] — Dictionary lookup API
- [Source: app/api/vocabulary/[query]/saved/route.ts] — Save vocabulary API
- [Source: app/(app)/dictionary/page.tsx] — Existing lookup + save pattern
- [Source: lib/schemas/vocabulary.ts] — VocabularyWithNearby type
- [Source: components/app/shared/index.ts] — Shared component exports

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
