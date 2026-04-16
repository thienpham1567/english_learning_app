# Story 18.14.1: Produce the Cutover Scorecard and Next-Wave Plan

Status: ready-for-dev

## Story

As a team lead,
I want a clear readiness scorecard and backlog for the next wave,
so that the migration stays measurable instead of open-ended.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R8 - Cutover and Governance  
**Story ID:** 18.14.1  
**Dependencies:** 18.13.1

## Acceptance Criteria

1. A production-readiness review is completed for all migrated domains.
2. A rollback and incident-response playbook exists for `apps/api`.
3. Performance and error baselines are captured for migrated flows.
4. A prioritized next-wave backlog exists for AI-heavy route groups such as `chat`, `writing-practice`, `grammar-quiz`, `reading`, `listening`, and `voice`.
5. A continue, pause, or expand decision is recorded for the next migration wave.

## Tasks / Subtasks

- [ ] Task 1: Produce the cutover scorecard for migrated domains.
- [ ] Task 2: Write the rollback and incident-response playbook.
- [ ] Task 3: Capture baseline operational metrics and error posture.
- [ ] Task 4: Prioritize the next migration wave and record a decision.

## Dev Notes

### Current Repo Reality

- By this point in the plan, Epic 18 has migrated the first wave only; AI-heavy route groups remain under `apps/web/app/api/*`.
- Operational baseline work is split across stories `18.3.3`, `18.6.2`, and `18.12.2`.
- There is no current cutover scorecard or next-wave backlog document in the repo.

### Implementation Guardrails

- The scorecard should reflect real migrated scope, not aspirational endpoints.
- The rollback plan should assume `apps/web` and `apps/api` may coexist during incidents.
- Use concrete signals from logs/tests/monitoring rather than narrative-only readiness claims.
- The next-wave backlog should rank route groups by risk, value, and migration complexity.

### File Targets

- [_bmad-output/planning-artifacts](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts)
- [docs](/Users/thienpham/Documents/english_learning_app/docs)
- [apps/web/app/api](/Users/thienpham/Documents/english_learning_app/apps/web/app/api)

### Testing Requirements

- No code tests required unless scorecard generation is automated
- Review that the backlog covers the remaining major route groups
- Evidence links for performance/error baselines and rollback playbook

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Story 18.13.1 artifact](/Users/thienpham/Documents/english_learning_app/_bmad-output/implementation-artifacts/18-13-1-enforce-backend-ownership-rules-and-inventory-remaining-route-groups.md)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- Epic 18 ends with governance and readiness work because the route inventory shows a clear second wave remains after the first migration slice.

### Completion Notes List

- The scorecard is only useful if it drives a concrete continue/pause/expand decision rather than becoming a retrospective artifact nobody uses.

### File List

- `_bmad-output/implementation-artifacts/18-14-1-produce-the-cutover-scorecard-and-next-wave-plan.md`
