# Story 12.3: Vocabulary SRS Review Quiz

Status: ready-for-dev

## Story

As a learner,
I want to review all my saved vocabulary via SRS scheduling,
so that I retain words long-term through optimal spacing.

## Acceptance Criteria

1. **Given** a user with saved vocabulary where `next_review <= now`, **When** navigating to `/review-quiz`, **Then** the page shows a "Từ vựng" tab alongside the existing "Lỗi sai" tab.
2. **Given** due vocabulary words exist, **When** starting a vocabulary review, **Then** words are presented as 4-choice quizzes: show Vietnamese definition → pick the correct English word (and alternating: show English word → pick correct Vietnamese definition).
3. **Given** a user answers a vocabulary quiz question, **When** the answer is submitted, **Then** SM-2 algorithm updates the word's `ease_factor`, `interval`, `next_review`, `review_count`, and `mastery_level` in the `user_vocabulary` table.
4. **Given** a user completes all due vocabulary reviews, **When** the session summary displays, **Then** it shows: words reviewed count, accuracy percentage, next review dates for each word, and mastery level changes.
5. **Given** a user has due vocabulary reviews, **When** the sidebar renders, **Then** a badge count shows the number of due vocabulary reviews on the "Ôn tập" sidebar item (combined: error due + vocab due).

## Tasks / Subtasks

