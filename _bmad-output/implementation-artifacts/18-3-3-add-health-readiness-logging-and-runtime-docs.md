# Story 18.3.3: Add Health, Readiness, Logging, and Runtime Docs

Status: ready-for-dev

## Story

As a developer,
I want the new service to expose operational baseline endpoints and docs,
so that the API is observable and runnable before domain migration starts.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R4 - API Foundation  
**Story ID:** 18.3.3  
**Dependencies:** 18.3.2

## Acceptance Criteria

1. `/health` and `/ready` endpoints exist in `apps/api`.
2. Structured request logging is enabled for the API baseline.
3. The chosen deployment target and reverse-proxy assumption are documented.
4. Local startup for `web + api + db` is documented and verified.

## Tasks / Subtasks

- [ ] Task 1: Implement `/health` and `/ready`.
  - [ ] Keep `/health` cheap and process-local.
  - [ ] Let `/ready` include dependency checks that matter for startup, such as DB readiness.
- [ ] Task 2: Add baseline structured logging.
  - [ ] Log method, path, status, and correlation-friendly fields at minimum.
- [ ] Task 3: Document runtime assumptions.
  - [ ] Record the deployment and proxy model that later auth and client stories depend on.
  - [ ] Document local startup for API alongside `apps/web` and the database.
- [ ] Task 4: Add tests or smoke verification for the new endpoints.

## Dev Notes

### Current Repo Reality

- There is no existing `apps/api` operational baseline yet.
- No CI or deployment workflow files are present in the repo today.
- Source search did not find an existing logging or telemetry stack in app code, so this story should stay light.

### Implementation Guardrails

- Do not turn this into a full observability rollout. Baseline structured logging is enough here.
- Keep `/health` and `/ready` stable and machine-friendly; later stories can add docs/monitoring depth.
- Document proxy and cookie assumptions now because stories `18.4.x` and `18.5.x` depend on them.
- If a logging library is introduced, keep the choice conservative and easy to run locally.

### File Targets

- [apps/api/src/health](/Users/thienpham/Documents/english_learning_app/apps/api/src/health)
- [apps/api/src/main.ts](/Users/thienpham/Documents/english_learning_app/apps/api/src/main.ts)
- [apps/api/README.md](/Users/thienpham/Documents/english_learning_app/apps/api/README.md)

### Testing Requirements

- Endpoint tests for `/health` and `/ready`
- Manual smoke verification for `web + api + db`
- Logging verification sufficient to confirm structured request logs are emitted

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.3.2 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-3-2-provide-database-module-backed-by-repo-database.md)
- [Root package.json](/Users/thienpham/Documents/english_learning_app/package.json)
- [Turbo config](/Users/thienpham/Documents/english_learning_app/turbo.json)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- No existing CI or telemetry config was found in the repo, so this story defines the first runtime baseline for `apps/api`.

### Completion Notes List

- The operational docs created here become the source of truth for later auth, typed-client, and cutover stories.

### File List

- `_bmad-output/implementation-artifacts/18-3-3-add-health-readiness-logging-and-runtime-docs.md`
