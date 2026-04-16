# Story 18.5.2: Integrate the Typed Client into `apps/web`

Status: ready-for-dev

## Story

As a developer,
I want `apps/web` to consume one authenticated API endpoint through the typed client,
so that the integration path is proven before the Learner Home cutover.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.5.2  
**Dependencies:** 18.5.1

## Acceptance Criteria

1. `apps/web` calls at least one authenticated API endpoint through the typed client.
2. Cookie/session behavior works with the chosen proxy or base-URL setup.
3. Integration guidance is documented for server components, client components, and SSR loaders.
4. No new feature code uses handwritten API paths for the migrated endpoint.

## Tasks / Subtasks

- [ ] Task 1: Pick the first authenticated endpoint to migrate through the typed client.
  - [ ] Prefer `/me` or the first dashboard read path after the auth baseline is proven.
- [ ] Task 2: Integrate the typed client in `apps/web`.
  - [ ] Replace handwritten string/path usage for the chosen endpoint.
  - [ ] Keep the existing fetch stack single-sourced.
- [ ] Task 3: Document call patterns for different rendering modes.
  - [ ] Cover client hooks, server components, and any SSR loaders used by the repo.
- [ ] Task 4: Add regression coverage for authenticated calls.

## Dev Notes

### Current Repo Reality

- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx) already uses the shared web fetch client for `/dashboard`.
- The repo has a typed-ish fetch wrapper but still relies on raw string paths such as `"/dashboard"` and `"/daily-challenge/today"`.
- There is no documented remote API base-URL strategy yet for `apps/api`.

### Implementation Guardrails

- Reuse the typed client surface from `18.5.1`; do not keep adding stringly-typed endpoint calls beside it.
- Pick one authenticated flow and prove it end to end before broader Learner Home cutover.
- Preserve caller behavior in hooks/components; this story is about integration plumbing, not feature redesign.
- Capture the proxy/base-URL rule in docs so later cutover stories do not guess.

### File Targets

- [apps/web/hooks/useDashboard.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)
- [apps/web/lib/api-client.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/api-client.ts)
- [apps/web/lib/http.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/http.ts)
- [apps/web/app/(app)/home/page.tsx](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)

### Testing Requirements

- One authenticated web-integration test for the chosen endpoint
- One failure-path test for missing session/cookie handling
- Manual verification that the same endpoint works from the intended render mode

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.5.1 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-5-1-create-typed-http-client-foundation.md)
- [Dashboard hook](/Users/thienpham/Documents/english_learning_app/apps/web/hooks/useDashboard.tsx)
- [Web API client](/Users/thienpham/Documents/english_learning_app/apps/web/lib/api-client.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The dashboard hook is the clearest existing consumer to prove typed-client integration without inventing a new UI surface.

### Completion Notes List

- The main failure mode is building a typed client in isolation and never wiring real web consumers onto it before domain migration starts.

### File List

- `_bmad-output/implementation-artifacts/18-5-2-integrate-typed-client-into-apps-web.md`
