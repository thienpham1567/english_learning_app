# Story 18.7.1: Define Dashboard Contracts and Tests

Status: ready-for-dev

## Story

As a developer,
I want the dashboard transport contract formalized in shared schemas,
so that the first production slice is contract-first.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.7.1  
**Dependencies:** 18.5.2, 18.6.2

## Acceptance Criteria

1. `@repo/contracts` defines the dashboard request and response shapes used by the migrated endpoint.
2. Shared dashboard error cases are captured through the common error envelope.
3. Contract tests validate success and failure parsing.
4. Existing dashboard schema work is reused or extended instead of duplicated.

## Tasks / Subtasks

- [ ] Task 1: Extend the dashboard contract surface.
  - [ ] Keep the existing response schema.
  - [ ] Add any request/query schema needed for the migrated endpoint, even if it is currently empty.
- [ ] Task 2: Connect dashboard failures to the shared API error envelope.
- [ ] Task 3: Expand contract tests for success and failure cases.
- [ ] Task 4: Export the dashboard contract cleanly from the package root.

## Dev Notes

### Current Repo Reality

- [packages/contracts/src/dashboard/dashboard.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts) already defines `DashboardResponseSchema`.
- [packages/contracts/__tests__/dashboard.test.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/__tests__/dashboard.test.ts) is the natural place to expand contract coverage.
- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx) currently duplicates a local `DashboardData` type instead of importing a shared contract type.

### Implementation Guardrails

- Reuse the current dashboard response contract; do not redefine the same fields under a new name.
- Add an explicit request schema even if the endpoint remains a simple authenticated `GET` for now.
- Keep dashboard errors aligned with `18.2.1` instead of adding dashboard-only failure JSON.
- This story should stay contract-only. Do not move runtime logic into `apps/api` yet.

### File Targets

- [packages/contracts/src/dashboard/dashboard.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts)
- [packages/contracts/src/dashboard/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/index.ts)
- [packages/contracts/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/index.ts)
- [packages/contracts/__tests__/dashboard.test.ts](/Users/thienpham/Documents/english_learning_app/packages/contracts/__tests__/dashboard.test.ts)
- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)

### Testing Requirements

- Contract parse tests for dashboard success payloads
- Contract parse tests for representative error envelopes
- Optional type-only cleanup in `apps/web` if local dashboard types can be replaced safely

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Dashboard contract](/Users/thienpham/Documents/english_learning_app/packages/contracts/src/dashboard/dashboard.ts)
- [Dashboard hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Dashboard is the only domain with an existing shared contract today, so this story is mostly extension and cleanup rather than greenfield schema work.

### Completion Notes List

- The main mistake to avoid is leaving the shared response schema unused while `apps/web` keeps its own duplicate dashboard types.

### File List

- `_bmad-output/implementation-artifacts/18-7-1-define-dashboard-contracts-and-tests.md`
