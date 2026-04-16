# Story 18.1.1: Scaffold the `apps/api` Workspace

Status: ready-for-dev

## Story

As a developer,
I want a NestJS app scaffolded in `apps/api`,
so that backend work has a dedicated runtime boundary inside the existing monorepo.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.1.1  
**Dependencies:** Epic 17 monorepo foundation is already in place (`apps/web`, `packages/*`, pnpm workspace, Turborepo)

## Acceptance Criteria

1. **AC1 - `apps/api` workspace exists with the minimum bootstrap files**
   - `apps/api/package.json`
   - `apps/api/tsconfig.json`
   - `apps/api/src/main.ts`
   - `apps/api/src/app.module.ts`
   - any required Nest support files needed to run the app locally, such as `nest-cli.json` or `tsconfig.build.json`

2. **AC2 - The new app follows this repo's workspace conventions**
   - the package name is `api` so `pnpm --filter api ...` works the same way `apps/web` uses `web`
   - `apps/api` lives under `apps/` and is picked up by the existing [pnpm-workspace.yaml](/Users/thienpham/Documents/english_learning_app/pnpm-workspace.yaml)
   - the app extends the root [tsconfig.json](/Users/thienpham/Documents/english_learning_app/tsconfig.json) instead of introducing a disconnected TypeScript base

3. **AC3 - The TypeScript config is Nest/Node-safe, not just inherited from Next.js defaults**
   - the app overrides root settings that are not appropriate for a Node/Nest runtime
   - specifically account for Nest requirements such as decorator metadata and a real emitted build output
   - do not leave the app on the root Next-oriented config unchanged (`dom` libs, `moduleResolution: bundler`, `noEmit: true`)

4. **AC4 - `pnpm --filter api dev` starts the Nest service locally**
   - the app boots as a plain Nest HTTP app
   - it listens on a non-conflicting local port so `apps/web` can continue to run without changes
   - recommended default: `process.env.PORT ?? 3001`

5. **AC5 - The scaffold stays intentionally minimal**
   - no business-domain modules, controllers, DB integration, auth integration, or shared-client work are introduced in this story
   - only the minimum bootstrap path is created so later stories can layer config, health, auth, contracts, and modules in sequence
   - if a generator creates extra default files, remove anything not needed for the minimal bootstrap

6. **AC6 - `apps/web` remains unaffected**
   - no changes are required to keep `apps/web` running
   - do not touch existing dashboard/database migration work in progress for this story

## Tasks / Subtasks

- [ ] Task 1: Create the new app workspace shell (AC: 1, 2)
  - [ ] Create `apps/api/`
  - [ ] Add `package.json` with package name `api`
  - [ ] Add `tsconfig.json`
  - [ ] Add any required Nest support files such as `nest-cli.json` and `tsconfig.build.json`

- [ ] Task 2: Add the minimal Nest runtime dependencies and scripts (AC: 2, 4, 5)
  - [ ] Add the minimal runtime dependencies required to boot a Nest HTTP app
  - [ ] Add the minimal dev/build/start scripts needed for local use
  - [ ] Keep the dependency set lean; defer test/lint stack expansion to later stories unless required for bootstrap

- [ ] Task 3: Scaffold the bootstrap source files (AC: 1, 4, 5)
  - [ ] Create `src/main.ts`
  - [ ] Create `src/app.module.ts`
  - [ ] Keep the first module set minimal and free of domain logic
  - [ ] Ensure the app listens on a non-conflicting local port

- [ ] Task 4: Align TypeScript with this monorepo and Nest runtime needs (AC: 2, 3)
  - [ ] Extend the root TypeScript config rather than replacing it
  - [ ] Override Node/Nest-specific compiler options that differ from the root Next.js-oriented defaults
  - [ ] Ensure emitted output can be produced for later build support

- [ ] Task 5: Smoke-verify the scaffold without expanding scope (AC: 4, 6)
  - [ ] Run `pnpm --filter api dev`
  - [ ] Verify the app starts cleanly
  - [ ] Verify the chosen port does not collide with `apps/web`
  - [ ] Avoid changing `apps/web` code or unrelated in-progress files

## Dev Notes

### Story Foundation

This is the first executable step of Epic 18. The goal is only to create the new service boundary in `apps/api`, not to migrate business logic yet.

From the Epic 18 planning artifacts:

