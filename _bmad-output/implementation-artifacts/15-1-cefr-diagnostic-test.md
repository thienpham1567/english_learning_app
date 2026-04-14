# Story 15.1: CEFR Diagnostic Test

## Status: ready-for-dev
## Story ID: 15.1
## Epic: 15 — CEFR Diagnostic, Scenarios & Social
## Created: 2026-04-14

---

## User Story

**As** a new learner,
**I want** to take a placement test to determine my English level,
**So that** all modules start at the right difficulty for me.

## Business Value

The CEFR Diagnostic Test is the primary onboarding gate for personalized learning. Without it, all users start at the same level (5.0 / B1), missing the opportunity to calibrate grammar, listening, reading, and vocabulary modules to their actual proficiency. This directly impacts retention — users who experience too-easy or too-hard content churn faster.

---

## Acceptance Criteria (BDD)

### AC1: Test Accessibility
**Given** a user navigating to `/diagnostic` (accessible from onboarding + settings)
**When** the page loads
**Then** a welcome screen explains the test purpose, duration (~15 min), and format
**And** a "Bắt đầu test" button initiates the adaptive test
**And** if user has taken a test within the last 30 days, show retake cooldown timer

### AC2: Adaptive Question Flow
**Given** the test has started
**When** questions are presented
**Then** 30 total questions: 10 grammar + 10 vocabulary + 5 reading + 5 listening
**And** questions begin at B1 (mid) level
**And** adaptive logic: 3 correct in a row → increase difficulty level
**And** adaptive logic: 2 wrong in a row → decrease difficulty level
**And** levels range: A1 → A2 → B1 → B2 → C1 → C2

### AC3: Results Display
**Given** the user has completed all 30 questions
**When** the results page renders
**Then** show overall CEFR level (A1–C2) with confidence percentage
**And** show skill breakdown radar chart (grammar, vocabulary, reading, listening)
**And** show per-skill CEFR level
**And** show comparison to previous test result if available

### AC4: Profile Auto-Population
**Given** the test results are calculated
**When** results are saved
**Then** auto-populate `user_skill_profile` for all tested modules (grammar, listening, reading)
**And** vocabulary skill is derived from vocabulary question performance
**And** existing skill profiles are overwritten with diagnostic results

### AC5: Rate Limiting
**Given** a user who has completed a diagnostic test
**When** they try to retake within 30 days
**Then** show "Bạn có thể làm lại test sau X ngày" message
**And** disable the start button

### AC6: Persistence
**Given** test results have been computed
**When** saved to database
**Then** stored in `diagnostic_result` table with: userId, overallCefr, confidence, skillBreakdown (JSONB), completedAt
**And** XP awarded: 50 XP for first completion, 25 XP for retakes

---

## Technical Requirements

### Database Schema

New table `diagnostic_result`:
```sql
CREATE TABLE diagnostic_result (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  overall_cefr TEXT NOT NULL,        -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  confidence REAL NOT NULL,           -- 0.0 to 1.0
  skill_breakdown JSONB NOT NULL,     -- { grammar: { level: 5.2, cefr: 'B1', correct: 7, total: 10 }, ... }
  answers JSONB,                       -- full answer log for review
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX diagnostic_result_user_idx ON diagnostic_result(user_id);
```

Add to Drizzle schema in `lib/db/schema.ts`:
```typescript
export const diagnosticResult = pgTable("diagnostic_result", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  overallCefr: text("overall_cefr").notNull(),
  confidence: real("confidence").notNull(),
  skillBreakdown: jsonb("skill_breakdown").$type<DiagnosticSkillBreakdown>().notNull(),
  answers: jsonb("answers").$type<DiagnosticAnswer[]>(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### API Endpoints

#### `POST /api/diagnostic/start`
- Check rate limit (30-day cooldown)
- Return question set (30 questions pre-generated or AI-generated)
- Return `sessionId` for answer tracking

#### `POST /api/diagnostic/answer`
- Body: `{ sessionId, questionIndex, answer, timeSpent }`
- Apply adaptive logic server-side
- Return next question with adjusted difficulty
- Return `{ nextQuestion, progress, currentLevel }`

#### `POST /api/diagnostic/complete`
- Body: `{ sessionId }`
- Calculate final CEFR levels per skill
- Update `user_skill_profile` for all modules
- Award XP (50 first time, 25 retake)
- Save to `diagnostic_result`
- Return full results

### Adaptive Algorithm

```
CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
LEVEL_TO_NUMERIC = { A1: 1, A2: 3, B1: 5, B2: 7, C1: 9, C2: 10 }

State per skill:
  - currentLevel: starts at B1 (index 2)
  - consecutiveCorrect: 0
  - consecutiveWrong: 0
  - history: []

On correct answer:
  - consecutiveCorrect++
  - consecutiveWrong = 0
  - if consecutiveCorrect >= 3: level up (min C2), reset consecutiveCorrect

On wrong answer:
  - consecutiveWrong++
  - consecutiveCorrect = 0
  - if consecutiveWrong >= 2: level down (min A1), reset consecutiveWrong

