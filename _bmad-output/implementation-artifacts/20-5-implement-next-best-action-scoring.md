# Story 20.5: Implement Next-Best-Action Scoring

Status: review

## Story

As a learner,
I want the app to choose the most useful next task,
so that I do not have to decide between many modules.

## Acceptance Criteria

1. Recommendations are ranked using mastery gap, due urgency, skill importance, goal relevance, recency, difficulty match, estimated duration, and completion likelihood.
2. Recommendations are grouped as `must_do`, `should_do`, and `could_do`.
3. Each recommendation includes concise learner-facing reason text.
4. Ranking is deterministic for the same input.
5. Tests cover due-review priority, weak-skill priority, time budget filtering, and goal relevance.

## Tasks / Subtasks

- [x] Add recommendation contracts (AC: 1, 2, 3)
  - [x] Define candidate input and recommendation output schemas under `packages/contracts/src/learning`.
  - [x] Include reason text, action URL, skill ids, group, score, estimated minutes, and priority.
- [x] Add scoring engine (AC: 1, 2, 4)
  - [x] Implement deterministic scoring under `packages/modules/src/learning`.
  - [x] Separate score components for due urgency, mastery gap, goal relevance, recency, difficulty fit, and duration fit.
  - [x] Preserve score breakdown internally for tests and debugging.
- [x] Add candidate adapters (AC: 1, 3)
  - [x] Convert due reviews, weak skill needs, and existing study actions into recommendation candidates.
  - [x] Generate short reason text from score drivers.
- [x] Add tests (AC: 4, 5)
  - [x] Due review outranks optional new study when overdue.
  - [x] Weak high-impact skill outranks low-impact skill.
  - [x] Time budget filters or downranks long tasks.
  - [x] Goal relevance changes ordering predictably.

## Dev Notes

- This story depends on 20.4.
- Use rules first. Do not call OpenAI or any AI service for ranking.
- Candidate action URLs should target existing app routes where possible, such as `/flashcards`, `/review-quiz`, `/grammar-quiz`, `/listening`, `/reading`, `/writing-practice`, and `/pronunciation`.
- Recommendation reasons must be explainable and short enough for dashboard UI.

### Project Structure Notes

- Keep scoring in `packages/modules/src/learning` or a clearly named `packages/modules/src/recommendation` slice.
- Keep API exposure for a later story unless a minimal package-level function needs tests.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Home Page](/Users/thienpham/Documents/english_learning_app/apps/web/app/(app)/home/page.tsx)
- [Study Plan Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/study-plan/daily/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation.

### Completion Notes List

- **Contracts**: Added `RecommendationCandidateSchema`, `RecommendationSchema`, `ScoreBreakdownSchema`, `ScorerContextSchema`, `RecommendationGroup` with full type exports.
- **Scoring engine** (`recommendation-scorer.ts`):
  - 8 weighted score components: dueUrgency(0.25), masteryGap(0.20), goalRelevance(0.15), skillImportance(0.10), recency(0.10), difficultyFit(0.08), durationFit(0.07), completionLikelihood(0.05)
  - Deterministic composite scoring — pure functions, no AI calls
  - Group assignment: must_do (overdue/very weak+goal), should_do (≥0.4), could_do (rest)
  - Reason text generator: combines top score drivers into readable phrases
  - Time budget filtering: removes candidates exceeding budget
- **Candidate adapters** (`recommendation-adapters.ts`):
  - `candidatesFromDueReviews`: converts due skill states to candidates
  - `candidatesFromWeakSkills`: converts weak/low-confidence skills to study candidates
  - `candidatesFromDefaultActions`: generates starter candidates for new learners
  - Routes mapped to existing app URLs per dev notes
- **Tests**: 14 scorer tests covering determinism, due priority, weak skill priority, time budget, goal relevance, grouping, reason text, and breakdown preservation.
- Full regression: 111/111 pass.

### Change Log

- 2026-04-22: Story 20.5 implemented — recommendation contracts, scoring engine, candidate adapters, 14 tests.

### File List

- `packages/contracts/src/learning/recommendation.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/modules/src/learning/recommendation-scorer.ts` (new)
- `packages/modules/src/learning/recommendation-adapters.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/recommendation-scorer.test.ts` (new)
