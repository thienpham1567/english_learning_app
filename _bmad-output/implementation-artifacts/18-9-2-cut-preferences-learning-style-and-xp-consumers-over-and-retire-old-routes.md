# Story 18.9.2: Cut Preferences, Learning-Style, and XP Consumers Over and Retire Old Routes

Status: ready-for-dev

## Story

As a developer,
I want the rest of the Learner Home flow switched to `apps/api`,
so that duplicated backend ownership is removed for the first production slice.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.9.2  
**Dependencies:** 18.8.2, 18.8.3, 18.9.1

## Acceptance Criteria

1. `apps/web` uses the typed API client for preferences, learning-style, and XP flows.
2. Old Next route handlers for migrated Learner Home endpoints are removed or reduced to clearly documented temporary proxies.
3. No duplicated business logic remains between `apps/web` and `apps/api` for these flows.
4. Existing user behavior remains unchanged from the UI perspective.

## Tasks / Subtasks

- [ ] Task 1: Cut XP callers over to the API-owned endpoint.
  - [ ] Start with [apps/web/hooks/useGrammarQuiz.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts).
- [ ] Task 2: Inventory and cut over preferences and learning-style callers.
  - [ ] Replace remaining direct calls with typed-client usage.
- [ ] Task 3: Retire or proxy the old Next routes.
  - [ ] Add owners and retirement dates for any temporary proxies left in `apps/web`.
- [ ] Task 4: Run regression checks for the Learner Home slice.

## Dev Notes

### Current Repo Reality

- The known current XP consumer is [apps/web/hooks/useGrammarQuiz.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts), which posts to `"/xp"`.
- Preferences and learning-style routes still live at [apps/web/app/api/preferences/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts) and [apps/web/app/api/learning-style/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts).
- A repository-wide search did not surface many obvious non-route callers for preferences or learning style, so this story should include a real consumer inventory before route retirement.

### Implementation Guardrails

- Remove duplicated backend ownership, not just duplicated URLs.
- If a temporary proxy route remains, mark it clearly with owner and retirement date.
- Keep UI behavior stable even if the backend path changes.
- This story should finish the Learner Home cutover, not begin a wider vocabulary/daily-challenge migration.

### File Targets

- [apps/web/hooks/useGrammarQuiz.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts)
- [apps/web/app/api/preferences/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts)
- [apps/web/app/api/learning-style/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts)
- [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)

### Testing Requirements

- XP caller regression tests
- Preferences/learning-style smoke verification after cutover
- Checks that old route files are removed or explicitly documented as temporary proxies

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Grammar quiz hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts)
- [Preferences route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts)
- [Learning-style route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts)
- [XP route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- XP has an obvious caller today; preferences and learning-style need a live caller inventory before route retirement to avoid dead-code assumptions.

### Completion Notes List

- The risk is "fake cutover": routes move to `apps/api`, but legacy mutations or proxy routes quietly remain the real owners.

### File List

- `_bmad-output/implementation-artifacts/18-9-2-cut-preferences-learning-style-and-xp-consumers-over-and-retire-old-routes.md`
