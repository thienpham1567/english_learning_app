---
sprintNumber: 8
status: in-progress
startDate: 2026-04-12
epics: [9]
---

# Sprint 8 — Progress Analytics

## Sprint Goal

Xây dựng hệ thống activity logging và trang Progress Analytics để user nhìn thấy sự tiến bộ qua thời gian.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 9.1: Activity Logging Infrastructure | Epic 9 | 5 | ⬜ TODO | None |
| 2 | 9.2: Analytics API Endpoint | Epic 9 | 5 | ⬜ TODO | 9.1 |
| 3 | 9.3: Progress Analytics Page | Epic 9 | 8 | ⬜ TODO | 9.2 |

**Total: 18 points**

## Implementation Order

1. **Story 9.1** — DB table + logActivity() utility + integrate into existing APIs
2. **Story 9.2** — Analytics API aggregating data from activity_log
3. **Story 9.3** — Visual page with CSS/SVG charts

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] All charts CSS/SVG only (no chart library)
- [ ] Responsive layout (stacked mobile, 2-col desktop)
- [ ] Navigation link added to sidebar
