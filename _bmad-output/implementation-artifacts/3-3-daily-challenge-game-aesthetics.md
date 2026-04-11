# Story 3.3: Daily Challenge Game Aesthetics

Status: ready-for-dev

## Story

As a learner doing the daily challenge,
I want a game-like visual experience with progress tracking,
so that the challenge feels exciting rather than like homework.

## Acceptance Criteria

1. **Given** a user starting the daily challenge **When** exercises are displayed **Then** the progress dots (lines 113–132 of `page.tsx`) are replaced with a segmented progress bar using the shared `ProgressSegments` component. Completed segments show green+check, current segment pulses with accent, remaining segments are muted.

2. **Given** an exercise is displayed **Then** a type label with emoji is shown above the exercise:
   - `fill-in-blank` → "📝 Điền vào chỗ trống"
   - `sentence-order` → "🔄 Sắp xếp câu"
   - `translation` → "🌐 Dịch câu"
   - `error-correction` → "🔍 Sửa lỗi"

3. **Given** the header **Then** the `StreakDisplay` component is replaced with the shared `StreakFire` component (animated flame particles).

4. **Given** an active challenge **Then** time elapsed shows as a subtle "⏱ 2:34" timer in the header, updating every second.

## Tasks / Subtasks

- [ ] Task 1: Replace progress dots with `ProgressSegments` (AC: #1)
  - [ ] Import `ProgressSegments` from `@/components/app/shared`
  - [ ] Replace the dots `<Flex justify="center" gap={8}>` block (lines 113–132) with `<ProgressSegments current={currentExercise} total={challenge.exercises.length} />`
  - [ ] The component already renders completed=green, current=pulsing accent, remaining=border — matches AC exactly

- [ ] Task 2: Add exercise type labels with emoji (AC: #2)
  - [ ] Create `EXERCISE_TYPE_LABELS` map in `page.tsx`:
    ```ts
    const EXERCISE_TYPE_LABELS: Record<string, string> = {
      "fill-in-blank": "📝 Điền vào chỗ trống",
      "sentence-order": "🔄 Sắp xếp câu",
      "translation": "🌐 Dịch câu",
      "error-correction": "🔍 Sửa lỗi",
    };
    ```
  - [ ] Render `<Text type="secondary" style={{ fontSize: 13 }}>{EXERCISE_TYPE_LABELS[exercise.type]}</Text>` above the `<ExerciseCard>` wrapper

- [ ] Task 3: Replace `StreakDisplay` with `StreakFire` (AC: #3)
  - [ ] Remove import of `StreakDisplay` from `@/components/app/daily-challenge/StreakDisplay`
  - [ ] Import `StreakFire` from `@/components/app/shared`
  - [ ] Replace `<StreakDisplay currentStreak={streak.currentStreak} bestStreak={streak.bestStreak} />` with `<StreakFire streak={streak.currentStreak} />`
  - [ ] NOTE: `StreakDisplay` uses Tailwind classes (legacy) — `StreakFire` is the Ant Design pattern

- [ ] Task 4: Add live elapsed timer (AC: #4)
  - [ ] Create a `useElapsedTimer` hook or inline `useState` + `useEffect` with `setInterval(1000)`
  - [ ] Only tick when `state === "active"`
  - [ ] Start from `0` on active, stop on submitting/results/completed
  - [ ] Format as `MM:SS` — display as `<Text type="secondary">⏱ {formatted}</Text>` in the header
  - [ ] NOTE: The hook's `timeElapsedMs` is a snapshot, not live. Use independent `setInterval` for UI display

## Dev Notes

### CRITICAL: Do NOT
- **Do NOT** create new component files. All changes are in `app/(app)/daily-challenge/page.tsx`.
- **Do NOT** modify `ExerciseCard.tsx` or any exercise sub-components.
- **Do NOT** modify `useDailyChallenge.ts` — the hook API stays the same.
- **Do NOT** use Tailwind CSS — project uses Ant Design + CSS custom properties.
- **Do NOT** touch `ChallengeResults.tsx`, `CompletedState.tsx`, or `BadgeGallery.tsx` — those are Story 3.4 scope.

### Existing Code Map (touch this file only)
| File | Lines | What Changes |
|------|-------|-------------|
| `app/(app)/daily-challenge/page.tsx` | 169 | Replace dots→ProgressSegments, add type labels, swap StreakDisplay→StreakFire, add timer |

### useDailyChallenge Hook API (from `hooks/useDailyChallenge.ts`)
```ts
const {
  state,           // "loading" | "active" | "submitting" | "results" | "completed" | "error"
  challenge,       // DailyChallenge | null — contains exercises[]
  streak,          // { currentStreak, bestStreak, lastCompletedDate }
  badges,          // Badge[]
  currentExercise, // number (0-indexed)
  results,         // { answers, score, newBadges } | null
  error,           // string | null
  timeElapsedMs,   // number (snapshot, NOT live)
  answerExercise,  // (answer: string) => void
} = useDailyChallenge();
```

### Exercise Type (from `lib/daily-challenge/types.ts`)
```ts
type Exercise =
  | { type: "fill-in-blank"; instruction: string; data: FillInBlankData }
  | { type: "sentence-order"; instruction: string; data: SentenceOrderData }
  | { type: "translation"; instruction: string; data: TranslationData }
  | { type: "error-correction"; instruction: string; data: ErrorCorrectionData };
```

### ProgressSegments API (from `components/app/shared/ProgressSegments.tsx`)
```ts
<ProgressSegments current={currentIndex} total={totalCount} showLabels={false} />
// current: 0-indexed completed count (segments 0..current-1 are green)
// Segment at index `current` pulses accent, rest are muted
```

### StreakFire API (from `components/app/shared/StreakFire.tsx`)
```ts
<StreakFire streak={number} />
// Renders animated fire emoji + streak count
```

### Previous Learnings from Story 3.1/3.2
- `StreakDisplay` uses legacy Tailwind classes — must be replaced with `StreakFire` (Ant Design pattern)
- CSS animation classes `anim-fade-in`, `anim-fade-up` respect `prefers-reduced-motion`
- Ant Design `<Card>` body padding: `styles={{ body: { padding: ... } }}` (v6 API)
- Build-verify with `npm run build` — icon names differ between v5/v6

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — AC definition
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Page 5 & design system] — UX spec
- [Source: app/(app)/daily-challenge/page.tsx] — Current page
- [Source: components/app/shared/ProgressSegments.tsx] — Segmented progress bar
- [Source: components/app/shared/StreakFire.tsx] — Animated streak fire
- [Source: hooks/useDailyChallenge.ts] — Hook API

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
