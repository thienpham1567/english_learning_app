# Monorepo-Ready Backend Design for Web and Mobile

Date: 2026-04-15

Status: Draft

## Summary

This document proposes a clean backend structure for `english_learning_app` under the chosen direction:

- keep the product running in a monorepo
- keep Next.js as the current runtime host
- design backend boundaries now so the backend can later become a standalone service with minimal rewrite
- support both web and mobile clients from the same backend contracts

The core decision is:

- **move business logic out of `app/api/*` and out of UI code**
- **organize backend by domain modules and shared contracts**
- **treat Next.js route handlers as temporary HTTP adapters, not as the backend itself**

This gives the team a clean intermediate state:

- low migration cost today
- strong internal boundaries now
- straightforward extraction path later

## Current State

The current project already has backend behavior, but it is embedded directly inside the Next.js app:

- client components call `/api/*`
- route handlers in `app/api/*` perform auth, validation, business logic, DB access, and third-party calls
- Drizzle DB access is used directly from route handlers and utility files
- OpenAI integration is also invoked directly from route handlers

This is workable for early product development, but it creates a few structural problems:

- route handlers become large and hard to test
- business rules are duplicated across routes, hooks, and page logic
- domain logic depends on Next.js runtime details
- mobile support becomes harder because the API contract is not clearly separated from the web app
- later extraction to a dedicated API service would require untangling many framework-specific imports

## Goals

### Primary Goals

- support both web and mobile from one backend contract surface
- keep the current Next.js app working during migration
- isolate domain logic from framework code
- reduce direct DB queries from route handlers
- make API endpoints thin and predictable
- make future backend extraction incremental instead of disruptive

### Secondary Goals

- improve testability
- improve code ownership by domain
- make auth, validation, and error handling consistent
- make it easier to introduce background jobs, queues, and observability later

## Non-Goals

- fully extracting a standalone backend service right now
- rewriting every existing feature in one pass
- replacing all current routes immediately
- introducing complex distributed infrastructure before it is needed

## Options Considered

### Option 1: Keep Everything Inside Next.js, Just Clean Up Files

Description:

- keep `app/api/*`
- move some helpers into `lib/*`
- continue using direct Drizzle and OpenAI calls from route handlers

Pros:

- smallest immediate change
- lowest migration effort now

Cons:

- weak boundaries remain
- mobile support stays second-class
- future backend extraction still expensive
- domain logic continues to depend on Next.js request/response patterns

Verdict:

- rejected

### Option 2: Backend-Core Packages Plus Thin Adapters

Description:

- keep web app in the monorepo
- introduce packages for contracts, modules, database access, and integrations
- keep Next route handlers only as adapters that call use cases
- design transport and auth boundaries so mobile can use the same backend surface later

Pros:

- best balance between clean architecture and practical migration
- lets the team improve structure incrementally
- mobile support becomes first-class
- future extraction to a standalone API is mostly adapter work

Cons:

- requires discipline and package boundaries
- migration takes multiple phases

Verdict:

- selected

### Option 3: Split Backend Into a Separate Service Immediately

Description:

- create a dedicated API app now
- move all routes, auth, DB access, and integrations out of Next.js immediately

Pros:

- cleanest final boundary
- web and mobile use the same API immediately

Cons:

- much higher short-term migration cost
- more infra and deployment complexity
- high risk of slowing feature work during the transition

Verdict:

- not selected for now

## Selected Architecture

The selected architecture is:

- **monorepo**
- **Next.js remains the active web app**
- **domain logic lives in reusable backend packages**
- **HTTP transport is an adapter**
- **DB access is behind repositories/query services**
- **mobile and web share request/response contracts**

The key rule is:

- **framework code depends on domain code**
- **domain code never depends on framework code**

## Target Monorepo Layout

