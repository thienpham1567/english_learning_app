# Story 18.11.1: Implement Daily Challenge Read Flows in NestJS

Status: ready-for-dev

## Story

As a learner,
I want daily challenge retrieval served by the Nest backend,
so that the challenge surface is ready for centralized progress ownership.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.11.1  
**Dependencies:** 18.10.3

## Acceptance Criteria

1. `apps/api` serves the current daily challenge retrieval and streak-read flows needed by the web app.
2. Logic from relevant `apps/web/app/api/daily-challenge/*` read routes is moved into API-owned services or adapters.
3. Contracts and auth are enforced consistently with earlier migrated modules.
4. Tests cover happy-path, no-data, and unauthorized cases.

## Tasks / Subtasks

- [ ] Task 1: Build the daily-challenge read module.
  - [ ] Cover today's challenge retrieval and streak read flows.
- [ ] Task 2: Preserve the current generation/read behavior.
  - [ ] Carry over exam-mode lookup, streak lookup, badge shaping, and AI-generation fallback.
- [ ] Task 3: Use shared auth/contracts/error handling.
- [ ] Task 4: Add unit/e2e coverage.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/daily-challenge/today/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/today/route.ts) handles both existing-challenge reads and on-demand AI generation.
- [apps/web/app/api/daily-challenge/streak/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/streak/route.ts) returns streak and badges.
- [apps/web/hooks/useDailyChallenge.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDailyChallenge.ts) is the main consumer for the daily challenge page.

### Implementation Guardrails

- Preserve the Vietnam-date logic used by the current challenge flow.
- Keep AI-generation behavior and schema validation explicit; this story is not the place to redesign prompt generation.
- Separate read flow ownership from submission/update ownership; scoring and streak mutation belong to `18.11.2`.
- Preserve the no-data/current-existing branches, not only the ideal generation path.

### File Targets

- [apps/api/src/daily-challenge](/Users/thienpham/Documents/english_learning_app/apps/api/src/daily-challenge)
- [apps/web/app/api/daily-challenge/today/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/today/route.ts)
- [apps/web/app/api/daily-challenge/streak/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/streak/route.ts)
- [apps/web/hooks/useDailyChallenge.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDailyChallenge.ts)

### Testing Requirements

- Happy-path read tests
- Existing-challenge/no-data branch tests
- Unauthorized tests
- Verification that current daily challenge consumers still receive the same shape

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Daily challenge today route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/today/route.ts)
- [Daily challenge streak route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/streak/route.ts)
- [Daily challenge hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDailyChallenge.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The daily challenge read flow is more than a plain fetch; it includes generation, preference lookup, and streak/badge shaping in one route today.

### Completion Notes List

- The easiest regression here is breaking VN-date behavior or the "challenge already exists" branch while focusing only on generation.

### File List

- `_bmad-output/implementation-artifacts/18-11-1-implement-daily-challenge-read-flows-in-nestjs.md`
