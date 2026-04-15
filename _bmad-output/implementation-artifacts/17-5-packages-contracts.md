# Story 17.5 — Create `packages/contracts` (Zod Schemas + DTOs)

## Story

**As a** developer,
**I want** a contracts package defining API request/response shapes with zod,
**so that** web, mobile, and backend modules share the same type definitions and can validate data at boundaries.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R2 - Shared Packages
**Story ID:** 17.5
**Estimate:** 3h
**Dependencies:** 17.3 (Root DX Setup — ✅ done)

## Status

ready-for-dev

## Acceptance Criteria

- [ ] AC1: Package `packages/contracts/` exists with structure:
  ```
  packages/contracts/
    package.json         # name: @repo/contracts
    tsconfig.json        # extends root
    vitest.config.ts
    src/
      common/
        pagination.ts    # PaginationSchema
        api-error.ts     # ApiErrorResponseSchema
        index.ts
      dashboard/
        dashboard.ts     # DashboardResponseSchema
        index.ts
      index.ts           # barrel export
    __tests__/
      dashboard.test.ts
      common.test.ts
  ```
- [ ] AC2: `zod` is a dependency of `@repo/contracts`
- [ ] AC3: `DashboardResponseSchema` matches current `/api/dashboard` response exactly
- [ ] AC4: TypeScript types derived via `z.infer<typeof ...>`
- [ ] AC5: Common schemas: `PaginationSchema`, `ApiErrorResponseSchema`
- [ ] AC6: Package builds: `pnpm build --filter @repo/contracts`
- [ ] AC7: Unit tests: valid data passes, invalid data fails
- [ ] AC8: Web app can import: `import { DashboardResponseSchema } from "@repo/contracts"`
- [ ] AC9: `pnpm build` from root succeeds (no regressions)

## Tasks/Subtasks

- [ ] Task 1: Create package scaffold
  - [ ] 1.1: Create `packages/contracts/package.json`
  - [ ] 1.2: Create `packages/contracts/tsconfig.json`
  - [ ] 1.3: Create `packages/contracts/vitest.config.ts`
- [ ] Task 2: Implement common schemas
  - [ ] 2.1: Create `src/common/pagination.ts` — PaginationSchema
  - [ ] 2.2: Create `src/common/api-error.ts` — ApiErrorResponseSchema
  - [ ] 2.3: Create `src/common/index.ts` — barrel export
- [ ] Task 3: Implement dashboard contract
  - [ ] 3.1: Create `src/dashboard/dashboard.ts` — DashboardResponseSchema
  - [ ] 3.2: Create `src/dashboard/index.ts` — barrel export
- [ ] Task 4: Create barrel exports
  - [ ] 4.1: Create `src/index.ts` re-exporting all
- [ ] Task 5: Write unit tests
  - [ ] 5.1: `__tests__/common.test.ts` — pagination + error schemas
  - [ ] 5.2: `__tests__/dashboard.test.ts` — valid/invalid dashboard data
- [ ] Task 6: Integration verification
  - [ ] 6.1: Add `@repo/contracts` as dependency in `apps/web/package.json`
  - [ ] 6.2: `pnpm install` resolves workspace link
  - [ ] 6.3: `pnpm build` from root succeeds
  - [ ] 6.4: Verify import works in web app

## Dev Notes

### Exact dashboard response shape (from route.ts)

```ts
{
  flashcardsDue: number,           // COUNT result
  vocabDue: number,                // COUNT result
  dailyChallenge: {
    completed: boolean,
    score: number | null,
  },
  streak: {
    currentStreak: number,
    bestStreak: number,
    lastCompletedDate: string | null,  // date string or null
  },
  badges: Array<{
    id: string,          // "streak-3", "streak-7", etc.
    emoji: string,       // "🔥", "🏆"
    label: string,       // "Bắt đầu tốt", etc.
    requiredStreak: number,
    unlocked: boolean,
  }>,
  recentVocabulary: Array<{
    query: string,
    headword: string,
    level: string,       // "unknown" fallback
    lookedUpAt: string,  // date string
  }>,
  weeklyActivity: Array<{
    day: string,         // "2026-04-15"
    count: number,
  }>,
  totalXP: number,
}
```

### Package scaffold (same pattern as @repo/shared)

```json
{
  "name": "@repo/contracts",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3.2.4"
  }
}
```

### Previous story learnings (from 17.4)

- Package scaffold pattern proven: package.json + tsconfig.json + vitest.config.ts
- Tests go in `__tests__/` directory
- Use `workspace:*` for cross-package deps
- `pnpm install` + `pnpm build` to verify integration
- Zero external deps except core (zod in this case)

### Note on zod version

Project uses `zod@^4.3.6` (zod v4). Key API differences from v3:
- `z.object()` still works the same
- `z.infer<typeof schema>` still works
- Use `z.string().datetime()` for date strings if needed

## Dev Agent Record

### Implementation Plan
### Debug Log
### Completion Notes

## File List
## Change Log