Final CEFR = weighted average of last 5 question levels per skill
Confidence = 1 - (stddev of answered levels / 3)
```

---

## Developer Context

### Existing Patterns to Follow

1. **API pattern**: All API routes use `auth.api.getSession({ headers: await headers() })` for authentication
2. **DB pattern**: Drizzle ORM with `db.select()`, `db.insert()`, `.onConflictDoUpdate()`
3. **Skill profile**: Use existing `getSkillProfile()` and `updateSkillProfile()` from `lib/adaptive/difficulty.ts`
4. **CEFR mapping**: Use existing `levelToCefr()` from `lib/adaptive/difficulty.ts`
5. **XP logging**: Use `activityLog` table insert pattern (see any existing API that awards XP)
6. **Question generation**: Follow grammar-quiz pattern — use OpenAI with structured output via Zod schema
7. **Component style**: Ant Design components + CSS variables (`var(--accent)`, `var(--border)`, etc.)
8. **Radar chart**: Reuse `SkillRadar` SVG component already built in `app/(app)/progress/page.tsx`

### Critical Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `userSkillProfile` table | `lib/db/schema.ts:91-102` | Write diagnostic results |
| `getSkillProfile` / `updateSkillProfile` | `lib/adaptive/difficulty.ts` | Read/write skill levels |
| `levelToCefr` | `lib/adaptive/difficulty.ts` | Map numeric → CEFR |
| `activityLog` table | `lib/db/schema.ts` | Award XP |
| `openAiClient` | `lib/openai/client.ts` | Generate questions if using AI |
| `SkillRadar` component | `app/(app)/progress/page.tsx:113-225` | **Extract to shared** for results radar |

### File Structure

```
app/
  (app)/
    diagnostic/
      page.tsx              ← Main diagnostic page (client component)
  api/
    diagnostic/
      start/route.ts        ← POST: check cooldown, generate questions
      answer/route.ts       ← POST: receive answer, return next question
      complete/route.ts     ← POST: calculate results, save, award XP
lib/
  diagnostic/
    questions.ts            ← Question bank or AI generation logic
    algorithm.ts            ← Adaptive scoring algorithm
    types.ts                ← TypeScript types for diagnostic
components/
  app/
    shared/
      SkillRadar.tsx        ← Extract from progress page for reuse
```

### Question Strategy

**Option A (Recommended for MVP)**: Pre-built question bank
- Create `lib/diagnostic/questions.ts` with ~200 questions tagged by skill + CEFR level
- Fast, deterministic, no API cost per test
- Questions shuffled per session

**Option B**: AI-generated per session
- Use OpenAI to generate questions at each level
- More variety but adds latency and cost
- Can be added later as enhancement

### Navigation Integration

Add "Placement Test" to settings/profile page:
```tsx
// In settings or onboarding flow
<Link href="/diagnostic">
  📊 Bài test xếp loại CEFR
</Link>
```

For new users (first login), consider showing a prompt card on the home page:
```
"Bạn chưa làm bài test xếp loại — hệ thống sẽ khó cá nhân hóa bài học cho bạn."
[Làm test ngay →]
```

---

## Previous Story Intelligence

### Story 15.4 (Weekly Leaderboard) — learnings:
- Anonymized user data pattern established
- UTC+7 timezone arithmetic (no `toLocaleString` on server — use explicit offset)
- Code review caught `.having()` without `.groupBy()` — always validate SQL queries
- Successfully integrated widget on home page with `{!isNewUser && <Component />}` pattern

### Sprint 10 (Epic 14) — patterns established:
- Lazy-loading pattern for non-critical data (`useEffect` + `fetch`)
- Hooks must be declared before any early returns (React Rules of Hooks — F3 fix)
- Division-by-zero guards in all score calculations
- CSS heatmap variables pattern in `globals.css`

---

## Git Intelligence

Recent commits (last 5):
```
d0a2968 fix: Code review patches F1-F2 for Story 15.4
86ee36e feat: Story 15.4 — Weekly Leaderboard
3104bec fix: Code review patches F1-F4 for Sprint 10
29e195c feat: Story 14.2 — Predicted TOEIC Score
966de59 feat: Story 14.4 — Enhanced Today's Plan
```

Patterns: Feature commits follow `feat: Story X.Y — Title` convention. Code review fixes follow `fix: Code review patches F#-F# for Story X.Y`.

---

## Testing Checklist

- [ ] New user can access `/diagnostic` and see welcome screen
- [ ] Test starts at B1 level, 30 questions presented sequentially
- [ ] Adaptive level changes visible (harder after 3 correct, easier after 2 wrong)
- [ ] Progress indicator shows question X/30
- [ ] Results page shows overall CEFR + per-skill breakdown + radar
- [ ] `user_skill_profile` updated for grammar, listening, reading modules
- [ ] XP awarded (50 first time, 25 retake)
- [ ] 30-day cooldown enforced
- [ ] `pnpm build` passes
- [ ] Dark/light mode renders correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master

---

> Ultimate context engine analysis completed — comprehensive developer guide created
