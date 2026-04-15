# Story 17.1 — Initialize pnpm Workspace + Turborepo

## Story

**As a** developer,
**I want** the project configured as a pnpm workspace with Turborepo,
**so that** packages can be developed and built independently with proper dependency resolution.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R1 - Monorepo Scaffolding
**Estimate:** 4h

## Status

review

## Acceptance Criteria

- [x] AC1: `pnpm-workspace.yaml` created with `apps/*` and `packages/*`
- [x] AC2: `turbo.json` created with `build`, `dev`, `lint`, `test` pipelines
- [x] AC3: Root `package.json` updated with workspace name and Turborepo dev dependency
- [x] AC4: Root `tsconfig.json` preserved with current config (no breaking changes)
- [x] AC5: `pnpm install` succeeds from root
- [x] AC6: `pnpm build` succeeds (current app still works)
- [x] AC7: `.gitignore` updated for `.turbo/` cache directory

## Tasks/Subtasks

- [x] Task 1: Create `pnpm-workspace.yaml`
  - [x] 1.1: Create file with `apps/*` and `packages/*` entries
- [x] Task 2: Install and configure Turborepo
  - [x] 2.1: Add `turbo` as root devDependency
  - [x] 2.2: Create `turbo.json` with build/dev/lint/test pipelines
- [x] Task 3: Update root `package.json`
  - [x] 3.1: Update name to `@repo/root`
  - [x] 3.2: Add `"packageManager"` field for pnpm@10.28.1
- [x] Task 4: Update `.gitignore`
  - [x] 4.1: Add `.turbo/` cache directory
- [x] Task 5: Verify everything works
  - [x] 5.1: `pnpm install` succeeds
  - [x] 5.2: `pnpm build` succeeds
  - [x] 5.3: `pnpm dev` starts dev server (verified via existing script)
  - [x] 5.4: `pnpm test:run` — 55 failures (all pre-existing, 0 regressions)

## Dev Notes

- No source files moved — that's Story 17.2
- `apps/` and `packages/` directories don't need to exist yet
- All existing scripts preserved: `dev`, `build`, `lint`, `test`, `db:generate`, `db:migrate`
- tsconfig.json unchanged — will become base config in 17.2

## Dev Agent Record

### Implementation Plan

1. Create pnpm-workspace.yaml with workspace globs
2. Create turbo.json with task pipelines
3. Update package.json: rename, add packageManager, add turbo devDep
4. Update .gitignore for turbo cache
5. Verify install, build, tests

### Debug Log

- No issues encountered. All changes are additive config files.
- 55 test failures pre-existed before any changes (verified via git stash baseline).

### Completion Notes

✅ All 5 tasks complete. Monorepo workspace foundation established:
- `pnpm-workspace.yaml` declares `apps/*` and `packages/*`
- `turbo.json` configures build/dev/lint/test/test:run pipelines
- Package renamed `tmp-scaffold` → `@repo/root`
- `turbo@^2.5.4` added as devDependency
- `packageManager: pnpm@10.28.1` pinned
- `.gitignore` updated for `.turbo/` cache
- Build passes, install succeeds, 0 regressions introduced

## File List

- `pnpm-workspace.yaml` (new)
- `turbo.json` (new)
- `package.json` (modified — name, packageManager, turbo dep)
- `.gitignore` (modified — .turbo/)

## Change Log

- 2026-04-15: Story 17.1 implemented — pnpm workspace + Turborepo scaffolding
