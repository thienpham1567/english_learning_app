# Story 17.4 — Create `packages/shared` (Error Types + Result Helpers)

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R2 - Shared Packages
- **Estimate:** 3h
- **Dependencies:** 17.3

## Description

Create the shared utilities package with typed error classes and result helpers. All backend modules will use these for consistent error handling.

## Acceptance Criteria

- [ ] AC1: Package structure:
  ```
  packages/shared/
    package.json         # name: @repo/shared
    tsconfig.json        # extends root
    src/
      errors/
        app-error.ts     # base class
        domain-errors.ts # NotFound, Conflict, Validation, etc.
        index.ts
      result/
        result.ts        # Result<T, E> type
        index.ts
      index.ts           # barrel export
  ```
- [ ] AC2: Error classes hierarchy:
  ```ts
  AppError (base)
  ├── ValidationError    (400)
  ├── UnauthorizedError  (401)
  ├── ForbiddenError     (403)
  ├── NotFoundError      (404)
  ├── ConflictError      (409)
  └── IntegrationError   (502)
  ```
- [ ] AC3: Each error has: `code` (string), `message`, `statusCode`, `toJSON()`
- [ ] AC4: `Result<T, E>` type:
  ```ts
  type Result<T, E = AppError> =
    | { ok: true; value: T }
    | { ok: false; error: E };
  ```
- [ ] AC5: Package builds: `pnpm build --filter @repo/shared`
- [ ] AC6: Web app can import: `import { NotFoundError } from "@repo/shared"`
- [ ] AC7: Unit tests for all error classes (code, statusCode, message, toJSON)

## Technical Notes

### Error example

```ts
export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super({
      code: "NOT_FOUND",
      message: id ? `${entity} not found: ${id}` : `${entity} not found`,
      statusCode: 404,
    });
    this.name = "NotFoundError";
  }
}
```

### Build config

Use `tsup` or plain `tsc` for package builds:

```json
{
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsc --watch"
  }
}
```
