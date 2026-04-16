# Story 18.12.1: Add Rate Limiting and Security Middleware

Status: ready-for-dev

## Story

As a developer,
I want core safeguards on migrated routes,
so that the API surface is safe to expand after the first migration wave.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.12.1  
**Dependencies:** 18.11.3

## Acceptance Criteria

1. Rate limiting is applied to migrated public endpoints where appropriate.
2. Security middleware and headers are documented and enabled where relevant.
3. The safeguards do not break authenticated web flows behind the chosen proxy setup.
4. Tests or verification steps cover the expected failure behavior for throttled requests.

## Tasks / Subtasks

- [ ] Task 1: Add baseline rate limiting for migrated endpoints.
- [ ] Task 2: Add or document core security middleware/headers.
- [ ] Task 3: Verify auth/proxy compatibility.
- [ ] Task 4: Add throttling/security verification steps.

## Dev Notes

### Current Repo Reality

- `apps/api` currently has no security middleware baseline beyond what earlier bootstrap stories add.
- The migrated route set by this point includes auth-dependent web flows, so cookie and proxy handling are already in play.
- The repo has no existing dedicated security/ratelimiting package to reuse.

### Implementation Guardrails

- Apply limits where they make sense; do not punish every authenticated read route equally.
- Preserve the browser-based session flow established in earlier auth/client stories.
- Keep this story focused on baseline protections, not a full WAF design.
- Document the exact failure shape for throttled requests so callers can react consistently.

### File Targets

- [apps/api/src/main.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/main.ts)
- [apps/api/src/common](/Users/thienpham/Documents/english_learning_app/apps/api/src/common)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)

### Testing Requirements

- Verification of throttled request behavior
- Checks that authenticated web flows still work
- Documentation of enabled headers/middleware and their intended coverage

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.4.2 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-4-2-add-auth-guard-and-prove-session-resolution-with-me.md)
- [Story 18.12.2 artifact target](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-12-2-add-correlation-ids-api-docs-and-monitoring-coverage.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- There is no pre-existing API security baseline in this repo, so this story establishes the first one after the core route migrations.

### Completion Notes List

- The common failure here is adding middleware that looks correct in isolation but breaks cookie-authenticated web requests behind the chosen proxy setup.

### File List

- `_bmad-output/implementation-artifacts/18-12-1-add-rate-limiting-and-security-middleware.md`
