# Story 18.7.2: Define Preferences, Learning-Style, and XP Contracts

Status: ready-for-dev

## Story

As a developer,
I want the rest of the Learner Home slice covered by explicit contracts,
so that all phase-one endpoints share one typed boundary.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.7.2  
**Dependencies:** 18.7.1

## Acceptance Criteria

1. Contracts exist for preferences read/write, learning-style analysis, and XP award flows.
2. Request validation requirements are captured in shared schemas, not only controller code.
3. Shared unauthorized and validation error cases are defined for these endpoints.
4. Contract tests cover representative success and failure payloads.

## Tasks / Subtasks

- [ ] Task 1: Add preferences contracts.
  - [ ] Cover `GET /preferences` and `PATCH /preferences`.
- [ ] Task 2: Add learning-style contracts.
  - [ ] Cover both enough-data and not-enough-data responses.
- [ ] Task 3: Add XP award contracts.
  - [ ] Cover the current award flow used by grammar quiz completion.
- [ ] Task 4: Add contract tests and exports.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/preferences/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts) currently returns and validates preferences inline.
- [apps/web/app/api/learning-style/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts) contains both analysis logic and response shaping inline.
- [apps/web/app/api/xp/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts) already uses a small local Zod schema for `{ activity: "quiz_complete" }`.

### Implementation Guardrails

- Move request/response typing into `@repo/contracts`; do not leave validation rules trapped in route files.
- Model learning-style as a contract with at least two states: enough data and insufficient data.
- Capture XP as transport contracts, not as direct imports of `awardXP`.
- Keep unauthorized and validation failures tied to the shared error envelope instead of endpoint-local `{ error: ... }` objects.

### File Targets

- [packages/contracts/src/preferences](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/preferences)
- [packages/contracts/src/learning-style](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/learning-style)
- [packages/contracts/src/xp](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/xp)
- [packages/contracts/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)
- [packages/contracts/__tests__](/Users/thienpham/Documents/english_learning_app/packages/contracts/__tests__)

### Testing Requirements

- Success/failure contract tests for preferences
- Enough-data and not-enough-data contract tests for learning style
- Valid/invalid request tests for XP award input

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Preferences route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts)
- [Learning-style route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts)
- [XP route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/xp/route.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Preferences, learning style, and XP are still fully route-local today; this story creates the contract seam before the Nest move.

### Completion Notes List

- The largest hidden risk is treating learning-style's "insufficient data" branch as an afterthought instead of a first-class response contract.

### File List

- `_bmad-output/implementation-artifacts/18-7-2-define-preferences-learning-style-and-xp-contracts.md`
