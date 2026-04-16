# Story 18.11.2: Implement Daily Challenge Submission and Streak Updates

Status: ready-for-dev

## Story

As a learner,
I want challenge completion handled by the Nest backend,
so that streak and completion rules are centralized with the rest of the API.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.11.2  
**Dependencies:** 18.11.1

## Acceptance Criteria

1. `apps/api` handles daily challenge submission and any immediate streak updates required by the current product behavior.
2. Transaction boundaries are explicit where multiple records can change together.
3. Duplicate submission and failure-recovery paths are defined and tested.
4. The migrated flow preserves current user-visible behavior.

## Tasks / Subtasks

- [ ] Task 1: Move challenge submission and scoring into `apps/api`.
  - [ ] Preserve the existing scoring logic and answer-shaping behavior.
- [ ] Task 2: Make write boundaries explicit.
  - [ ] Coordinate challenge completion and streak updates safely.
- [ ] Task 3: Decide how XP and activity side effects are orchestrated.
  - [ ] Keep behavior consistent with current completion semantics.
- [ ] Task 4: Add tests for duplicate submission, recovery, and auth failures.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/daily-challenge/submit/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/submit/route.ts) currently scores answers, updates the challenge row, updates streaks, awards XP, and logs activity in one route.
- The route uses Vietnam-date helpers and guards against repeat completion with `409 Already completed`.
- `useDailyChallenge` expects answer details, score, streak, badges, and new badges in the response.

### Implementation Guardrails

- Preserve the current duplicate-submission behavior and response contract.
- Make the write boundary explicit for challenge completion and streak updates; do not leave partial updates as an accident of sequential statements.
- Preserve VN-date semantics and badge unlocking logic.
- This story should centralize mutation behavior, not redesign the daily challenge product flow.

### File Targets

- [apps/api/src/daily-challenge](/Users/thienpham/Documents/english_learning_app/apps/api/src/daily-challenge)
- [apps/web/app/api/daily-challenge/submit/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/submit/route.ts)
- [apps/web/hooks/useDailyChallenge.ts](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDailyChallenge.ts)

### Testing Requirements

- Successful submission tests
- Duplicate-submission tests
- Failure-recovery tests
- Unauthorized and invalid-input tests

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Daily challenge submit route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/daily-challenge/submit/route.ts)
- [Daily challenge hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDailyChallenge.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The current route mixes scoring, streak mutation, XP, and activity logging, so this is the story where write ownership must become explicit instead of incidental.

### Completion Notes List

- The highest-risk regression is partial completion state if challenge update and streak update stop being treated as one coordinated mutation.

### File List

- `_bmad-output/implementation-artifacts/18-11-2-implement-daily-challenge-submission-and-streak-updates.md`