- `apps/api` becomes the authoritative backend service
- `apps/web` stays UI + SSR + client integration
- the first module set should stay minimal: app, health placeholder, config placeholder, auth placeholder

For `18.1.1`, only the bootstrap shell is required. Health/config/auth modules can remain placeholders or be deferred to `18.1.2` and `18.3.x`.

### Current Repo Reality

Current workspace state:

- `apps/web` exists and its package name is `web`
- `apps/api` does **not** exist yet
- root scripts already use `turbo run ...`
- `pnpm-workspace.yaml` already includes `apps/*`, so no workspace-pattern change is required just to add the new app

This means the new app should follow the existing app naming pattern:

- use package name `api`
- place it under `apps/api`
- do not create a second monorepo layer

### Critical Technical Guardrails

1. **Do not convert this repo into Nest CLI monorepo mode**

Inference from official Nest docs plus current repo structure:

- Nest documents both standard and monorepo CLI workflows
- this repository is already a pnpm + Turborepo monorepo with per-app package manifests
- therefore the right fit is a standard Nest application living inside the existing workspace, not a repo-wide Nest monorepo conversion

Concretely:

- keep the existing root `package.json`, `pnpm-workspace.yaml`, and `turbo.json`
- keep Nest support files scoped to `apps/api`
- do not introduce a repo-root `nest-cli.json` that tries to redefine the whole workspace

2. **Do not inherit the root TypeScript config unchanged**

The root [tsconfig.json](/Users/thienpham/Documents/english_learning_app/tsconfig.json) is tuned for Next.js:

- `lib: ["dom", "dom.iterable", "esnext"]`
- `moduleResolution: "bundler"`
- `jsx: "react-jsx"`
- `noEmit: true`

That is not a safe config to use unchanged for a Node/Nest runtime.

The `apps/api` config should still extend the root base, but override the Node/Nest-specific pieces, including at least:

- `module`
- `moduleResolution`
- `lib`
- `types`
- `noEmit`
- `outDir`
- `rootDir`
- `emitDecoratorMetadata`
- `experimentalDecorators`

If a `tsconfig.build.json` is used, keep it app-local and consistent with the app's runtime/build scripts.

3. **Avoid the default port collision**

`apps/web` runs via `next dev`, which defaults to port `3000`.

If Nest boots on `3000`, this story fails the requirement that `apps/web` keep running unchanged.

Set a non-conflicting default port in `src/main.ts`, with `3001` as the recommended local default unless an env var overrides it.

4. **Keep the dependency set minimal**

This story does not need:

- DB wiring
- Better Auth integration
- health/ready endpoints beyond placeholders
- contract validation
- test harnesses
- Swagger
- background jobs

Only add what is needed to boot a plain Nest HTTP app successfully.

### Recommended Dependency Baseline

As of 2026-04-16, `npm view` reports these current package versions:

- `@nestjs/core`: `11.1.19`
- `@nestjs/platform-express`: `11.1.19`
- `@nestjs/cli`: `11.0.21`
- `reflect-metadata`: `0.2.2`
- `rxjs`: `7.8.2`

Use versions compatible with the Nest 11 line. Avoid mixing majors.

Likely minimum dependencies for this story:

- runtime:
  - `@nestjs/common`
  - `@nestjs/core`
  - `@nestjs/platform-express`
  - `reflect-metadata`
  - `rxjs`
- dev:
  - `@nestjs/cli`
  - `typescript`
  - `@types/node`

Only add more if the chosen local run strategy truly requires it.

### Script and File Shape Guidance

Use the current repo's app convention from [apps/web/package.json](/Users/thienpham/Documents/english_learning_app/apps/web/package.json):

- simple app name (`web`, so the new app should be `api`)
- local scripts owned by the app package

Recommended script shape for this story:

- `dev`: starts local watch mode for Nest
- `build`: optional but acceptable if needed for the scaffold
- `start`: optional if it helps keep the app conventional

If you use Nest CLI-driven scripts, keep the support files inside `apps/api`, not at repo root.

### File Structure Requirements

Files this story is expected to add:

- [apps/api/package.json](/Users/thienpham/Documents/english_learning_app/apps/api/package.json)
- [apps/api/tsconfig.json](/Users/thienpham/Documents/english_learning_app/apps/api/tsconfig.json)
- [apps/api/src/main.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/main.ts)
- [apps/api/src/app.module.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/app.module.ts)

