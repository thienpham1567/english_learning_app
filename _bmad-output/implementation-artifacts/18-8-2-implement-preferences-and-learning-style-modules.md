# Story 18.8.2: Implement Preferences and Learning-Style Modules

Status: ready-for-dev

## Story

As a learner,
I want my preferences and learning-style data served by the Nest backend,
so that personalization flows stop depending on Next route handlers.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.8.2  
**Dependencies:** 18.7.2, 18.8.1

## Acceptance Criteria

1. `apps/api` contains controllers and services for preferences and learning-style flows.
2. Logic currently in `apps/web/app/api/preferences/route.ts` and `apps/web/app/api/learning-style/route.ts` is moved into API-owned services or adapters.
3. Validation and auth are enforced through shared API infrastructure rather than route-local logic.
4. Tests cover read, write, invalid-input, insufficient-data, and unauthorized cases.

## Tasks / Subtasks

- [ ] Task 1: Build the preferences module.
  - [ ] Implement authenticated read/write paths using the shared contracts.
- [ ] Task 2: Build the learning-style module.
  - [ ] Move the analysis logic out of the Next route and into API-owned services.
- [ ] Task 3: Reuse shared infrastructure.
  - [ ] Use the auth guard/session resolution from `18.4.x`.
  - [ ] Use the Zod validation/error envelope path from `18.2.x`.
- [ ] Task 4: Add unit/e2e coverage for both modules.

## Dev Notes

### Current Repo Reality

- [apps/web/app/api/preferences/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts) currently performs auth, validation, DB access, and default handling inline.
- [apps/web/app/api/learning-style/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts) currently performs activity analysis and response shaping inline.
- Both routes read/write `@repo/database` tables directly from `apps/web`.

### Implementation Guardrails

- Preserve the current user-visible behavior, including the preferences default branch and the learning-style "not enough data" branch.
- Keep DB access inside services/adapters that consume `@repo/database`; do not duplicate table definitions or inline SQL strings in controllers.
- Do not leave validation in route-local `if` blocks once shared contracts exist.
- This story is about backend ownership, not UI cutover. Web callers can continue using old routes until `18.9.2`.

### File Targets

- [apps/api/src/preferences](/Users/thienpham/Documents/english_learning_app/apps/api/src/preferences)
- [apps/api/src/learning-style](/Users/thienpham/Documents/english_learning_app/apps/api/src/learning-style)
- [apps/web/app/api/preferences/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts)
- [apps/web/app/api/learning-style/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts)

### Testing Requirements

- Preferences read/write tests
- Learning-style enough-data and insufficient-data tests
- Shared unauthorized and validation failure tests

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Preferences route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/preferences/route.ts)
- [Learning-style route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/learning-style/route.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- These two routes are still the clearest examples of route-local auth, validation, and DB logic all mixed together in `apps/web`.

### Completion Notes List

- The biggest risk is migrating the happy path only and losing the existing default/insufficient-data behaviors.

### File List

- `_bmad-output/implementation-artifacts/18-8-2-implement-preferences-and-learning-style-modules.md`
