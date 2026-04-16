# Story 18.10.1: Define Vocabulary and Flashcard Contracts

Status: ready-for-dev

## Story

As a developer,
I want core learning-loop contracts defined before migration,
so that vocabulary and flashcard endpoints move behind a typed boundary.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.10.1  
**Dependencies:** 18.7.2, 18.9.2

## Acceptance Criteria

1. Contracts exist for vocabulary lookup, vocabulary save, flashcard due, and flashcard review flows.
2. Shared success and failure shapes are defined for these endpoints.
3. Contract tests cover representative success, validation-failure, and unauthorized cases.
4. Existing vocabulary and dashboard-related schema work is reused where possible.

## Tasks / Subtasks

- [ ] Task 1: Add vocabulary contracts for the current lookup/save surfaces.
  - [ ] Cover list/detail/save/toggle/delete behavior as needed by the live routes.
- [ ] Task 2: Add flashcard due/review contracts.
- [ ] Task 3: Tie all failures to the shared API error envelope.
- [ ] Task 4: Add contract tests and exports.

## Dev Notes

### Current Repo Reality

- Vocabulary route files currently live under [apps/web/app/api/vocabulary](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary).
- Relevant current endpoints include [vocabulary/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/route.ts), [vocabulary/save/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/save/route.ts), [vocabulary/[query]/detail/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/detail/route.ts), [vocabulary/[query]/saved/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/saved/route.ts), and [vocabulary/[query]/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/route.ts).
- Flashcard endpoints currently live at [apps/web/app/api/flashcards/due/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/due/route.ts) and [apps/web/app/api/flashcards/review/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts).

### Implementation Guardrails

- Model the live route surface honestly instead of collapsing distinct operations into one vague schema.
- Reuse existing vocabulary normalization work where possible.
- Keep flashcard review contracts separate from the older vocabulary SRS review contracts.
- This story stays contract-first; it should not migrate runtime logic yet.

### File Targets

- [packages/contracts/src/vocabulary](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/vocabulary)
- [packages/contracts/src/flashcards](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/flashcards)
- [packages/contracts/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)
- [packages/contracts/__tests__](/Users/thienpham/Documents/english_learning_app/packages/contracts/__tests__)

### Testing Requirements

- Vocabulary contract success/failure tests
- Flashcard due/review contract tests
- Unauthorized and validation envelope parsing tests

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Vocabulary route group](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary)
- [Flashcards due route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/due/route.ts)
- [Flashcards review route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Vocabulary has a wider live route surface than the epic summary implies, so the contracts need to acknowledge list/detail/save/toggle/delete behavior, not only one lookup call.

### Completion Notes List

- The easiest failure is merging flashcard and vocabulary review semantics into one schema when the current repo still treats them as separate flows.

### File List

- `_bmad-output/implementation-artifacts/18-10-1-define-vocabulary-and-flashcard-contracts.md`
