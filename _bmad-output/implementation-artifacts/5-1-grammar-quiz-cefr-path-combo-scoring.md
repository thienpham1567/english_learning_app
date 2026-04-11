# Story 5.1: Grammar Quiz CEFR Path & Combo Scoring

Status: ready-for-dev

## Story

As a grammar learner,
I want to see my CEFR progression and earn combo streaks,
so that studying grammar feels like progression, not random quizzes.

## Acceptance Criteria

1. **CEFR visual path replaces pill buttons:** A visual CEFR path (A1──●──A2──●──B1──○──B2──○──C1──○──C2──○) replaces the current card-style level picker.
   - Completed levels show a checkmark ✓ 
   - Current level is highlighted (accent border/glow)
   - Uncompleted levels show empty circles
   - **Mapping:** easy=A1+A2, medium=B1+B2, hard=C1+C2

2. **Combo Counter during quiz:** Consecutive correct answers display a "🔥 x3 Combo!" counter above the question.

3. **Combo resets on incorrect:** The combo counter resets to 0 on wrong answers.

4. **Score summary shows combo stats:** The summary shows max combo, best combo, and weak topics.

5. **Weak topics show "Luyện thêm →" links:** Navigate to chatbot with Christine (IELTS) persona pre-selected.

## Tasks / Subtasks

- [ ] Task 1: Replace LevelPicker with CEFR path component
  - [ ] Create `components/app/grammar-quiz/CEFRPath.tsx`
  - [ ] Render horizontal path: A1 ── A2 ── B1 ── B2 ── C1 ── C2
  - [ ] Each node: circle + label, connected by horizontal lines
  - [ ] Map CEFR to difficulty: A1/A2 = "easy", B1/B2 = "medium", C1/C2 = "hard"
  - [ ] Clicking a node calls `onSelect(difficulty)` — selecting any within a tier selects the tier
  - [ ] Selected tier nodes get accent fill + glow
  - [ ] Unselected nodes: muted border, empty circle
  - [ ] Responsive: horizontal scroll on small viewports
  - [ ] Keep "🚀 Bắt đầu" button below the path

- [ ] Task 2: Add combo tracking to useGrammarQuiz hook
  - [ ] Add `combo: number` state (current streak)
  - [ ] Add `maxCombo: number` state (best streak in session)
  - [ ] In `answerQuestion`: if correct → `combo + 1`, update maxCombo; if incorrect → `combo = 0`
  - [ ] Reset both on `retryQuiz` and `newQuiz`
  - [ ] Return `combo` and `maxCombo` from the hook

- [ ] Task 3: Display combo counter in QuestionCard (AC: #2, #3)
  - [ ] Accept `combo` prop
  - [ ] When `combo >= 2`, show "🔥 x{combo} Combo!" badge above the question stem
  - [ ] Animate with `anim-pop-in` on combo change
  - [ ] Badge disappears when combo resets (AC: #3)

- [ ] Task 4: Update ScoreSummary with combo stats + "Luyện thêm →" (AC: #4, #5)
  - [ ] Accept `maxCombo` prop
  - [ ] Show "🔥 Combo cao nhất: x{maxCombo}" next to score
  - [ ] Weak topics: add "Luyện thêm →" button that navigates to `/english-chatbot?persona=christine`
  - [ ] Update page.tsx to pass `combo` and `maxCombo` from hook

## Dev Notes

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `components/app/grammar-quiz/LevelPicker.tsx` | 76 | **Replace entirely** → rename to `CEFRPath.tsx` |
| `hooks/useGrammarQuiz.ts` | 136 | Add combo/maxCombo tracking |
| `components/app/grammar-quiz/QuestionCard.tsx` | 290 | Add combo badge display |
| `components/app/grammar-quiz/ScoreSummary.tsx` | 138 | Add combo stats + "Luyện thêm" links |
| `app/(app)/grammar-quiz/page.tsx` | 175 | Update imports + pass new props |

### CEFR-to-Difficulty Mapping
```
A1, A2 → "easy"    (Cơ bản)
B1, B2 → "medium"  (Trung cấp)
C1, C2 → "hard"    (Nâng cao)
```

### Current State Machine (useGrammarQuiz.ts)
```
idle → loading → active → summary
         ↑                    ↓
         └─── retryQuiz ──────┘
         └─── newQuiz → idle
```

### Current LevelPicker (to be replaced)
Uses 3 Ant Design `<Card>` components in a vertical stack with labels:
- Dễ (easy) — color `#9AB17A`
- Trung bình (medium) — color `#C3CC9B`  
- Khó (hard) — color `#E4DFB5`

### Target CEFRPath Design
```
   A1 ─── A2 ─── B1 ─── B2 ─── C1 ─── C2
   (●)    (●)    (●)    (○)    (○)    (○)
   ────green────  ───accent───  ───muted───
```
- Nodes: 36px circles with labels below
- Lines: 2px solid connectors between circles
- Selected tier: filled accent circles + subtle glow
- Unselected: hollow muted border circles

### CRITICAL: Do NOT
- **Do NOT** change API contracts (`POST /grammar-quiz/generate`)
- **Do NOT** modify `GrammarQuestion` type
- **Do NOT** use Tailwind or framer-motion
- **Do NOT** add external state management (keep useState)

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.1] — AC definition
- [Source: hooks/useGrammarQuiz.ts] — State management hook
- [Source: components/app/grammar-quiz/LevelPicker.tsx] — Current level picker (to replace)
- [Source: components/app/grammar-quiz/QuestionCard.tsx] — Question display
- [Source: components/app/grammar-quiz/ScoreSummary.tsx] — Score + topic breakdown

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
