# Story 17.7: Create `packages/auth` (ActorContext Abstraction)

Status: done

## Story

As a developer,
I want an auth package that provides an `ActorContext` type and a web session resolver factory,
so that business modules receive a framework-agnostic identity instead of depending on `next/headers` or Better Auth details.

**Epic:** 17 — Monorepo Backend Architecture
**Sprint:** R2 — Shared Packages
**Story ID:** 17.7
**Estimate:** 3h
**Risk:** 🟢 Low — new package, no mass refactor
**Dependencies:** 17.4 (`@repo/shared` — ✅ done, provides `UnauthorizedError`)

## Acceptance Criteria

1. **AC1 — Package structure:**
   ```
   packages/auth/
     package.json          # name: @repo/auth
     tsconfig.json
     src/
       types.ts            # ActorContext type + AuthSessionResolver interface
       web/
         resolve-web-actor.ts  # factory: createWebActorResolver(auth)
         index.ts              # barrel for web/
       index.ts            # barrel: re-exports types + web
     __tests__/
       resolve-web-actor.test.ts
   ```

2. **AC2 — `ActorContext` type exported:**
   ```ts
   export type ActorContext = {
     userId: string;
     roles: string[];
     clientType: "web" | "mobile" | "internal";
   };
   ```

3. **AC3 — `AuthSessionResolver` interface exported** (decouples from `better-auth`):
   ```ts
   export interface AuthSessionResolver {
     api: {
       getSession: (opts: { headers: Headers }) => Promise<{ user: { id: string } } | null>;
     };
   }
   ```

4. **AC4 — `createWebActorResolver` factory exported:**
   ```ts
   export function createWebActorResolver(auth: AuthSessionResolver) {
     return async function resolveWebActor(): Promise<ActorContext> {
       const session = await auth.api.getSession({ headers: await headers() });
       if (!session) throw new UnauthorizedError("Session required");
       return { userId: session.user.id, roles: [], clientType: "web" };
     };
   }
   ```
   - Imports `headers` from `next/headers` (web adapter — this is intentional)
   - Imports `UnauthorizedError` from `@repo/shared`
   - Returns a zero-arg `resolveWebActor()` function

5. **AC5 — Unit tests** with mocked `auth.api.getSession`:
   - ✅ Returns `ActorContext` with correct `userId` on valid session
   - ✅ Throws `UnauthorizedError` when session is null
   - ✅ Sets `clientType: "web"` and `roles: []`

6. **AC6 — Proof-of-concept wiring in `apps/web`:**
   - Create `apps/web/lib/resolve-actor.ts`:
     ```ts
     import { auth } from "@/lib/auth";
     import { createWebActorResolver } from "@repo/auth";
     export const resolveWebActor = createWebActorResolver(auth);
     ```
   - Refactor `apps/web/app/api/dashboard/route.ts` to use it:
     ```ts
     // Before (lines 23-28):
     const session = await auth.api.getSession({ headers: await headers() });
     if (!session) { return Response.json({ error: "Unauthorized" }, { status: 401 }); }
     const userId = session.user.id;

     // After:
     import { resolveWebActor } from "@/lib/resolve-actor";
     const actor = await resolveWebActor();
     const userId = actor.userId;
     ```
   - The route handler removes `import { headers } from "next/headers"` and `import { auth } from "@/lib/auth"`
   - Dashboard response body is **identical** (no behavioral change)

7. **AC7 — Package builds independently:** `pnpm build --filter @repo/auth` succeeds

8. **AC8 — Web app can import:** `import { createWebActorResolver, type ActorContext } from "@repo/auth"`

## Tasks / Subtasks

