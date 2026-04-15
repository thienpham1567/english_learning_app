# Story 17.7 — Create `packages/auth` (ActorContext Abstraction)

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R2 - Shared Packages
- **Estimate:** 3h
- **Dependencies:** 17.4 (uses UnauthorizedError from @repo/shared)

## Description

Create an auth package that abstracts identity resolution behind an `ActorContext` type. Business modules receive this instead of depending on `next/headers` or Better Auth details.

## Acceptance Criteria

- [ ] AC1: Package structure:
  ```
  packages/auth/
    package.json          # name: @repo/auth
    tsconfig.json
    src/
      types.ts            # ActorContext type
      web/
        resolve-web-actor.ts  # cookie/session resolver for Next.js
        index.ts
      index.ts            # barrel export
  ```
- [ ] AC2: `ActorContext` type:
  ```ts
  export type ActorContext = {
    userId: string;
    roles: string[];
    clientType: "web" | "mobile" | "internal";
  };
  ```
- [ ] AC3: `resolveWebActor` function:
  ```ts
  export async function resolveWebActor(): Promise<ActorContext> {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) throw new UnauthorizedError("Session required");
    return {
      userId: session.user.id,
      roles: [],
      clientType: "web",
    };
  }
  ```
- [ ] AC4: Throws `UnauthorizedError` from `@repo/shared` on failure
- [ ] AC5: Unit test with mocked `auth.api.getSession`
- [ ] AC6: At least ONE existing route refactored to use `resolveWebActor()` as proof:
  ```ts
  // Before
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  // After
  const actor = await resolveWebActor();
  const userId = actor.userId;
  ```
- [ ] AC7: Package builds independently
- [ ] AC8: Web app can import: `import { resolveWebActor, type ActorContext } from "@repo/auth"`

## Technical Notes

- `resolveWebActor` depends on `next/headers` — this is fine because it's a WEB adapter
- Future `resolveTokenActor` (for mobile) will live in `packages/auth/src/token/`
- The point is: modules only see `ActorContext`, not the resolution mechanism
- Choose dashboard route as the proof-of-concept for AC6
