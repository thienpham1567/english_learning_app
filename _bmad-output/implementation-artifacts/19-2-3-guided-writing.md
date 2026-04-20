# Story 19.2.3: Guided Writing (Prompt + Outline + Vocab Bank)

Status: done

## Story

As a self-learner, I want to start an essay from a topic that comes with a suggested outline and a vocab bank — so the cold-start problem goes away and I practice using target lexical resources.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R10 — Writing Core
**Story ID:** 19.2.3
**Dependencies:** 19.2.1

## Acceptance Criteria

1. **AC1** — `POST /api/writing/guided-prompt` accepts `{ exam, targetBand, topicCategory? }` and returns `{ prompt, outline: string[], vocabBank: Array<{ term, meaning, example }> }`.
2. **AC2** — Outline has 3–5 bullets (intro stance + 2–3 body points + conclusion hook). Vocab bank has 6–10 B2/C1 terms with brief meaning and a usage example.
3. **AC3** — UI: new tab on `writing-practice` called "Guided" — shows the prompt, outline, vocab bank (clickable to insert into editor), and a composition textarea that connects to 19.2.1 score on submit.
4. **AC4** — "Shuffle topic" button regenerates prompt with the same category; "New category" lets user pick from a fixed list (education, technology, environment, health, society, work).
5. **AC5** — When scoring (via 19.2.1), the `lexical` feedback is asked to acknowledge whether the user actually used the vocab bank terms and how well.
6. **AC6** — Prompt + outline + vocabBank get stored on the resulting `writingAttempt` record so the user can revisit.

## Tasks

- [x] Task 1: Add `/api/writing/guided-prompt` (AC1, AC2, AC4).
- [x] Task 2: Extend `writingAttempt` schema to include `guidedPromptJson nullable` (AC6).
- [x] Task 3: Add the Guided tab UI with the three panels (AC3).
- [x] Task 4: Extend the 19.2.1 score prompt to receive `vocabBank` and comment on usage (AC5).

## Dev Notes

- Vocab bank should avoid overly obscure words — aim for "ambitious but defensible" B2/C1 choices.
- Do not seed from a static list for categories — let the LLM generate per session for variety, but keep the category set fixed.
- The "click to insert" action should insert the term alone (not the example) at the cursor.

## References

- Story 19.2.1 scoring endpoint.
- Existing writing page: [apps/web/app/(app)/writing-practice/](apps/web/app/(app)/writing-practice/)

## File List

- `apps/web/app/api/writing/guided-prompt/route.ts` — Guided prompt endpoint (AC1, AC2)
- `apps/web/app/(app)/writing-practice/_components/GuidedWritingPanel.tsx` — Full guided writing UI (AC3, AC4)
- `apps/web/app/(app)/writing-practice/page.tsx` — Added "🎯 Viết có hướng dẫn" tab (AC3)
- `packages/database/src/schema/index.ts` — Added `guidedPromptJson` column (AC6)
- `apps/web/lib/db/migrations/0015_guided_writing.sql` — Migration for new column
- `apps/web/lib/writing/rubric-prompts.ts` — Extended `buildScoringPrompt` with vocabBank param (AC5)
- `apps/web/app/api/writing/score/route.ts` — Extended to accept vocabBank + guidedPromptJson (AC5, AC6)
- `apps/web/test/lib/rubric-prompts.test.ts` — Added 2 tests for vocabBank (22 total passing)

## Dev Agent Record

### Completion Notes

- Migration 0015 applied to Supabase — adds nullable `guided_prompt_json` jsonb column
- AC1: endpoint validates exam type, randomizes category if not provided
- AC2: prompt instructs AI to cap outline at 3–5 bullets, vocabBank at 6–10 terms; server-side slice enforces
- AC3: GuidedWritingPanel with 4 states: setup → loading-prompt → writing → result
- AC3: vocab bank items show ✓ green check when detected in essay text; click inserts at cursor position
- AC4: "Đổi đề" shuffles same category; "Chủ đề khác" returns to setup
- AC5: buildScoringPrompt appends vocab terms with instruction to comment on usage in lexical feedback
- AC6: guidedPromptJson (prompt+outline+vocabBank+category) persisted on writingAttempt record
- 22 tests passing

### Review Findings

- [x] [Review][Patch] No rate limiting on `guided-prompt` endpoint — **fixed** (20/min/user)
- [x] [Review][Patch] Missing `exam` in `generatePrompt` useCallback deps — **fixed**
- [x] [Review][Patch] No minimum outline (≥3) or vocabBank (≥6) length enforcement — **fixed**
- [x] [Review][Patch] `vocabBank` items not type-guarded in score route — **fixed** (filter + type predicate)
- [x] [Review][Defer] `guidedPromptJson` stored without validation — deferred, low severity
- [x] [Review][Defer] Vocab insert position resets on textarea focus loss — deferred, known DOM limitation
