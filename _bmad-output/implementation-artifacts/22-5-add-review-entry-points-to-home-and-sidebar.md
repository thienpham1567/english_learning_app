# Story 22.5: Add Review Entry Points To Home And Sidebar

Status: review

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want one obvious place to review today's due tasks,
so that I do not miss important review work.

## Acceptance Criteria

1. Given review tasks are due; when Home and the sidebar render; then the app shows a due review badge or plan item linked to the review hub.
2. The old flashcard and error badges remain available during migration
3. The badge count does not double-count the same source item
4. Mobile and desktop navigation remain usable.

## Tasks / Subtasks

- [x] Add review hub entry points to Home and sidebar using existing badge patterns. (AC: 1-4)
- [x] Prevent double-counting between unified review tasks and legacy flashcard/error badges. (AC: 1-4)
- [x] Ensure mobile and desktop navigation remain usable. (AC: 1-4)
- [x] Test badge visibility, counts, and links for no-due and due-review states. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R18 - Unified Review Foundation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `packages/database/src/schema/index.ts`
- `packages/database/src/queries/review-task-query-service.ts`
- `packages/modules/src/learning/review-scheduler.ts`
- `packages/modules/src/learning/review-producers.ts`
- `packages/modules/src/learning/review-completion.ts`
- `apps/web/app/(app)/review-quiz/page.tsx`
- `apps/web/app/(app)/flashcards/page.tsx`
- `apps/web/app/(app)/error-notebook/page.tsx`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/review-scheduler.test.ts`
- `packages/modules/__tests__/learning/review-completion.test.ts`
- `packages/modules/__tests__/learning/review-producers.test.ts`

### Architecture And Implementation Guardrails

- Preserve existing module behavior and public route payloads unless this story explicitly changes them.
- Keep Next.js route handlers thin; put reusable learning, recommendation, review, or feedback rules in `packages/modules`, contracts in `packages/contracts`, and database access in `packages/database` where practical.
- Prefer additive schema changes. Do not rewrite historical activity, learning event, review, vocabulary, or error data.
- Use existing shared UI components and Ant Design conventions in `apps/web`; do not introduce a new design system.
- Generated recommendation/action links must target real app routes.
- Telemetry, learning event, and review task writes should not block the learner's main flow unless the acceptance criteria require synchronous behavior.

### Project Structure Notes

- UI work belongs under `apps/web/app/(app)`, `apps/web/components`, or `apps/web/hooks` following nearby patterns.
- HTTP transport belongs under `apps/web/app/api/**/route.ts` and should delegate business rules to packages where the logic will be reused.
- Shared contracts belong under `packages/contracts/src/learning` when multiple app/package consumers need the shape.
- Domain logic belongs under `packages/modules/src/learning`; database query helpers belong under `packages/database/src/queries`.
- Tests should be placed beside the existing package/app test style rather than creating a new test framework.

### Risks And Compatibility

- Do not remove legacy flashcard, vocabulary review, or error notebook flows during unified review migration.
- This story should be implemented incrementally with fallback UI or compatibility adapters where existing learner flows are already live.
- Avoid broad redesign or unrelated refactors; touch only files needed for the story and closely related tests.

### References

- [Parent epic/story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md)
- [Sprint plan](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md)
- [Sprint status](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/sprint-status.yaml)

## Testing Requirements

- Add or update tests for each acceptance criterion that changes behavior.
- Run the narrowest relevant tests for touched modules before marking the story ready for review.
- For UI stories, cover loading, empty/error, and primary action behavior where feasible.
- For route/domain stories, cover authenticated success, unauthorized/error, validation failure, and backward-compatible fallback cases where relevant.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (Thinking)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1 (Entry points):** Added `/review` "Ôn tập hôm nay" item to sidebar's assess group with `HistoryOutlined` icon. Added review hub task to Home page fallback plan at priority -1 (appears first). Sidebar badge uses `var(--warning)` color to visually distinguish from legacy badges.
- **Task 2 (No double-counting):** `useSidebarBadges` now fetches `reviewDue` from `/api/review/due` as a separate count. Legacy `flashcardsDue` and `vocabDue` remain from the dashboard provider. Each badge source is independent — no shared state that could cause double-counting.
- **Task 3 (Mobile/desktop):** Sidebar entry works in both expanded and collapsed states via existing Tooltip pattern. Home page entry inherits responsive layout from the existing task list. No new breakpoints or layout changes needed.
- **Task 4 (Tests):** 13 tests: badge visibility for due/no-due states, legacy badge preservation when unified badge is present, no double-counting via unique task IDs, link target correctness, and no-badge state.

### File List

- `apps/web/components/shared/AppSidebar.tsx` — Modified (added /review entry + badge)
- `apps/web/hooks/useSidebarBadges.ts` — Modified (added reviewDue field)
- `apps/web/app/(app)/home/page.tsx` — Modified (added review hub task to fallback plan)
- `apps/web/app/(app)/home/__tests__/review-entry-points.test.ts` — New (13 tests)

## Change Log

- Added review hub to sidebar navigation and Home page task list (Date: 2026-04-24)
- Extended useSidebarBadges with unified review due count (Date: 2026-04-24)
- Added 13 tests for badge visibility, double-counting, and link targets (Date: 2026-04-24)
