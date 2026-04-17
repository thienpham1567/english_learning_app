# Deferred Work

## Deferred from: code review of 17-8-dashboard-query-service (2026-04-16)

- **Badge duplication drift risk** — `packages/database/src/queries/dashboard-badges.ts` duplicates `apps/web/lib/daily-challenge/badges.ts`. If thresholds/labels change in one place, the other silently diverges. Story 17.9 consolidation should establish single source of truth.
- **Singleton `drizzleDashboardQueryService` hinders DI** — the exported singleton pattern makes implementation swapping require `vi.mock`. Story 17.9 module/use-case layer should refactor to an injectable factory or class pattern.
- **`Promise.all` connection leak on partial rejection** — if any one of the 6 dashboard queries rejects (e.g. DB timeout), the rejected `Promise.all` abandons remaining queries without cancelling them, leaving connection pool slots occupied. Pre-existing architectural concern; track for when connection pooling strategy is revisited.
- **JSON `"null"` string not caught by `?? "unknown"` for vocab level** — `vocabularyCache.data->>'level'` may return the string `"null"` (JSON null serialized to string), bypassing the nullish coalescing fallback. Pre-existing bug in both old route and new query service.

## Deferred from: code review of 17-9-dashboard-module (2026-04-16)

- **userId runtime guard** — `resolveWebActor()` throws `UnauthorizedError` before the use case is reached, so an empty userId would mean the auth layer failed. Guard belongs at the auth boundary, not the use case. Revisit if `getDashboardOverview` gains callers outside the web adapter.
- **`DashboardQueryService` port owned by `@repo/database` instead of `@repo/modules`** — architecture prefers modules to own their ports/interfaces; the current dependency direction is inverted. Story 17.8 established the interface in `@repo/database`; clean-up deferred to a future port-migration story when scope permits.
- **No lint/typecheck scripts in `@repo/modules/package.json`** — package silently skipped by root-level lint/typecheck orchestration. Add `"lint"` and `"typecheck"` scripts to bring this package into CI parity with other workspace packages.
- **Runtime response validation in use cases** — `getDashboardOverview` returns the query service result unvalidated. Establish a cross-cutting schema-parse policy once multiple use cases exist rather than adding it ad-hoc.