- [ ] Task 1: Create vocabulary due API (AC: #1, #5)
  - [ ] 1.1: `GET /api/vocabulary/due` — query `user_vocabulary` WHERE `saved = true AND next_review <= now()` with JOIN on `vocabulary_cache` for word data
  - [ ] 1.2: Return `{ dueCount, words[] }` where each word includes: `query`, `headword`, `overviewVi`, `overviewEn`, `partOfSpeech`, `level`, `easeFactor`, `interval`, `reviewCount`, `masteryLevel`
  - [ ] 1.3: Limit to 15 words per session, ordered by `next_review ASC` (most overdue first)

- [ ] Task 2: Create vocabulary review submit API (AC: #3)
  - [ ] 2.1: `POST /api/vocabulary/review` — accepts `{ results: Array<{ query: string, quality: 0-5 }> }`
  - [ ] 2.2: For each result, use shared `computeSm2()` from `lib/srs/sm2.ts` to calculate next state
  - [ ] 2.3: Update `user_vocabulary` row: `ease_factor`, `interval`, `review_count`, `next_review`
  - [ ] 2.4: Derive and update `mastery_level` using `deriveMastery()` from `lib/srs/types.ts`
  - [ ] 2.5: Award XP: 5 XP per word reviewed, log activity as `flashcard_review`

- [ ] Task 3: Extend review-quiz page with vocabulary tab (AC: #1, #2, #4)
  - [ ] 3.1: Add tab navigation at top: "Lỗi sai" | "Từ vựng 📚" with badge counts on each
  - [ ] 3.2: Create `VocabReviewQuiz` component for vocabulary mode
  - [ ] 3.3: Quiz card shows definition (Vi) → 4 English word choices (3 wrong + 1 correct), alternating with English word → 4 Vietnamese definition choices
  - [ ] 3.4: Wrong options are randomly selected from user's other saved vocabulary (same CEFR level preferred)
  - [ ] 3.5: Map user selections to SM-2 quality: wrong=2, correct+slow=3, correct+fast(<3s)=5
  - [ ] 3.6: After answering, show brief feedback: ✅/❌ with correct answer flash (300ms delay before next)

- [ ] Task 4: Session summary view (AC: #4)
  - [ ] 4.1: Show accuracy ring (reuse existing Progress component pattern)
  - [ ] 4.2: Show per-word results: word, correct/wrong, new mastery level, next review date
  - [ ] 4.3: Mastery level change indicators: 🟡→🔵 "Learning!", 🔵→🟢 "Mastered! 🎉"
  - [ ] 4.4: "Ôn tiếp" button to restart with remaining due words

- [ ] Task 5: Sidebar badge integration (AC: #5)
  - [ ] 5.1: Extend `useSidebarBadges` hook to also fetch vocabulary due count
  - [ ] 5.2: Update sidebar to show combined badge: `errorsDue + vocabDue`
  - [ ] 5.3: Update `/api/dashboard` to include `vocabDue` count

## Dev Notes

### ⚠️ CRITICAL: Existing Review Quiz is for ERROR LOG, NOT Vocabulary

The existing `/review-quiz` page at `app/(app)/review-quiz/page.tsx` reviews entries from the `error_log` table (wrong answers from grammar quiz, daily challenge). **Story 12.3 adds vocabulary SRS review as a SECOND TAB on the same page.** Do NOT replace the existing error review functionality.

### Architecture & Patterns

- **SM-2 Algorithm:** Already extracted to `lib/srs/sm2.ts` — use `computeSm2()` and `defaultSm2State()`
- **Mastery Derivation:** Use `deriveMastery(interval, repetitions)` from `lib/srs/types.ts`
- **DB Schema:** `user_vocabulary` already has SRS columns: `mastery_level`, `ease_factor`, `interval`, `review_count`, `next_review` (added in Story 12.1)
- **Vocabulary Data:** Join `user_vocabulary` with `vocabulary_cache` to get word definitions — `vocabulary_cache.data` is JSONB type `Vocabulary` from `lib/schemas/vocabulary.ts`
- **XP System:** Use `awardXP()` from `lib/xp.ts` and `logActivity()` from `lib/activity-log.ts`
- **Existing Patterns:** Follow the same inline-style approach as the existing review-quiz page (no Tailwind, use CSS custom properties)
- **Components:** Use Ant Design sparingly (Tag, Progress, Badge, Collapse) — same as existing page

### Project Structure Notes

```
app/api/vocabulary/due/route.ts        ← NEW: Fetch due vocabulary
app/api/vocabulary/review/route.ts     ← NEW: Submit vocabulary review
app/(app)/review-quiz/page.tsx         ← MODIFY: Add tab navigation + VocabReviewQuiz
hooks/useSidebarBadges.ts              ← MODIFY: Add vocabDue count
app/api/dashboard/route.ts             ← MODIFY: Include vocabDue in response
```

### Distractor Generation Strategy

For 4-choice quiz, distractors (wrong options) should be:
1. From user's own saved vocabulary (familiar but different words)
2. Same CEFR level as target word when possible
3. Same part of speech when possible
4. If not enough saved words, use random words from `vocabulary_cache`
5. Never include the correct answer as a distractor

### SM-2 Quality Mapping for Quiz

```
User wrong answer     → quality = 2 (incorrect — SM-2 resets interval)
User correct, slow    → quality = 3 (hard — slow recall, narrow interval increase)  
User correct, medium  → quality = 4 (good — standard interval increase)
User correct, fast    → quality = 5 (easy — accelerated interval increase)
```

Timer approach: record timestamp when question appears. On answer:
- `< 3 seconds` → quality 5 (easy)
- `3-8 seconds` → quality 4 (good)
- `> 8 seconds` → quality 3 (hard)

### References

- [Source: lib/srs/sm2.ts] — SM-2 algorithm (`computeSm2`, `defaultSm2State`)
- [Source: lib/srs/types.ts] — `Sm2State`, `MasteryLevel`, `deriveMastery()`
- [Source: lib/db/schema.ts#L53-70] — `userVocabulary` table with SRS fields
- [Source: lib/db/schema.ts#L46-51] — `vocabularyCache` table with word data
- [Source: app/(app)/review-quiz/page.tsx] — Existing error-log review quiz (extend, don't replace)
- [Source: hooks/useSidebarBadges.ts] — Sidebar badge hook to extend
- [Source: lib/xp.ts] — `awardXP()` utility
- [Source: lib/activity-log.ts] — `logActivity()` utility
- [Source: app/api/flashcards/review/route.ts] — Reference pattern for SM-2 review API
- [Source: _bmad-output/planning-artifacts/epics.md#L914-928] — Story 12.3 acceptance criteria

### Previous Story Intelligence

Stories 12.1, 12.2, 12.4 were implemented in the same commit (`f493bb4`):
- `lib/srs/` module created with SM-2 algorithm
- `lib/adaptive/difficulty.ts` created for adaptive difficulty
- `user_vocabulary` schema extended with 5 SRS columns
- `user_skill_profile` table created
- Migration `drizzle/0008` applied to production DB
- Code review found and fixed: `setWhere` API compat, race condition in getSkillProfile, migration DEFAULT flooding queue, missing C2 level, missing index on next_review

### Git Intelligence

Recent commits show the pattern of:
- Using `lib/xp.ts` `awardXP()` for fire-and-forget XP awarding
- Using `logActivity()` for activity tracking
- Using `auth.api.getSession({ headers: await headers() })` for auth
- Using inline styles with CSS custom properties for UI components
- All API routes follow the pattern: auth check → validate → query → respond

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### Change Log