```text
apps/
  web/
    app/
    components/
    hooks/
    next.config.ts
    package.json
  mobile/
    app/
    package.json
  api/                        # future app, not required on day 1
    src/
    package.json

packages/
  contracts/
    src/
      common/
      auth/
      dashboard/
      vocabulary/
      chat/
      reading/
      progress/
      index.ts

  modules/
    src/
      dashboard/
        application/
        domain/
        ports/
        index.ts
      vocabulary/
        application/
        domain/
        ports/
        index.ts
      chat/
        application/
        domain/
        ports/
        index.ts
      reading/
        application/
        domain/
        ports/
        index.ts
      progress/
        application/
        domain/
        ports/
        index.ts

  database/
    src/
      client/
      schema/
      repos/
      queries/
      transactions/
      index.ts

  integrations/
    src/
      openai/
      push/
      speech/
      guardian/
      index.ts

  auth/
    src/
      actor-context.ts
      session-service.ts
      token-service.ts
      index.ts

  shared/
    src/
      errors/
      result/
      time/
      logging/
      ids/
      index.ts

  testing/
    src/
      fixtures/
      fakes/
      test-utils/
      index.ts
```

## Package Responsibilities

### `apps/web`

Responsibilities:

- Next.js pages, layouts, server components, client components
- browser interaction
- route handlers only as temporary HTTP adapters while the API still lives in the web app
- session/cookie handling for the web experience

Must not own:

- business rules
- raw DB queries for feature logic
- OpenAI orchestration details
- reusable request/response contracts

### `apps/mobile`

Responsibilities:

- mobile UI and local state
- API consumption through shared contracts

Must not own:

- backend business rules
- server-side validation rules duplicated from backend

### `apps/api` (future)

Responsibilities:

- standalone HTTP server when extraction becomes necessary
- route registration
- auth middleware
- rate limiting
- request parsing
- response mapping

This app is **not required immediately**. The architecture is designed so it can be added later and reuse the same `packages/*`.

### `packages/contracts`

Responsibilities:

- `zod` schemas
- request DTOs
- response DTOs
- shared API types
- error response shapes

This package becomes the stable interface between:

- web and backend
- mobile and backend
- future standalone API and internal modules

Recommendation:

- use `zod` as the source of truth
- derive TypeScript types from schemas
- optionally generate OpenAPI later from the same schemas

### `packages/modules`

Responsibilities:

- feature-level domain logic
- use cases
- orchestration of repositories and integrations
- business validation that is not transport-specific
- transaction boundary coordination

This is the real backend core.

Each module should answer:

- what use cases does this domain expose?
- what data does it need?
- what integrations does it depend on?
- what business rules does it enforce?

This package must not import:

- `next/*`
- `Request` / `Response`
- browser APIs
- direct Drizzle schema or raw DB clients unless the module itself is intentionally an infrastructure module

### `packages/database`

Responsibilities:

- Drizzle schema
- DB client
- repository implementations
- read-model query services
- transactions

Structure guideline:

- `repos/*` for write-oriented repository implementations
- `queries/*` for optimized read paths like dashboard and analytics

This package should know about SQL and performance. Other packages should know about business intent.

### `packages/integrations`

Responsibilities:

- OpenAI
- external article providers
- push notifications
- speech providers
- any other third-party API adapters

Rule:

- modules depend on integration interfaces or service wrappers
- route handlers never talk to third-party SDKs directly

### `packages/auth`

Responsibilities:

- actor identity abstraction
- session resolution
- bearer token validation
- token issuance strategy for mobile when needed

Important principle:

- business modules should receive an `ActorContext`
- they should not care whether that actor came from a web cookie, a mobile bearer token, or an internal service token

### `packages/shared`

Responsibilities:

- framework-agnostic utilities only
- error classes
- result helpers
- logging interfaces
- time abstractions

Must not become a dumping ground for random feature logic.

## Dependency Rules

The dependency direction should be enforced by convention and linting.

Allowed:

- `apps/* -> packages/contracts`
- `apps/* -> packages/modules`
- `apps/* -> packages/auth`
- `apps/* -> packages/shared`
- `packages/modules -> packages/contracts`
- `packages/modules -> packages/shared`
- `packages/modules -> ports/interfaces defined in modules`
- `packages/database -> packages/modules` only when implementing module ports
- `packages/integrations -> packages/modules` only when implementing integration ports

Not allowed:

- `packages/modules -> next/*`
- `packages/modules -> packages/database/client` directly
- `packages/modules -> packages/integrations/sdk` directly without a port boundary
- `apps/web/components -> packages/database`
- `hooks/components -> DB or third-party SDKs`

## Backend Layering Model

Each feature should follow the same flow:

```text
HTTP Route / Server Action / Future API Endpoint
  -> input contract validation
  -> auth actor resolution
  -> application use case
  -> repositories + integrations
  -> output contract mapping
  -> HTTP response
```

This separates concerns cleanly:

- transport concern: route handler
- business concern: use case
- persistence concern: repository/query service
- third-party concern: integration adapter

## Domain Module Template

Recommended feature module template:

```text
packages/modules/src/vocabulary/
  application/
    lookup-vocabulary.ts
    get-due-vocabulary.ts
    review-vocabulary.ts
  domain/
    vocabulary-entry.ts
    spaced-repetition.ts
    errors.ts
  ports/
    vocabulary-repo.ts
    vocabulary-cache.ts
    dictionary-provider.ts
  index.ts
```

Rules:

- `application/` owns use cases
- `domain/` owns business rules and core models
- `ports/` defines dependencies the module needs

The Drizzle implementation lives elsewhere, for example:

```text
packages/database/src/repos/vocabulary/
  drizzle-vocabulary-repo.ts
  drizzle-vocabulary-cache.ts
```

This is what makes later extraction easy:

- the use case does not care whether the repository lives in Next.js or a separate API service

## API Style Recommendation

For a future `web + mobile` backend, the recommended transport is:

- **REST + JSON + zod contracts**

Reasoning:

- mobile clients consume it easily
- web can still consume it from server components or client fetch
- contracts are explicit and shareable
- it is less coupled to the web runtime than server actions or tRPC-only designs

This does not prevent internal helper functions or server actions inside the web app, but:

- the stable cross-client backend boundary should be HTTP contracts, not framework-specific RPC

## Auth Strategy

The current app uses web-oriented auth behavior. That is fine for now, but the architecture must become client-neutral.

### Web

Keep:

- cookie/session-based auth for the web app

Adapter responsibility:

- extract session from Next request
- build `ActorContext`
- pass `ActorContext` to the use case

### Mobile

Prepare for:

- bearer token auth
- token refresh flow
- same `ActorContext` output after auth resolution

### Required Design Rule

No business module may depend on:

- `headers()`
- cookies
- `next/headers`
- Better Auth request objects

Instead, use:

```ts
type ActorContext = {
  userId: string;
  roles: string[];
  clientType: "web" | "mobile" | "internal";
};
```

The transport layer resolves this. The use case consumes it.

## Data Access Strategy

There are two categories of DB access in this project:

### Write-Oriented Paths

Examples:

- review flashcards
- update streak
- save vocabulary
- persist chat messages

Use:

- repository interfaces
- transaction boundaries at use-case level

### Read-Oriented Paths

Examples:

- dashboard aggregates
- analytics
- leaderboard
- progress summaries

Use:

- query services or read models optimized for real UI needs

Do not force every dashboard query through an over-abstracted repository if the real need is a specialized read projection.

Recommended split:

- repositories for transactional domain state changes
- query services for read-heavy aggregates

## Error Handling Strategy

Define a shared error model in `packages/shared/errors`.

Categories:

- validation error
- unauthorized
- forbidden
- not found
- conflict
- upstream integration error
- internal error

Rules:

- modules throw typed domain/application errors
- transport adapters map them to HTTP status codes and response bodies
- no route should manually string-build error responses ad hoc

Example:

```text
Module throws: VocabularyNotFoundError
Route maps to: 404 { code: "VOCABULARY_NOT_FOUND", message: "..." }
```

