# Story 19.4.3: Extensive Reading Tracker

Status: ready-for-dev

## Story

As a self-learner, I want to see how many words I've read per day/week/month and a streak of reading days — so I stay motivated and can target the "1M words/year" extensive-reading benchmark.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R12 — Reading Advanced
**Story ID:** 19.4.3
**Dependencies:** 19.4.2 (so reads actually generate engagement signals)

## Acceptance Criteria

1. **AC1** — New `readingSession` table: `{ id, userId, passageId, wordCount, startedAt, endedAt, completedAt?, scrollPct, clickCount }`. A session starts when a passage opens and ends on tab close / 5-minute idle / explicit finish.
2. **AC2** — A session counts toward the word total only when `completedAt` is set (marked finished or scrolled ≥ 90%).
3. **AC3** — `progress` page gets a "Reading" block: today / this week / this month word counts, current streak (consecutive days with ≥ 1 finished session), and a 90-day heatmap (GitHub-style).
4. **AC4** — Milestones: 10K, 50K, 100K, 500K, 1M words — unlock-style toast on crossing each.
5. **AC5** — Client-side session tracker (`useReadingSession` hook) posts to `POST /api/reading/session/heartbeat` every 30s while visible and on visibility change.
6. **AC6** — Heatmap + totals queries run server-side with indexed lookups on `(userId, completedAt)`.

## Tasks

- [ ] Task 1: Add `readingSession` schema + indexes + migration (AC1, AC6).
- [ ] Task 2: `useReadingSession` hook (AC5).
- [ ] Task 3: Endpoints: `POST /api/reading/session/heartbeat`, `POST /api/reading/session/finish` (AC1, AC2).
- [ ] Task 4: Progress-page Reading block with heatmap (use `react-calendar-heatmap` or roll own SVG grid) (AC3).
- [ ] Task 5: Milestone detection + toast (AC4).

## Dev Notes

- Streak calc: count days where at least one session has `completedAt` in that day, consecutive up to today (timezone = user locale from `Intl`).
- Heartbeat upserts `endedAt` to keep active sessions fresh; a background sweep could close stale ones, but a simple 5-min idle check during heartbeat is sufficient for now.
- Don't couple this to Epic 18 (`apps/api`) — the endpoints live in `apps/web/app/api/` for now.

## References

- [react-calendar-heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- Existing progress page: [apps/web/app/(app)/progress/](apps/web/app/(app)/progress/)
