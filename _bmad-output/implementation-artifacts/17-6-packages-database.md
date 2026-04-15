# Story 17.6 — Create `packages/database` (Schema + Client Extraction)

## Story

**As a** developer,
**I want** the Drizzle schema and DB client extracted into a shared database package,
**so that** domain modules and apps can share the same schema without importing from `lib/db`.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R2 - Shared Packages
**Story ID:** 17.6
**Estimate:** 5h
**Risk:** 🟡 Medium — 47 files with 95 imports need updating
**Dependencies:** 17.5 (contracts — ✅ done)

## Status

ready-for-dev

## Acceptance Criteria

- [ ] AC1: Package `packages/database/` exists with structure:
  ```
  packages/database/
    package.json         # name: @repo/database
    tsconfig.json
    src/
      schema/
        index.ts         # all table + enum exports (moved from lib/db/schema.ts)
      client/
        index.ts         # db + pool exports (moved from lib/db/index.ts)
      index.ts           # barrel export
  ```
- [ ] AC2: All 47 files in `apps/web/` updated: `@/lib/db/schema` → `@repo/database`
- [ ] AC3: All `@/lib/db` (client) imports → `@repo/database`
- [ ] AC4: `apps/web/lib/db/` becomes a thin re-export barrel (backward compat for tests)
- [ ] AC5: Drizzle config updated: schema path → `../../packages/database/src/schema/index.ts`
- [ ] AC6: `drizzle-kit generate` still works
- [ ] AC7: `pnpm build` from root succeeds
- [ ] AC8: All existing tests pass (same 55 fail / 316 pass baseline)
- [ ] AC9: Migrations stay in `apps/web/lib/db/migrations/` (NOT moved — they're Next.js deploy-specific)

## Tasks/Subtasks

- [ ] Task 1: Create package scaffold
  - [ ] 1.1: Create `packages/database/package.json` (drizzle-orm, pg as deps)
  - [ ] 1.2: Create `packages/database/tsconfig.json`
- [ ] Task 2: Move schema
  - [ ] 2.1: Move `apps/web/lib/db/schema.ts` → `packages/database/src/schema/index.ts`
  - [ ] 2.2: Verify all table/enum exports preserved
- [ ] Task 3: Move client
  - [ ] 3.1: Create `packages/database/src/client/index.ts` (db + pool exports)
  - [ ] 3.2: Import schema from `../schema` in client
- [ ] Task 4: Create barrel exports
  - [ ] 4.1: `packages/database/src/index.ts` re-exports schema + client
- [ ] Task 5: Create backward-compat re-exports in apps/web
  - [ ] 5.1: Update `apps/web/lib/db/schema.ts` → re-export from `@repo/database`
  - [ ] 5.2: Update `apps/web/lib/db/index.ts` → re-export from `@repo/database`
- [ ] Task 6: Update all 47 files
  - [ ] 6.1: Replace `from "@/lib/db/schema"` → `from "@repo/database"` (44 files)
  - [ ] 6.2: Replace `from "@/lib/db"` → `from "@repo/database"` (47 files, some overlap)
  - [ ] 6.3: Verify no remaining `@/lib/db` imports (except the re-export barrels)
- [ ] Task 7: Update Drizzle config
  - [ ] 7.1: Update `drizzle.config.ts` schema path
  - [ ] 7.2: Keep migrations in `apps/web/lib/db/migrations/`
- [ ] Task 8: Add workspace dep + verify
  - [ ] 8.1: Add `@repo/database` to `apps/web/package.json`
  - [ ] 8.2: `pnpm install`
  - [ ] 8.3: `pnpm build` from root succeeds
  - [ ] 8.4: Run tests — same baseline (55/316)

## Dev Notes

### Files to update (47 total)

**API routes (44 files):**
- `app/api/daily-challenge/submit/route.ts`
- `app/api/daily-challenge/today/route.ts`
- `app/api/daily-challenge/streak/route.ts`
- `app/api/preferences/route.ts`
- `app/api/listening/submit/route.ts`, `audio/[id]/route.ts`, `generate/route.ts`
- `app/api/word-of-the-day/route.ts`
- `app/api/flashcards/due/route.ts`, `review/route.ts`
- `app/api/chat/route.ts`
- `app/api/review-quiz/submit/route.ts`, `due/route.ts`
- `app/api/dashboard/route.ts`
- `app/api/dictionary/route.ts`
- `app/api/vocabulary/**/*.ts` (7 files)
- `app/api/conversations/**/*.ts` (3 files)
- `app/api/writing-practice/**/*.ts` (2 files)
- Plus 15+ more routes

**Lib files (3 files):**
- `lib/xp.ts`
- `lib/activity-log.ts`
- `lib/adaptive/difficulty.ts`
- `lib/auth.ts`

### Schema exports (19 total)

**Enums:** `messageRoleEnum`, `activityTypeEnum`, `examModeEnum`
**Tables:** `conversation`, `message`, `vocabularyCache`, `userVocabulary`, `flashcardProgress`, `userSkillProfile`, `writingSubmission`, `dailyChallenge`, `userStreak`, `activityLog`, `listeningExercise`, `pushSubscription`, `userPreferences`, `errorLog`, `diagnosticResult`

### Migration strategy

Use find-and-replace approach:
```bash
# Step 1: schema imports
sed -i '' 's|from "@/lib/db/schema"|from "@repo/database"|g' apps/web/app/api/**/*.ts

# Step 2: client imports  
sed -i '' 's|from "@/lib/db"|from "@repo/database"|g' apps/web/app/api/**/*.ts
```

Then verify manually for edge cases (named imports, `import *`).

### Current DB client setup

```ts
// apps/web/lib/db/index.ts (14 lines)
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("Missing DATABASE_URL");

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle(pool, { schema });
```

### Dependencies for @repo/database

```json
{
  "dependencies": {
    "drizzle-orm": "^0.45.1",
    "pg": "^8.20.0"
  },
  "devDependencies": {
    "@types/pg": "^8.20.0",
    "typescript": "^5"
  }
}
```

### Previous story learnings

- Package scaffold pattern is proven (17.4, 17.5)
- Use `workspace:*` for deps
- `pnpm install` then `pnpm build` to verify
- Re-export barrels prevent test breakage during transition

## Dev Agent Record

### Implementation Plan
### Debug Log
### Completion Notes
### Review Findings
- [ ] [Review][Patch] Schema compatibility barrel now eagerly loads the DB client, so schema-only imports can fail when `DATABASE_URL` is unset [apps/web/lib/db/schema.ts:5]
- [ ] [Review][Patch] App imports were not migrated from `@/lib/db*` to `@repo/database`, so AC2/AC3 for this story remain unimplemented [apps/web/app/api/dashboard/route.ts:5]

## File List
## Change Log
