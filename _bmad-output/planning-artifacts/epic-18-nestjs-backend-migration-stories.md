---
sourceEpic: _bmad-output/planning-artifacts/epic-18-nestjs-backend-migration.md
generatedAt: 2026-04-16
status: draft
---

# Epic 18 Detailed Story Breakdown

## Purpose

This document decomposes Epic 18 into implementation-ready child stories that are small enough for a single developer agent to complete in sequence.

## Source Inputs

- `_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration.md`
- Current monorepo structure under `apps/*` and `packages/*`
- Current Next.js route handlers under `apps/web/app/api/*`
- Shared packages already present in `packages/contracts`, `packages/database`, `packages/auth`, and `packages/shared`

## Guardrails

- `apps/api` becomes the authoritative backend for migrated domains
- `apps/web` remains UI, SSR, and thin integration code only
- Contracts stay framework-agnostic in `@repo/contracts`
- Database access stays in `@repo/database`
- Better Auth remains the auth system of record
- AI-heavy domains stay out of the first migration wave

## Parent Story 18.1 - Create `apps/api` NestJS Application

### Story 18.1.1 - Scaffold the `apps/api` Workspace

**As a** developer,  
**I want** a NestJS app scaffolded in `apps/api`,  
**so that** backend work has a dedicated runtime boundary.

**Acceptance Criteria:**

- [ ] `apps/api` exists with `package.json`, `tsconfig.json`, `src/main.ts`, and `src/app.module.ts`
- [ ] The API app uses the workspace TypeScript base configuration instead of a one-off compiler setup
- [ ] `pnpm --filter api dev` starts a Nest HTTP server locally
- [ ] `apps/web` still runs without requiring API migration changes in this story

### Story 18.1.2 - Register API Tasks and Minimal Bootstrap Modules

**As a** developer,  
**I want** the new API app wired into the monorepo toolchain,  
**so that** the service behaves like a first-class workspace app.

**Acceptance Criteria:**

- [ ] Root `pnpm dev`, `pnpm build`, `pnpm lint`, and `pnpm test` can include the API app through Turbo
- [ ] `apps/api` contains only the minimal bootstrap module set: app, config placeholder, health placeholder, and auth placeholder
- [ ] The API app can build independently with `pnpm --filter api build`
- [ ] No business-domain controllers or services are introduced yet

## Parent Story 18.2 - Establish API Contracts, Validation, and Error Envelope

### Story 18.2.1 - Define the Shared API Error Envelope

**As a** developer,  
**I want** one error contract shared by web and API,  
**so that** transport failures are shaped consistently across migrated routes.

**Acceptance Criteria:**

- [ ] `@repo/contracts` exposes a standard API error envelope schema and TypeScript type
- [ ] The error envelope covers validation, unauthorized, forbidden, not-found, and internal error cases
- [ ] `apps/api` can map Nest exceptions into the shared error envelope
- [ ] Existing dashboard contract patterns remain compatible with the shared envelope

### Story 18.2.2 - Add Zod Validation Adapters and a Sample Endpoint

**As a** developer,  
**I want** Nest request validation to be driven by Zod contracts,  
**so that** request parsing and response typing do not drift.

**Acceptance Criteria:**

- [ ] A reusable Zod-based request validation path exists for Nest controllers
- [ ] A sample endpoint demonstrates request validation, typed response shaping, and shared error handling end to end
- [ ] No duplicate `class-validator` model is created for the same transport contract
- [ ] Invalid payloads return the shared validation error envelope instead of ad hoc JSON

## Parent Story 18.3 - Wire Config, Database, Health, and Deployment Baseline

### Story 18.3.1 - Wire Configuration Loading for `apps/api`

**As a** developer,  
**I want** API runtime config loaded through a single module,  
**so that** local and deployed environments use the same configuration contract.

**Acceptance Criteria:**

- [ ] `apps/api` loads required environment variables through one configuration module
- [ ] Missing required configuration fails fast during boot
- [ ] Environment access is centralized instead of spread across controllers and services
- [ ] Existing root environment expectations in `turbo.json` are reflected in the API config contract

