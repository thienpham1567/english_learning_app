---
sprintNumber: 9
status: backlog
startDate: 2026-04-15
epics: [12]
---

# Sprint 9 — Core Learning Engine (P0)

## Sprint Goal

Xây dựng nền tảng học tập thông minh: SM-2 SRS cho tất cả vocabulary, adaptive difficulty cho Grammar + Listening, shadowing mode, và enhanced Today's Plan.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 12.1: Vocabulary SRS Schema Extension | Epic 12 | 3 | ⬜ TODO | None |
| 2 | 12.2: SM-2 Algorithm Service | Epic 12 | 3 | ⬜ TODO | 12.1 |
| 3 | 12.3: Vocabulary SRS Review Quiz | Epic 12 | 8 | ⬜ TODO | 12.2 |
| 4 | 12.4: User Skill Profile & Adaptive Grammar | Epic 12 | 5 | ⬜ TODO | None |
| 5 | 12.5: Adaptive Listening Integration | Epic 12 | 3 | ⬜ TODO | 12.4 |

**Total: 22 points**

## Implementation Order

1. **Story 12.1** — DB migration: add SRS columns to user_vocabulary table
2. **Story 12.2** — Extract SM-2 into shared `lib/srs/sm2.ts`, refactor flashcard API
3. **Story 12.4** — Create user_skill_profile table + adaptive difficulty service (parallel with 12.2)
4. **Story 12.3** — Vocabulary SRS review quiz page using shared SM-2 service
5. **Story 12.5** — Wire adaptive difficulty into Listening module

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] SM-2 algorithm unit tests pass for all quality levels
- [ ] Existing flashcard review not regressed (uses shared SM-2)
- [ ] Vocabulary SRS due count shows in sidebar badges
- [ ] Adaptive level badge visible on Grammar + Listening pages
