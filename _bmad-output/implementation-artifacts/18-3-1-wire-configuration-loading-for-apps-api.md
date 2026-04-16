# Story 18.3.1: Wire Configuration Loading for `apps/api`

Status: ready-for-dev

## Story

As a developer,
I want API runtime config loaded through a single module,
so that local and deployed environments use the same configuration contract.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.3.1  
**Dependencies:** 18.1.2, 18.2.2

## Acceptance Criteria

1. `apps/api` loads required environment variables through one configuration module.
2. Missing required configuration fails fast during boot.
3. Environment access is centralized instead of spread across controllers and services.
4. Existing root environment expectations in `turbo.json` are reflected in the API config contract.

## Tasks / Subtasks

- [ ] Task 1: Create a typed API config module.
  - [ ] Define the environment contract in one place.
  - [ ] Validate env at startup.
- [ ] Task 2: Expose config through Nest DI.
  - [ ] Keep `process.env` access out of controllers and feature services.
- [ ] Task 3: Reflect root workspace env expectations.
  - [ ] Review the env names already listed in `turbo.json`.
  - [ ] Mark which values are required now versus reserved for later modules.
- [ ] Task 4: Add failure-path tests or boot checks.

## Dev Notes

### Current Repo Reality

- The root [turbo.json](/Users/thienpham/Documents/english_learning_app/turbo.json) already declares `DATABASE_URL`, Better Auth envs, OpenAI envs, push/cron envs, and other backend-relevant variables.
- [packages/database/src/client/index.ts](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts) currently reads `DATABASE_URL` directly from `process.env`.
- `apps/api` has no central config contract yet.

### Implementation Guardrails

- Do not make every env in `turbo.json` immediately required if the API baseline does not use it yet.
- Separate "required now" from "known future" variables so early bootstrap stories do not block on AI or push-notification secrets.
- Prefer Zod-based env validation to stay aligned with the repo's existing contract style.
- Keep the public shape small and typed, for example `ApiConfigService` or a typed config object exported through DI.

### File Targets

- [apps/api/src/config](/Users/thienpham/Documents/english_learning_app/apps/api/src/config)
- [apps/api/src/app.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/app.module.ts)
- [turbo.json](/Users/thienpham/Documents/english_learning_app/turbo.json)

### Testing Requirements

- One boot-time failure test for missing required env
- One success-path config parse test
- Verification that later modules can consume the config through DI instead of `process.env`

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Turbo config env list](/Users/thienpham/Documents/english_learning_app/turbo.json)
- [Database client env usage](/Users/thienpham/Documents/english_learning_app/packages/database/src/client/index.ts)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- `DATABASE_URL` is already mandatory for the shared DB package, but many other repo envs belong to later feature stories.

### Completion Notes List

- The main risk is centralizing nothing and letting `process.env` spread across future controllers and services.

### File List

- `_bmad-output/implementation-artifacts/18-3-1-wire-configuration-loading-for-apps-api.md`