- [x] Task 1: Create package scaffold (AC: #1, #7)
  - [x] 1.1: Create `packages/auth/package.json`
  - [x] 1.2: Create `packages/auth/tsconfig.json`
  - [x] 1.3: Add `"@repo/auth": "workspace:*"` to `apps/web/package.json`
  - [x] 1.4: Run `pnpm install`
- [x] Task 2: Define types (AC: #2, #3)
  - [x] 2.1: Create `packages/auth/src/types.ts` — `ActorContext` + `AuthSessionResolver`
- [x] Task 3: Create web resolver factory (AC: #4)
  - [x] 3.1: Create `packages/auth/src/web/resolve-web-actor.ts`
  - [x] 3.2: Create `packages/auth/src/web/index.ts` barrel
- [x] Task 4: Create barrel exports (AC: #8)
  - [x] 4.1: Create `packages/auth/src/index.ts` — re-export all
- [x] Task 5: Write unit tests (AC: #5)
  - [x] 5.1: Create `packages/auth/__tests__/resolve-web-actor.test.ts`
  - [x] 5.2: Mock `next/headers` — return a fake `Headers` object
  - [x] 5.3: Test: valid session → correct ActorContext
  - [x] 5.4: Test: null session → throws UnauthorizedError
- [x] Task 6: Wire proof-of-concept in web app (AC: #6)
  - [x] 6.1: Create `apps/web/lib/resolve-actor.ts`
  - [x] 6.2: Refactor `apps/web/app/api/dashboard/route.ts`
  - [x] 6.3: Verify dashboard response unchanged
- [x] Task 7: Verify build (AC: #7, #8)
  - [x] 7.1: `pnpm build` from root succeeds (5 tasks, 12.5s)
  - [x] 7.2: Run existing tests — auth package 4/4 passed

## Dev Notes

### Design decision: factory pattern (not singleton)

The `auth` instance lives in `apps/web/lib/auth.ts` and depends on `@repo/database` (for the DB pool) and Better Auth plugins (`nextCookies`). Moving it into `packages/auth` would create a circular dependency and couple the auth package to the database.

Instead, `packages/auth` exports a **factory** (`createWebActorResolver`) that accepts any object matching the `AuthSessionResolver` interface. The web app wires it up once in `apps/web/lib/resolve-actor.ts`. This keeps:
- `packages/auth` free of `better-auth`, `@repo/database`, and env var dependencies
- The factory testable with plain mocks (no auth infrastructure needed)
- Future `resolveTokenActor` (mobile bearer auth) can follow the same pattern in `packages/auth/src/token/`

### Current auth pattern (50+ routes)

Every route follows this exact pattern:
```ts
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  // ... business logic
}
```

After this story, the pattern becomes:
```ts
import { resolveWebActor } from "@/lib/resolve-actor";

export async function GET() {
  const actor = await resolveWebActor();
  const userId = actor.userId;
  // ... business logic
}
```

**Only the dashboard route is converted in this story.** The remaining 50+ routes will be migrated in later stories (likely Story 17.10 or a future epic).

### `better-auth` version: `^1.5.6`

- `auth.api.getSession({ headers })` returns `{ user: { id: string; ... }, session: ... } | null`
- The `headers` parameter expects the Next.js `Headers` object from `next/headers`
- No breaking changes expected in the 1.x line

### Error handling in route handlers

When `resolveWebActor()` throws `UnauthorizedError`, the route handler needs a try/catch or a global error boundary. For the dashboard proof-of-concept, wrap in try/catch:
```ts
try {
  const actor = await resolveWebActor();
  // ... business logic
  return Response.json(result);
} catch (e) {
  if (e instanceof AppError) {
    return Response.json({ error: e.message }, { status: e.statusCode });
  }
  throw e;
}
```

**Alternative (simpler for now):** Since only one route is being converted, a local try/catch is acceptable. A shared `withAuth` wrapper or global error handler is deferred to Story 17.10.

### Package dependencies

```json
{
  "name": "@repo/auth",
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
    "@repo/shared": "workspace:*"
  },
  "peerDependencies": {
    "next": ">=14"
  },
  "devDependencies": {
    "typescript": "^5",
    "vitest": "^3.2.4",
    "next": "^16"
  }
}
```

- `@repo/shared` as dep (for `UnauthorizedError`)
- `next` as **peerDependency** (for `next/headers` — the web app provides it)
- `next` also in devDependencies (for type resolution during `tsc`)
- NO dependency on `better-auth` or `@repo/database`

### tsconfig.json — follow established pattern

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
[Source: packages/shared/tsconfig.json, packages/database/tsconfig.json]

### File reference: `apps/web/lib/auth.ts` (DO NOT MODIFY)

```ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pool } from "@repo/database";

export const auth = betterAuth({
  database: pool,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});
```
This file stays in `apps/web`. The `@repo/auth` package never imports it.

### File reference: `apps/web/app/api/dashboard/route.ts` (refactor target)

- Lines 1-4: imports (remove `headers`, `auth` — add `resolveWebActor`)
- Lines 23-28: auth check (replace with `resolveWebActor()`)
- Lines 29-183: business logic (unchanged)
- Add try/catch for `UnauthorizedError` → 401 response

[Source: apps/web/app/api/dashboard/route.ts]

### Anti-patterns to avoid

- ❌ DO NOT move `betterAuth()` config into `packages/auth` — it depends on DB pool and env vars
- ❌ DO NOT add `better-auth` as a dependency of `packages/auth` — use the `AuthSessionResolver` interface
- ❌ DO NOT convert all 50+ routes — only dashboard for proof-of-concept
- ❌ DO NOT create a global error middleware — that's Story 17.10 scope
- ❌ DO NOT use `import * from "@repo/auth"` — use named imports

### Previous story learnings (17.4, 17.5, 17.6)

- Package scaffold: `main` + `types` both point to `./src/index.ts` (no dist needed for internal packages in monorepo with `transpilePackages`)
- Use `workspace:*` protocol for internal deps
- `pnpm install` then `pnpm build` to verify after package creation
- Tests use `vitest` — same version `^3.2.4` as other packages
- Barrel re-export pattern: keep old import paths working during transition

### Git commit conventions

Follow established pattern from recent commits:
- `feat(17.7): Create packages/auth — ActorContext abstraction`
- `docs: Story 17.7 → review`

### Project Structure Notes

- Package location: `packages/auth/` (alongside `packages/shared/`, `packages/contracts/`, `packages/database/`)
- Web wiring: `apps/web/lib/resolve-actor.ts` (new file, next to `auth.ts` and `auth-client.ts`)
- `apps/web/lib/auth.ts` and `apps/web/lib/auth-client.ts` remain unchanged
- No conflicts detected with existing structure

### References

- [Source: _bmad-output/planning-artifacts/epic-17-monorepo-backend.md#Story 17.7]
- [Source: _bmad-output/planning-artifacts/epics.md (not applicable — Epic 17 is infrastructure)]
- [Source: apps/web/lib/auth.ts — current Better Auth setup]
- [Source: apps/web/app/api/dashboard/route.ts — proof-of-concept refactor target]
- [Source: packages/shared/src/errors/domain-errors.ts — UnauthorizedError]
- [Source: packages/database/package.json — established package pattern]
- [Source: packages/shared/tsconfig.json — established tsconfig pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

No issues encountered. Clean implementation.

### Completion Notes List

- Created `packages/auth` with factory pattern (`createWebActorResolver`) to decouple from Better Auth
- `AuthSessionResolver` interface prevents `better-auth` from being a package dependency
- Unit tests: 4/4 passed (valid session, null session throws, clientType/roles defaults, headers passthrough)
- Dashboard route refactored as proof-of-concept: replaced inline `auth.api.getSession()` with `resolveWebActor()`
- Added try/catch with `AppError` handling for thrown `UnauthorizedError`
- Full project build: 5 tasks successful in 12.5s

### File List

**New files:**
- `packages/auth/package.json`
- `packages/auth/tsconfig.json`
- `packages/auth/src/types.ts`
- `packages/auth/src/web/resolve-web-actor.ts`
- `packages/auth/src/web/index.ts`
- `packages/auth/src/index.ts`
- `packages/auth/__tests__/resolve-web-actor.test.ts`
- `apps/web/lib/resolve-actor.ts`

**Modified files:**
- `apps/web/package.json` (added `@repo/auth` workspace dep)
- `apps/web/app/api/dashboard/route.ts` (refactored to use `resolveWebActor()`)

## Change Log

- 2026-04-15: Story 17.7 implemented — packages/auth created with ActorContext abstraction, factory pattern, unit tests, and dashboard route proof-of-concept

### Review Findings

- [x] [Review][Patch] Preserve the existing unauthorized dashboard payload [packages/auth/src/web/resolve-web-actor.ts:27]
