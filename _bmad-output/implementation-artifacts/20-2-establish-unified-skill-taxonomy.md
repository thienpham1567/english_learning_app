# Story 20.2: Establish Unified Skill Taxonomy

Status: done

## Story

As a learner,
I want my progress to be measured by actual English skills rather than isolated modules,
so that recommendations reflect what I really need to improve.

## Acceptance Criteria

1. A canonical taxonomy exists for vocabulary, grammar, listening, speaking, pronunciation, reading, writing, and exam strategy.
2. Each taxonomy entry includes id, label, parent skill, CEFR relevance, supported modules, and version.
3. Existing activity/module types map to at least one skill.
4. Unmapped future activity types fail tests or validation.
5. Taxonomy versioning does not require rewriting historical events.

## Tasks / Subtasks

- [x] Define taxonomy contracts (AC: 1, 2, 5)
  - [x] Add taxonomy schemas/types under `packages/contracts/src/learning`.
  - [x] Include canonical skill, subskill, skill version, and module mapping types.
- [x] Add taxonomy source data (AC: 1, 2, 3, 5)
  - [x] Add taxonomy constants under `packages/modules/src/learning`.
  - [x] Include parent-child relationships and supported modules.
  - [x] Map current activity types from `activityTypeEnum` to taxonomy skills.
- [x] Add validation helpers (AC: 3, 4)
  - [x] Add functions to resolve skills for a module/activity.
  - [x] Make unmapped activity/module values fail loudly.
- [x] Add tests (AC: 1, 3, 4, 5)
  - [x] Cover every existing `activityTypeEnum` value.
  - [x] Cover expected parent-child relationships.
  - [x] Cover version preservation for old events.

### Review Findings

- [x] [Review][Patch] `_subskillIndex` is dead code — remove unused Map [`modules/src/learning/skill-taxonomy.ts`:L107]
- [x] [Review][Patch] `MODULE_SKILL_MAP.length === 11` is a brittle magic number — compare against `LearningModuleType.options.length` [`modules/__tests__/learning/skill-taxonomy.test.ts`]
- [x] [Review][Patch] No test for subskill ID uniqueness — add guard against duplicate subskill IDs [`modules/__tests__/learning/skill-taxonomy.test.ts`]

## Dev Notes

- Existing `activityTypeEnum` is defined in `packages/database/src/schema/index.ts`.
- Current `userSkillProfile` uses module-level tracking. This story does not replace it yet; it creates the taxonomy needed to migrate toward finer mastery.
- Keep taxonomy deterministic and code-owned for now. Do not add AI-based taxonomy generation.

### Project Structure Notes

- Contracts: `packages/contracts/src/learning`.
- Domain constants/use cases: `packages/modules/src/learning`.
- Avoid adding taxonomy data in UI components.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [Database Schema](/Users/thienpham/Documents/english_learning_app/packages/database/src/schema/index.ts)
- [Modules Index](/Users/thienpham/Documents/english_learning_app/packages/modules/src/index.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

None — clean implementation.

### Completion Notes List

- **Contracts layer**: Created `skill-taxonomy.ts` with 4 Zod schemas: `SkillSchema`, `SubskillSchema`, `SkillTaxonomyVersionSchema`, `ModuleSkillMappingSchema`. All exported via barrel chain to root `@repo/contracts`.
- **Domain layer**: Created `packages/modules/src/learning/skill-taxonomy.ts` with:
  - 8 canonical skills (vocabulary, grammar, listening, speaking, pronunciation, reading, writing, exam_strategy)
  - 20 subskills with parent-child relationships
  - Full module→skill mapping (11 modules) and activity→skill mapping (10 activity types from `activityTypeEnum`)
  - Version metadata (`1.0.0`, `2026-04-22`)
- **Resolver helpers**: `resolveSkillsForModule()` and `resolveSkillsForActivity()` throw on unmapped values (AC4).
- **Tests**: 12 contract tests + 19 domain tests = 31 new tests. Full regression: 67/67 pass.
- No UX/module changes.

### Change Log

- 2026-04-22: Story 20.2 implemented — unified skill taxonomy with contracts, domain data, resolvers, and 31 tests.

### File List

- `packages/contracts/src/learning/skill-taxonomy.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/contracts/src/index.ts` (modified)
- `packages/contracts/__tests__/skill-taxonomy.test.ts` (new)
- `packages/modules/src/learning/skill-taxonomy.ts` (new)
- `packages/modules/src/learning/index.ts` (new)
- `packages/modules/src/index.ts` (modified)
- `packages/modules/__tests__/learning/skill-taxonomy.test.ts` (new)
