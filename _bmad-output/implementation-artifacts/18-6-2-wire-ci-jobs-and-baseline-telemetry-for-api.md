# Story 18.6.2: Wire CI Jobs and Baseline Telemetry for the API

Status: ready-for-dev

## Story

As a developer,
I want the API checked in CI with minimal telemetry hooks,
so that migration work does not ship blind.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R5 - Auth and Client Integration Baseline  
**Story ID:** 18.6.2  
**Dependencies:** 18.6.1

## Acceptance Criteria

1. API build, lint, typecheck, unit test, and e2e test jobs run in CI.
2. Logging, error-reporting hooks, and any minimal metrics hooks are documented and wired for `apps/api`.
3. CI failures isolate API issues clearly from `apps/web`.
4. The API baseline can fail the pipeline on contract, auth, or validation regressions.

## Tasks / Subtasks

- [ ] Task 1: Add CI coverage for `apps/api`.
  - [ ] Create or extend workflow files so API checks run predictably.
  - [ ] Keep API failures attributable to `apps/api`, not buried in generic root logs.
- [ ] Task 2: Add baseline telemetry hooks.
  - [ ] Reuse the structured logging baseline from `18.3.3`.
  - [ ] Add the thinnest useful error-reporting/metrics seam; do not overbuild observability here.
- [ ] Task 3: Document the operational signals.
  - [ ] Record where to look for logs, failures, and CI evidence.
- [ ] Task 4: Verify the pipeline fails on API regressions.

## Dev Notes

### Current Repo Reality

- No existing CI workflow files were found under `.github/workflows`, `.gitlab-ci.yml`, or `.circleci`.
- Source search did not find an established telemetry or monitoring package in app code today.
- The root task runner already exposes `build`, `lint`, `test`, and `test:run` through Turbo.

### Implementation Guardrails

- Do not make `apps/api` checks depend on `apps/web` implementation details beyond shared package builds.
- Keep telemetry baseline-level. This is not the story for full tracing or vendor lock-in.
- If CI adds matrix or split jobs, make the API job names explicit so failures are easy to triage.
- Preserve local reproducibility: every CI command should have a plain `pnpm` equivalent developers can run locally.

### File Targets

- [.github/workflows](/Users/thienpham/Documents/english_learning_app/.github/workflows)
- [package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [turbo.json](/Users/thienpham/Documents/english_learning_app/turbo.json)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)

### Testing Requirements

- CI workflow validation by dry run or syntax check where available
- One intentional or simulated failure path proving API regressions fail the pipeline
- Verification that logs/error hooks are documented and reachable from the runtime baseline

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.3.3 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-3-3-add-health-readiness-logging-and-runtime-docs.md)
- [Story 18.6.1 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-6-1-add-unit-and-e2e-test-harnesses-for-apps-api.md)
- [Root package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [Turbo config](/Users/thienpham/Documents/english_learning_app/turbo.json)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- This repo currently has no committed CI or telemetry baseline for the new API surface, so this story establishes both.

### Completion Notes List

- The key risk is leaving API checks implicit inside root Turbo output, which makes migration regressions easy to miss or misattribute.

### File List

- `_bmad-output/implementation-artifacts/18-6-2-wire-ci-jobs-and-baseline-telemetry-for-api.md`
