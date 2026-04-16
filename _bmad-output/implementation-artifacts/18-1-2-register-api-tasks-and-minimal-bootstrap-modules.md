# Story 18.1.2: Register API Tasks and Minimal Bootstrap Modules

Status: ready-for-dev

## Story

As a developer,
I want the new API app wired into the monorepo toolchain,
so that the service behaves like a first-class workspace app without bringing in business logic early.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.1.2  
**Dependencies:** 18.1.1

## Acceptance Criteria

1. Root `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm test` can include the API app through Turbo.
2. `apps/api` contains only the minimal bootstrap module set: app, config placeholder, health placeholder, and auth placeholder.
3. The API app can build independently with `pnpm --filter api build`.
4. No business-domain controllers or services are introduced yet.

## Tasks / Subtasks

- [ ] Task 1: Make `apps/api` participate in root Turbo tasks.
  - [ ] Add `dev`, `build`, `lint`, and `test` scripts to `apps/api/package.json`.
  - [ ] Reuse the existing root Turbo task names instead of inventing API-only root commands.
- [ ] Task 2: Add the placeholder bootstrap modules.
  - [ ] Create `src/config/config.module.ts`.
  - [ ] Create `src/health/health.module.ts`.
  - [ ] Create `src/auth/auth.module.ts`.
  - [ ] Register those modules from `src/app.module.ts`.
- [ ] Task 3: Keep the app buildable but intentionally empty.
  - [ ] Ensure `pnpm --filter api build` emits output.
  - [ ] Avoid adding controllers or services for dashboard, preferences, vocabulary, or daily challenge.
- [ ] Task 4: Smoke-verify workspace behavior.
  - [ ] Verify `pnpm build` still works at the root.
  - [ ] Verify `pnpm --filter api dev` and `pnpm --filter api build` both work after the placeholder modules are added.

## Dev Notes

### Current Repo Reality

- The root [package.json](/Users/thienpham/Documents/english_learning_app/package.json) already uses `turbo run dev/build/lint/test`.
- The root [turbo.json](/Users/thienpham/Documents/english_learning_app/turbo.json) already defines those tasks and accepts `dist/**` as a build output.
- `apps/api` is new work; there are no existing CI or deployment definitions to preserve yet.

### Implementation Guardrails

- Root task participation will usually come from adding matching scripts inside [apps/api/package.json](/Users/thienpham/Documents/english_learning_app/apps/api/package.json), not from rewriting root scripts.
- Keep the module set skeletal. This story is only about bootstrapping structure for later stories `18.2.x` through `18.4.x`.
- Do not add database wiring, Better Auth integration, Swagger, or domain modules here.
- Use predictable module names so later stories can extend them instead of replacing them.

### File Targets

- [apps/api/package.json](/Users/thienpham/Documents/english_learning_app/apps/api/package.json)
- [apps/api/src/app.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/app.module.ts)
- [apps/api/src/config/config.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/config/config.module.ts)
- [apps/api/src/health/health.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/health/health.module.ts)
- [apps/api/src/auth/auth.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/auth/auth.module.ts)

### Testing Requirements

- `pnpm --filter api build`
- `pnpm --filter api dev`
- `pnpm build`

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.1.1 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-1-1-scaffold-apps-api-workspace.md)
- [Root package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [Turbo config](/Users/thienpham/Documents/english_learning_app/turbo.json)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The root workspace already has the right Turbo task names; the missing piece is the `apps/api` package surface.

### Completion Notes List

- The main risk is overfilling `apps/api` with domain work before the shared validation, config, and auth stories land.

### File List

- `_bmad-output/implementation-artifacts/18-1-2-register-api-tasks-and-minimal-bootstrap-modules.md`
