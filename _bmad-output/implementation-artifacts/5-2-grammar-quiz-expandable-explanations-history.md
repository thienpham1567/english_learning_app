# Story 5.2: Grammar Quiz Expandable Explanations & History

Status: ready-for-dev

## Story

As a grammar learner,
I want explanations to be optional and to see my quiz history,
so that I can focus on flow or dive deep as I choose.

## Acceptance Criteria

1. **Compact result badge:** When answer is revealed, show "Đúng ✓" (green) or "Sai ✗" (red) with correct answer highlighted. This replaces the always-visible explanation.

2. **Expandable explanation:** An "Xem giải thích" toggle (collapsed by default) wraps the full explanation block. User can expand/collapse it.

3. **Slide transitions:** Question transitions use slide-left animation when advancing to next question.

4. **History panel:** A "Lịch sử" icon (🕑) in the page header opens a panel showing last 10 quiz results with date, level, and score. Results persist in localStorage.

## Tasks / Subtasks

- [ ] Task 1: Refactor QuestionCard explanation to collapsible
  - [ ] Add `showExplanation` state (default: false)
  - [ ] When `isRevealed`: show compact result badge (Đúng ✓ / Sai ✗)
  - [ ] Add "Xem giải thích ▼" button that toggles full explanation visibility
  - [ ] When expanded, show the existing explanation+examples block
  - [ ] Keep VN/EN language toggle inside the expanded section

- [ ] Task 2: Add slide-left transition for question changes
  - [ ] Add `@keyframes slideInLeft` and `.anim-slide-in-left` to `globals.css`
  - [ ] In `grammar-quiz/page.tsx`, change the active question wrapper from `anim-fade-in` to `anim-slide-in-left`
  - [ ] Ensure the `key={currentIndex}` forces re-mount + re-animation

- [ ] Task 3: Quiz history persistence + panel
  - [ ] Create `components/app/grammar-quiz/QuizHistory.tsx` drawer/panel component
  - [ ] Store quiz results in localStorage key `grammar-quiz-history`
  - [ ] Shape: `{ date: string; level: string; score: number; total: number }[]`
  - [ ] Keep last 10 entries (push + slice)
  - [ ] Save entry when quiz transitions to "summary" state
  - [ ] In `useGrammarQuiz.ts`, add `saveHistory` effect or callback

- [ ] Task 4: Add history icon to page header
  - [ ] Add a HistoryOutlined icon button in the page header (right side)
  - [ ] Clicking it opens the `QuizHistory` panel
  - [ ] Panel shows list of 10 last results with date, level badge, score

## Dev Notes

### Files to Modify
| File | What Changes |
|------|-------------|
| `components/app/grammar-quiz/QuestionCard.tsx` (322 lines) | Wrap explanation in collapsible, add compact result badge |
| `app/globals.css` | Add `@keyframes slideInLeft` + `.anim-slide-in-left` |
| `app/(app)/grammar-quiz/page.tsx` (179 lines) | Change question animation, add history icon to header |
| `hooks/useGrammarQuiz.ts` (155 lines) | Add history save on quiz completion |

### Files to Create
| File | Purpose |
|------|---------|
| `components/app/grammar-quiz/QuizHistory.tsx` | Drawer component listing last 10 quiz results |

### Current Explanation Block (QuestionCard.tsx L185-271)
Currently the explanation is **always visible** when `isRevealed` is true. It contains:
- "GIẢI THÍCH" header with VN/EN toggle
- Explanation text (`explanationVi` / `explanationEn`)
- "VÍ DỤ" section with 2 example sentences

### Target Behavior
```
┌─ Answer revealed ──────────────────┐
│  ✓ Đúng! Đáp án: C — whether       │  ← compact badge (always visible)
│  ▸ Xem giải thích                    │  ← toggle (collapsed by default)
│                                      │
│  ┌─ Expanded ──────────────────────┐ │
│  │ GIẢI THÍCH          [VN] [EN]   │ │
│  │ Confirm whether...              │ │
│  │ VÍ DỤ                           │ │
│  │ 1. Please confirm whether...    │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### History Entry Shape
```ts
type QuizHistoryEntry = {
  date: string;       // ISO string
  level: string;      // "easy" | "medium" | "hard"
  score: number;
  total: number;
};
```

### Existing CSS Animations Available
- `anim-fade-in`, `anim-fade-up`, `anim-slide-in-right`, `anim-slide-in-up`
- `anim-pop-in`, `anim-scale-in`, `anim-bounce-emoji`
- Need to add: `anim-slide-in-left`

### CRITICAL: Do NOT
- **Do NOT** change API contracts
- **Do NOT** modify `GrammarQuestion` type
- **Do NOT** use Tailwind, framer-motion, or external state management

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.2] — AC definition
- [Source: components/app/grammar-quiz/QuestionCard.tsx L185-271] — Current explanation block
- [Source: app/(app)/grammar-quiz/page.tsx L49-83] — Page header
- [Source: hooks/useGrammarQuiz.ts] — State management hook
- [Source: app/globals.css L643-646] — Existing slide animations

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
