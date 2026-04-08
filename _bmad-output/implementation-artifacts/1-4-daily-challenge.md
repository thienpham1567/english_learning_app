# Story 1.4: Daily Challenge

Status: done

## Story

As an English learner,
I want a daily challenge with varied mini-exercises and streak tracking,
so that I develop a consistent learning habit and stay motivated through gamification.

## Acceptance Criteria

1. **Route & Navigation**: Add `/daily-challenge` to sidebar (icon: `Flame` from lucide-react, label: "Thử thách"). Add to `ToolbarBreadcrumb` with eyebrow "Thử thách mỗi ngày", title "Daily Challenge".
2. **Daily Reset**: Each user gets ONE challenge per calendar day (UTC+7, Vietnam timezone). Challenge resets at midnight VN time. Server-side date check prevents re-generation.
3. **Challenge Types** (AI-generated, rotated daily):
   - **Fill-in-the-blank**: Sentence with missing word, 4 options.
   - **Sentence ordering**: Scrambled words → arrange into correct sentence.
   - **Translation**: Vietnamese → English translation (AI checks correctness with tolerance).
   - **Error correction**: Find and fix the grammar error in a sentence.
   - Each daily challenge contains 5 exercises mixing 2–3 types.
4. **Challenge UI**:
   - One exercise at a time, progress dots at top.
   - Immediate feedback after each answer (correct/incorrect + explanation).
   - Time elapsed shown (not a timer — no pressure, just tracking).
   - Smooth transitions between exercises via `motion/react`.
5. **Streak System**:
   - Consecutive days of completing the challenge increment the streak counter.
   - Missing a day resets to 0.
   - Show current streak 🔥 prominently on the challenge page.
   - Show best streak record.
6. **Badges** (unlock at milestones):
   - 🔥 3-day streak: "Bắt đầu tốt"
   - 🔥 7-day: "Kiên trì"
   - 🔥 30-day: "Không thể cản"
   - 🏆 100-day: "Huyền thoại"
   - Display earned badges on the page with locked/unlocked states.
7. **Persistence**: 
   - `daily_challenge` DB table: `id (uuid PK)`, `userId (text)`, `challengeDate (date)`, `exercises (jsonb)`, `answers (jsonb, nullable)`, `score (integer, nullable)`, `completedAt (timestamp, nullable)`, `timeElapsedMs (integer, nullable)`, `createdAt (timestamp)`.
   - `user_streak` DB table: `userId (text PK)`, `currentStreak (integer, default 0)`, `bestStreak (integer, default 0)`, `lastCompletedDate (date, nullable)`, `updatedAt (timestamp)`.
8. **API Endpoints**:
   - `GET /api/daily-challenge/today` — returns today's challenge (generates if not exists). Includes streak info.
   - `POST /api/daily-challenge/submit` — body: `{ answers: { exerciseIndex: number, answer: string }[] }`. Scores answers, updates streak, returns results.
   - `GET /api/daily-challenge/streak` — returns streak info and earned badges.
9. **Results Screen**: After submitting, show:
   - Score: `correct / 5` with emoji reactions (5/5: 🎉, 4/5: 👏, 3/5: 👍, ≤2: 💪).
   - Current streak with animation if streak increased.
   - Any newly earned badge with celebration animation.
   - "Quay lại mai nhé!" message.
10. **Already Completed State**: If user visits after completing today's challenge, show their results + streak + countdown to next challenge.

## Tasks / Subtasks

