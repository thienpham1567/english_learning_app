# Story 18.8.3: Implement API-Owned XP Award Orchestration

Status: ready-for-dev

## Story

As a learner,
I want XP awards handled by the authoritative backend,
so that progress changes are centralized before broader migration.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.8.3  
**Dependencies:** 18.7.2, 18.8.2

## Acceptance Criteria

1. `apps/api` exposes an XP award endpoint or service aligned with the shared contracts.
2. Logic currently in `apps/web/app/api/xp/route.ts` is moved behind API-owned orchestration.
3. Input validation uses the shared contract schema.
4. Tests cover valid awards, invalid payloads, and unauthorized requests.

## Tasks / Subtasks

- [ ] Task 1: Create the API-owned XP module.
  - [ ] Move transport logic out of the Next route.
  - [ ] Centralize XP award orchestration in `apps/api`.
- [ ] Task 2: Reuse or relocate app-local helpers carefully.
  - [ ] Account for [apps/web/lib/xp.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts) and [apps/web/lib/activity-log.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/activity-log.ts).
- [ ] Task 3: Enforce shared validation and auth.
- [ ] Task 4: Add unit/e2e coverage for award behavior and failure paths.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts) currently validates `{ activity: "quiz_complete" }` with a local Zod schema.
- [apps/web/lib/xp.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts) increments `userStreak.xpTotal` directly through `@repo/database`.
- [apps/web/lib/activity-log.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/activity-log.ts) logs activity in a fire-and-forget way from the web app.

### Implementation Guardrails

- Move backend mutation ownership into `apps/api`; do not leave XP writes initiated from `apps/web` runtime code long-term.
- Preserve the current XP amount semantics unless product requirements explicitly change.
- Decide deliberately whether `awardXP` and `logActivity` stay app-local temporarily, move to shared packages, or are wrapped by API services. Do not duplicate them.
- Keep the transport contract small and explicit; XP orchestration should not become a catch-all progress module yet.

### File Targets

- [apps/api/src/xp](/Users/thienpham/Documents/english_learning_app/apps/api/src/xp)
- [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)
- [apps/web/lib/xp.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts)
- [apps/web/lib/activity-log.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/activity-log.ts)

### Testing Requirements

- Valid award-path tests
- Invalid-payload tests
- Unauthorized tests
- Verification that XP mutation and activity logging remain consistent

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [XP route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)
- [XP helper](/Users/thienpham/Documents/english_learning_app/apps/web/lib/xp.ts)
- [Activity log helper](/Users/thienpham/Documents/english_learning_app/apps/web/lib/activity-log.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- XP mutations already live outside the route body in `apps/web/lib`, but they are still owned by the web app runtime rather than the new API boundary.

### Completion Notes List

- The hidden risk is splitting XP mutation between `apps/web` helpers and `apps/api` services after migration starts.

### File List

- `_bmad-output/implementation-artifacts/18-8-3-implement-api-owned-xp-award-orchestration.md`
