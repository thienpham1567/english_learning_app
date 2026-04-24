# Story 21.1: Audit Recommendation Routes

Status: done

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want recommendation links to open the correct app module,
so that I can trust the daily plan and continue learning without dead ends.

## Acceptance Criteria

1. Given the app has generated recommendation candidates; when a candidate includes an internal `actionUrl`; then the URL matches an existing app route.
2. The speaking recommendation no longer points to `/chatbot`
3. A route coverage test fails if a recommendation URL does not map to a known route
4. Existing recommendations for vocabulary, grammar, listening, reading, writing, pronunciation, and exam strategy still route correctly.

## Tasks / Subtasks

- [x] Inventory all generated recommendation and daily-plan action URLs from `recommendation-adapters.ts` and related tests. (AC: 1-4)
- [x] Fix invalid mappings, including replacing `/chatbot` with the real chat route or an intentionally chosen speaking route. (AC: 1-4)
- [x] Add a route allowlist or route-discovery helper test that covers every generated internal action URL. (AC: 1-4)
- [x] Verify vocabulary, grammar, listening, reading, writing, pronunciation, and exam strategy recommendations still route to existing pages. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R17 - Adaptive Home Activation.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/home/page.tsx`
- `apps/web/app/api/study-plan/daily/route.ts`
- `apps/web/hooks/useDashboard.tsx`
- `packages/modules/src/learning/recommendation-adapters.ts`
- `packages/modules/src/learning/recommendation-scorer.ts`
- `packages/modules/src/learning/daily-plan-generator.ts`
- `apps/web/components/shared/AppSidebar.tsx`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/daily-plan-generator.test.ts`
- `packages/modules/__tests__/learning/recommendation-scorer.test.ts`
- `apps/web/components/shared/__tests__/AppSidebar.test.tsx`

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

- Home already has a dashboard fallback. Preserve it until adaptive plan behavior is verified.
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

- **Audit (Task 1):** Inventoried all action URLs across `SKILL_TO_URL`, `SKILL_TO_MODULE`, `DEFAULT_STUDY_ACTIONS`, `candidatesFromDueReviews`, `candidatesFromWeakSkills`, and `candidatesFromDefaultActions`. Found speaking skill incorrectly mapped to `/chatbot` (non-existent route).
- **Fix (Task 2):** Corrected `actionUrl` in 2 places: `SKILL_TO_URL.speaking` and `DEFAULT_STUDY_ACTIONS` speaking entry, both from `/chatbot` → `/english-chatbot`. `moduleType` kept as `"chatbot"` to match the canonical `LearningModuleType` contract.
- **Route allowlist test (Task 3):** Created `recommendation-routes.test.ts` with 22 tests covering: static `SKILL_TO_URL` allowlist validation, per-skill parametric tests for all 3 adapter functions (`candidatesFromDueReviews`, `candidatesFromWeakSkills`, `candidatesFromDefaultActions`), and explicit `/chatbot` regression guards. Test will fail automatically if a future URL mapping targets a non-existent route.
- **Verification (Task 4):** Confirmed all 8 skills (vocabulary, grammar, listening, speaking, pronunciation, reading, writing, exam_strategy) generate valid routes. Full regression suite: 193/193 tests pass across 13 files, zero regressions.
- Exported `SKILL_TO_URL` from `recommendation-adapters.ts` for testability (AC: 3).

### Senior Developer Review (AI)

- Review date: 2026-04-24
- Review outcome: Changes Requested → Resolved
- Action items:
  - [x] [High] Revert `SKILL_TO_MODULE.speaking` from `"english_chatbot"` back to `"chatbot"` — moduleType is a domain concept defined in `LearningModuleType` contract, not a route path.
  - [x] [High] Revert `DEFAULT_STUDY_ACTIONS` speaking `moduleType` from `"english_chatbot"` back to `"chatbot"`.
  - [x] [Low] Noted: `KNOWN_APP_ROUTES` allowlist is hardcoded — deferred, acceptable tradeoff for test simplicity.

### File List

- `packages/modules/src/learning/recommendation-adapters.ts` — Modified (fix speaking actionUrl, export SKILL_TO_URL)
- `packages/modules/__tests__/learning/recommendation-routes.test.ts` — New (22 route coverage tests)

## Change Log

- Fixed speaking recommendation routing `/chatbot` → `/english-chatbot` (actionUrl only, moduleType kept as `"chatbot"`) (Date: 2026-04-24)
- Added route allowlist test with 22 test cases covering all adapter functions and regression guards (Date: 2026-04-24)
- Code review: reverted moduleType change that conflicted with `LearningModuleType` contract (Date: 2026-04-24)