Files this story may add if needed by the chosen Nest bootstrap path:

- [apps/api/nest-cli.json](/Users/thienpham/Documents/english_learning_app/apps/api/nest-cli.json)
- [apps/api/tsconfig.build.json](/Users/thienpham/Documents/english_learning_app/apps/api/tsconfig.build.json)

Files this story should avoid touching unless absolutely required:

- [package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [turbo.json](/Users/thienpham/Documents/english_learning_app/turbo.json)
- [apps/web/package.json](/Users/thienpham/Documents/english_learning_app/apps/web/package.json)
- current in-progress dashboard/database files in the working tree

If the lockfile changes because new app dependencies are added, that is expected.

### Testing Requirements

This story is scaffold-first, not test-harness-first.

Required verification is smoke-level:

- install dependencies successfully
- `pnpm --filter api dev` starts
- the app stays on a non-conflicting port

Do **not** expand this story into the full unit/e2e harness. That belongs to `18.6.1`.

### Previous Story / Repo Intelligence

There is no previous Epic 18 implementation story yet. This is the first one.

Relevant repo patterns learned from earlier monorepo work:

- app package names are short and direct (`web`)
- shared packages extend the root TypeScript config and add local overrides
- root task orchestration already exists through Turbo

Recent git history also suggests preserving current boundaries:

- `0e48dfc chore restructure folders web`
  - the repo recently stabilized around the `apps/web` path layout
- `a13e833 chore: update`
  - `turbo.json` was updated recently; avoid unnecessary task churn in this story
- `f0ed893 chore: update`
  - auth wiring changed recently in `apps/web`; this story should not overlap it

### Project Structure Notes

- `apps/api` is currently absent, so this story should add it cleanly rather than refactor an existing service
- `next.config.ts` currently transpiles `@repo/*` shared packages for `apps/web`; this story does not require changing web transpilation
- `packages/modules` is still absent; do not create it here
- the working tree already contains unrelated changes in dashboard/database planning and implementation files; avoid modifying those files while scaffolding `apps/api`

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Epic 18 planning artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration.md)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)
- [Root package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [Turbo config](/Users/thienpham/Documents/english_learning_app/turbo.json)
- [Workspace config](/Users/thienpham/Documents/english_learning_app/pnpm-workspace.yaml)
- [Root tsconfig](/Users/thienpham/Documents/english_learning_app/tsconfig.json)
- [Web app package.json](/Users/thienpham/Documents/english_learning_app/apps/web/package.json)
- [Web app tsconfig](/Users/thienpham/Documents/english_learning_app/apps/web/tsconfig.json)
- [Web app next.config.ts](/Users/thienpham/Documents/english_learning_app/apps/web/next.config.ts)
- Nest first steps: [docs.nestjs.com/first-steps](https://docs.nestjs.com/first-steps)
- Nest CLI workspaces: [docs.nestjs.com/cli/monorepo](https://docs.nestjs.com/cli/monorepo)
- Nest SWC/monorepo notes: [docs.nestjs.com/recipes/swc](https://docs.nestjs.com/recipes/swc)
- Official Nest starter tsconfig: [nestjs/typescript-starter tsconfig.json](https://raw.githubusercontent.com/nestjs/typescript-starter/master/tsconfig.json)
- Official Nest starter package.json: [nestjs/typescript-starter package.json](https://raw.githubusercontent.com/nestjs/typescript-starter/master/package.json)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- No `project-context.md` file was found in the workspace
- The `create-story` workflow expects a newer `backlog` / `development_status` sprint format, but this repo now uses `storySequence` plus `not_started`; target story was inferred as the first `not_started` entry in the current Epic 18 sequence
- `apps/api` and Nest dependencies are not present anywhere in the repo yet

### Completion Notes List

- Story `18.1.1` is the next Epic 18 story to context for development
- The highest-risk implementation mistake here is treating the whole repo as a Nest monorepo instead of adding a normal app inside the existing pnpm/Turbo workspace
- The second highest-risk mistake is using the root Next.js TypeScript config unchanged for the Nest runtime
- The most concrete local runtime guardrail is port selection: default to `3001` so `apps/web` can keep using `3000`

### File List

- `_bmad-output/implementation-artifacts/18-1-1-scaffold-apps-api-workspace.md`