## Third-Party Integration Strategy

The project already depends on:

- OpenAI
- article/content providers
- push-related services
- speech providers

These should live behind integration adapters.

Example:

```text
packages/integrations/src/openai/dictionary-provider.ts
packages/integrations/src/openai/chat-provider.ts
packages/integrations/src/guardian/article-provider.ts
```

Why:

- keeps SDK details out of route handlers
- improves testability
- supports swapping providers later
- makes it easier to move backend runtime out of Next.js

## Background Jobs and Async Work

This app already has patterns that will likely need async processing as it grows:

- push notifications
- AI generation
- analytics rollups
- expensive reading analysis

The architecture should prepare for async execution even if a queue is not added immediately.

Recommendation:

- define background-job intent at the module level
- keep transport adapters unaware of execution details
- start with synchronous execution where acceptable
- introduce a queue/outbox later without changing module contracts

A future evolution could look like:

- use case emits a domain event
- outbox persists it
- worker consumes it

But this is optional for the current stage.

## Observability

The backend structure should be friendly to logging and tracing from day one.

Recommendation:

- pass logger/context into adapters and use cases
- log at boundaries:
  - request entry
  - external API call
  - DB aggregate query
  - domain failure
  - upstream failure

Avoid:

- `console.error` scattered across many routes as the only error strategy

## Testing Strategy

### Module Tests

Test:

- use cases
- domain rules
- error conditions

Use:

- fake repositories
- fake integrations

These tests should not require Next.js or a real database.

### Repository / Query Tests

Test:

- Drizzle repository implementations
- aggregate query services
- transaction behavior

Use:

- integration tests against a test database

### Contract Tests

Test:

- request validation
- response shape
- route-to-use-case mapping

### End-to-End Tests

Test:

- critical user flows across web and API

## Migration Strategy

The migration should be incremental, not a big-bang rewrite.

### Phase 1: Establish Monorepo Boundaries

- standardize workspace structure
- move current app into `apps/web` if the repo is not already organized that way
- create `packages/contracts`
- create `packages/modules`
- create `packages/database`
- create `packages/integrations`

Success criteria:

- the app still runs
- no feature behavior changes yet

### Phase 2: Extract Shared Infrastructure

- move Drizzle client and schema into `packages/database`
- move OpenAI config/client into `packages/integrations`
- move auth actor abstraction into `packages/auth`

Success criteria:

- no feature route imports DB or OpenAI from arbitrary local utility files

### Phase 3: Migrate Thin-Slice Modules

Start with high-value modules:

1. dashboard
2. vocabulary
3. chat

For each module:

- create contracts
- define ports
- move use cases into `packages/modules`
- implement DB/integration adapters
- shrink route handlers to thin wrappers

Success criteria:

- route handlers mostly validate input, resolve actor, call use case, map response

### Phase 4: Read Model Cleanup

- move dashboard/progress/leaderboard queries into dedicated query services
- add missing DB indexes based on actual query patterns
- remove `ORDER BY RANDOM()` where present

Success criteria:

- heavy read endpoints become explicit and optimized

### Phase 5: Mobile-Ready API Boundary

- standardize endpoint naming and response envelopes
- ensure contracts are reusable by mobile
- add bearer-token auth adapter path

Success criteria:

- mobile can consume the same backend surface without web-only assumptions

### Phase 6: Optional API Extraction

Only when needed:

- add `apps/api`
- move HTTP adapters from `apps/web` into `apps/api`
- keep `packages/modules`, `packages/database`, `packages/contracts`, and `packages/integrations` unchanged

Success criteria:

- backend extraction is mostly transport and deployment work, not a domain rewrite

## Concrete Mapping From Current Codebase

### Current

- `app/api/dashboard/route.ts`
- `app/api/chat/route.ts`
- `app/api/vocabulary/*`
- `app/api/reading/*`
- `lib/db/*`
- `lib/openai/*`

### Target

#### Dashboard

Current:

