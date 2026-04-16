# Deferred Work

## Deferred from: code review of 17-8-dashboard-query-service (2026-04-16)

- **Badge duplication drift risk** — `packages/database/src/queries/dashboard-badges.ts` duplicates `apps/web/lib/daily-challenge/badges.ts`. If thresholds/labels change in one place, the other silently diverges. Story 17.9 consolidation should establish single source of truth.
- **Singleton `drizzleDashboardQueryService` hinders DI** — the exported singleton pattern makes implementation swapping require `vi.mock`. Story 17.9 module/use-case layer should refactor to an injectable factory or class pattern.
- **`Promise.all` connection leak on partial rejection** — if any one of the 6 dashboard queries rejects (e.g. DB timeout), the rejected `Promise.all` abandons remaining queries without cancelling them, leaving connection pool slots occupied. Pre-existing architectural concern; track for when connection pooling strategy is revisited.
- **JSON `"null"` string not caught by `?? "unknown"` for vocab level** — `vocabularyCache.data->>'level'` may return the string `"null"` (JSON null serialized to string), bypassing the nullish coalescing fallback. Pre-existing bug in both old route and new query service.
