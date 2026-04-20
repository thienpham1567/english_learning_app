# Story 19.4.1: CEFR-Graded Reader + Vocab Prioritization

Status: ready-for-dev

## Story

As a self-learner, I want reading material tagged by CEFR level (A2/B1/B2/C1) and ranked so that passages using words I haven't mastered yet surface first — so every session grows my vocabulary, not just my hour count.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R12 — Reading Advanced
**Story ID:** 19.4.1
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — `readingPassage` schema extended with `cefrLevel: "A2"|"B1"|"B2"|"C1"|"C2"`, `wordCount int`, `lexicalTagsJson: string[]` (normalized lemmas). Existing rows backfilled via a one-off script that uses an LLM pass for level + tokenizes for lemmas.
2. **AC2** — `GET /api/reading/passages?level=<>&sort=priority` returns passages sorted by a score that rewards unseen lemmas for the user: `score = novelLemmaCount + 0.5 * knownLemmaCount - 2 * tooHardLemmaCount`, where "known" comes from `my-vocabulary` and `tooHard` is any lemma > 2 CEFR steps above the selected level.
3. **AC3** — The `reading` page gets a level filter (pill group) and shows the priority-sorted list with each passage's: title, word count, CEFR badge, "new words" count, read/unread indicator.
4. **AC4** — Passage seed: add ≥ 30 passages across A2–C1 (via LLM generation at design time, stored in the DB via a seed script in `packages/database`). Each passage 150–600 words.
5. **AC5** — A one-off route-handler or CLI script `scripts/backfill-reading-metadata.ts` can be re-run to recompute `cefrLevel`, `wordCount`, `lexicalTagsJson` for all passages (idempotent).
6. **AC6** — A lemma dictionary is cached in `apps/web/lib/reading/lemmatize.ts` (use `wink-lemmatizer` or similar lightweight dependency; do not pull in `compromise` or spacy).

## Tasks

- [ ] Task 1: Extend `readingPassage` schema + migration (AC1).
- [ ] Task 2: Add lemmatizer module (AC6).
- [ ] Task 3: Author the seed script + seed 30+ passages (AC4).
- [ ] Task 4: Implement priority-sort endpoint (AC2).
- [ ] Task 5: Build the level filter + sorted list UI (AC3).
- [ ] Task 6: Add backfill script (AC5).

## Dev Notes

- CEFR classification prompt: few-shot with 2 example paragraphs per level, ask for the single most-fitting level.
- `novelLemmaCount` is the count of passage lemmas not present in the user's `my-vocabulary` lemmas.
- Consider adding a user preference `preferredCefrLevel` later — out of scope for this story.

## References

- [wink-lemmatizer](https://winkjs.org/wink-lemmatizer/)
- [CEFR descriptors](https://www.coe.int/en/web/common-european-framework-reference-languages)
- Existing reading surface: [apps/web/app/(app)/reading/](apps/web/app/(app)/reading/)
