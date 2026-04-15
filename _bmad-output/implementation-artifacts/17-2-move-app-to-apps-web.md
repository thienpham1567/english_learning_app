# Story 17.2 — Move Current App to `apps/web/`

## Story

**As a** developer,
**I want** the existing Next.js app moved into `apps/web/`,
**so that** the monorepo has room for shared packages and future apps.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R1 - Monorepo Scaffolding
**Estimate:** 6h
**Risk:** 🔴 HIGH

## Status

in-progress

## Acceptance Criteria

- [ ] AC1: All source files moved to `apps/web/`
- [ ] AC2: `apps/web/package.json` created with app's dependencies
- [ ] AC3: `apps/web/tsconfig.json` with correct path aliases
- [ ] AC4: `apps/web/next.config.ts` updated for monorepo
- [ ] AC5: `pnpm dev --filter web` starts dev server
- [ ] AC6: `pnpm build --filter web` succeeds
- [ ] AC7: Drizzle commands work (generate, migrate)
- [ ] AC8: No feature regression

## Tasks/Subtasks

- [ ] Task 1: Create `apps/web/` directory and move source files
  - [ ] 1.1: Move `app/`, `components/`, `hooks/`, `lib/`, `data/`, `public/`, `scripts/`, `test/`
  - [ ] 1.2: Move `middleware.test.ts`, `proxy.ts`
  - [ ] 1.3: Move config files: `next.config.ts`, `postcss.config.mjs`, `biome.json`, `eslint.config.mjs`, `vitest.config.ts`
  - [ ] 1.4: Move `vercel.json`
  - [ ] 1.5: Move `drizzle/` migrations and `drizzle.config.ts`
- [ ] Task 2: Create `apps/web/package.json`
  - [ ] 2.1: Split dependencies from root to web app package.json
  - [ ] 2.2: Root package.json keeps only workspace tools (turbo)
- [ ] Task 3: Configure TypeScript
  - [ ] 3.1: Root `tsconfig.json` becomes base config
  - [ ] 3.2: `apps/web/tsconfig.json` extends root with `@/*` alias
- [ ] Task 4: Verify build and dev
  - [ ] 4.1: `pnpm install` succeeds
  - [ ] 4.2: `pnpm build --filter web` succeeds
  - [ ] 4.3: `pnpm dev --filter web` starts
  - [ ] 4.4: `pnpm test:run --filter web` — no new regressions
  - [ ] 4.5: Drizzle commands work

## Dev Notes

- `.env.local` stays at root — Next.js resolves from cwd which will be `apps/web/`
- `process.cwd()` in `nearby-words.ts` may need fixing
- Do NOT mix feature work with this story
- Commit atomically — one big move

## Dev Agent Record

### Implementation Plan
### Debug Log
### Completion Notes

## File List
## Change Log