### Story 18.3.2 - Provide a Database Module Backed by `@repo/database`

**As a** developer,  
**I want** Nest services to consume `@repo/database` through dependency injection,  
**so that** the API reuses the existing Drizzle and PostgreSQL setup.

**Acceptance Criteria:**

- [ ] `apps/api` exposes a database provider/module that reuses `db`, `pool`, or a narrow wrapper from `@repo/database`
- [ ] No schema files or table definitions are duplicated inside `apps/api`
- [ ] A sample service can query the database through the injected provider
- [ ] The provider lifecycle is compatible with local development and tests

### Story 18.3.3 - Add Health, Readiness, Logging, and Runtime Docs

**As a** developer,  
**I want** the new service to expose operational baseline endpoints and docs,  
**so that** the API is observable and runnable before domain migration starts.

**Acceptance Criteria:**

- [ ] `/health` and `/ready` endpoints exist in `apps/api`
- [ ] Structured request logging is enabled for the API baseline
- [ ] The chosen deployment target and reverse-proxy assumption are documented
- [ ] Local startup for `web + api + db` is documented and verified

## Parent Story 18.4 - Integrate Better Auth Session Resolution in NestJS

### Story 18.4.1 - Build Better Auth Session Resolution for Nest Requests

**As a** developer,  
**I want** Nest requests to resolve the authenticated actor from Better Auth,  
**so that** migrated endpoints can enforce auth without copying Next.js route logic.

**Acceptance Criteria:**

- [ ] `apps/api` can resolve the current session from incoming request headers or cookies
- [ ] The resolved actor shape stays compatible with the framework-agnostic auth types in `@repo/auth`
- [ ] Auth failures use the shared unauthorized error shape
- [ ] The implementation does not fork Better Auth state or replace the existing auth source of record

### Story 18.4.2 - Add Auth Guard and Prove Session Resolution with `/me`

**As a** developer,  
**I want** a minimal authenticated endpoint and guard,  
**so that** session resolution is verified before feature migration begins.

**Acceptance Criteria:**

- [ ] A reusable auth guard or middleware protects authenticated Nest routes
- [ ] A `/me` or equivalent authenticated endpoint returns the resolved actor or profile stub
- [ ] Authenticated and unauthenticated flows are covered by tests
- [ ] Cookie, CORS, and proxy-domain assumptions are documented alongside the endpoint

## Parent Story 18.5 - Create Typed API Client and Web Integration Strategy

### Story 18.5.1 - Create the Typed HTTP Client Foundation

**As a** developer,  
**I want** a typed HTTP client built from shared contracts,  
**so that** `apps/web` stops hardcoding endpoint strings and payload shapes.

**Acceptance Criteria:**

- [ ] A reusable client layer exists in `@repo/contracts` or a dedicated sibling package
- [ ] The client consumes shared request, response, and error schemas from `@repo/contracts`
- [ ] Base URL configuration is environment-driven instead of hardcoded
- [ ] Client helpers stay thin and transport-focused rather than becoming feature services

### Story 18.5.2 - Integrate the Typed Client into `apps/web`

**As a** developer,  
**I want** `apps/web` to consume one authenticated API endpoint through the typed client,  
**so that** the integration path is proven before the Learner Home cutover.

**Acceptance Criteria:**

- [ ] `apps/web` calls at least one authenticated API endpoint through the typed client
- [ ] Cookie/session behavior works with the chosen proxy or base-URL setup
- [ ] Integration guidance is documented for server components, client components, and SSR loaders
- [ ] No new feature code uses handwritten API paths for the migrated endpoint

## Parent Story 18.6 - Add API CI, Test Harness, and Observability Baseline

### Story 18.6.1 - Add Unit and E2E Test Harnesses for `apps/api`

**As a** developer,  
**I want** API tests in place before migration work scales out,  
**so that** controllers, services, and guards can be verified safely.

**Acceptance Criteria:**

