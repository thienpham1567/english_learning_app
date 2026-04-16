# Story 18.10.2: Implement the Vocabulary Module in NestJS

Status: ready-for-dev

## Story

As a learner,
I want vocabulary lookup and save flows served by the Nest backend,
so that the vocabulary pipeline stops depending on Next route handlers.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.10.2  
**Dependencies:** 18.10.1

## Acceptance Criteria

1. `apps/api` contains a vocabulary controller and service for lookup and save flows.
2. Logic from relevant `apps/web/app/api/vocabulary*` routes is moved into API-owned services or adapters.
3. The module preserves current persistence behavior for saved words and cache reuse.
4. Tests cover lookup, save, duplicate-save, invalid-input, and unauthorized flows.

## Tasks / Subtasks

- [ ] Task 1: Create the vocabulary controller/service in `apps/api`.
  - [ ] Cover the live lookup/list/detail/save/toggle/delete surface selected for this migration wave.
- [ ] Task 2: Reuse existing DB and normalization behavior.
  - [ ] Preserve `vocabularyCache` usage and save/upsert semantics.
- [ ] Task 3: Enforce shared auth, validation, and error handling.
- [ ] Task 4: Add unit/e2e coverage for the migrated endpoints.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/vocabulary/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/route.ts) lists user vocabulary entries.
- [apps/web/app/api/vocabulary/save/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/save/route.ts) quick-saves cached words.
- [apps/web/app/api/vocabulary/[query]/detail/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/detail/route.ts), [vocabulary/[query]/saved/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/saved/route.ts), and [vocabulary/[query]/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary/[query]/route.ts) handle detail, toggle-save, and delete flows.

### Implementation Guardrails

- Preserve current cache behavior by reusing `vocabularyCache` instead of bypassing it.
- Keep normalization helpers shared or wrapped; do not copy large data-shaping code into controllers.
- Decide explicitly which vocabulary endpoints are in-wave versus deferred, then migrate that set completely.
- This story is the vocabulary backend move only. Flashcard consumer cutover belongs to `18.10.3`.

### File Targets

- [apps/api/src/vocabulary](/Users/thienpham/Documents/english_learning_app/apps/api/src/vocabulary)
- [apps/web/app/api/vocabulary](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary)
- [apps/web/lib/schemas/vocabulary.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/schemas/vocabulary.ts)

### Testing Requirements

- Lookup/list/detail tests
- Save and duplicate-save tests
- Invalid-input and unauthorized tests
- Parity checks for cache-miss/not-found behavior

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Vocabulary route group](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/vocabulary)
- [Vocabulary schema helpers](/Users/thienpham/Documents/english_learning_app/apps/web/lib/schemas/vocabulary.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Vocabulary persistence already depends on both `userVocabulary` and `vocabularyCache`, so migration must preserve the cache-backed behavior rather than simplifying it away.

### Completion Notes List

- The main migration risk is moving only one path, such as quick-save, while leaving list/detail/delete logic behind in `apps/web`.

### File List

- `_bmad-output/implementation-artifacts/18-10-2-implement-the-vocabulary-module-in-nestjs.md`
