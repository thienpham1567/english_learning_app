---
sprintNumber: 10
status: backlog
startDate: 2026-04-22
epics: [13, 14]
---

# Sprint 10 — Voice & Analytics (P1)

## Sprint Goal

Thêm Shadowing/Dictation mode cho Listening, nâng cấp Voice AI với inline feedback, và enrich Home + Progress pages với streak calendar, predicted TOEIC score, và Word of the Day.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 13.1: Shadowing Mode | Epic 13 | 8 | ⬜ TODO | None |
| 2 | 13.2: Dictation Mode | Epic 13 | 5 | ⬜ TODO | None |
| 3 | 13.3: Voice Conversation with Inline Feedback | Epic 13 | 8 | ⬜ TODO | None |
| 4 | 14.1: Streak Calendar Heatmap | Epic 14 | 5 | ⬜ TODO | None |
| 5 | 14.2: Predicted TOEIC Score | Epic 14 | 8 | ⬜ TODO | None |
| 6 | 14.3: Word of the Day | Epic 14 | 3 | ⬜ TODO | None |
| 7 | 14.4: Enhanced Today's Plan | Epic 14 | 5 | ⬜ TODO | Sprint 9 (skill profile) |

**Total: 42 points**

## Implementation Order

1. **Story 14.1** (Streak Calendar) — Quick visual win, uses existing analytics API data
2. **Story 14.3** (Word of Day) — Quick win, new widget on Home
3. **Story 13.2** (Dictation) — Lower complexity than shadowing, builds listening infra
4. **Story 13.1** (Shadowing) — Reuses pronunciation evaluate API + voice input hook
5. **Story 14.2** (Predicted TOEIC) — New algorithm + Progress page component
6. **Story 13.3** (Voice Inline Feedback) — Extends existing voice conversation mode
7. **Story 14.4** (Enhanced Plan) — Integrates SRS due counts from Sprint 9

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] Shadowing + Dictation accessible from Listening page mode selector
- [ ] Streak Calendar renders correctly for 0-data, partial, and full heatmap states
- [ ] Predicted TOEIC shows graceful "insufficient data" state
- [ ] Voice feedback non-blocking — conversation flow not interrupted
- [ ] All CSS/SVG only (no chart library)
