# Story 17.1 — Initialize pnpm Workspace + Turborepo

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R1 - Monorepo Scaffolding
- **Estimate:** 4h
- **Dependencies:** None (first story)
- **Risk:** Low

## Description

Configure the project root as a pnpm workspace with Turborepo for build orchestration. This establishes the monorepo foundation before any code is moved.

## Acceptance Criteria

- [ ] AC1: `pnpm-workspace.yaml` created with entries: `apps/*`, `packages/*`
- [ ] AC2: `turbo.json` created with pipelines: `build`, `dev`, `lint`, `test`
- [ ] AC3: Root `package.json` updated:
  - `"name": "@repo/root"` (private)
  - workspace scripts added: `dev`, `build`, `lint`, `test`
  - `turbo` added as dev dependency
- [ ] AC4: Root `tsconfig.json` becomes base config with `compilerOptions` shared across packages
- [ ] AC5: `pnpm install` succeeds from root
- [ ] AC6: `pnpm build` succeeds (current app still works at this point)
- [ ] AC7: `.gitignore` updated for `.turbo/` cache directory

## Technical Notes

### turbo.json structure

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Dev Notes

- Do NOT move any source files in this story
- The current app stays at project root temporarily
- Story 17.2 handles the actual move to `apps/web/`