- [x] Task 1: Navigation updates (AC: #1)
  - [x] Add daily-challenge entry to `navItems` in `AppSidebar.tsx`
  - [x] Add daily-challenge breadcrumb to `ToolbarBreadcrumb.tsx`
- [x] Task 2: Database schema (AC: #7)
  - [x] Add `dailyChallenge` table to `lib/db/schema.ts`
  - [x] Add `userStreak` table to `lib/db/schema.ts`
  - [x] Generate and run migration
- [x] Task 3: Types and schemas (AC: #3)
  - [x] Create `lib/daily-challenge/types.ts`
  - [x] Create `lib/daily-challenge/schema.ts`
  - [x] Create `lib/daily-challenge/badges.ts`
- [x] Task 4: API routes (AC: #8)
  - [x] Create `app/api/daily-challenge/today/route.ts`
  - [x] Create `app/api/daily-challenge/submit/route.ts`
  - [x] Create `app/api/daily-challenge/streak/route.ts`
  - [x] Implement AI challenge generation with OpenAI structured output
  - [x] Implement streak calculation logic (VN timezone: UTC+7)
- [x] Task 5: UI components (AC: #4, #5, #6, #9, #10)
  - [x] Create `components/app/daily-challenge/ExerciseCard.tsx` — exercise dispatcher
  - [x] Create `components/app/daily-challenge/FillInBlank.tsx`
  - [x] Create `components/app/daily-challenge/SentenceOrder.tsx` — click-to-reorder
  - [x] Create `components/app/daily-challenge/TranslationExercise.tsx`
  - [x] Create `components/app/daily-challenge/ErrorCorrection.tsx`
  - [x] Create `components/app/daily-challenge/StreakDisplay.tsx`
  - [x] Create `components/app/daily-challenge/BadgeGallery.tsx`
  - [x] Create `components/app/daily-challenge/ChallengeResults.tsx`
  - [x] Create `components/app/daily-challenge/CompletedState.tsx`
- [x] Task 6: Page and hook (AC: all)
  - [x] Create `app/(app)/daily-challenge/page.tsx`
  - [x] Create `hooks/useDailyChallenge.ts`

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

- **Next.js 16 App Router** — route page with `"use client"`.
- **API routes** — auth guard via `auth.api.getSession()`. All business logic in route handlers.
- **Database** — PostgreSQL via Drizzle ORM. Two new tables. Use `date` type (not `timestamp`) for `challengeDate` and `lastCompletedDate`.
- **OpenAI** — reuse `lib/openai/` client. Structured JSON output. Validate with Zod.
- **Timezone** — All date comparisons must use Vietnam timezone (UTC+7). Compute "today" server-side: `new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })` (returns YYYY-MM-DD).
- **Styling** — Tailwind CSS v4 + CSS variables. Use warm fire tones for streak display (orange gradient similar to `from-amber-500 to-orange-600` used in fuel-prices, now available for reuse).
- **Animations** — `motion/react` for exercise transitions, streak fire animation, badge unlock celebrations. Use `AnimatePresence` for mount/exit.

### Key Existing Code to Reuse

- **OpenAI client**: `lib/openai/`.
- **Auth**: `lib/auth.ts`.
- **DB patterns**: `lib/db/schema.ts` — uuid, text, timestamp, jsonb columns.
- **UI patterns**: `motion.div` with `initial/animate/exit` transitions — see `FuelPriceChat.tsx` for reference animation patterns.
- **Design tokens**: `globals.css` — all CSS variables.

### Anti-Pattern Prevention

- **DO NOT** use `new Date()` directly for date comparisons — always compute VN timezone date on the server.
- **DO NOT** allow re-submission of a completed challenge — check `completedAt` before accepting answers.
- **DO NOT** store streak in localStorage — server-side in `userStreak` table for integrity.
- **DO NOT** install drag-and-drop library for sentence ordering — use simple click-to-reorder with `motion/react` layout animations (`layout` prop).
- **DO NOT** create complex badge artwork — use emoji + CSS-styled containers. No image generation needed.
- **DO NOT** skip auth guard on any endpoint — all endpoints require authenticated session.

### Streak Calculation Logic

```typescript
// Pseudo-code for streak update
const vnToday = getVnDate();  // YYYY-MM-DD
const { lastCompletedDate, currentStreak } = userStreak;

if (lastCompletedDate === vnToday) {
  // Already completed today — no streak change
} else if (lastCompletedDate === vnYesterday) {
  // Consecutive — increment streak
  currentStreak += 1;
} else {
  // Missed day(s) — reset to 1
  currentStreak = 1;
}
bestStreak = Math.max(bestStreak, currentStreak);
lastCompletedDate = vnToday;
```

### Project Structure Notes

```
app/(app)/daily-challenge/page.tsx                     ← route page
components/app/daily-challenge/                        ← UI components (10 files)
hooks/useDailyChallenge.ts                             ← state machine hook
lib/daily-challenge/types.ts                           ← TypeScript types
lib/daily-challenge/schema.ts                          ← Zod schemas
lib/daily-challenge/badges.ts                          ← badge definitions
app/api/daily-challenge/today/route.ts                 ← GET today's challenge
app/api/daily-challenge/submit/route.ts                ← POST answers
app/api/daily-challenge/streak/route.ts                ← GET streak + badges
```

### References

- [Source: lib/openai/] — OpenAI client
- [Source: lib/db/schema.ts] — DB table patterns  
- [Source: lib/auth.ts] — auth session pattern
- [Source: components/app/shared/AppSidebar.tsx#L10-15] — nav items
- [Source: components/app/shared/ToolbarBreadcrumb.tsx#L5-10] — breadcrumbs
- [Source: app/globals.css] — design tokens
- [Source: components/app/fuel-prices/FuelPriceChat.tsx#L261] — orange gradient pattern for streak fire

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

- Fixed Exercise type from loose union to discriminated union for proper TypeScript narrowing in ExerciseCard and scoreExercise.
- ChallengeSession.tsx from spec merged into page.tsx (consistent with grammar-quiz and writing-practice patterns).

### Completion Notes List

- ✅ Task 1: Added Flame icon + /daily-challenge to sidebar nav and breadcrumb. All 12 nav tests pass.
- ✅ Task 2: Added `dailyChallenge` (9 cols) and `userStreak` (5 cols) tables. Migration `0005_yummy_catseye.sql` generated.
- ✅ Task 3: Created discriminated union Exercise type, Zod schemas with `z.discriminatedUnion`, badge definitions with milestone/unlock logic.
- ✅ Task 4: Created 3 API routes: GET /today (generates or retrieves), POST /submit (scores + streak update), GET /streak (info + badges). VN timezone (UTC+7) date computations.
- ✅ Task 5: Created 9 UI components: ExerciseCard (dispatcher), FillInBlank, SentenceOrder (click-to-reorder), TranslationExercise, ErrorCorrection, StreakDisplay (animated fire), BadgeGallery, ChallengeResults, CompletedState.
- ✅ Task 6: Created page + useDailyChallenge hook (state machine: loading → active → submitting → results | completed).
- ✅ Build passes. All navigation tests pass.
- ℹ️ ChallengeSession.tsx merged into page.tsx to match existing story patterns.

### File List

**Modified:**
- components/app/shared/AppSidebar.tsx (added Flame + daily-challenge nav)
- components/app/shared/ToolbarBreadcrumb.tsx (added daily-challenge breadcrumb)
- lib/db/schema.ts (added dailyChallenge + userStreak tables + types)

**Created:**
- lib/daily-challenge/types.ts
- lib/daily-challenge/schema.ts
- lib/daily-challenge/badges.ts
- app/api/daily-challenge/today/route.ts
- app/api/daily-challenge/submit/route.ts
- app/api/daily-challenge/streak/route.ts
- components/app/daily-challenge/ExerciseCard.tsx
- components/app/daily-challenge/FillInBlank.tsx
- components/app/daily-challenge/SentenceOrder.tsx
- components/app/daily-challenge/TranslationExercise.tsx
- components/app/daily-challenge/ErrorCorrection.tsx
- components/app/daily-challenge/StreakDisplay.tsx
- components/app/daily-challenge/BadgeGallery.tsx
- components/app/daily-challenge/ChallengeResults.tsx
- components/app/daily-challenge/CompletedState.tsx
- hooks/useDailyChallenge.ts
- app/(app)/daily-challenge/page.tsx
- lib/db/migrations/0005_yummy_catseye.sql

## Code Review (AI)

**Review Date:** 2026-04-08
**Reviewer Model:** Gemini 3 Flash + Claude Opus 4.6 (Thinking)
**Review Outcome:** Fixed
**Layers Run:** Blind Hunter · Edge Case Hunter · Acceptance Auditor

### Findings

- [x] [Review][Patch] F1: `getVnYesterday` timezone sensitivity — subtracting from server local time could yield wrong date on non-VN servers [app/api/daily-challenge/submit/route.ts] — **Fixed:** derives yesterday from VN today string with +07:00 anchor
- [x] [Review][Patch] F2: Missing countdown to next challenge in CompletedState (AC #10) [components/app/daily-challenge/CompletedState.tsx] — **Fixed:** added live HH:MM:SS countdown to VN midnight
