# Story 20.11: Add Structured Feedback Quality Gates

Status: review

## Story

As a learner,
I want AI feedback that tells me what to do next,
so that feedback directly improves my next practice session.

## Acceptance Criteria

1. Parsed AI feedback includes summary, strengths, issues, priority issues, evidence spans where applicable, suggested rewrite or drill, confidence, and next action candidates.
2. Malformed output is rejected or safely degraded.
3. High-priority issues can schedule review tasks.
4. Accepted, ignored, edited, and retried feedback actions are tracked.
5. Tests cover valid output, malformed output, and review-task scheduling from feedback.

## Tasks / Subtasks

- [x] Add structured feedback output contract (AC: 1, 2)
  - [x] Define `StructuredFeedback`, issue, evidence span, and next action candidate schemas.
  - [x] Include confidence and priority issue fields.
- [x] Add validator and safe degradation path (AC: 2)
  - [x] Validate model output before persistence.
  - [x] Provide fallback feedback shape for malformed but recoverable output.
  - [x] Reject unusable output with existing route error handling.
- [x] Connect priority issues to review tasks (AC: 3)
  - [x] Map priority issues to taxonomy skill ids.
  - [x] Create review task candidates using Story 20.7 model.
- [x] Track feedback actions (AC: 4)
  - [x] Persist accepted, ignored, edited, and retried actions.
  - [x] Emit learning events for meaningful feedback interactions.
- [x] Add tests (AC: 1, 2, 3, 4, 5)
  - [x] Valid structured output.
  - [x] Malformed output.
  - [x] High-priority issue schedules review task.
  - [x] Feedback action tracking.

## Dev Notes

- This story depends on 20.10 and benefits from 20.7.
- Keep user-facing feedback concise; do not expose internal schema details in the UI.
- Existing prompt files include writing rubric prompt logic in `apps/web/lib/writing/rubric-prompts.ts`.

### Project Structure Notes

- Validator/domain logic should live in `packages/modules/src/ai-feedback` or `packages/modules/src/learning`.
- Contracts can live in `packages/contracts/src/learning` or a new `ai-feedback` contract folder.
- Keep app routes thin and schema-validate near boundaries.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Writing Rubric Prompts](/Users/thienpham/Documents/english_learning_app/apps/web/lib/writing/rubric-prompts.ts)
- [Writing Error Tags](/Users/thienpham/Documents/english_learning_app/apps/web/lib/writing/error-tags.ts)
- [Writing Pattern Quiz Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/writing/pattern-quiz/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean first-pass implementation.

### Completion Notes List

- **Contracts** (`structured-feedback.ts`):
  - `StructuredFeedbackSchema`: summary, strengths, issues (with severity+evidenceSpan+skillIds), priorityIssues, suggestedRewrite, confidence, nextActionCandidates
  - `FeedbackIssueSchema`: id, category, description, severity (low/medium/high/critical), evidenceSpan, suggestedFix, skillIds
  - `FeedbackActionSchema`: feedbackRunId, userId, action (accepted/ignored/edited/retried), editedContent, timestamp
- **Domain logic** (`feedback-quality-gates.ts`):
  - `validateFeedbackOutput()` — Zod parse with safe degradation for partial output, throws on unusable (AC: 2)
  - `issuesAsReviewTasks()` — converts high/critical issues with skillIds into error_retry review tasks (AC: 3)
  - `recordFeedbackAction()` — pure action record creation (AC: 4)
  - `isMeaningfulFeedbackAction()` — filters accepted/retried/edited as meaningful for learning events
- **Tests**: 19 tests covering valid output, malformed degradation, unusable rejection, review task creation, action tracking, meaningful action detection.
- Full regression: 203/203 pass.

### Change Log

- 2026-04-22: Story 20.11 implemented — structured feedback contracts, quality gates, 19 tests.

### File List

- `packages/contracts/src/learning/structured-feedback.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/modules/src/learning/feedback-quality-gates.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/feedback-quality-gates.test.ts` (new)
