# Story 6.2: XP System & Cross-Module Vocabulary Flow

Status: ready-for-dev

## Story

As a learner,
I want to earn XP for all activities and have saved words appear in flashcards automatically,
so that I feel progress across the whole app and my learning loop is seamless.

## Acceptance Criteria

1. **XP awarded on activity completion:**
   - Flashcard session = 10 XP per card reviewed
   - Quiz complete = 50 XP
   - Writing submission = 100 XP
   - Daily challenge = 30 XP

2. **XP stored in DB:** New `xp_total` column in users table (additive only, never decremented).

3. **Dashboard reflects XP:** The GreetingCard `XPCounter` shows the real `xp_total` instead of the current placeholder formula.

4. **Cross-module vocabulary flow:** Words saved from MiniDictionary (chatbot) automatically create flashcard entries via existing vocabulary → flashcard pipeline.

5. **Reduced motion:** `prefers-reduced-motion` disables all celebration/fire animations (static fallback shown).

## Tasks / Subtasks

- [ ] Task 1: Add `xp_total` column to users table
  - [ ] Add `xpTotal` column to a user profile table (or extend `user_streak` table as it already has userId PK)
  - [ ] Create SQL migration: `ALTER TABLE user_streak ADD COLUMN xp_total INTEGER NOT NULL DEFAULT 0;`
  - [ ] Update Drizzle schema in `lib/db/schema.ts`

- [ ] Task 2: Create XP awarding utility
  - [ ] Create `lib/xp.ts` with `awardXP(userId: string, amount: number): Promise<number>`
  - [ ] Atomically increment: `UPDATE user_streak SET xp_total = xp_total + $amount WHERE user_id = $userId`
  - [ ] Return the new total
  - [ ] Handle missing row (upsert)

- [ ] Task 3: Wire XP to activity endpoints
  - [ ] `POST /api/flashcards/review` — award 10 XP per card reviewed
  - [ ] `POST /api/grammar-quiz/generate` — award 50 XP on quiz completion (or create new submit endpoint)
  - [ ] `POST /api/writing-practice/review` — award 100 XP on submission
  - [ ] `POST /api/daily-challenge/submit` — award 30 XP on completion
  - [ ] All awards happen server-side after the main operation succeeds

- [ ] Task 4: Update dashboard API to use real XP
  - [ ] In `/api/dashboard/route.ts`, replace placeholder formula (L154) with actual `xp_total` from `user_streak`
  - [ ] Current: `totalXP = (streak.currentStreak ?? 0) * 20 + recentVocabulary.length * 5`
  - [ ] Target: `totalXP = streakRow.xpTotal ?? 0`

- [ ] Task 5: MiniDictionary → flashcard pipeline
  - [ ] In MiniDictionary's save handler, after saving to vocabulary, also create flashcard_progress entry
  - [ ] Use existing pattern: ensure `flashcard_progress` row exists with default SM-2 values
  - [ ] Check: does `/api/dictionary` POST already handle this? If so, document and skip

- [ ] Task 6: Reduced motion for celebration animations
  - [ ] Audit all celebration/fire animations in the app
  - [ ] Add `@media (prefers-reduced-motion: reduce)` rules to disable them
  - [ ] Show static fallback (e.g., static emoji instead of animated fire)
  - [ ] Key files: StreakFire component, confetti in quiz/flashcard completion, daily challenge celebration

## Dev Notes

### Files to Create
| File | Purpose |
|------|---------|
| `lib/xp.ts` | XP awarding utility function |

### Files to Modify
| File | What Changes |
|------|-------------|
| `lib/db/schema.ts` | Add `xpTotal` to `userStreak` table |
| `app/api/dashboard/route.ts` | Replace XP placeholder with real value |
| `app/api/flashcards/review/route.ts` | Award 10 XP per card |
| `app/api/daily-challenge/submit/route.ts` | Award 30 XP |
| `app/api/writing-practice/review/route.ts` | Award 100 XP |
| `app/globals.css` | Add reduced-motion rules for animations |

### Current XP Placeholder (to replace)
```ts
// app/api/dashboard/route.ts L152-154
// XP placeholder — a proper XP ledger table should be added in a future story.
// Current approximation: streak days × 20 + vocabulary lookups × 5.
const totalXP = (streak.currentStreak ?? 0) * 20 + recentVocabulary.length * 5;
```

### XP Awarding Pattern
```ts
// lib/xp.ts
export async function awardXP(userId: string, amount: number): Promise<number> {
  const result = await db
    .update(userStreak)
    .set({ xpTotal: sql`${userStreak.xpTotal} + ${amount}` })
    .where(eq(userStreak.userId, userId))
    .returning({ xpTotal: userStreak.xpTotal });
  return result[0]?.xpTotal ?? 0;
}
```

### DB Migration
```sql
ALTER TABLE user_streak ADD COLUMN xp_total INTEGER NOT NULL DEFAULT 0;
```

### XP Point Values (from AC)
| Activity | Points |
|----------|--------|
| Flashcard review (per card) | 10 XP |
| Grammar quiz complete | 50 XP |
| Writing submission | 100 XP |
| Daily challenge | 30 XP |

### Existing Activity Completion Endpoints
| Endpoint | File |
|----------|------|
| `POST /api/flashcards/review` | `app/api/flashcards/review/route.ts` |
| `POST /api/grammar-quiz/generate` | `app/api/grammar-quiz/generate/route.ts` |
| `POST /api/writing-practice/review` | `app/api/writing-practice/review/route.ts` |
| `POST /api/daily-challenge/submit` | `app/api/daily-challenge/submit/route.ts` |

### MiniDictionary Save Flow
```
ChatWindow → useMiniDictionary → onSave callback
  → POST /api/dictionary (saves to vocabulary_cache + user_vocabulary)
  → NEED: also create flashcard_progress entry for saved word
```

### Reduced Motion Files to Audit
- `StreakFire` component (fire animation in dashboard)
- `flashcard_celebration` (confetti on session complete)
- `daily_challenge_celebration` (celebration animation)
- `QuizHistory` animations
- Any `animation` or `transition` CSS that should be disabled

### CRITICAL: Do NOT
- **Do NOT** create a separate XP ledger table — AC says additive `xp_total` on user profile
- **Do NOT** decrement XP — additive only
- **Do NOT** change the XP point values from the AC specification
- **Do NOT** break existing activity completion flows — XP is added *after* success

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.2] — AC definition
- [Source: app/api/dashboard/route.ts L152-154] — Current placeholder XP
- [Source: lib/db/schema.ts L100-106] — userStreak table (extend with xpTotal)
- [Source: components/app/shared/MiniDictionary.tsx] — MiniDictionary save handler
- [Source: app/(app)/home/page.tsx L111] — XPCounter in GreetingCard

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
