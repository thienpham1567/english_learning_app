# Story 19.2.1: IELTS/TOEFL Essay Scoring by Rubric

Status: ready-for-dev

## Story

As a self-learner, I want to submit an essay and get a score broken down by IELTS band (Task Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy) with inline suggestions — so I know exactly where to improve.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R10 — Writing Core
**Story ID:** 19.2.1
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — `POST /api/writing/score` accepts `{ text, prompt?, exam: "ielts-task2" | "ielts-task1" | "toefl-independent", targetBand?: number }` and returns a structured rubric result.
2. **AC2** — Response shape:
   ```ts
   {
     overall: number,  // 1-9 for IELTS, 1-30 for TOEFL
     criteria: {
       taskResponse: { score: number, feedback: string },
       coherence: { score: number, feedback: string },
       lexical: { score: number, feedback: string },
       grammar: { score: number, feedback: string }
     },
     inlineIssues: Array<{
       quote: string,
       startOffset: number,
       endOffset: number,
       category: "grammar"|"word-choice"|"coherence"|"task",
       suggestion: string,
       explanation: string
     }>,
     strengths: string[],
     nextSteps: string[]
   }
   ```
3. **AC3** — Uses OpenAI with `response_format: { type: "json_schema" }` and a rubric-calibrated system prompt. Word count pre-check: < 150 words → auto-respond `{ error: "under-length" }` without calling the model.
4. **AC4** — New route `app/(app)/writing-practice/score/page.tsx`: textarea + exam selector + prompt field + "Score my essay" button. Results render with the essay displayed and `inlineIssues` highlighted (hover = suggestion).
5. **AC5** — Rate-limited 5/min/user (scoring is expensive).
6. **AC6** — Persist to `writingAttempt`: `{ userId, exam, prompt, text, overall, criteriaJson, inlineIssuesJson, createdAt }`.

## Tasks

- [ ] Task 1: Add `writingAttempt` Drizzle schema + migration (AC6).
- [ ] Task 2: Author the rubric system prompt per exam variant — keep prompts in `lib/writing/rubric-prompts.ts` (AC3).
- [ ] Task 3: Implement `/api/writing/score` with structured output + rate-limit (AC1, AC2, AC3, AC5).
- [ ] Task 4: Build the score page UI with inline highlights (AC4).
- [ ] Task 5: Snapshot tests for the prompt template — assert exam variant, word-count guard, JSON schema shape.

## Dev Notes

- Compute `startOffset`/`endOffset` server-side (defensively) by searching for `quote` in `text` — do not trust model offsets. If quote not found, drop the issue rather than misaligning highlights.
- Cap `text` at 2000 words.
- For IELTS, the model should be instructed to use the public band descriptors and be slightly conservative (err on the lower band).
- Consider a second pass ("self-check") in the same prompt to reduce hallucinated issues — keep it in the same API call to avoid double cost.

## References

- [IELTS Task 2 band descriptors (public)](https://www.ielts.org/-/media/pdfs/writing-band-descriptors-task-2.ashx)
- OpenAI client: [apps/web/lib/openai.ts](apps/web/lib/openai.ts)
- Existing writing page: [apps/web/app/(app)/writing-practice/](apps/web/app/(app)/writing-practice/)
