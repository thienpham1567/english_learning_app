# Story 19.2.3: Guided Writing (Prompt + Outline + Vocab Bank)

Status: ready-for-dev

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

- [ ] Task 1: Add `/api/writing/guided-prompt` (AC1, AC2, AC4).
- [ ] Task 2: Extend `writingAttempt` schema to include `guidedPromptJson nullable` (AC6).
- [ ] Task 3: Add the Guided tab UI with the three panels (AC3).
- [ ] Task 4: Extend the 19.2.1 score prompt to receive `vocabBank` and comment on usage (AC5).

## Dev Notes

- Vocab bank should avoid overly obscure words — aim for "ambitious but defensible" B2/C1 choices.
- Do not seed from a static list for categories — let the LLM generate per session for variety, but keep the category set fixed.
- The "click to insert" action should insert the term alone (not the example) at the cursor.

## References

- Story 19.2.1 scoring endpoint.
- Existing writing page: [apps/web/app/(app)/writing-practice/](apps/web/app/(app)/writing-practice/)
