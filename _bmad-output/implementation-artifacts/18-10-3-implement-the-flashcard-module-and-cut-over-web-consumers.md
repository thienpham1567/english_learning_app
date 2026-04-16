# Story 18.10.3: Implement the Flashcard Module and Cut Over Web Consumers

Status: ready-for-dev

## Story

As a learner,
I want due and review flashcard flows served by the Nest backend,
so that the highest-frequency learning loop has a clear backend owner.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.10.3  
**Dependencies:** 18.10.1, 18.10.2

## Acceptance Criteria

1. `apps/api` contains a flashcard controller and service for due and review flows.
2. Logic from relevant `apps/web/app/api/flashcards/*` routes is moved into API-owned services or adapters.
3. `apps/web` switches to the typed API client for migrated flashcard calls.
4. Tests cover due retrieval, review submission, invalid-input, and unauthorized flows.

## Tasks / Subtasks

- [ ] Task 1: Build the flashcard API module.
  - [ ] Migrate due-card retrieval and review submission into `apps/api`.
- [ ] Task 2: Reuse existing review logic carefully.
  - [ ] Account for SM-2 helpers and XP side effects.
- [ ] Task 3: Cut over web consumers.
  - [ ] Update [apps/web/hooks/useFlashcardSession.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useFlashcardSession.ts).
- [ ] Task 4: Add unit/e2e and web regression coverage.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/flashcards/due/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/due/route.ts) reads saved vocabulary and flashcard progress to assemble due cards.
- [apps/web/app/api/flashcards/review/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts) performs SM-2 updates and XP/activity side effects.
- [apps/web/hooks/useFlashcardSession.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useFlashcardSession.ts) is the main live consumer for those routes.

### Implementation Guardrails

- Keep flashcard routes distinct from `vocabulary/due` and `vocabulary/review`, which are older SRS quiz flows.
- Preserve current review semantics unless there is an explicit product change.
- Reuse shared SM-2 helpers instead of cloning the algorithm into `apps/api`.
- Do not leave `useFlashcardSession` pointing at the old Next route after the backend module lands.

### File Targets

- [apps/api/src/flashcards](/Users/thienpham/Documents/english_learning_app/apps/api/src/flashcards)
- [apps/web/app/api/flashcards/due/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/due/route.ts)
- [apps/web/app/api/flashcards/review/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts)
- [apps/web/hooks/useFlashcardSession.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useFlashcardSession.ts)

### Testing Requirements

- Due retrieval tests
- Review submission tests
- Invalid-input and unauthorized tests
- Web hook regression checks after cutover

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Flashcards due route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/due/route.ts)
- [Flashcards review route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/flashcards/review/route.ts)
- [Flashcard session hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useFlashcardSession.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Flashcards already have one clear web consumer, which makes this a good cutover story once the API module exists.

### Completion Notes List

- The hidden risk is accidentally mixing flashcard review and vocabulary review side effects because both touch SRS and XP concepts.

### File List

- `_bmad-output/implementation-artifacts/18-10-3-implement-the-flashcard-module-and-cut-over-web-consumers.md`
