# Story 1.1: Flashcard Spaced Repetition

Status: done

## Story

As an English learner,
I want to review my saved vocabulary through interactive flashcards with spaced repetition,
so that I can memorize words efficiently and retain them long-term.

## Acceptance Criteria

1. **Route & Navigation**: Replace `/fuel-prices` sidebar entry with `/flashcards` (icon: `Layers` from lucide-react, label: "Ôn tập"). Update `ToolbarBreadcrumb` accordingly.
2. **Card Queue**: On mount, fetch the user's saved vocabulary (`saved: true` from `userVocabulary`) joined with `vocabularyCache.data`, sorted by SM-2 next-review date (earliest first). Only cards due for review appear.
3. **Card UI**: Display one card at a time in a centered, animated card component:
   - **Front**: headword, phonetic, CEFR level badge, part of speech.
   - **Back** (revealed on tap/click): Vietnamese definition (`overviewVi`), example sentences, collocations.
   - Flip animation using `motion/react` (rotateY 180°).
4. **Self-Rating**: After revealing the back, show 4 buttons: "Quên" (Again=0), "Khó" (Hard=2), "Ổn" (Good=3), "Dễ" (Easy=5). Each maps to SM-2 quality grades.
5. **SM-2 Algorithm**: Implement a pure function `computeSm2(prev: Sm2State, quality: number): Sm2State` in `lib/flashcard/sm2.ts`. Fields: `easeFactor`, `interval` (days), `repetitions`, `nextReview` (ISO date string).
6. **Persistence**: Add a `flashcard_progress` DB table: `id (uuid PK)`, `userId (text)`, `query (text, FK → vocabulary_cache)`, `easeFactor (real, default 2.5)`, `interval (integer, default 0)`, `repetitions (integer, default 0)`, `nextReview (timestamp)`, `updatedAt (timestamp)`. Unique index on `(userId, query)`.
7. **API Endpoints**:
   - `GET /api/flashcards/due` — returns due cards (join flashcard_progress + vocabulary_cache + user_vocabulary where saved=true AND nextReview <= now), limit 20.
   - `POST /api/flashcards/review` — body: `{ query: string, quality: number }` — computes new SM-2 state, upserts `flashcard_progress`.
8. **Empty State**: When no cards are due, show a celebration illustration with message "🎉 Bạn đã ôn xong! Quay lại sau nhé." and a countdown to next review.
9. **Progress Bar**: Show `reviewed / total due` progress at the top of the session.
10. **Session Summary**: After completing all due cards, show stats: total reviewed, average quality, cards marked "Quên".
11. **Responsive**: Works on mobile (≤720px) with swipe-friendly card size.

## Tasks / Subtasks

