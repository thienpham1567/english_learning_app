# Story 17.2 — Move Current App to `apps/web/`

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R1 - Monorepo Scaffolding
- **Estimate:** 6h
- **Dependencies:** 17.1
- **Risk:** 🔴 HIGH — Every import path changes

## Description

Move the entire Next.js application into `apps/web/` so the monorepo root is free for shared packages. This is the highest-risk story in the epic — no other changes should be combined in the same PR.

## Acceptance Criteria

- [ ] AC1: Directory structure created:
  ```
  apps/web/
    app/
    components/
    hooks/
    lib/
    data/
    public/
    styles/
    next.config.ts
    package.json
    tsconfig.json
  ```
- [ ] AC2: `apps/web/package.json` created with all app dependencies moved from root
- [ ] AC3: `apps/web/tsconfig.json` extends root tsconfig, `@/*` alias points to `apps/web/`
- [ ] AC4: `next.config.ts` updated with `transpilePackages` for future workspace packages
- [ ] AC5: All `@/*` import aliases resolve correctly
- [ ] AC6: `pnpm dev --filter web` starts dev server successfully
- [ ] AC7: `pnpm build --filter web` succeeds with zero errors
- [ ] AC8: All existing tests pass (`pnpm test --filter web`)
- [ ] AC9: Drizzle migrations work:
  - `drizzle-kit generate` succeeds
  - `drizzle-kit migrate` succeeds
- [ ] AC10: Manual smoke test passes:
  - Home page loads with dashboard data
  - Dictionary lookup works
  - Flashcard review works
  - Chat conversation works
  - Daily challenge loads

## Technical Notes

### File Move Checklist

```
Root → apps/web/
├── app/          → apps/web/app/
├── components/   → apps/web/components/
├── hooks/        → apps/web/hooks/
├── lib/          → apps/web/lib/
├── data/         → apps/web/data/
├── public/       → apps/web/public/
├── styles/       → apps/web/styles/
├── next.config.ts → apps/web/next.config.ts
├── postcss.config.mjs → apps/web/postcss.config.mjs
└── middleware.ts  → apps/web/middleware.ts
```

### Files that stay at root

- `pnpm-workspace.yaml`
- `turbo.json`
- Root `package.json` (workspace scripts only)
- Root `tsconfig.json` (base config)
- `.env.local` (stays at root, Next.js resolves from cwd)
- `drizzle.config.ts` (update schema path)
- `_bmad-output/`, `docs/`, `_bmad/` (project-level, not app-level)

### Critical Risk: `process.cwd()` usage

The `nearby-words.ts` file uses `process.cwd()` to resolve `data/english-words.txt`. After the move, `process.cwd()` will be the monorepo root, not `apps/web/`. Fix:

```ts
// Option A: Use __dirname (preferred)
const filePath = join(__dirname, "..", "..", "data", "english-words.txt");

// Option B: Use an env or config
const filePath = join(process.env.APP_ROOT ?? process.cwd(), "data", "english-words.txt");
```

### Import Alias Strategy

Keep `@/*` resolving to `apps/web/` in tsconfig:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Dev Notes

- Create this as a single atomic commit — do not mix with any feature work
- Run full test suite before AND after the move
- Verify `.env.local` is still picked up by Next.js