- [ ] `apps/api` has a working unit test setup for services and guards
- [ ] `apps/api` has a working e2e harness using `supertest` or an equivalent tool
- [ ] The sample authenticated and validation endpoints are covered by tests
- [ ] Failure paths are asserted, not only happy paths

### Story 18.6.2 - Wire CI Jobs and Baseline Telemetry for the API

**As a** developer,  
**I want** the API checked in CI with minimal telemetry hooks,  
**so that** migration work does not ship blind.

**Acceptance Criteria:**

- [ ] API build, lint, typecheck, unit test, and e2e test jobs run in CI
- [ ] Logging, error-reporting hooks, and any minimal metrics hooks are documented and wired for `apps/api`
- [ ] CI failures isolate API issues clearly from `apps/web`
- [ ] The API baseline can fail the pipeline on contract, auth, or validation regressions

## Parent Story 18.7 - Add Learner Home Contracts

### Story 18.7.1 - Define Dashboard Contracts and Tests

**As a** developer,  
**I want** the dashboard transport contract formalized in shared schemas,  
**so that** the first production slice is contract-first.

**Acceptance Criteria:**

- [ ] `@repo/contracts` defines the dashboard request and response shapes used by the migrated endpoint
- [ ] Shared dashboard error cases are captured through the common error envelope
- [ ] Contract tests validate success and failure parsing
- [ ] Existing dashboard schema work is reused or extended instead of duplicated

### Story 18.7.2 - Define Preferences, Learning-Style, and XP Contracts

**As a** developer,  
**I want** the rest of the Learner Home slice covered by explicit contracts,  
**so that** all phase-one endpoints share one typed boundary.

**Acceptance Criteria:**

- [ ] Contracts exist for preferences read/write, learning-style analysis, and XP award flows
- [ ] Request validation requirements are captured in shared schemas, not only controller code
- [ ] Shared unauthorized and validation error cases are defined for these endpoints
- [ ] Contract tests cover representative success and failure payloads

## Parent Story 18.8 - Implement Learner Home Module in NestJS

### Story 18.8.1 - Implement the Dashboard Module in `apps/api`

**As a** learner,  
**I want** dashboard data served by the Nest backend,  
**so that** the new API boundary is proven on a real read-heavy workflow.

**Acceptance Criteria:**

- [ ] `apps/api` contains a dashboard controller, service, and any query adapters needed for the existing dashboard flow
- [ ] Logic currently in `apps/web/app/api/dashboard/route.ts` is moved into API-owned services or adapters
- [ ] Database access flows through `@repo/database`
- [ ] Tests cover success, unauthorized, and failure behavior for the migrated dashboard endpoint

### Story 18.8.2 - Implement Preferences and Learning-Style Modules

**As a** learner,  
**I want** my preferences and learning-style data served by the Nest backend,  
**so that** personalization flows stop depending on Next route handlers.

**Acceptance Criteria:**

- [ ] `apps/api` contains controllers and services for preferences and learning-style flows
- [ ] Logic currently in `apps/web/app/api/preferences/route.ts` and `apps/web/app/api/learning-style/route.ts` is moved into API-owned services or adapters
- [ ] Validation and auth are enforced through shared API infrastructure rather than route-local logic
- [ ] Tests cover read, write, invalid-input, insufficient-data, and unauthorized cases

### Story 18.8.3 - Implement API-Owned XP Award Orchestration

**As a** learner,  
**I want** XP awards handled by the authoritative backend,  
**so that** progress changes are centralized before broader migration.

**Acceptance Criteria:**

- [ ] `apps/api` exposes an XP award endpoint or service aligned with the shared contracts
- [ ] Logic currently in `apps/web/app/api/xp/route.ts` is moved behind API-owned orchestration
- [ ] Input validation uses the shared contract schema
- [ ] Tests cover valid awards, invalid payloads, and unauthorized requests

## Parent Story 18.9 - Cut `apps/web` Over to the Learner Home API

### Story 18.9.1 - Cut Dashboard Consumers Over to `apps/api`

**As a** developer,  
**I want** dashboard reads in `apps/web` to come from the API service,  
**so that** the first migrated slice is actually backend-owned.

