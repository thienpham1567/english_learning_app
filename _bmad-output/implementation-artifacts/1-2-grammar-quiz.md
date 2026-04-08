# Story 1.2: Grammar Quiz

Status: done

## Story

As an English learner,
I want to practice grammar through AI-generated quizzes tailored to my CEFR level,
so that I can identify and fix my grammar weaknesses systematically.

## Acceptance Criteria

1. **Route & Navigation**: Add `/grammar-quiz` to sidebar (icon: `BrainCircuit` from lucide-react, label: "Ngữ pháp"). Add to `ToolbarBreadcrumb` with eyebrow "Luyện ngữ pháp", title "Grammar Quiz".
2. **Level Selection**: On entry, show a level picker (A1–C2) with the user's last-used level pre-selected (stored in localStorage key `grammar-quiz-level`).
3. **Quiz Generation**: Call `POST /api/grammar-quiz/generate` with `{ level: string, count: number }`. Backend uses OpenAI to generate `count` (default 10) multiple-choice questions. Each question has: `stem` (sentence with blank), `options` (4 choices), `correctIndex`, `explanation` (English + Vietnamese), `grammarTopic` (e.g., "present perfect", "conditionals").
4. **Quiz UI**: Present one question at a time with:
   - Progress indicator (e.g., "3 / 10").
   - Stem with highlighted blank.
   - 4 option buttons (A/B/C/D). On selection: correct → green + check icon, wrong → red + X icon + correct answer highlighted green.
   - After answering, show explanation panel with "Giải thích" heading, grammar rule in English and Vietnamese translation.
   - "Tiếp theo" button to advance.
5. **Score Summary**: After completing all questions, show results:
   - Score: `correct / total` with percentage.
   - Breakdown by grammar topic.
   - Weak topics highlighted.
   - "Làm lại" (retry same) and "Đề mới" (new quiz) buttons.
6. **Streaming**: Quiz generation should show a loading skeleton while AI generates questions. Do NOT stream individual questions — generate all at once then display.
7. **OpenAI Integration**: Use existing `lib/openai/` client. System prompt must enforce JSON output with Zod validation. Temperature: 0.7. Model: match whatever the chatbot uses.
8. **No Persistence**: Quiz results are session-only (no DB). Level preference saved in localStorage only.

## Tasks / Subtasks

