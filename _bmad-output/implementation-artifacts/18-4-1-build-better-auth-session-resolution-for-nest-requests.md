# Story 18.4.1: Build Better Auth Session Resolution for Nest Requests

Status: ready-for-dev

## Story

As a developer,
I want Nest requests to resolve the authenticated actor from Better Auth,
so that migrated endpoints can enforce auth without copying Next.js route logic.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.4.1  
**Dependencies:** 18.3.3

## Acceptance Criteria

1. `apps/api` can resolve the current session from incoming request headers or cookies.
2. The resolved actor shape stays compatible with the framework-agnostic auth types in `@repo/auth`.
3. Auth failures use the shared unauthorized error shape.
4. The implementation does not fork Better Auth state or replace the existing auth source of record.

## Tasks / Subtasks

- [ ] Task 1: Extend the auth seam for non-Next request contexts.
  - [ ] Add a request/session resolution path that can work with Nest request headers/cookies.
  - [ ] Preserve the existing `ActorContext` shape.
- [ ] Task 2: Keep Better Auth as the source of truth.
  - [ ] Reuse the existing auth instance or its underlying session API.
  - [ ] Avoid duplicating tables, cookies, or session parsing rules.
- [ ] Task 3: Map unauthenticated requests to the shared unauthorized envelope.
  - [ ] Route failures through the common API error handling added in `18.2.1`.
- [ ] Task 4: Add focused auth-resolution tests.

## Dev Notes

### Current Repo Reality

- [packages/auth/src/types.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts) defines `ActorContext` and `AuthSessionResolver`.
- [packages/auth/src/web/resolve-web-actor.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/web/resolve-web-actor.ts) is currently Next-specific because it calls `next/headers`.
- [apps/web/lib/auth.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/auth.ts) is the Better Auth source of record and already uses `@repo/database`.

### Implementation Guardrails

- Do not make `@repo/auth` depend on Nest runtime types.
- Prefer a framework-agnostic helper in `@repo/auth` plus a thin Nest adapter in `apps/api`.
- Keep the actor shape exactly aligned with the existing `ActorContext` contract so business modules stay transport-independent.
- Do not create a second Better Auth instance with different config if the existing one can be reused safely.

### File Targets

- [packages/auth/src/types.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts)
- [packages/auth/src/index.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/index.ts)
- [packages/auth/src/web/resolve-web-actor.ts](/Users/thienpham/Documents/english_learning_app/packages/auth/src/web/resolve-web-actor.ts)
- [apps/web/lib/auth.ts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/auth.ts)
- [apps/api/src/auth](/Users/thienpham/Documents/english_learning_app/apps/api/src/auth)

### Testing Requirements

- Unit tests for the new resolver helper
- API-side tests for authenticated and unauthenticated request parsing
- Verification that auth failures surface as the shared unauthorized envelope

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Auth types](/Users/thienpham/Documents/english_learning_app/packages/auth/src/types.ts)
- [Existing web actor resolver](/Users/thienpham/Documents/english_learning_app/packages/auth/src/web/resolve-web-actor.ts)
- [Better Auth source of record](/Users/thienpham/Documents/english_learning_app/apps/web/lib/auth.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The current shared auth package is transport-agnostic in types only; the actual resolver helper is still tied to Next.js.

### Completion Notes List

- The most important constraint is keeping Better Auth state single-sourced while making session resolution reusable from Nest.

### File List

- `_bmad-output/implementation-artifacts/18-4-1-build-better-auth-session-resolution-for-nest-requests.md`
