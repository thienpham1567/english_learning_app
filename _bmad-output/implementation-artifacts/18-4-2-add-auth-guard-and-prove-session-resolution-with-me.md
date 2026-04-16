# Story 18.4.2: Add Auth Guard and Prove Session Resolution with `/me`

Status: ready-for-dev

## Story

As a developer,
I want a minimal authenticated endpoint and guard,
so that session resolution is verified before feature migration begins.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.4.2  
**Dependencies:** 18.4.1

## Acceptance Criteria

1. A reusable auth guard or middleware protects authenticated Nest routes.
2. A `/me` or equivalent authenticated endpoint returns the resolved actor or profile stub.
3. Authenticated and unauthenticated flows are covered by tests.
4. Cookie, CORS, and proxy-domain assumptions are documented alongside the endpoint.

## Tasks / Subtasks

- [ ] Task 1: Add the reusable auth guard.
  - [ ] Resolve the session once and attach the actor to the request context.
  - [ ] Reuse the shared unauthorized error handling path.
- [ ] Task 2: Add a minimal authenticated endpoint.
  - [ ] Return the resolved actor or a small profile stub from `/me`.
  - [ ] Keep it infrastructure-focused; this is not a user-profile feature story.
- [ ] Task 3: Document runtime assumptions.
  - [ ] Record cookie forwarding, proxy, and CORS expectations needed for `apps/web` to call `apps/api`.
- [ ] Task 4: Add e2e coverage for signed-in and signed-out cases.

## Dev Notes

### Current Repo Reality

- `apps/api` does not yet have any authenticated routes.
- The existing shared auth types are in [packages/auth/src/types.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts).
- The current web app depends on Better Auth cookies configured in [apps/web/lib/auth.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/auth.ts).

### Implementation Guardrails

- Keep `/me` tiny. Its purpose is to prove request auth, not to become a permanent user-profile aggregation endpoint.
- If a custom decorator is introduced for `CurrentActor`, keep it local to `apps/api`.
- This story should not add feature-domain controllers such as dashboard or preferences.
- The docs produced here will become prerequisites for stories `18.5.2` and `18.9.x`.

### File Targets

- [apps/api/src/auth](/Users/thienpham/Documents/english_learning_app/apps/api/src/auth)
- [apps/api/src/main.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/main.ts)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)

### Testing Requirements

- E2E test for unauthenticated `/me` returning unauthorized
- E2E test for authenticated `/me` returning the resolved actor/profile stub
- Verification that cookies survive the chosen local proxy/base-URL setup

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.4.1 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-4-1-build-better-auth-session-resolution-for-nest-requests.md)
- [Better Auth source of record](/Users/thienpham/Documents/english_learning_app/apps/web/lib/auth.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The repo has no existing API-side auth guard, so `/me` is the first proof that session resolution works outside Next route handlers.

### Completion Notes List

- The biggest mistake here is treating `/me` as business scope instead of an auth verification seam.

### File List

- `_bmad-output/implementation-artifacts/18-4-2-add-auth-guard-and-prove-session-resolution-with-me.md`