- route performs auth, aggregation query, and response shaping

Target:

```text
apps/web/app/api/dashboard/route.ts
  -> packages/contracts/dashboard
  -> packages/auth/resolve-web-actor
  -> packages/modules/dashboard/application/get-dashboard-overview
  -> packages/database/queries/dashboard-query-service
```

#### Vocabulary

Current:

- dictionary lookup, cache, persistence, and response mapping are mixed in route handlers

Target:

```text
apps/web/app/api/vocabulary/*
  -> packages/modules/vocabulary/application/*
  -> packages/database/repos/vocabulary/*
  -> packages/integrations/openai/dictionary-provider
  -> packages/contracts/vocabulary/*
```

#### Chat

Current:

- route handles request parsing, OpenAI streaming, and DB persistence in one file

Target:

```text
apps/web/app/api/chat/route.ts
  -> packages/modules/chat/application/start-chat-stream
  -> packages/integrations/openai/chat-provider
  -> packages/database/repos/chat/*
  -> packages/contracts/chat/*
```

#### Reading

Current:

- route handlers and page logic own article fetch, caching, and grammar analysis decisions

Target:

```text
packages/modules/reading/application/*
packages/database/queries/reading/*
packages/integrations/guardian/*
packages/integrations/openai/grammar-analysis-provider
packages/contracts/reading/*
```

## Example Adapter Shape

Example route adapter:

```ts
export async function GET(req: Request) {
  const actor = await resolveWebActor(req);
  const input = DashboardRequestSchema.parse(parseRequest(req));
  const result = await getDashboardOverview({ actor, input });
  return Response.json(DashboardResponseSchema.parse(result));
}
```

What should not happen:

- raw SQL and business decisions living directly in the route

## Example Use Case Shape

```ts
export async function getDashboardOverview(deps: {
  actor: ActorContext;
  dashboardQuery: DashboardQueryService;
}) {
  return deps.dashboardQuery.getOverviewForUser(deps.actor.userId);
}
```

This use case does not know:

- whether the caller is web or mobile
- whether the transport is Next.js or a standalone API
- how the DB is connected

## Anti-Patterns to Ban

- importing `db` directly in UI components, hooks, or pages
- importing `next/headers` or cookies in domain modules
- calling OpenAI SDK directly from route handlers
- mixing DTO validation and domain rules in many places
- putting aggregate read logic in random utility files
- using `lib/*` as an unbounded catch-all instead of domain packages
- coupling mobile API design to web-only session behavior

## Acceptance Criteria

The architecture should be considered successfully adopted when:

- all new backend features follow the adapter -> use case -> repo/integration pattern
- `packages/contracts` becomes the source of truth for API shapes
- web and mobile can share request/response definitions
- route handlers are thin
- business modules contain no Next.js imports
- DB queries for major features are concentrated in `packages/database`
- future `apps/api` can be created without moving domain logic again

## Recommended First Refactor Wave

The first wave should target the highest-ROI areas from the current codebase review:

1. `dashboard`
2. `vocabulary`
3. `chat`

Why:

- they already act like backend features
- they have real business logic
- they touch auth, DB, and integrations
- they will benefit both web cleanup and future mobile support

## Open Questions

These do not block the architecture choice, but they should be answered during implementation planning:

- should the monorepo standardize on `npm workspaces` or `pnpm workspaces`?
- should contracts also generate OpenAPI for mobile client generation?
- should mobile auth reuse Better Auth directly, or should the API own bearer token issuance?
- at what traffic level should `apps/api` become a separate deployed service?

## Final Recommendation

Adopt **Option 2: Backend-core packages plus thin adapters**.

Implementation guidance:

- keep shipping inside Next.js for now
- stop treating Next route handlers as the domain layer
- make contracts, modules, repositories, and integrations explicit
- design every new feature so it can be called by both web and mobile
- postpone standalone backend extraction until scale or client needs justify it

This gives the project a clean backend architecture now, while preserving speed of execution and keeping the path to a real standalone backend open.
