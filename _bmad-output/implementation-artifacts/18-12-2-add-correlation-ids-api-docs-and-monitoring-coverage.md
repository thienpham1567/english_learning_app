# Story 18.12.2: Add Correlation IDs, API Docs, and Monitoring Coverage

Status: ready-for-dev

## Story

As a developer,
I want migrated modules to be diagnosable in production,
so that operational issues can be traced and triaged quickly.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R7 - Core Learning Migration  
**Story ID:** 18.12.2  
**Dependencies:** 18.12.1

## Acceptance Criteria

1. Structured logs include request correlation for migrated endpoints.
2. API documentation exists for the migrated route set.
3. Error monitoring covers the migrated modules.
4. Operational docs explain where to look for logs, traces, and failure signals.

## Tasks / Subtasks

- [ ] Task 1: Add correlation IDs through the request pipeline.
- [ ] Task 2: Generate or publish API docs for the migrated routes.
- [ ] Task 3: Add a baseline error-monitoring seam.
- [ ] Task 4: Document the operational troubleshooting path.

## Dev Notes

### Current Repo Reality

- `apps/api` only has the baseline logging/runtime docs created earlier in the epic.
- Source search did not find an established monitoring stack in application code.
- No generated API docs pipeline exists in the repo today.

### Implementation Guardrails

- Keep request correlation end to end through logs and error handling.
- API docs should describe the migrated route set, not aspirational future routes.
- Monitoring coverage can start thin, but it needs a real integration point instead of TODO comments.
- Make the operational docs concrete enough that someone can actually trace a failing request.

### File Targets

- [apps/api/src/common](/Users/thienpham/Documents/english_learning_app/apps/api/src/common)
- [apps/api/src/main.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/main.ts)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)
- [docs](/Users/thienpham/Documents/english_learning_app/docs)

### Testing Requirements

- Verification that correlation IDs appear in logs
- Validation that API docs generate or render for migrated routes
- Smoke verification that monitoring hooks capture an error path

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.3.3 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-3-3-add-health-readiness-logging-and-runtime-docs.md)
- [Story 18.6.2 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-6-2-wire-ci-jobs-and-baseline-telemetry-for-api.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- This repo currently has logging but no real request-correlation, API-doc, or monitoring baseline for the new API surface.

### Completion Notes List

- The main risk is documenting observability aspirationally without wiring any real correlation or error signal path.

### File List

- `_bmad-output/implementation-artifacts/18-12-2-add-correlation-ids-api-docs-and-monitoring-coverage.md`
