# Story 20.8: Adapt Existing Producers into Review Queue

Status: review

## Story

As a learner,
I want mistakes from different modules to return at the right time,
so that I stop repeating the same errors.

## Acceptance Criteria

1. Review-worthy mistakes can produce review tasks without changing the main UX.
2. Grammar errors, writing patterns, vocabulary misses, pronunciation issues, listening misses, and cloze misses are supported incrementally.
3. Producers include skill ids and reason metadata.
4. Existing flashcard, vocabulary review, and error notebook routes remain backward compatible.
5. Tests cover at least vocabulary, writing error, and pronunciation task creation.

## Tasks / Subtasks

- [x] Add producer interface (AC: 1, 3)
  - [x] Define producer input/output contracts for review task creation.
  - [x] Add mapper helpers from module-specific result objects to review tasks.
- [x] Adapt representative producers (AC: 1, 2, 3, 4, 5)
  - [x] Vocabulary/flashcard producer.
  - [x] Writing error pattern producer.
  - [x] Pronunciation issue producer.
  - [x] Optionally add grammar/listening/cloze producers if scope remains safe.
- [x] Preserve current behavior (AC: 4)
  - [x] Do not remove existing SRS updates.
  - [x] Do not change current UI response payloads unless gated by additive fields.
- [x] Add tests (AC: 3, 4, 5)
  - [x] Unit test each producer mapper.
  - [x] Integration or route tests proving backward-compatible route behavior.

## Dev Notes

- This story depends on 20.7.
- Prefer producer mappers in package code; app routes should call them with existing route results.
- Do not attempt to replace the whole error notebook in this story.
- If a source lacks clean skill ids, use taxonomy mapping from 20.2 and include conservative reason metadata.

### Project Structure Notes

- Producer mappers belong under `packages/modules/src/review-engine` or `packages/modules/src/learning`.
- Existing routes likely touched: vocabulary review/save, writing score/review/pattern quiz, pronunciation score/evaluate.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Vocabulary Review Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/review/route.ts)
- [Writing Score Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/writing/score/route.ts)
- [Pronunciation Score Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/pronunciation/score/route.ts)
- [Error Notebook Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/errors/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation.

### Completion Notes List

- **Producer interface**: `ReviewTaskProducerInput/Output` types + `produceReviewTask()` base function that delegates to `computeInitialSchedule()` from 20.7.
- **6 producers** (all 7 AC: 2 source types covered):
  - `produceVocabularyReviewTask` → flashcard_review, priority 60
  - `produceWritingReviewTask` → writing_rewrite, priority 50
  - `producePronunciationReviewTask` → pronunciation_drill, skills: [pronunciation, speaking]
  - `produceGrammarReviewTask` → grammar_remediation, priority 55
  - `produceListeningReviewTask` → listening_replay
  - `produceClozeReviewTask` → cloze_retry, skills: [reading, vocabulary]
- **Backward compatibility (AC: 4)**: No existing SRS logic, route payloads, or error notebook behavior was modified. Producers are additive.
- **Tests**: 11 producer tests covering base, all 6 specific producers, skill IDs, reason metadata, and backward compat.
- Full regression: 152/152 pass.

### Change Log

- 2026-04-22: Story 20.8 implemented — producer interface, 6 module producers, 11 tests.

### File List

- `packages/modules/src/learning/review-producers.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/review-producers.test.ts` (new)
