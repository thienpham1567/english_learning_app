# Story 10.2: Listening Practice Page

Status: review

## Story

As a learner,
I want a page where I can practice listening to English audio,
So that I can improve my listening comprehension skills.

## Acceptance Criteria

1. **Given** a user navigating to `/listening`
   **When** the page renders with no active exercise
   **Then** a CEFR level selector displays (matching grammar quiz visual style)
   **And** exercise type options show: Comprehension (MCQ), Dictation, Fill-blanks

2. **Given** a user starting an exercise
   **When** they select level + type and click "Bắt đầu"
   **Then** audio + questions are generated via `POST /api/listening/generate`
   **And** a loading state shows during generation

3. **Given** an active exercise
   **When** the exercise UI renders
   **Then** an audio player shows play/pause, seek bar, speed control (0.75x / 1x / 1.25x)
   **And** a "Nghe lại" replay button allows up to 3 replays
   **And** MCQ questions display below the audio player

4. **Given** a user submitting answers
   **When** `POST /api/listening/submit` returns
   **Then** results show score, correct answers, and the full transcript
   **And** XP earned badge displays

5. **Given** navigation integration
   **Then** page is accessible from sidebar ("🎧 Luyện nghe")
   **And** the page follows existing module patterns (breadcrumb, loading/error states)

## Tasks / Subtasks

