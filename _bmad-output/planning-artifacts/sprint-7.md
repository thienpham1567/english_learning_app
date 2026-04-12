---
sprintNumber: 7
status: in-progress
startDate: 2026-04-12
epics: [7, 8]
---

# Sprint 7 — Voice Chatbot + Smart Dashboard

## Sprint Goal

Thêm voice I/O cho chatbot (nói tiếng Anh) và nâng cấp dashboard với Smart CTA + Level System.

## Stories

| # | Story | Epic | Points | Status | Dependencies |
|---|---|---|---|---|---|
| 1 | 8.1: Smart CTA "Bài Hôm Nay" | Epic 8 | 3 | ✅ DONE | None |
| 2 | 8.2: Level System UI | Epic 8 | 3 | ✅ DONE | None |
| 3 | 7.1: Voice Input Hook & Mic Button | Epic 7 | 5 | ✅ DONE | None |
| 4 | 7.2: Text-to-Speech for AI Responses | Epic 7 | 5 | ✅ DONE | None |
| 5 | 7.3: Voice Conversation Mode | Epic 7 | 8 | ✅ DONE | 7.1, 7.2 |

**Total: 24 points**

## Implementation Order

1. **Story 8.1** (Smart CTA) — Quick win, dashboard improvement, no new APIs
2. **Story 8.2** (Level System) — Builds on 8.1, pure client-side formula
3. **Story 7.1** (Voice Input) — New hook + UI button on chatbot
4. **Story 7.2** (TTS) — New hook + speaker button on messages
5. **Story 7.3** (Voice Mode) — Combines 7.1 + 7.2 into full conversational flow

## Definition of Done

- [ ] All stories meet acceptance criteria
- [ ] `npm run build` passes (Exit 0)
- [ ] No regressions on existing features
- [ ] `prefers-reduced-motion` respected for new animations
- [ ] Graceful degradation on unsupported browsers (voice features hidden)
