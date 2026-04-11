# Story 3.1: Flashcard Immersive Mode & Card Redesign

Status: ready-for-dev

## Story

As a learner reviewing flashcards,
I want a distraction-free, full-screen card experience with CEFR-colored cards,
so that I can focus entirely on memorization.

## Acceptance Criteria

1. **Given** a user starting a flashcard review session **When** the session is active **Then** the module header (icon+title+subtitle row at lines 47–82 of `FlashcardSession.tsx`) is hidden, replaced by a thin Ant Design `<Progress>` bar pinned to the top.

2. **Given** a flashcard front **Then** it displays: headword (36px, `var(--font-display)`), phonetic (muted), CEFR badge pill (`<Tag>`), part of speech tag. Card background uses a subtle CEFR gradient:
   - A1/A2 → `green-50 → green-100` tones
   - B1/B2 → `amber-50 → amber-100` tones
   - C1/C2 → `rose-50 → rose-100` tones
   - No level → default `var(--accent)` muted gradient

3. **Given** a word without a CEFR level **Then** the card uses the default accent gradient (not blank/white).

4. **Given** an active session **Then** progress text shows "3 of 10 · ~2 min left" format. Estimate remaining time from average 12 seconds per card, updating each card advance.

5. **Given** a card back reveal **Then** 4 rating buttons (Quên/Khó/Ổn/Dễ) are displayed at the bottom — keep existing `RatingButtons` component.

6. **Given** session ends (state=`summary`) **Then** the module header returns (summary state shows the header again).

## Tasks / Subtasks

- [ ] Task 1: Refactor `FlashcardSession.tsx` for immersive mode (AC: #1, #6)
  - [ ] Remove the header block (lines 47–82) from `state === "active"` rendering path
  - [ ] Add a thin Ant Design `<Progress>` bar at the very top of the session container when active
  - [ ] Re-show the header block for `state !== "active"` (loading, empty, error, summary)
  - [ ] Use conditional rendering: `{state !== "active" && <ModuleHeader />}` pattern

- [ ] Task 2: Redesign `FlashcardCard.tsx` with CEFR gradients (AC: #2, #3)
  - [ ] Create `CEFR_GRADIENTS` lookup map:
    ```ts
    const CEFR_GRADIENTS: Record<string, string> = {
      A1: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
      A2: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
      B1: "linear-gradient(135deg, #fffbeb, #fef3c7)",
      B2: "linear-gradient(135deg, #fefce8, #fef9c3)",
      C1: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
      C2: "linear-gradient(135deg, #fdf2f8, #fce7f3)",
    };
    const DEFAULT_GRADIENT = "linear-gradient(135deg, var(--accent-muted), var(--bg))";
    ```
  - [ ] Apply gradient to the front `<Card>` `style.background` — use `CEFR_GRADIENTS[card.level ?? ""] ?? DEFAULT_GRADIENT`
  - [ ] Keep CEFR badge as `<Tag color={LEVEL_COLORS[card.level]}>` — already exists (line 67)
  - [ ] Ensure headword is 36px with `var(--font-display)` — already set (line 81)
  - [ ] Add phonetic display — already present (lines 86–90)

- [ ] Task 3: Add estimated time to `SessionProgress.tsx` (AC: #4)
  - [ ] Add `startTime` prop (timestamp of session start)
  - [ ] Compute average time per card: `(Date.now() - startTime) / current` or default 12s if `current === 0`
  - [ ] Display format: `"{current} of {total} · ~{minutesLeft} min left"` using `Math.ceil(remaining * avgPerCard / 60000)`
  - [ ] Pass `startTime` from `FlashcardSession` — store via `useRef(Date.now())` set when entering `active` state

- [ ] Task 4: Verify rating buttons stay intact (AC: #5)
  - [ ] No changes needed to `RatingButtons` — existing implementation is correct
  - [ ] Verify the 4 buttons render below card when flipped

## Dev Notes

### Architecture Patterns to Follow
- **Ant Design v6**: Use `<Card>`, `<Tag>`, `<Progress>`, `<Flex>`, `<Typography>`, `<Space>`, `<Button>` — NO raw HTML `<div>` for anything Ant Design provides.
- **CSS custom properties**: Use design tokens (`var(--radius-xl)`, `var(--shadow-lg)`, `var(--font-display)`, etc.) from `globals.css`.
- **Component animations**: Use project CSS classes `anim-fade-in`, `anim-fade-up` for enter animations. These auto-respect `prefers-reduced-motion`.

### CRITICAL: Do NOT
- **Do NOT** create new component files. All changes fit within existing files: `FlashcardSession.tsx`, `FlashcardCard.tsx`, `SessionProgress.tsx`.
- **Do NOT** use `framer-motion` or `tailwindcss` — project is pure Ant Design + CSS custom properties.
- **Do NOT** modify the `useFlashcardSession` hook — the hook API stays the same.
- **Do NOT** touch `EmptyState.tsx` or `SessionSummary.tsx` — they are out of scope for this story.

### Existing Code Map (touch these files only)
| File | Lines | What Changes |
|------|-------|-------------|
| `components/app/flashcards/FlashcardSession.tsx` | 223 | Hide header in active state, add thin progress bar, track session start time |
| `components/app/flashcards/FlashcardCard.tsx` | 202 | Add CEFR gradient backgrounds to front card face |
| `components/app/flashcards/SessionProgress.tsx` | 31 | Add estimated time remaining display |

### DueCard Type (from `lib/flashcard/types.ts`)
```ts
type DueCard = {
  query: string;
  headword: string;
  phonetic: string | null;
  level: string | null;        // "A1"|"A2"|"B1"|"B2"|"C1"|"C2"|null
  partOfSpeech: string | null;
  overviewVi: string;
  senses: { id, label, definitionVi, examples[], collocations[] }[];
};
```

### useFlashcardSession Hook API (from `hooks/useFlashcardSession.ts`)
```ts
const {
  state,         // "loading" | "active" | "empty" | "summary" | "error"
  currentCard,   // DueCard | undefined
  currentIndex,  // number
  totalDue,      // number
  stats,         // { totalReviewed, totalQuality, forgottenCount }
  isSubmitting,  // boolean
  nextReviewAt,  // string | null
  fetchDueCards, // () => Promise<void>
  submitReview,  // (quality: number) => Promise<void>
  restart,       // () => void
} = useFlashcardSession();
```

### Previous Learnings from Epic 1 & 2
- Hydration mismatch: never do `useState(browser-only-value)`. Use `null` initial → `useEffect` sets real value.
- Always use `isMobile === true` / `=== false` checks (not truthy/falsy) when SSR is involved.
- Build verifies: run `npm run build` to catch Turbopack import errors. Some icon names don't exist in `@ant-design/icons` v6 — verify before using.
- Ant Design `<Card>` body padding is set via `styles={{ body: { padding: ... } }}` not `bodyStyle` (v6 change).

### Project Structure Notes
- All flashcard components live in `components/app/flashcards/`.
- Shared components (`ProgressSegments`, `StreakFire`, `CelebrationOverlay`, etc.) in `components/app/shared/` — NOT used in this story but used in Story 3.2.
- No new files or folders needed.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — AC definition
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Page 5: Flashcards] — UX redesign spec
- [Source: components/app/flashcards/FlashcardSession.tsx] — Current session orchestrator
- [Source: components/app/flashcards/FlashcardCard.tsx] — Current card with 3D flip
- [Source: components/app/flashcards/SessionProgress.tsx] — Current progress bar
- [Source: lib/flashcard/types.ts] — DueCard type definition

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
