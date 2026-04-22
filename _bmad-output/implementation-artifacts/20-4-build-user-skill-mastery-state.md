# Story 20.4: Build User Skill Mastery State

Status: review

## Story

As a learner,
I want the app to understand my strengths and weaknesses over time,
so that study recommendations are based on my actual skill state.

## Acceptance Criteria

1. The mastery update engine creates or updates `UserSkillState` for each affected skill.
2. Each state includes proficiency, confidence, last practiced time, last update time, success streak, failure streak, decay rate, recommended next review time, and source signal count.
3. Correct high-difficulty low-hint attempts increase mastery more than easy or heavily hinted attempts.
4. Repeated mistakes reduce confidence and increase review priority.
5. Stale skills decay over time using a deterministic rule.
6. Unit tests cover update, decay, confidence, and repeated-error behavior.

## Tasks / Subtasks

- [x] Add mastery contracts (AC: 1, 2)
  - [x] Add `UserSkillState` schemas/types under `packages/contracts/src/learning`.
  - [x] Add update input/output contracts for mastery updates.
- [x] Add persistence support (AC: 1, 2)
  - [x] Add additive user skill state table(s) in `packages/database/src/schema/index.ts`.
  - [x] Add query service methods to read, upsert, and list user skill states.
- [x] Add mastery engine (AC: 1, 3, 4, 5)
  - [x] Add deterministic scoring under `packages/modules/src/learning`.
  - [x] Use event score, result, difficulty, duration, hints, and error tags.
  - [x] Add decay calculation based on last practiced time and decay rate.
- [x] Add tests (AC: 3, 4, 5, 6)
  - [x] Cover positive update with high-quality attempt.
  - [x] Cover low-confidence update with hints/slow duration.
  - [x] Cover repeated mistake behavior.
  - [x] Cover stale skill decay.

## Dev Notes

- This story depends on 20.1, 20.2, and 20.3.
- Keep the initial model heuristic and deterministic. Do not introduce ML ranking or opaque AI scoring.
- Existing `userSkillProfile` is coarse module-level state. This story can coexist with it; avoid breaking `/api/skill-profile` consumers.
- Use additive database migration only.

### Project Structure Notes

- Domain logic belongs in `packages/modules/src/learning`.
- DB access belongs in `packages/database/src/queries`.
- Contracts belong in `packages/contracts/src/learning`.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Database Schema](/Users/thienpham/Documents/english_learning_app/packages/database/src/schema/index.ts)
- [Skill Profile Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/skill-profile/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation.

### Completion Notes List

- **Contracts**: Added `UserSkillStateSchema`, `MasteryUpdateInputSchema`, `MasteryUpdateOutputSchema` with 11/6/6 fields respectively. Exported via barrel chain.
- **Persistence**: Added `userSkillState` table with unique(userId, skillId) + nextReview index. Query service: `getUserSkillState`, `getAllUserSkillStates`, `upsertUserSkillState` with onConflictDoUpdate.
- **Mastery engine** (`mastery-engine.ts`):
  - Difficulty multipliers: beginner 0.5→advanced 1.6 (AC: 3)
  - Hint penalty: -15% per hint (AC: 3)
  - Streak bonus: +20% after 3+ correct
  - Failure escalation: loss grows with failure streak (AC: 4)
  - Time decay: proficiency decays after 48h grace period at configurable rate (AC: 5)
  - Review interval: 4h (new) to 168h (mastered), scaled by confidence
- **Tests**: 22 mastery engine tests. Full regression: 97/97 pass.
- No changes to existing `userSkillProfile` or `/api/skill-profile` route.

### Change Log

- 2026-04-22: Story 20.4 implemented — mastery contracts, DB table, engine with 22 tests.

### File List

- `packages/contracts/src/learning/user-skill-state.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/database/src/schema/index.ts` (modified — added `userSkillState` table)
- `packages/database/src/queries/user-skill-state-query-service.ts` (new)
- `packages/database/src/queries/index.ts` (modified)
- `packages/modules/src/learning/mastery-engine.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/mastery-engine.test.ts` (new)
