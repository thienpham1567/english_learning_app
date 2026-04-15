# Story 17.5 — Create `packages/contracts` (Zod Schemas + DTOs)

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R2 - Shared Packages
- **Estimate:** 3h
- **Dependencies:** 17.3

## Description

Create the contracts package that defines API request/response shapes with zod. This becomes the stable interface shared between web, mobile, and backend modules.

## Acceptance Criteria

- [ ] AC1: Package structure:
  ```
  packages/contracts/
    package.json         # name: @repo/contracts
    tsconfig.json
    src/
      common/
        pagination.ts    # PaginationSchema
        api-error.ts     # ApiErrorResponseSchema
        index.ts
      dashboard/
        dashboard.ts     # DashboardResponseSchema
        index.ts
      index.ts           # barrel export
  ```
- [ ] AC2: `zod` is a dependency of `@repo/contracts`
- [ ] AC3: `DashboardResponseSchema` matches current `/api/dashboard` response shape exactly:
  ```ts
  export const DashboardResponseSchema = z.object({
    flashcardsDue: z.number(),
    vocabDue: z.number(),
    dailyChallenge: z.object({
      completed: z.boolean(),
      score: z.number().nullable(),
    }),
    streak: z.object({
      currentStreak: z.number(),
      bestStreak: z.number(),
      lastCompletedDate: z.string().nullable(),
    }),
    badges: z.array(z.object({
      id: z.string(),
      label: z.string(),
      emoji: z.string(),
      unlocked: z.boolean(),
    })),
    recentVocabulary: z.array(z.object({
      query: z.string(),
      headword: z.string(),
      level: z.string(),
      lookedUpAt: z.string(),
    })),
    weeklyActivity: z.array(z.object({
      day: z.string(),
      count: z.number(),
    })),
    totalXP: z.number(),
  });
  ```
- [ ] AC4: TypeScript types derived: `export type DashboardResponse = z.infer<typeof DashboardResponseSchema>`
- [ ] AC5: Common schemas:
  - `PaginationSchema` (z.object with offset, limit)
  - `ApiErrorResponseSchema` (z.object with code, message)
- [ ] AC6: Package builds independently
- [ ] AC7: Unit tests: parse valid data → success, parse invalid data → error
- [ ] AC8: Web app can import: `import { DashboardResponseSchema } from "@repo/contracts"`

## Technical Notes

- Extract the response shape by inspecting the current `app/api/dashboard/route.ts` return value
- Don't change the actual API — just codify the existing contract
- Future stories will add vocabulary, chat, reading contracts
