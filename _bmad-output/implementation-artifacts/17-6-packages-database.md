# Story 17.6 — Create `packages/database` (Schema + Client Extraction)

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R2 - Shared Packages
- **Estimate:** 5h
- **Dependencies:** 17.3
- **Risk:** 🟡 MEDIUM — Many files change (mechanical import updates)

## Description

Extract the Drizzle schema, DB client, and migration infrastructure into a shared database package. All API routes and modules will import schema/client from `@repo/database` instead of `@/lib/db`.

## Acceptance Criteria

- [ ] AC1: Package structure:
  ```
  packages/database/
    package.json          # name: @repo/database
    tsconfig.json
    drizzle.config.ts     # moved or root config updated
    migrations/           # existing migrations moved here
    src/
      client/
        index.ts          # DB client (from lib/db/index.ts)
      schema/
        index.ts          # full schema (from lib/db/schema.ts)
      index.ts            # barrel: re-export client + schema
  ```
- [ ] AC2: All tables exported from `@repo/database`:
  - conversation, message, vocabularyCache, userVocabulary, flashcardProgress
  - writingSubmission, dailyChallenge, userStreak, activityLog
  - listeningExercise, errorLog, diagnosticResult, scenarioProgress
  - All enums: messageRoleEnum, activityTypeEnum
  - All types: Conversation, Message, VocabularyCache, etc.
- [ ] AC3: All `apps/web` imports updated:
  - `from "@/lib/db/schema"` → `from "@repo/database"`
  - `from "@/lib/db"` → `from "@repo/database"`
- [ ] AC4: `drizzle-kit generate` works with updated config
- [ ] AC5: `drizzle-kit migrate` works
- [ ] AC6: `pnpm build --filter web` succeeds
- [ ] AC7: All existing tests pass
- [ ] AC8: No feature regression (manual smoke: dashboard, vocab, flashcards)

## Technical Notes

### Import update strategy

Use find-and-replace across all files:

```bash
# Find all files importing from lib/db
grep -rn 'from "@/lib/db' apps/web/ --include="*.ts" --include="*.tsx"
```

Expected ~40-50 files to update. Changes are mechanical — only import paths change, no logic changes.

### Drizzle config

```ts
// packages/database/drizzle.config.ts (or root)
export default defineConfig({
  schema: "packages/database/src/schema/index.ts",
  out: "packages/database/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Backward compatibility option

If the import update is too risky in one PR, keep `apps/web/lib/db/index.ts` as a re-export barrel:

```ts
// apps/web/lib/db/index.ts (temporary)
export { db } from "@repo/database";

// apps/web/lib/db/schema.ts (temporary)
export * from "@repo/database";
```

This allows gradual migration of imports.

## Dev Notes

- This is the largest mechanical change in Sprint R2
- Run `pnpm build` and `pnpm test` after EVERY batch of import updates
- Commit in batches: schema move, client move, import updates
