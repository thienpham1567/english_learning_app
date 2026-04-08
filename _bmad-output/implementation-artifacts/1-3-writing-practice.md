# Story 1.3: Writing Practice

Status: done

## Story

As an English learner,
I want to practice writing with AI-powered feedback using IELTS rubrics,
so that I can improve my writing skills and track my progress toward target band scores.

## Acceptance Criteria

1. **Route & Navigation**: Add `/writing-practice` to sidebar (icon: `PenLine` from lucide-react, label: "Luyện viết"). Add to `ToolbarBreadcrumb` with eyebrow "Luyện viết", title "Writing Practice".
2. **Prompt Selection**: On entry, show a prompt gallery with categories:
   - IELTS Task 1 (graph/chart description)
   - IELTS Task 2 (argumentative essay)
   - Email (formal/informal)
   - Free topic (user types their own prompt)
   Prompts are AI-generated via `POST /api/writing-practice/prompt` with `{ category: string }`.
3. **Writing Editor**: Full-width textarea with:
   - Word count (live, bottom-right).
   - Minimum word target based on category (Task 1: 150, Task 2: 250, Email: 80, Free: 50).
   - Word target indicator: gray when under, green when met, amber when 20% over.
   - "Nộp bài" (Submit) button — disabled until minimum word count met.
4. **AI Feedback**: On submit, call `POST /api/writing-practice/review` with `{ prompt, category, text }`. Response includes:
   - **Band scores** (Task Response, Coherence & Cohesion, Lexical Resource, Grammar Range) — each 1.0–9.0 in 0.5 steps. Overall band = average rounded to nearest 0.5.
   - **Inline annotations**: array of `{ startIndex, endIndex, type: 'grammar'|'vocabulary'|'coherence', suggestion, explanation }` for specific error highlights.
   - **General feedback**: paragraph-length feedback in English with Vietnamese translation.
   - **Improved version**: a rewritten version of the user's text at the target level.
5. **Results UI**: Side-by-side layout (desktop) or tabbed (mobile):
   - Left: user's text with highlighted errors (click to see suggestion tooltip).
   - Right: band score radar chart (CSS-only or SVG), general feedback, improved version.
6. **History**: Save submissions to DB. Show last 10 submissions as a list on the main page with date, category, overall band, and word count. Click to view past feedback.
7. **OpenAI Integration**: Use existing `lib/openai/` client. Persona system prompt derived from Christine Ho persona (IELTS examiner). Use `response_format: { type: "json_object" }` with Zod validation.

## Tasks / Subtasks

