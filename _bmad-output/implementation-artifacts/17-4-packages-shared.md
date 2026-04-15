# Story 17.4 — Create `packages/shared` (Error Types + Result Helpers)

## Story

**As a** developer,
**I want** a shared package with typed error classes and result helpers,
**so that** all backend modules use consistent error handling and the route handlers can map errors to HTTP responses automatically.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R2 - Shared Packages
**Story ID:** 17.4
**Estimate:** 3h
**Dependencies:** 17.3 (Root DX Setup — ✅ done)

## Status

ready-for-dev

## Acceptance Criteria

- [ ] AC1: Package `packages/shared/` exists with structure:
  ```
  packages/shared/
    package.json         # name: @repo/shared, private: true
    tsconfig.json        # extends ../../tsconfig.json
    vitest.config.ts     # test setup
    src/
      errors/
        app-error.ts     # base class
        domain-errors.ts # NotFound, Conflict, Validation, etc.
        index.ts
      result/
        result.ts        # Result<T, E> type + helpers
        index.ts
      index.ts           # barrel export
    __tests__/
      errors.test.ts
      result.test.ts
  ```
- [ ] AC2: Error class hierarchy:
  ```ts
  AppError (base, extends Error)
  ├── ValidationError    (400, code: "VALIDATION_ERROR")
  ├── UnauthorizedError  (401, code: "UNAUTHORIZED")
  ├── ForbiddenError     (403, code: "FORBIDDEN")
  ├── NotFoundError      (404, code: "NOT_FOUND")
  ├── ConflictError      (409, code: "CONFLICT")
  └── IntegrationError   (502, code: "INTEGRATION_ERROR")
  ```
- [ ] AC3: Each error has: `code` (string), `message` (string), `statusCode` (number), `toJSON()` method
- [ ] AC4: `Result<T, E>` discriminated union type + `ok()` and `err()` helper functions
- [ ] AC5: Package builds: `pnpm build --filter @repo/shared`
- [ ] AC6: Web app can import: `import { NotFoundError, type Result } from "@repo/shared"`
- [ ] AC7: Unit tests for all error classes and result helpers
- [ ] AC8: `pnpm build` from root still succeeds (no regressions)

## Tasks/Subtasks

- [ ] Task 1: Create package scaffold
  - [ ] 1.1: Create `packages/shared/package.json` with name `@repo/shared`
  - [ ] 1.2: Create `packages/shared/tsconfig.json` extending root
  - [ ] 1.3: Create `packages/shared/vitest.config.ts`
- [ ] Task 2: Implement error classes
  - [ ] 2.1: Create `src/errors/app-error.ts` — base AppError class
  - [ ] 2.2: Create `src/errors/domain-errors.ts` — 6 domain error subclasses
  - [ ] 2.3: Create `src/errors/index.ts` — barrel export
- [ ] Task 3: Implement Result type
  - [ ] 3.1: Create `src/result/result.ts` — Result<T,E> type + ok/err helpers
  - [ ] 3.2: Create `src/result/index.ts` — barrel export
- [ ] Task 4: Create barrel exports
  - [ ] 4.1: Create `src/index.ts` exporting all from errors and result
- [ ] Task 5: Write unit tests
  - [ ] 5.1: `__tests__/errors.test.ts` — test all 6 error classes
  - [ ] 5.2: `__tests__/result.test.ts` — test ok/err/type narrowing
- [ ] Task 6: Integration verification
  - [ ] 6.1: Add `@repo/shared` as dependency in `apps/web/package.json`
  - [ ] 6.2: Verify `pnpm install` resolves workspace link
  - [ ] 6.3: Verify `pnpm build` succeeds from root
  - [ ] 6.4: Verify import works in web app (create a test import)

## Dev Notes

### Current error patterns in the codebase

The existing API routes use ad-hoc error responses:
```ts
// 401 — used in 10+ routes
return Response.json({ error: "Unauthorized" }, { status: 401 });

// 404 — used in 5+ routes
return Response.json({ error: "Article not found" }, { status: 404 });

// 409
return Response.json({ error: "Already completed today's challenge" }, { status: 409 });

// 502
return Response.json({ error: "Failed to generate challenge" }, { status: 502 });
```

These will be replaced in Story 17.10 with:
```ts
throw new NotFoundError("Article", id);
// → caught by error mapper → Response.json({ code: "NOT_FOUND", message: "..." }, { status: 404 })
```

### Package.json pattern from README

```json
{
  "name": "@repo/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### tsconfig pattern

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Previous story learnings (from Sprint R1)

- Use `git mv` for tracked files; new packages just use `write_to_file`
- Always `pnpm install` after adding workspace dependencies
- Verify with `pnpm build` from root before committing
- `.gitignore` already handles `node_modules`, `dist/`, `.turbo/` everywhere

### Architecture requirement

From the monorepo spec: "framework depends on domain, never reverse"
- `@repo/shared` has ZERO external dependencies — no `next`, no `drizzle`, no `react`
- Only depends on TypeScript built-ins

## Dev Agent Record

### Implementation Plan
### Debug Log
### Completion Notes

## File List
## Change Log