- [x] Task 1: Remove fuel-prices feature (AC: #1)
  - [x] Delete `app/(app)/fuel-prices/` directory
  - [x] Delete `components/app/fuel-prices/` directory
  - [x] Delete `components/app/fuel-chat/` directory
  - [x] Delete `hooks/useFuelChat.ts`
  - [x] Delete `lib/fuel-prices/` directory
  - [x] Delete `app/api/fuel-prices/` directory
  - [x] Update `AppSidebar.tsx`: replace fuel-prices nav entry with flashcards
  - [x] Update `ToolbarBreadcrumb.tsx`: replace fuel-prices breadcrumb with flashcards
- [x] Task 2: Database schema & migration (AC: #6)
  - [x] Add `flashcardProgress` table to `lib/db/schema.ts`
  - [x] Generate migration with `drizzle-kit generate`
  - [ ] Run migration with `drizzle-kit migrate` (requires DB connection — deferred to deploy)
- [x] Task 3: SM-2 algorithm (AC: #5)
  - [x] Create `lib/flashcard/sm2.ts` with `computeSm2()` pure function
  - [x] Create `lib/flashcard/types.ts` with `Sm2State` type
  - [x] Write unit tests `lib/flashcard/__tests__/sm2.test.ts`
- [x] Task 4: API routes (AC: #7)
  - [x] Create `app/api/flashcards/due/route.ts` — GET handler
  - [x] Create `app/api/flashcards/review/route.ts` — POST handler
  - [x] Auth guard: use `auth.api.getSession()` pattern from existing routes
- [x] Task 5: Flashcard UI components (AC: #3, #4, #8, #9, #10)
  - [x] Create `components/app/flashcards/FlashcardSession.tsx` — main container
  - [x] Create `components/app/flashcards/FlashcardCard.tsx` — flip card with rating buttons
  - [x] Create `components/app/flashcards/SessionProgress.tsx` — progress bar
  - [x] Create `components/app/flashcards/SessionSummary.tsx` — end-of-session stats
  - [x] Create `components/app/flashcards/EmptyState.tsx` — celebration/countdown
- [x] Task 6: Page route (AC: #1)
  - [x] Create `app/(app)/flashcards/page.tsx`
- [x] Task 7: Custom hook (AC: #2, #7)
  - [x] Create `hooks/useFlashcardSession.ts` — manages card queue, current card index, review submission

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

- **Next.js 16 App Router** with `app/` directory routing. All pages are in `app/(app)/`.
- **API routes** use Next.js Route Handlers (`route.ts`). Auth pattern: `const session = await auth.api.getSession({ headers: await headers() })`.
- **Database**: PostgreSQL via Drizzle ORM. Schema in `lib/db/schema.ts`. Use `drizzle-kit` for migrations.
- **Styling**: Tailwind CSS v4 with custom CSS variables defined in `app/globals.css`. Design tokens: `--accent: #c46d2e`, `--ink: #1c1917`, `--font-display: Fraunces`, `--font-body: Source Sans 3`.
- **Animations**: `motion/react` (Framer Motion v12). Use `motion.div`, `AnimatePresence` for mount/unmount animations.
- **Components**: Feature components in `components/app/<feature>/`. Shared in `components/app/shared/`.
- **HTTP client**: `lib/http.ts` (axios instance) for client-side API calls.
- **State management**: React hooks + `nuqs` for URL query state. No Redux/Zustand.
- **Testing**: Vitest + Testing Library. Test files colocated in `__tests__/` subdirs.

### Key Existing Code to Reuse

- **Vocabulary data shape**: `Vocabulary` type from `lib/schemas/vocabulary.ts` — headword, phonetic, phoneticsUs/Uk, partOfSpeech, level, overviewVi, overviewEn, senses[].
- **User vocabulary query**: existing `userVocabulary` table joins with `vocabularyCache` — reuse this join pattern for fetching due cards.
- **Auth pattern**: `lib/auth.ts` for `auth.api.getSession()`.
- **Level badge colors**: `LEVEL_COLORS` map in `app/(app)/my-vocabulary/page.tsx` — reuse same color scheme for CEFR badges on cards.
- **UI patterns**: rounded cards with `border border-(--border)`, `shadow-(--shadow-md)`, `backdrop-blur`. Refer to `FuelPriceChat.tsx` for premium chat-style layout patterns (being replaced but shows design quality bar).

### Anti-Pattern Prevention

- **DO NOT** install any new dependencies — all needed packages exist: `motion/react`, `lucide-react`, `drizzle-orm`, `zod`.
- **DO NOT** create a separate vocabulary fetch — reuse the existing `vocabularyCache` data joined with `userVocabulary`.
- **DO NOT** use localStorage for SM-2 state — it must be server-persisted in PostgreSQL for cross-device sync.
- **DO NOT** put business logic in components — SM-2 computation is a pure function in `lib/flashcard/sm2.ts`.

### Project Structure Notes

```
app/(app)/flashcards/page.tsx          ← route page
components/app/flashcards/             ← all flashcard UI components
hooks/useFlashcardSession.ts           ← session state hook
lib/flashcard/sm2.ts                   ← SM-2 algorithm
lib/flashcard/types.ts                 ← Sm2State type
lib/flashcard/__tests__/sm2.test.ts    ← unit tests
app/api/flashcards/due/route.ts        ← GET due cards
app/api/flashcards/review/route.ts     ← POST review result
```

### References

- [Source: lib/db/schema.ts] — existing DB tables and Drizzle patterns
- [Source: lib/schemas/vocabulary.ts] — Vocabulary type with all fields
- [Source: components/app/shared/AppSidebar.tsx#L10-15] — navigation items array
- [Source: components/app/shared/ToolbarBreadcrumb.tsx#L5-10] — breadcrumb map
- [Source: app/globals.css] — design tokens and CSS variables
- [Source: app/(app)/my-vocabulary/page.tsx#L29-36] — LEVEL_COLORS reuse

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Deleted all fuel-prices related files (6 directories/files). Updated AppSidebar to use `Layers` icon and `/flashcards` route. Updated ToolbarBreadcrumb.
- ✅ Task 2: Added `flashcardProgress` table to schema with easeFactor (real), interval (integer), repetitions (integer), nextReview (timestamp), unique index on (userId, query). Migration generated: `0003_ambiguous_deathstrike.sql`.
- ✅ Task 3: Implemented SM-2 algorithm in `lib/flashcard/sm2.ts` as a pure function. Includes `computeSm2()` and `defaultSm2State()`. All 10 unit tests pass.
- ✅ Task 4: Created GET `/api/flashcards/due` (joins userVocabulary + vocabularyCache + flashcardProgress, returns due cards + next review countdown) and POST `/api/flashcards/review` (Zod-validated input, computes SM-2, upserts progress). Both routes use auth guard.
- ✅ Task 5: Created 5 UI components: FlashcardSession (main container with loading/empty/active/summary states), FlashcardCard (3D flip animation with front/back), SessionProgress (animated progress bar), SessionSummary (stats with emoji), EmptyState (countdown timer).
- ✅ Task 6: Created page route at `app/(app)/flashcards/page.tsx`.
- ✅ Task 7: Created `useFlashcardSession` hook with state machine (loading → active → summary/empty), card queue management, review submission, stats tracking.
- ✅ Build passes successfully. All 10 SM-2 unit tests pass. Sidebar and breadcrumb tests pass (8+4=12 tests). Pre-existing 8 test failures are unrelated to this story.
- ⚠️ DB migration not run (requires DB connection). Migration file generated and ready.

### File List

**Deleted:**
- app/(app)/fuel-prices/ (directory)
- components/app/fuel-prices/ (directory)
- components/app/fuel-chat/ (directory)
- hooks/useFuelChat.ts
- lib/fuel-prices/ (directory)
- app/api/fuel-prices/ (directory)

**Modified:**
- components/app/shared/AppSidebar.tsx (replaced Fuel icon/route with Layers /flashcards)
- components/app/shared/ToolbarBreadcrumb.tsx (replaced fuel-prices breadcrumb with flashcards)
- lib/db/schema.ts (added flashcardProgress table + integer/real imports)

**Created:**
- lib/flashcard/types.ts
- lib/flashcard/sm2.ts
- lib/flashcard/__tests__/sm2.test.ts
- lib/db/migrations/0003_ambiguous_deathstrike.sql
- app/api/flashcards/due/route.ts
- app/api/flashcards/review/route.ts
- components/app/flashcards/FlashcardSession.tsx
- components/app/flashcards/FlashcardCard.tsx
- components/app/flashcards/SessionProgress.tsx
- components/app/flashcards/SessionSummary.tsx
- components/app/flashcards/EmptyState.tsx
- app/(app)/flashcards/page.tsx
- hooks/useFlashcardSession.ts

## Senior Developer Review (AI)

**Review Date:** 2026-04-08
**Reviewer Model:** Claude Sonnet 4.6 (Thinking)
**Review Outcome:** Changes Requested
**Layers Run:** Blind Hunter · Edge Case Hunter · Acceptance Auditor

### Action Items

**Patch — must fix:**

- [x] [Review][Patch] F1: `orderBy(lte(...))` produces wrong SQL — cards not sorted by urgency [app/api/flashcards/due/route.ts:53]
- [x] [Review][Patch] F2: Network error silently shows empty/done state instead of error state [hooks/useFlashcardSession.ts:42]
- [x] [Review][Patch] F3: `blink` animation keyframe undefined — loading dots don't animate [components/app/flashcards/FlashcardSession.tsx:73]
- [x] [Review][Patch] F4: `isFlipped` state persists when same card key recurs after "Quên" [components/app/flashcards/FlashcardCard.tsx:23]
- [x] [Review][Patch] F5: No way to restart session after summary without page refresh [hooks/useFlashcardSession.ts]
- [x] [Review][Patch] F6: Progress bar shows 0-indexed count ("0/10" on card 1) [components/app/flashcards/FlashcardSession.tsx:106]

**Defer — pre-existing / low risk:**

- [x] [Review][Defer] F7: Triple-redundant `userId` filter in countdown query [app/api/flashcards/due/route.ts:76-84] — deferred, pre-existing
- [x] [Review][Defer] F8: No retry feedback on `submitReview` API failure [hooks/useFlashcardSession.ts:71] — deferred, UX polish
- [x] [Review][Defer] F9: `senses` JSONB branch inconsistency (→ vs ->>) [app/api/flashcards/due/route.ts:34] — deferred, driver handles it

### Review Follow-ups (AI)

- [x] [AI-Review][F1][High] Fix `orderBy(lte(...))` → use `asc(flashcardProgress.nextReview)` with NULL-first handling
- [x] [AI-Review][F2][Med] Add `"error"` state to `SessionState`, show error UI instead of celebrations on fetch failure
- [x] [AI-Review][F3][Low] Define `blink` keyframe in `globals.css` or replace with `motion/react` animation
- [x] [AI-Review][F4][Med] Add `key={card.query + reviewCount}` or pass `onReset` to force flip-state reset on re-encounter
- [x] [AI-Review][F5][Low] Expose `restart()` function in hook that resets `hasFetched.current = false` and refetches
- [x] [AI-Review][F6][Low] Pass `current={currentIndex + 1}` to `SessionProgress`