- [x] Task 1: Navigation updates (AC: #1)
  - [x] Add writing-practice entry to `navItems` in `AppSidebar.tsx`
  - [x] Add writing-practice breadcrumb to `ToolbarBreadcrumb.tsx`
- [x] Task 2: Database schema (AC: #6)
  - [x] Add `writingSubmission` table to `lib/db/schema.ts`
  - [x] Generate and run migration
- [x] Task 3: Types and schemas (AC: #4)
  - [x] Create `lib/writing-practice/types.ts`
  - [x] Create `lib/writing-practice/schema.ts`
- [x] Task 4: API routes (AC: #2, #4, #6)
  - [x] Create `app/api/writing-practice/prompt/route.ts`
  - [x] Create `app/api/writing-practice/review/route.ts`
  - [x] Create `app/api/writing-practice/history/route.ts`
- [x] Task 5: UI components (AC: #2, #3, #4, #5, #6)
  - [x] Create `components/app/writing-practice/PromptGallery.tsx`
  - [x] Create `components/app/writing-practice/WritingEditor.tsx`
  - [x] Create `components/app/writing-practice/FeedbackPanel.tsx`
  - [x] Create `components/app/writing-practice/BandScoreRadar.tsx`
  - [x] Create `components/app/writing-practice/AnnotatedText.tsx`
  - [x] Create `components/app/writing-practice/SubmissionHistory.tsx`
- [x] Task 6: Page and hook (AC: all)
  - [x] Create `app/(app)/writing-practice/page.tsx`
  - [x] Create `hooks/useWritingPractice.ts`

## Dev Notes

### Architecture Patterns (MUST FOLLOW)

- **Next.js 16 App Router** — route page is `"use client"`.
- **API routes** — auth guard via `auth.api.getSession()`. Route Handlers in `app/api/writing-practice/`.
- **Database** — PostgreSQL via Drizzle ORM. New `writingSubmission` table with jsonb columns for scores and feedback.
- **OpenAI** — reuse `lib/openai/` client. Structured JSON output with Zod validation. Christine Ho persona instructions from `lib/chat/personas.ts` — extract and adapt the IELTS examiner system prompt.
- **Styling** — Tailwind CSS v4 + CSS variables. Use `--accent` for band score highlights, `--sage: #5a7a64` for grammar annotations.
- **Animations** — `motion/react` for panel transitions, score reveals.

### Key Existing Code to Reuse

- **Christine Ho persona**: `lib/chat/personas.ts` line 67-92 — IELTS examiner instructions. Adapt for writing review system prompt.
- **OpenAI client**: `lib/openai/` — existing client setup.
- **Auth**: `lib/auth.ts` — session check pattern.
- **DB patterns**: `lib/db/schema.ts` — table definition patterns with uuid, timestamp, jsonb.
- **Markdown rendering**: `react-markdown` + `remark-gfm` already installed — reuse for rendering feedback.

### Anti-Pattern Prevention

- **DO NOT** create a new OpenAI client — reuse existing one.
- **DO NOT** skip Zod validation of AI feedback response — always validate.
- **DO NOT** render the radar chart with a charting library — use a simple SVG polygon (no new deps).
- **DO NOT** put the AI review logic in the component — keep it in the API route handler.
- **DO NOT** forget to handle long AI response times — show a shimmer/skeleton during review.

### Project Structure Notes

```
app/(app)/writing-practice/page.tsx                    ← route page
components/app/writing-practice/                       ← UI components
hooks/useWritingPractice.ts                            ← state machine hook
lib/writing-practice/types.ts                          ← TypeScript types
lib/writing-practice/schema.ts                         ← Zod schemas
app/api/writing-practice/prompt/route.ts               ← prompt generation
app/api/writing-practice/review/route.ts               ← writing review
app/api/writing-practice/history/route.ts              ← submission history
```

### References

- [Source: lib/chat/personas.ts#L67-92] — Christine Ho IELTS persona
- [Source: lib/openai/] — OpenAI client
- [Source: lib/db/schema.ts] — DB table patterns
- [Source: components/app/shared/AppSidebar.tsx#L10-15] — nav items
- [Source: components/app/shared/ToolbarBreadcrumb.tsx#L5-10] — breadcrumbs
- [Source: app/globals.css] — design tokens including `--sage` for annotations

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

### Completion Notes List

- ✅ Task 1: Added PenLine icon + /writing-practice to sidebar nav and breadcrumb. All nav tests pass.
- ✅ Task 2: Added `writingSubmission` table (10 columns, jsonb scores/feedback). Migration `0004_narrow_jean_grey.sql` generated.
- ✅ Task 3: Created types (WritingFeedback, InlineAnnotation, BandScores, WritingCategory) and Zod schemas.
- ✅ Task 4: Created 3 API routes: POST /prompt (AI prompt generation), POST /review (IELTS feedback + DB persistence), GET /history.
- ✅ Task 5: Created 6 UI components: PromptGallery, WritingEditor, BandScoreRadar (SVG), AnnotatedText, FeedbackPanel, SubmissionHistory.
- ✅ Task 6: Created page + useWritingPractice hook (state machine: prompt-selection → generating-prompt → writing → reviewing → feedback).
- ✅ Build passes. All navigation tests pass.

### File List

**Modified:**
- components/app/shared/AppSidebar.tsx (added PenLine + writing-practice nav)
- components/app/shared/ToolbarBreadcrumb.tsx (added writing-practice breadcrumb)
- lib/db/schema.ts (added writingSubmission table + WritingSubmissionRow type)

**Created:**
- lib/writing-practice/types.ts
- lib/writing-practice/schema.ts
- app/api/writing-practice/prompt/route.ts
- app/api/writing-practice/review/route.ts
- app/api/writing-practice/history/route.ts
- components/app/writing-practice/PromptGallery.tsx
- components/app/writing-practice/WritingEditor.tsx
- components/app/writing-practice/BandScoreRadar.tsx
- components/app/writing-practice/AnnotatedText.tsx
- components/app/writing-practice/FeedbackPanel.tsx
- components/app/writing-practice/SubmissionHistory.tsx
- hooks/useWritingPractice.ts
- app/(app)/writing-practice/page.tsx
- lib/db/migrations/0004_narrow_jean_grey.sql

## Code Review (AI)

**Review Date:** 2026-04-08
**Reviewer Model:** Gemini 3 Flash + Claude Opus 4.6 (Thinking)
**Review Outcome:** Fixed
**Layers Run:** Blind Hunter · Edge Case Hunter · Acceptance Auditor

### Findings

- [x] [Review][Patch] F1: Missing rate limiting on review endpoint — expensive AI calls could be spammed [app/api/writing-practice/review/route.ts] — **Fixed:** added per-user rate limiter (3 req/min)
- [x] [Review][Patch] F2: Annotation overlap vulnerability — overlapping or out-of-bounds AI annotations break text rendering [components/app/writing-practice/AnnotatedText.tsx] — **Fixed:** added index clamping + overlap filter
- [x] [Review][Defer] F3: Radar chart doesn't clamp scores to 0-9 range [components/app/writing-practice/BandScoreRadar.tsx] — deferred, Zod schema already validates 1-9
