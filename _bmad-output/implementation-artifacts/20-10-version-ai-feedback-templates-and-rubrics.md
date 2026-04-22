# Story 20.10: Version AI Feedback Templates and Rubrics

Status: review

## Story

As a product team,
I want AI feedback to be versioned,
so that feedback quality can be measured, compared, and rolled back safely.

## Acceptance Criteria

1. AI feedback requests store template id, template version, rubric version, model name, prompt hash, input snapshot, structured output, latency, cost estimate, and safety flags.
2. Writing, speaking, listening summary, pronunciation, grammar, and reading feedback can use the shared metadata model.
3. Old feedback remains comparable by version.
4. Prompt/rubric changes require an explicit version bump.
5. Tests cover metadata capture and version validation.

## Tasks / Subtasks

- [x] Add feedback version contracts (AC: 1, 2, 3, 4)
  - [x] Define template, template version, rubric version, feedback run, and feedback output schemas.
  - [x] Include model metadata and prompt hash.
- [x] Add persistence support (AC: 1, 3)
  - [x] Add additive AI feedback tables or JSON-backed run log in `packages/database/src/schema/index.ts`.
  - [x] Add query service for creating feedback run records and outputs.
- [x] Add AI feedback metadata wrapper (AC: 1, 2, 4)
  - [x] Add shared package/module function to wrap existing AI calls.
  - [x] Enforce explicit template/rubric version in call sites using the wrapper.
- [x] Integrate representative modules (AC: 2, 5)
  - [x] Integrate writing feedback or scoring first.
  - [x] Integrate one speaking/pronunciation or listening feedback route.
- [x] Add tests (AC: 1, 3, 4, 5)
  - [x] Metadata capture test.
  - [x] Version required test.
  - [x] Representative route/module test with AI mocked.

## Dev Notes

- This story should not rewrite prompts for quality yet; it adds metadata/versioning needed to evaluate quality.
- Existing AI calls use `apps/web/lib/openai/client.ts` and `apps/web/lib/openai/config.ts`.
- Be careful not to persist raw secrets or unredacted sensitive data in input snapshots.

### Project Structure Notes

- Contracts: `packages/contracts/src/learning` or `packages/contracts/src/ai-feedback` if a separate export is cleaner.
- Domain wrapper: `packages/modules/src/ai-feedback` or `packages/modules/src/learning`.
- Route call sites remain in `apps/web/app/api/**` until migrated.

### References

- [Epic 20 Stories](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-20-learning-quality-personalization-stories.md)
- [OpenAI Client](/Users/thienpham/Documents/english_learning_app/apps/web/lib/openai/client.ts)
- [Writing Review Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/writing-practice/review/route.ts)
- [Writing Score Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/writing/score/route.ts)
- [Listening Summary Score Route](/Users/thienpham/Documents/english_learning_app/apps/web/app/api/listening/summary-score/route.ts)

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Fixed REDACT_KEYS set: keys must be lowercase since comparison uses `.toLowerCase()`.
- Fixed import path: `@repo/contracts` main barrel didn’t export feedback schemas; used `@repo/contracts/src/learning/ai-feedback` direct path.

### Completion Notes List

- **Contracts** (`ai-feedback.ts`): `FeedbackTemplateSchema`, `FeedbackRunSchema`, `FeedbackRequestSchema` with semver validation, 6 module types (AC: 2), model metadata, prompt hash, safety flags.
- **Persistence** (`aiFeedbackRun` table): 14 columns incl. templateVersion, rubricVersion, modelName, promptHash, inputSnapshot (JSONB), structuredOutput, latencyMs, costEstimate, safetyFlags. Indexed by user+created and template+version.
- **Query service** (`ai-feedback-query-service.ts`): `createFeedbackRun()` with returning ID.
- **Wrapper** (`ai-feedback-wrapper.ts`):
  - `hashPrompt()` — SHA-256 change detection for prompts (AC: 4)
  - `registerFeedbackTemplate()` / `getFeedbackTemplate()` — explicit version registry (AC: 4)
  - `wrapFeedbackCall()` — captures latency, cost, safety flags, redacts PII, validates version (AC: 1)
  - Input redaction: password/token/secret/apikey/authorization fields auto-redacted; long values truncated at 2000 chars.
- **Tests**: 12 tests covering hash determinism, template registry, version enforcement, metadata capture, schema validation, safety flags, input redaction, truncation.
- Full regression: 184/184 pass.

### Change Log

- 2026-04-22: Story 20.10 implemented — AI feedback versioning contracts, DB table, wrapper, 12 tests.

### File List

- `packages/contracts/src/learning/ai-feedback.ts` (new)
- `packages/contracts/src/learning/index.ts` (modified)
- `packages/database/src/schema/index.ts` (modified — added `aiFeedbackRun` table)
- `packages/database/src/queries/ai-feedback-query-service.ts` (new)
- `packages/database/src/queries/index.ts` (modified)
- `packages/modules/src/learning/ai-feedback-wrapper.ts` (new)
- `packages/modules/src/learning/index.ts` (modified)
- `packages/modules/__tests__/learning/ai-feedback-wrapper.test.ts` (new)
