# Story 17.3 — Root Developer Experience Setup

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R1 - Monorepo Scaffolding
- **Estimate:** 2h
- **Dependencies:** 17.2

## Description

Configure root-level developer scripts and documentation so the team can work efficiently in the monorepo.

## Acceptance Criteria

- [ ] AC1: Root scripts work:
  - `pnpm dev` → starts web app
  - `pnpm build` → builds all packages + web
  - `pnpm lint` → lints all
  - `pnpm test` → runs all tests
- [ ] AC2: DB scripts work from root:
  - `pnpm db:generate` → runs drizzle-kit generate
  - `pnpm db:migrate` → runs drizzle-kit migrate
  - `pnpm db:studio` → opens drizzle studio
- [ ] AC3: `.gitignore` updated:
  - `.turbo/` added
  - `node_modules` in nested packages handled
  - `dist/` in packages handled
- [ ] AC4: README.md updated with:
  - Monorepo structure overview
  - How to run dev/build/test
  - How to add a new package
  - How to run DB commands