- [x] Task 1: Navigation updates (AC: #1)
  - [x] Add grammar-quiz entry to `navItems` in `AppSidebar.tsx`
  - [x] Add grammar-quiz breadcrumb to `ToolbarBreadcrumb.tsx`
- [x] Task 2: Types and schemas (AC: #3)
  - [x] Create `lib/grammar-quiz/types.ts` — `GrammarQuestion`, `QuizSession` types
  - [x] Create `lib/grammar-quiz/schema.ts` — Zod schemas for AI output validation
- [x] Task 3: API route (AC: #3, #7)
  - [x] Create `app/api/grammar-quiz/generate/route.ts` — POST handler
  - [x] Build OpenAI prompt that generates structured grammar questions
  - [x] Validate AI response with Zod schema, retry once on invalid output
- [x] Task 4: Quiz UI components (AC: #2, #4, #5, #6)
  - [x] Create `components/app/grammar-quiz/LevelPicker.tsx`
  - [x] Create `components/app/grammar-quiz/QuestionCard.tsx`
  - [x] Create `components/app/grammar-quiz/ScoreSummary.tsx`
- [x] Task 5: Page and hook (AC: #2)
  - [x] Create `app/(app)/grammar-quiz/page.tsx`
  - [x] Create `hooks/useGrammarQuiz.ts` — manages quiz state machine (idle → loading → active → reviewing → summary)

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

- **Next.js 16 App Router** — route at `app/(app)/grammar-quiz/page.tsx`, use `"use client"` directive.
- **API routes** — `app/api/grammar-quiz/generate/route.ts` with auth guard via `auth.api.getSession()`.
- **OpenAI client** — reuse existing `lib/openai/` setup. Use `response_format: { type: "json_object" }` for structured output.
- **Styling** — Tailwind CSS v4 + CSS variables from `globals.css`. Match existing design language: warm tones, `--accent: #c46d2e`, `--font-display: Fraunces` for headings.
- **Animations** — `motion/react` for card transitions, answer reveal, score animations.
- **No new dependencies required.**

### Key Existing Code to Reuse

- **OpenAI setup**: `lib/openai/` — client configuration, API key handling.
- **Auth pattern**: `auth.api.getSession({ headers: await headers() })` — copy from existing API routes.
- **UI design tokens**: `globals.css` — `--accent`, `--surface`, `--border`, `--shadow-md`, etc.
- **Level badge colors**: `LEVEL_COLORS` from `my-vocabulary/page.tsx` — reuse for level picker pills.
- **Loading skeleton pattern**: existing dictionary page uses loading states — follow same pattern.

### Anti-Pattern Prevention

- **DO NOT** stream questions one-by-one — generate all at once, validate, then show sequentially.
- **DO NOT** create a separate OpenAI client — reuse the existing one in `lib/openai/`.
- **DO NOT** store quiz results in the database — this is intentionally session-only to avoid schema bloat.
- **DO NOT** hardcode grammar topics — let the AI generate appropriate topics for the selected level.
- **DO NOT** skip Zod validation of AI output — LLMs produce unexpected formats; always validate.

### Project Structure Notes

```
app/(app)/grammar-quiz/page.tsx                 ← route page
components/app/grammar-quiz/                    ← UI components
hooks/useGrammarQuiz.ts                         ← quiz state machine
lib/grammar-quiz/types.ts                       ← TypeScript types
lib/grammar-quiz/schema.ts                      ← Zod validation schemas
app/api/grammar-quiz/generate/route.ts          ← AI quiz generation endpoint
```

### References

- [Source: lib/openai/] — existing OpenAI client setup
- [Source: lib/db/schema.ts] — DB patterns (for reference, no new tables needed)
- [Source: components/app/shared/AppSidebar.tsx#L10-15] — nav items
- [Source: components/app/shared/ToolbarBreadcrumb.tsx#L5-10] — breadcrumbs
- [Source: app/globals.css] — design tokens
- [Source: app/(app)/my-vocabulary/page.tsx#L29-36] — LEVEL_COLORS

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Added BrainCircuit icon + /grammar-quiz to sidebar nav and breadcrumb. All 12 nav tests pass.
- ✅ Task 2: Created `lib/grammar-quiz/types.ts` (GrammarQuestion, QuizSession, QuizState) and `lib/grammar-quiz/schema.ts` (Zod schemas with 4-tuple options, correctIndex 0-3 validation).
- ✅ Task 3: Created `POST /api/grammar-quiz/generate` — auth guard, Zod request validation (level enum + count), OpenAI JSON mode with system prompt, response validation, 1 retry on invalid format, 502 on failure.
- ✅ Task 4: Created 3 UI components: LevelPicker (A1-C2 pills + start button), QuestionCard (stem with highlighted blank, A/B/C/D options, correct/incorrect reveal, explanation panel, next button), ScoreSummary (score circle, per-topic breakdown, weak topic highlighting, retry/new quiz buttons).
- ✅ Task 5: Created page route and useGrammarQuiz hook with state machine (idle → loading → active → summary), localStorage level persistence, answer tracking, score calculation, topic breakdown.
- ✅ Build passes. All navigation tests pass.
- ℹ️ No DB tables needed — quiz results are session-only per AC#8.

### File List

**Modified:**
- components/app/shared/AppSidebar.tsx (added BrainCircuit import + grammar-quiz nav)
- components/app/shared/ToolbarBreadcrumb.tsx (added grammar-quiz breadcrumb)

**Created:**
- lib/grammar-quiz/types.ts
- lib/grammar-quiz/schema.ts
- app/api/grammar-quiz/generate/route.ts
- components/app/grammar-quiz/LevelPicker.tsx
- components/app/grammar-quiz/QuestionCard.tsx
- components/app/grammar-quiz/ScoreSummary.tsx
- app/(app)/grammar-quiz/page.tsx
- hooks/useGrammarQuiz.ts

## Code Review (AI)

**Review Date:** 2026-04-08
**Reviewer Model:** Gemini 3 Flash + Claude Opus 4.6 (Thinking)
**Review Outcome:** Fixed
**Layers Run:** Blind Hunter · Edge Case Hunter · Acceptance Auditor

### Findings

- [x] [Review][Patch] F1: No error feedback when quiz generation fails — user returned to idle silently [hooks/useGrammarQuiz.ts:45, app/(app)/grammar-quiz/page.tsx:60] — **Fixed:** added error state + error banner
- [x] [Review][Patch] F3: No rate limiting on AI endpoint — authenticated user could spam expensive calls [app/api/grammar-quiz/generate/route.ts] — **Fixed:** added in-memory per-user rate limiter (5 req/min)
- [x] [Review][Defer] F2: Topic breakdown sync risk if answers/questions lengths diverge [hooks/useGrammarQuiz.ts] — deferred, current logic prevents this
