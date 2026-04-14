---
sprintNumber: 11
status: backlog
startDate: 2026-04-29
epics: [15]
---

# Sprint 11 — Advanced Learning (P2)

## Sprint Goal

Triển khai CEFR Diagnostic Test cho measurement chính xác, Scenario-Based Lessons cho immersive learning, và Weekly Leaderboard cho social motivation.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 15.1: CEFR Diagnostic Test | Epic 15 | 13 | ⬜ TODO | Sprint 9 (skill profile) |
| 2 | 15.2: Scenario Engine & Airport Scenario | Epic 15 | 13 | ⬜ TODO | Sprint 10 (voice feedback) |
| 3 | 15.3: Additional Scenarios (3 more) | Epic 15 | 8 | ⬜ TODO | 15.2 |
| 4 | 15.4: Weekly Leaderboard | Epic 15 | 5 | ⬜ TODO | None |

**Total: 39 points**

## Implementation Order

1. **Story 15.4** (Leaderboard) — Quick win, aggregates existing activity_log data
2. **Story 15.1** (Diagnostic Test) — New page + adaptive algorithm + DB table
3. **Story 15.2** (Scenario Engine + Airport) — New page architecture + 5-step flow
4. **Story 15.3** (3 More Scenarios) — Content creation on top of engine, reuse engine

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] Diagnostic test populates user_skill_profile for ALL modules
- [ ] Diagnostic re-test limited to 1/month
- [ ] Scenario progress persisted per-step per-user
- [ ] All 4 scenarios completable end-to-end
- [ ] Leaderboard resets weekly (Monday 00:00 VN timezone)
- [ ] New navigation entries added to sidebar