**Acceptance Criteria:**

- [ ] `apps/web` reads dashboard data through the typed API client
- [ ] No page or loader in the Learner Home flow calls the old dashboard route directly
- [ ] User-visible dashboard behavior remains unchanged
- [ ] Regression coverage or smoke checks confirm auth/session behavior still works

### Story 18.9.2 - Cut Preferences, Learning-Style, and XP Consumers Over and Retire Old Routes

**As a** developer,  
**I want** the rest of the Learner Home flow switched to `apps/api`,  
**so that** duplicated backend ownership is removed for the first production slice.

**Acceptance Criteria:**

- [ ] `apps/web` uses the typed API client for preferences, learning-style, and XP flows
- [ ] Old Next route handlers for migrated Learner Home endpoints are removed or reduced to clearly documented temporary proxies
- [ ] No duplicated business logic remains between `apps/web` and `apps/api` for these flows
- [ ] Existing user behavior remains unchanged from the UI perspective

## Parent Story 18.10 - Migrate Vocabulary and Flashcard Endpoints

### Story 18.10.1 - Define Vocabulary and Flashcard Contracts

**As a** developer,  
**I want** core learning-loop contracts defined before migration,  
**so that** vocabulary and flashcard endpoints move behind a typed boundary.

**Acceptance Criteria:**

- [ ] Contracts exist for vocabulary lookup, vocabulary save, flashcard due, and flashcard review flows
- [ ] Shared success and failure shapes are defined for these endpoints
- [ ] Contract tests cover representative success, validation-failure, and unauthorized cases
- [ ] Existing vocabulary and dashboard-related schema work is reused where possible

### Story 18.10.2 - Implement the Vocabulary Module in NestJS

**As a** learner,  
**I want** vocabulary lookup and save flows served by the Nest backend,  
**so that** the vocabulary pipeline stops depending on Next route handlers.

**Acceptance Criteria:**

- [ ] `apps/api` contains a vocabulary controller and service for lookup and save flows
- [ ] Logic from relevant `apps/web/app/api/vocabulary*` routes is moved into API-owned services or adapters
- [ ] The module preserves current persistence behavior for saved words and cache reuse
- [ ] Tests cover lookup, save, duplicate-save, invalid-input, and unauthorized flows

### Story 18.10.3 - Implement the Flashcard Module and Cut Over Web Consumers

**As a** learner,  
**I want** due and review flashcard flows served by the Nest backend,  
**so that** the highest-frequency learning loop has a clear backend owner.

**Acceptance Criteria:**

- [ ] `apps/api` contains a flashcard controller and service for due and review flows
- [ ] Logic from relevant `apps/web/app/api/flashcards/*` routes is moved into API-owned services or adapters
- [ ] `apps/web` switches to the typed API client for migrated flashcard calls
- [ ] Tests cover due retrieval, review submission, invalid-input, and unauthorized flows

## Parent Story 18.11 - Migrate Daily Challenge and XP/Progress Orchestration

### Story 18.11.1 - Implement Daily Challenge Read Flows in NestJS

**As a** learner,  
**I want** daily challenge retrieval served by the Nest backend,  
**so that** the challenge surface is ready for centralized progress ownership.

**Acceptance Criteria:**

- [ ] `apps/api` serves the current daily challenge retrieval and streak-read flows needed by the web app
- [ ] Logic from relevant `apps/web/app/api/daily-challenge/*` read routes is moved into API-owned services or adapters
- [ ] Contracts and auth are enforced consistently with earlier migrated modules
- [ ] Tests cover happy-path, no-data, and unauthorized cases

### Story 18.11.2 - Implement Daily Challenge Submission and Streak Updates

**As a** learner,  
**I want** challenge completion handled by the Nest backend,  
**so that** streak and completion rules are centralized with the rest of the API.

**Acceptance Criteria:**

- [ ] `apps/api` handles daily challenge submission and any immediate streak updates required by the current product behavior
- [ ] Transaction boundaries are explicit where multiple records can change together
- [ ] Duplicate submission and failure-recovery paths are defined and tested
- [ ] The migrated flow preserves current user-visible behavior

