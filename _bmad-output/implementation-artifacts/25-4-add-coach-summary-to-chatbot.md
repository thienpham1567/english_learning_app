# Story 25.4: Add Coach Summary To Chatbot

Status: ready-for-dev

<!-- Generated and quality-reviewed by BMAD create-story workflow on 2026-04-24. -->

## Story

As a learner,
I want the chatbot to understand my recent study context,
so that it can coach me instead of only answering isolated questions.

## Acceptance Criteria

1. Given the learner has recent plan, review, error, or progress data; when they start a coaching conversation; then the chatbot can summarize recent strengths, weak spots, and recommended next actions.
2. The prompt stays concise and avoids exposing raw private database details
3. Coach recommendations link to real modules
4. Normal chat behavior remains available.

## Tasks / Subtasks

- [ ] Build compact coach context from recent plan, review, error, and progress data. (AC: 1-4)
- [ ] Inject coach context into chatbot prompts without exposing raw private database details. (AC: 1-4)
- [ ] Add module links for coach recommendations using route-tested URLs. (AC: 1-4)
- [ ] Verify normal chat and persona behavior remain unchanged when coach context is unavailable. (AC: 1-4)

## Dev Notes

### Context

- Sprint: R21 - Cross-Module Feedback And AI Coach.
- Parent artifact: `_bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md`.
- Sprint plan: `_bmad-output/planning-artifacts/adaptive-learning-upgrades-sprint-plan.md`.
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Reuse Epic 20 infrastructure before adding new abstractions: learning events, skill taxonomy, mastery state, recommendation scoring, daily study plan generation, review tasks, AI feedback metadata, and onboarding baseline.

### Source Tree Areas To Inspect First

- `apps/web/app/(app)/english-chatbot/_components/ChatWindow.tsx`
- `apps/web/app/api/chat/route.ts`
- `apps/web/lib/chat/build-chat-instructions.ts`
- `apps/web/lib/chat/create-chat-sse.ts`
- `apps/web/app/api/writing/score/route.ts`
- `apps/web/app/api/speaking/feedback/route.ts`
- `packages/modules/src/learning/ai-feedback-wrapper.ts`
- `packages/modules/src/learning/feedback-quality-gates.ts`
- `packages/database/src/schema/index.ts`

### Existing Test Areas To Reuse Or Extend

- `packages/modules/__tests__/learning/ai-feedback-wrapper.test.ts`
- `packages/modules/__tests__/learning/feedback-quality-gates.test.ts`
- `apps/web/app/(app)/english-chatbot/_components/__tests__/PersonaSwitcher.test.tsx`

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

- AI feedback and coaching must degrade gracefully. Do not let telemetry or coach context failures break normal chat or scoring.
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

To be filled by the implementing dev-story agent.

### Debug Log References

### Completion Notes List

### File List
