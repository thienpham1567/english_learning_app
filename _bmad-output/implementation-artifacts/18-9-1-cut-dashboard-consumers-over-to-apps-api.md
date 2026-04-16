# Story 18.9.1: Cut Dashboard Consumers Over to `apps/api`

Status: ready-for-dev

## Story

As a developer,
I want dashboard reads in `apps/web` to come from the API service,
so that the first migrated slice is actually backend-owned.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R6 - Learner Home Vertical Slice  
**Story ID:** 18.9.1  
**Dependencies:** 18.8.1

## Acceptance Criteria

1. `apps/web` reads dashboard data through the typed API client.
2. No page or loader in the Learner Home flow calls the old dashboard route directly.
3. User-visible dashboard behavior remains unchanged.
4. Regression coverage or smoke checks confirm auth/session behavior still works.

## Tasks / Subtasks

- [ ] Task 1: Switch dashboard consumers to the migrated API endpoint.
  - [ ] Update the typed client integration for dashboard reads.
  - [ ] Remove direct reliance on the old web-owned route for primary callers.
- [ ] Task 2: Update the main dashboard consumer surfaces.
  - [ ] Start with `useDashboard`.
  - [ ] Check home-page consumers and any shared dashboard context usage.
- [ ] Task 3: Preserve runtime behavior and auth.
- [ ] Task 4: Add regression coverage or smoke checks.

## Dev Notes

### Current Repo Reality

- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx) is the main read path for Learner Home dashboard data.
- [apps/web/app/(app)/home/page.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx) consumes dashboard state for XP, streak, badges, and today's actions.
- The existing Next route still lives at [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts).

### Implementation Guardrails

- Cut over callers through the typed client. Do not hardcode a new remote URL in component code.
- Preserve the caller-visible state machine in `useDashboard` unless there is a strong reason to change it.
- If a temporary proxy route remains in `apps/web`, make that explicit and time-boxed.
- Do not mix dashboard reads between old and new backends after this story lands.

### File Targets

- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)
- [apps/web/app/(app)/home/page.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx)
- [apps/web/app/api/dashboard/route.ts](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)

### Testing Requirements

- Dashboard hook/component regression coverage
- Auth/session smoke verification against the migrated endpoint
- Visual or manual behavior check for Learner Home parity

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Dashboard hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)
- [Home page](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx)
- [Dashboard route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/dashboard/route.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The dashboard hook is the narrowest high-value consumer seam, so it should lead the web cutover.

### Completion Notes List

- The main migration risk is leaving the UI apparently "migrated" while it still calls the old Next route underneath.

### File List

- `_bmad-output/implementation-artifacts/18-9-1-cut-dashboard-consumers-over-to-apps-api.md`
