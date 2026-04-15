# Story 17.8 — Dashboard Query Service in `packages/database`

## Info

- **Epic:** 17 - Monorepo Backend Architecture
- **Sprint:** R3 - Dashboard Module Extraction
- **Estimate:** 3h
- **Dependencies:** 17.6 (packages/database exists)

## Description

Extract the dashboard's DB aggregation queries into a dedicated query service within `packages/database`. This separates persistence logic from the route handler.

## Acceptance Criteria

- [ ] AC1: Files created:
  ```
  packages/database/src/queries/
    dashboard-query-service.ts    # interface
    drizzle-dashboard-query.ts    # implementation
    index.ts
  ```
- [ ] AC2: Interface defined:
  ```ts
  export interface DashboardQueryService {
    getOverviewForUser(userId: string): Promise<DashboardOverviewData>;
  }

  export type DashboardOverviewData = {
    flashcardsDue: number;
    vocabDue: number;
    dailyChallenge: { completed: boolean; score: number | null };
    streak: { currentStreak: number; bestStreak: number; lastCompletedDate: string | null };
    badges: Array<{ id: string; label: string; emoji: string; unlocked: boolean }>;
    recentVocabulary: Array<{ query: string; headword: string; level: string; lookedUpAt: string }>;
    weeklyActivity: Array<{ day: string; count: number }>;
    totalXP: number;
  };
  ```
- [ ] AC3: Drizzle implementation extracts ALL query logic from current `app/api/dashboard/route.ts`:
  - Flashcard due count
  - Vocab due count
  - Daily challenge status
  - Streak info
  - Badges
  - Recent vocabulary
  - Weekly activity
  - Total XP
- [ ] AC4: Return type matches `DashboardOverviewData` exactly
- [ ] AC5: Exported singleton: `export const drizzleDashboardQueryService: DashboardQueryService`
- [ ] AC6: Integration test verifies query returns correct shape against test DB
- [ ] AC7: No changes to API response behavior

## Technical Notes

### Current dashboard route analysis

The current `app/api/dashboard/route.ts` likely does:

```ts
// 1. Auth check
// 2. Multiple DB queries:
//    - flashcard due count (flashcardProgress where nextReview <= now)
//    - vocab due count (userVocabulary where saved=true, nextReview <= now)
//    - daily challenge (today's challenge for user)
//    - streak (userStreak for user)
//    - badges (computed from streak/activity)
//    - recent vocab (last 10 userVocabulary)
//    - weekly activity (activityLog grouped by day, last 7 days)
//    - total XP (userStreak.xpTotal)
// 3. Aggregate and return
```

Extract steps 2-3 into the query service. Step 1 stays in the route handler.

## Dev Notes

- Keep the query SQL identical to current — no optimization in this story
- The interface allows swapping implementations later (e.g., cached, different DB)
