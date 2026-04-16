# Story 18.11.3: Centralize XP and Progress Orchestration and Cut Over Consumers

Status: ready-for-dev

## Story

As a developer,
I want XP and progress updates to run through one backend-owned path,
so that learning-state mutations stop being split across the web app and route handlers.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.11.3  
**Dependencies:** 18.11.2

## Acceptance Criteria

1. XP and related progress updates flow through one authoritative orchestration path in `apps/api`.
2. `apps/web` consumes the migrated daily challenge and XP endpoints through the typed API client.
3. Old Next route handlers are removed or marked as temporary proxies with owners and dates.
4. Tests cover success, duplicate updates, unauthorized access, and failure recovery.

## Tasks / Subtasks

- [ ] Task 1: Consolidate XP/progress mutation ownership in `apps/api`.
  - [ ] Align daily challenge, quiz XP, and related progress writes behind one backend-owned path.
- [ ] Task 2: Cut over web callers.
  - [ ] Update the known XP caller in `useGrammarQuiz`.
  - [ ] Update daily challenge consumers if any temporary route layer remains.
- [ ] Task 3: Retire or document old routes.
- [ ] Task 4: Add regression coverage for progress mutations and recovery behavior.

## Dev Notes

### Current Repo Reality

- XP mutation is currently split across [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts), [apps/web/lib/xp.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts), and route-local side effects in flashcard/vocabulary/daily-challenge flows.
- The known direct caller for the quiz XP route is [apps/web/hooks/useGrammarQuiz.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts).
- Daily challenge, flashcard, and vocabulary review flows also touch progress-related state.

### Implementation Guardrails

- Finish the ownership move instead of leaving "temporary" app-local mutation helpers indefinite.
- Distinguish orchestration ownership from transport shape; the typed client should call one backend-owned path, not own business logic.
- If some routes remain proxies, mark them with owner and retirement date.
- Preserve user-visible XP totals, streaks, and progress semantics during the cutover.

### File Targets

- [apps/api/src/xp](/Users/thienpham/Documents/english_learning_app/apps/api/src/xp)
- [apps/api/src/daily-challenge](/Users/thienpham/Documents/english_learning_app/apps/api/src/daily-challenge)
- [apps/web/hooks/useGrammarQuiz.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts)
- [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)

### Testing Requirements

- Success-path mutation tests
- Duplicate-update tests
- Unauthorized tests
- Failure-recovery and parity checks for XP/progress totals

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [XP route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)
- [XP helper](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts)
- [Grammar quiz hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useGrammarQuiz.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- By this point of the migration, progress ownership should stop being fragmented across multiple web-side helpers and route handlers.

### Completion Notes List

- The core failure mode is ending the epic with `apps/api` added but XP/progress still effectively owned by `apps/web`.

### File List

- `_bmad-output/implementation-artifacts/18-11-3-centralize-xp-and-progress-orchestration-and-cut-over-consumers.md`
