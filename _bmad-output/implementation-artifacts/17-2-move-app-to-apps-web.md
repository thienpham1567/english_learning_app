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

review

## Acceptance Criteria

- [x] AC1: All source files moved to `apps/web/`
- [x] AC2: `apps/web/package.json` created with app's dependencies
- [x] AC3: `apps/web/tsconfig.json` with correct path aliases
- [x] AC4: `apps/web/next.config.ts` updated for monorepo (transpilePackages)
- [x] AC5: `pnpm build --filter web` succeeds
- [x] AC6: Drizzle config paths correct (relative, moved with app)
- [x] AC7: No feature regression (same test baseline)

## Tasks/Subtasks

- [x] Task 1: Create `apps/web/` directory and move source files
  - [x] 1.1: Move app/, components/, hooks/, lib/, data/, public/, scripts/, test/
  - [x] 1.2: Move middleware.test.ts, proxy.ts
  - [x] 1.3: Move config: next.config.ts, postcss, biome, eslint, vitest
  - [x] 1.4: Move vercel.json
  - [x] 1.5: Move drizzle/ and drizzle.config.ts
- [x] Task 2: Create `apps/web/package.json`
  - [x] 2.1: All app dependencies moved to web
  - [x] 2.2: Root keeps only turbo
- [x] Task 3: Configure TypeScript
  - [x] 3.1: Root tsconfig → base config
  - [x] 3.2: apps/web/tsconfig.json extends root with @/* alias
- [x] Task 4: Verify build and dev
  - [x] 4.1: pnpm install succeeds
  - [x] 4.2: pnpm build --filter web succeeds
  - [x] 4.3: Tests: 55 fail / 316 pass (same baseline, 0 regressions)
  - [x] 4.4: .gitignore updated for monorepo patterns

## Dev Agent Record

### Implementation Plan
1. git mv all source directories to apps/web/
2. Create apps/web/package.json with all deps
3. Strip root package.json to workspace-only
4. Create base tsconfig.json (root) + app tsconfig.json (web)
5. Update next.config.ts with transpilePackages
6. Copy .env.local to apps/web/
7. Fix .gitignore for monorepo patterns
8. Verify install/build/test

### Debug Log
- .next/ build artifacts got staged — fixed with git rm --cached and updated .gitignore pattern
- No path resolution issues — vitest uses import.meta.url, drizzle uses relative paths

### Completion Notes
✅ All 4 tasks complete. Highest-risk story executed cleanly:
- 378 files moved via git mv (preserving history)
- Root package.json: workspace-only (turbo)
- Build passes from apps/web/ context
- Zero regressions

## File List
- `apps/web/` — all source files (moved)
- `apps/web/package.json` (new)
- `apps/web/tsconfig.json` (new)
- `apps/web/next.config.ts` (modified — transpilePackages)
- `package.json` (modified — workspace-only)
- `tsconfig.json` (modified — base config)
- `.gitignore` (modified — monorepo patterns)

## Change Log
- 2026-04-15: Story 17.2 implemented — app moved to apps/web/
