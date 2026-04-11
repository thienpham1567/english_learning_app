# Story 3.4: Daily Challenge Celebration Animations

Status: ready-for-dev

## Story

As a learner completing the daily challenge,
I want tiered celebration animations based on my score,
so that perfect scores feel extra special.

## Acceptance Criteria

1. **Given** a user completing all 5 exercises **When** score is 5/5 **Then** `CelebrationOverlay` tier="big" displays with "🎉 Hoàn hảo!" in golden text.

2. **Given** score is 4/5 **Then** show "👏 Xuất sắc!" with `CelebrationOverlay` tier="medium".

3. **Given** score is 3/5 **Then** show "👍 Tốt lắm!" with `CelebrationOverlay` tier="small".

4. **Given** score ≤2/5 **Then** show "💪 Cố lên!" with encouraging message (no confetti overlay).

5. **Given** new badge unlocks **Then** each new badge renders with a `anim-pop-in` bounce-in animation.

6. **Given** answer breakdown **Then** correct answers show green background + check icon; incorrect answers show red background + shake animation + correct answer displayed in green text.

7. **Given** `prefers-reduced-motion` is set **Then** all animations disabled — static display, no confetti, no shake.

## Tasks / Subtasks

- [ ] Task 1: Rewrite `ChallengeResults.tsx` with tiered celebration (AC: #1–#4)
  - [ ] Remove all legacy Tailwind classes — use Ant Design `Card`, `Flex`, `Typography`, `Tag`, `Space`
  - [ ] Import `CelebrationOverlay` and `StreakFire` from `@/components/app/shared`
  - [ ] Create tiered celebration logic:
    ```ts
    const TIERS = [
      { min: 5, tier: "big" as const, emoji: "🎉", label: "Hoàn hảo!", color: "#d4a017" },
      { min: 4, tier: "medium" as const, emoji: "👏", label: "Xuất sắc!", color: "var(--accent)" },
      { min: 3, tier: "small" as const, emoji: "👍", label: "Tốt lắm!", color: "var(--success)" },
      { min: 0, tier: null, emoji: "💪", label: "Cố lên!", color: "var(--text-secondary)" },
    ];
    const matched = TIERS.find(t => score >= t.min)!;
    ```
  - [ ] Show `CelebrationOverlay` only when `matched.tier !== null`
  - [ ] Replace `StreakDisplay` (Tailwind) with `StreakFire` (Ant Design)

- [ ] Task 2: Add badge bounce-in animation (AC: #5)
  - [ ] Rewrite new badges section using Ant Design `Card` components
  - [ ] Each new badge gets `className="anim-pop-in anim-delay-{i}"` for staggered bounce

- [ ] Task 3: Animate answer breakdown rows (AC: #6)
  - [ ] Replace Tailwind-styled answer rows with Ant Design `Card` + `Flex`
  - [ ] Correct: green border + `CheckCircleFilled` icon + `anim-fade-up` entrance
  - [ ] Incorrect: red border + `CloseCircleFilled` icon + `anim-shake` CSS class + show explanation in green text
  - [ ] Add `anim-shake` keyframe to `globals.css` if not present

- [ ] Task 4: Add `anim-shake` CSS animation (AC: #6, #7)
  - [ ] Add to `globals.css` after existing animation utilities:
    ```css
    .anim-shake {
      animation: shake 0.4s ease-in-out;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }
    ```
  - [ ] Add `.anim-shake` to the `prefers-reduced-motion` disable list

- [ ] Task 5: Migrate `BadgeGallery.tsx` from Tailwind to Ant Design (optional, if time)
  - [ ] Replace Tailwind classes with Ant Design `Tag`, `Flex`, `Typography`
  - [ ] Keep existing logic, only change markup

- [ ] Task 6: Migrate `CompletedState.tsx` — replace `StreakDisplay` with `StreakFire` (cleanup)
  - [ ] Replace `StreakDisplay` import with `StreakFire` from shared
  - [ ] Replace Tailwind markup with Ant Design components

## Dev Notes

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `components/app/daily-challenge/ChallengeResults.tsx` | 86 | Full rewrite: tiered celebration, animated answers, badges |
| `components/app/daily-challenge/BadgeGallery.tsx` | 29 | Migrate Tailwind → Ant Design |
| `components/app/daily-challenge/CompletedState.tsx` | 97 | Replace StreakDisplay → StreakFire, migrate Tailwind → Ant Design |
| `app/globals.css` | 676 | Add `anim-shake` keyframe + reduced-motion entry |

### CRITICAL: Do NOT
- **Do NOT** modify `page.tsx` — it was updated in Story 3.3 and is stable.
- **Do NOT** modify `ExerciseCard.tsx` or exercise sub-components.
- **Do NOT** modify `useDailyChallenge.ts` — hook API stays the same.
- **Do NOT** use `framer-motion` or `tailwindcss` — project is pure Ant Design + CSS custom properties.

### CelebrationOverlay API
```ts
<CelebrationOverlay
  tier="big" | "medium" | "small"
  visible={boolean}
  onComplete={() => void}
>
  <children />  // content displayed over the confetti
</CelebrationOverlay>
```
- `tier="big"` → large confetti explosion, longer duration
- `tier="medium"` → moderate confetti
- `tier="small"` → brief flash, minimal confetti

### StreakFire API
```ts
<StreakFire streak={number} />
```

### ExerciseAnswer Type
```ts
type ExerciseAnswer = {
  exerciseIndex: number;
  answer: string;
  isCorrect?: boolean;
  explanation?: string;
};
```

### Badge Type
```ts
type Badge = {
  id: string;
  emoji: string;
  label: string;
  requiredStreak: number;
  unlocked: boolean;
};
```

### Existing CSS Animation Classes (from `globals.css`)
- `anim-fade-in`, `anim-fade-up`, `anim-scale-in`, `anim-pop-in`, `anim-bounce-emoji`
- `anim-delay-1` through `anim-delay-8` for staggering
- All auto-disabled by `prefers-reduced-motion: reduce`
- **Missing:** `anim-shake` — must be added

### Previous Learnings
- Legacy components (StreakDisplay, BadgeGallery) still use Tailwind classes — this story migrates them
- `CelebrationOverlay` `tier="small"` auto-dismisses after 200ms — good for ≤3 score tier
- Ant Design v6: use `styles={{ body: { padding: ... } }}` not `bodyStyle`
- Build verify with `npm run build` before submit

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.4] — AC definition
- [Source: components/app/daily-challenge/ChallengeResults.tsx] — Current results (Tailwind)
- [Source: components/app/daily-challenge/CompletedState.tsx] — Current completed (Tailwind)
- [Source: components/app/daily-challenge/BadgeGallery.tsx] — Current badges (Tailwind)
- [Source: components/app/shared/CelebrationOverlay.tsx] — Overlay API
- [Source: app/globals.css] — Animation utilities

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
