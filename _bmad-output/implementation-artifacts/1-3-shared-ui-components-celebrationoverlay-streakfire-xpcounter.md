# Story 1.3: Shared UI Components — CelebrationOverlay, StreakFire, XPCounter

Status: in-progress

## Story

As a user,
I want satisfying visual celebrations when I complete activities,
so that I feel rewarded and motivated to continue learning.

## Acceptance Criteria

1. `CelebrationOverlay` with tier="small" shows a green border flash (200ms)
2. `CelebrationOverlay` with tier="medium" shows scale-bounce animation + summary content slot
3. `CelebrationOverlay` with tier="big" shows fullscreen confetti particles + scale-bounce + content overlay
4. `StreakFire` renders CSS-only animated flame particles that scale with streak (1-day=small, 7-day=medium, 30-day=large)
5. `XPCounter` animates number counting up from previous value to new value
6. All animations respect `prefers-reduced-motion` (static display, no animation)

## Tasks / Subtasks

- [x] Task 1: Add new keyframes to globals.css (confetti, flame-flicker)
- [x] Task 2: Create `CelebrationOverlay` component
- [x] Task 3: Create `StreakFire` component
- [x] Task 4: Create `XPCounter` component
- [x] Task 5: Export from barrel index
- [x] Task 6: Write unit tests
- [x] Task 7: Verify build + tests

## Dev Notes

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: app/globals.css — existing keyframes]

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

### Completion Notes List

### File List

- `app/globals.css` — Modified (new keyframes)
- `components/app/shared/CelebrationOverlay.tsx` — New
- `components/app/shared/StreakFire.tsx` — New
- `components/app/shared/XPCounter.tsx` — New
- `components/app/shared/index.ts` — Modified (added exports)
- `components/app/shared/__tests__/CelebrationOverlay.test.tsx` — New
- `components/app/shared/__tests__/StreakFire.test.tsx` — New
- `components/app/shared/__tests__/XPCounter.test.tsx` — New