### Story 18.11.3 - Centralize XP and Progress Orchestration and Cut Over Consumers

**As a** developer,  
**I want** XP and progress updates to run through one backend-owned path,  
**so that** learning-state mutations stop being split across the web app and route handlers.

**Acceptance Criteria:**

- [ ] XP and related progress updates flow through one authoritative orchestration path in `apps/api`
- [ ] `apps/web` consumes the migrated daily challenge and XP endpoints through the typed API client
- [ ] Old Next route handlers are removed or marked as temporary proxies with owners and dates
- [ ] Tests cover success, duplicate updates, unauthorized access, and failure recovery

## Parent Story 18.12 - Harden the Migrated API Surface

### Story 18.12.1 - Add Rate Limiting and Security Middleware

**As a** developer,  
**I want** core safeguards on migrated routes,  
**so that** the API surface is safe to expand after the first migration wave.

**Acceptance Criteria:**

- [ ] Rate limiting is applied to migrated public endpoints where appropriate
- [ ] Security middleware and headers are documented and enabled where relevant
- [ ] The safeguards do not break authenticated web flows behind the chosen proxy setup
- [ ] Tests or verification steps cover the expected failure behavior for throttled requests

### Story 18.12.2 - Add Correlation IDs, API Docs, and Monitoring Coverage

**As a** developer,  
**I want** migrated modules to be diagnosable in production,  
**so that** operational issues can be traced and triaged quickly.

**Acceptance Criteria:**

- [ ] Structured logs include request correlation for migrated endpoints
- [ ] API documentation exists for the migrated route set
- [ ] Error monitoring covers the migrated modules
- [ ] Operational docs explain where to look for logs, traces, and failure signals

## Parent Story 18.13 - Enforce the Backend Boundary and Retire Migrated Next Routes

### Story 18.13.1 - Enforce Backend Ownership Rules and Inventory Remaining Route Groups

**As a** team,  
**I want** backend ownership made explicit in code and workflow,  
**so that** the repo does not drift back into a split-backend model.

**Acceptance Criteria:**

- [ ] Backend ownership rules are documented for the repo, including where new backend code must live
- [ ] Code review guidance exists for rejecting new long-term business logic in `apps/web/app/api/*`
- [ ] Remaining non-migrated route groups are inventoried and prioritized
- [ ] Temporary proxies in `apps/web` are marked with owners and target retirement dates

## Parent Story 18.14 - Production Readiness Review and Next-Wave Backlog

### Story 18.14.1 - Produce the Cutover Scorecard and Next-Wave Plan

**As a** team lead,  
**I want** a clear readiness scorecard and backlog for the next wave,  
**so that** the migration stays measurable instead of open-ended.

**Acceptance Criteria:**

- [ ] A production-readiness review is completed for all migrated domains
- [ ] A rollback and incident-response playbook exists for `apps/api`
- [ ] Performance and error baselines are captured for migrated flows
- [ ] A prioritized next-wave backlog exists for AI-heavy route groups such as `chat`, `writing-practice`, `grammar-quiz`, `reading`, `listening`, and `voice`
- [ ] A continue, pause, or expand decision is recorded for the next migration wave

## Recommended Execution Order

1. `18.1.1`
2. `18.1.2`
3. `18.2.1`
4. `18.2.2`
5. `18.3.1`
6. `18.3.2`
7. `18.3.3`
8. `18.4.1`
9. `18.4.2`
10. `18.5.1`
11. `18.5.2`
12. `18.6.1`
13. `18.6.2`
14. `18.7.1`
15. `18.7.2`
16. `18.8.1`
17. `18.8.2`
18. `18.8.3`
19. `18.9.1`
20. `18.9.2`
21. `18.10.1`
22. `18.10.2`
23. `18.10.3`
24. `18.11.1`
25. `18.11.2`
26. `18.11.3`
27. `18.12.1`
28. `18.12.2`
29. `18.13.1`
30. `18.14.1`
