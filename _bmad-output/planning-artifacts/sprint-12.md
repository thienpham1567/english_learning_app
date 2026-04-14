---
sprintNumber: 12
status: backlog
startDate: 2026-05-06
epics: [16]
---

# Sprint 12 — Platform Scale (P3)

## Sprint Goal

Mở rộng platform với offline mode cho core features, AI-generated grammar lessons, topic-based content pipeline, và learning style detection.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 16.1: Offline Flashcard & Vocabulary Sync | Epic 16 | 8 | ⬜ TODO | Sprint 9 (SRS) |
| 2 | 16.2: Offline Reading Cache | Epic 16 | 5 | ⬜ TODO | None |
| 3 | 16.3: AI Grammar Lessons | Epic 16 | 8 | ⬜ TODO | None |
| 4 | 16.4: Topic-Based Content Sets | Epic 16 | 13 | ⬜ TODO | None |
| 5 | 16.5: Learning Style Detection | Epic 16 | 5 | ⬜ TODO | Sprint 10 (analytics) |

**Total: 39 points**

## Implementation Order

1. **Story 16.3** (AI Grammar Lessons) — Self-contained, quick win for learning quality
2. **Story 16.2** (Offline Reading) — Simpler IndexedDB usage, no sync needed
3. **Story 16.1** (Offline Flashcard Sync) — Complex sync logic, requires careful conflict resolution
4. **Story 16.5** (Learning Style) — Analysis service + study plan integration
5. **Story 16.4** (Content Pipeline) — Most complex: background generation + multi-resource coordination

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] Offline flashcard review functional without network (airplane mode test)
- [ ] Offline sync resolves conflicts without data loss
- [ ] Grammar lessons cached and don't regenerate
- [ ] Content packs generate in background without blocking UI
- [ ] Learning style detection configurable and overridable
- [ ] Max 10 offline articles enforced (LRU eviction)
