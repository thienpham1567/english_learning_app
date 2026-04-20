# Story 19.4.4: Auto Cloze Test from Read Passage

Status: ready-for-dev

## Story

As a self-learner, I want a passage I just finished reading to be automatically turned into a cloze test (every Nth word blanked) — so I lock in vocab and collocation in context instead of via flashcards alone.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R12 — Reading Advanced
**Story ID:** 19.4.4
**Dependencies:** 19.4.1

## Acceptance Criteria

1. **AC1** — After finishing a passage (19.4.3 `completedAt` set), a "Test yourself" CTA appears that opens a cloze exercise derived from the same passage.
2. **AC2** — Cloze generation: prefer blanks on (a) lemmas in the passage that match the user's `my-vocabulary` (recall drill), (b) high-value content words (non-stopwords) at a configurable density (default every 7th content word).
3. **AC3** — `POST /api/reading/cloze` accepts `{ passageId, mode: "vocab-recall"|"density", density?: number }` and returns `{ items: Array<{ blankIndex, before, blank, after, answer, distractors?: string[] }> }`. Distractors only generated for MCQ mode (optional future pass).
4. **AC4** — UI: passage shown with inputs in place of blanks; typing reveals match on blur (green ✓ / red ✗ with correct answer). Final screen: score + list of missed answers.
5. **AC5** — Missed answers feed the existing spaced-repetition/flashcards flow (create a flashcard entry if not already present).
6. **AC6** — Cloze generation is deterministic per `(passageId, mode, density)` so re-taking the same test gives the same blanks.

## Tasks

- [ ] Task 1: Build the cloze generator in `lib/reading/cloze.ts` (pure function on passage + user vocab) (AC2, AC6).
- [ ] Task 2: Add `/api/reading/cloze` (AC3).
- [ ] Task 3: Build the cloze UI + scoring (AC4).
- [ ] Task 4: Wire missed-answer → flashcards creation (AC5).
- [ ] Task 5: CTA on post-read completion screen (AC1).

## Dev Notes

- Don't use an LLM for cloze generation — a deterministic pure function keeps this fast, free, and repeatable.
- Content-word filter: drop a small stopword list (`the, a, an, of, to, in, is, ...`), keep everything else as candidate.
- Lemma matching should be case-insensitive and use the lemmatizer from 19.4.1.
- Distractors (MCQ) are out of scope here — keep blanks free-text only.

## References

- Stopwords list: [github.com/stopwords/en](https://github.com/explosion/spaCy/blob/master/spacy/lang/en/stop_words.py) (inline a small set)
- Existing flashcards flow: [apps/web/app/(app)/flashcards/](apps/web/app/(app)/flashcards/)