- [x] Task 1: Navigation Integration (AC: #5)
  - [x] 1.1 Add `/listening` entry to `AppSidebar.tsx` nav items
  - [x] 1.2 Add `/listening` entry to `ToolbarBreadcrumb.tsx`
  - [x] 1.3 Create `app/(app)/listening/page.tsx` skeleton

- [x] Task 2: Custom Hook — `useListeningExercise` (AC: #2, #3, #4)
  - [x] 2.1 Create `hooks/useListeningExercise.ts`
  - [x] 2.2 States: idle → loading → active → submitted
  - [x] 2.3 `generate(level, exerciseType)` — calls generate API
  - [x] 2.4 `submit(answers)` — calls submit API
  - [x] 2.5 Track `replaysUsed` (max 3), `selectedSpeed`

- [x] Task 3: Level Selector UI (AC: #1)
  - [x] 3.1 Create `components/app/listening/LevelSelector.tsx`
  - [x] 3.2 CEFR level cards (reuse grammar quiz visual style)
  - [x] 3.3 Exercise type picker (Comprehension / Dictation / Fill-blanks)
  - [x] 3.4 "Bắt đầu luyện nghe" CTA button

- [x] Task 4: Audio Player Component (AC: #3)
  - [x] 4.1 Create `components/app/listening/AudioPlayer.tsx`
  - [x] 4.2 Play/Pause button with icon animation
  - [x] 4.3 Seek bar (progress indicator)
  - [x] 4.4 Speed control toggle (0.75x / 1.0x / 1.25x)
  - [x] 4.5 Replay counter ("Nghe lại" — max 3)

- [x] Task 5: Question Cards & Results (AC: #3, #4)
  - [x] 5.1 Create `components/app/listening/QuestionCards.tsx` — MCQ question list
  - [x] 5.2 Create `components/app/listening/Results.tsx` — score + transcript + XP badge
  - [x] 5.3 "Bài mới" button to reset and start over

- [x] Task 6: Page Assembly (AC: #1-5)
  - [x] 6.1 Wire all components together in `page.tsx`
  - [x] 6.2 Responsive layout (stacked mobile, centered desktop)
  - [x] 6.3 Error state and empty state handling

## Dev Notes

### Critical Architecture Patterns (MUST FOLLOW)

1. **Page Pattern** — Match existing module pages:
   - `"use client"` directive at top
   - Custom hook for all state management
   - Component decomposition: selector → active view → results
   - Reference: `app/(app)/grammar-quiz/page.tsx` for the closest pattern
   - Container wrapping: flex column with `var(--radius-lg)` border, gradient background

2. **Styling** — Use vanilla CSS custom properties (project standard):
   - `var(--bg)`, `var(--surface)`, `var(--text)`, `var(--text-muted)`, `var(--border)`
   - `var(--accent)`, `var(--accent-hover)`, `var(--accent-surface)`
   - `var(--shadow-md)`, `var(--radius-lg)`, `var(--radius-md)`, `var(--radius-sm)`
   - NO Tailwind, NO CSS modules — inline `style={{}}` objects following project convention
   - Reference: `grammar-quiz/page.tsx`, `progress/page.tsx`

3. **Audio Player** — Use native HTML5 `<audio>` element:
   - `useRef<HTMLAudioElement>` for programmatic control
   - `timeupdate` event for seek bar progress
   - `playbackRate` property for speed control
   - No external audio libraries needed

4. **API Integration** — Story 10.1 API contracts:
   - `POST /api/listening/generate` — body: `{ level, exerciseType }` → response has `id`, `audioUrl`, `questions` (no passage, no correctIndex)
   - `POST /api/listening/submit` — body: `{ exerciseId, answers }` → response has `score`, `total`, `correct`, `xpEarned`, `results`, `passage`
   - Audio: `GET /api/listening/audio/[id]` — returns MP3

5. **CEFR Level Selector** — Reuse grammar quiz visual style:
   - 6 level cards in 2x3 or 3x2 grid
   - Each card: level code (A1), label (Beginner), color coding
   - Selected state: accent border + scale transform
   - Reference: `components/app/grammar-quiz/CEFRPath.tsx`

6. **Navigation** — Add to sidebar between "Thử thách" and "Tiến độ":
   ```ts
   // AppSidebar.tsx navItems — use AudioOutlined or SoundOutlined icon
   { href: "/listening", label: "Luyện nghe", icon: SoundOutlined },
   
   // ToolbarBreadcrumb.tsx
   "/listening": { eyebrow: "TOEIC Listening", title: "Luyện nghe" },
   ```

### Project Structure Notes

New files to create:
- `app/(app)/listening/page.tsx` — Page component
- `hooks/useListeningExercise.ts` — Custom hook
- `components/app/listening/LevelSelector.tsx` — Level + type selection
- `components/app/listening/AudioPlayer.tsx` — Audio player with seek/speed
- `components/app/listening/QuestionCards.tsx` — MCQ question cards
- `components/app/listening/Results.tsx` — Score + transcript

Files to modify:
- `components/app/shared/AppSidebar.tsx` — Add navigation item
- `components/app/shared/ToolbarBreadcrumb.tsx` — Add breadcrumb entry

### Previous Story Intelligence

From Story 10.1 code review:
- **P4 CRITICAL**: `passage` is NOT returned in generate response (intentional — can't read during listening). Only returned in submit response.
- **P2**: Shared Zod schemas in `lib/listening/types.ts` — import response types from there
- **P1**: Exercise IDs are pre-generated UUIDs (used for audioUrl pattern `/api/listening/audio/{id}`)
- Audio endpoint has 5 calls/user/min rate limit — handle 429 gracefully in the hook

### Git Intelligence

Recent commits:
```
83f96cc fix(listening): code review — 4 patches applied
38d987b feat(listening): Story 10.1 — Listening Exercise Schema & API
684511f fix: batch-apply 6 code review findings
```

### Audio Player Design Notes

```
┌────────────────────────────────────────────┐
│  ▶ ━━━━━━━━━●━━━━━━━━━━━  1:23 / 2:45    │
│                                            │
│  🔄 Nghe lại (2/3)    ⚡ 1.0x             │
└────────────────────────────────────────────┘
```

- Play/Pause: toggle icon ▶/⏸
- Seek bar: `<input type="range">` tracking `currentTime / duration`
- Timer: `mm:ss / mm:ss` format
- Replay: decrement from 3, disable at 0
- Speed: cycle 0.75x → 1.0x → 1.25x

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.2]
- [Source: _bmad-output/implementation-artifacts/10-1-listening-exercise-schema-api.md] — Previous story
- [Source: lib/listening/types.ts] — Shared types and response interfaces
- [Source: app/(app)/grammar-quiz/page.tsx] — Closest UI pattern reference
- [Source: components/app/grammar-quiz/CEFRPath.tsx] — CEFR level selector reference
- [Source: components/app/shared/AppSidebar.tsx] — Navigation config
- [Source: components/app/shared/ToolbarBreadcrumb.tsx] — Breadcrumb config

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Build passed with 0 errors after all tasks completed

### Completion Notes List

- Task 1: Added SoundOutlined icon + /listening nav item to sidebar + breadcrumb
- Task 2: useListeningExercise hook with full state machine (idle/loading/active/submitting/submitted), replay counter, speed cycling
- Task 3: CEFR level cards in 3-column grid with color coding + exercise type vertical list
- Task 4: HTML5 audio player with custom seek bar, play/pause, speed toggle (0.75/1.0/1.25x), replay counter
- Task 5: MCQ cards with radio-style selection, Results with percentage score, per-question breakdown, transcript reveal, XP badge
- Task 6: State-driven page rendering, responsive centered layout (max-width 600px), error banner

### File List

- `components/app/shared/AppSidebar.tsx` (modified) — Added SoundOutlined + /listening nav item
- `components/app/shared/ToolbarBreadcrumb.tsx` (modified) — Added /listening breadcrumb
- `hooks/useListeningExercise.ts` (new) — Custom hook for exercise lifecycle
- `components/app/listening/LevelSelector.tsx` (new) — CEFR level + exercise type selector
- `components/app/listening/AudioPlayer.tsx` (new) — Audio player with seek/speed/replay
- `components/app/listening/QuestionCards.tsx` (new) — MCQ question cards
- `components/app/listening/Results.tsx` (new) — Score + transcript + XP
- `app/(app)/listening/page.tsx` (new) — Listening practice page
- `lib/listening/types.ts` (modified) — Removed passage from ListeningExerciseResponse (P4 fix alignment)
