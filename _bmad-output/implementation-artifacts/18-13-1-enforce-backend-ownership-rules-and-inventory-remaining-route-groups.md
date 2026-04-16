# Story 18.13.1: Enforce Backend Ownership Rules and Inventory Remaining Route Groups

Status: ready-for-dev

## Story

As a team,
I want backend ownership made explicit in code and workflow,
so that the repo does not drift back into a split-backend model.

**Epic:** 18 - NestJS Backend Platform and API Migration  
**Sprint:** R8 - Cutover and Governance  
**Story ID:** 18.13.1  
**Dependencies:** 18.12.2

## Acceptance Criteria

1. Backend ownership rules are documented for the repo, including where new backend code must live.
2. Code review guidance exists for rejecting new long-term business logic in `apps/web/app/api/*`.
3. Remaining non-migrated route groups are inventoried and prioritized.
4. Temporary proxies in `apps/web` are marked with owners and target retirement dates.

## Tasks / Subtasks

- [ ] Task 1: Document backend ownership rules for the monorepo.
- [ ] Task 2: Add code-review guidance or guardrails for `apps/web/app/api/*`.
- [ ] Task 3: Inventory the remaining route groups and rank them.
- [ ] Task 4: Mark temporary proxies with owner and retirement date.

## Dev Notes

### Current Repo Reality

- The repo still has a large route surface under [apps/web/app/api](/Users/thienpham/Documents/english_learning_app/apps/web/app/api), including AI-heavy groups such as `chat`, `writing-practice`, `grammar-quiz`, `reading`, `listening`, and `voice`.
- Epic 18 only migrates the first wave; many route groups remain after the Learner Home and core-learning slices.
- There is no current repo-level ownership document or automated guardrail for where new backend logic should live.

### Implementation Guardrails

- Make the rule explicit: long-term backend logic belongs in `apps/api` and shared packages, not in new `apps/web/app/api/*` route handlers.
- Keep temporary web proxies clearly labeled rather than pretending they are permanent.
- The inventory should be concrete enough to drive the next wave, not a vague list of categories.
- Governance changes should be light enough to adopt, but specific enough to block backsliding.

### File Targets

- [apps/web/app/api](/Users/thienpham/Documents/english_learning_app/apps/web/app/api)
- [docs](/Users/thienpham/Documents/english_learning_app/docs)
- [README.md](/Users/thienpham/Documents/english_learning_app/README.md)

### Testing Requirements

- Verification that the inventory covers all remaining route groups
- Review of proxy markers/owners/dates in any surviving web route adapters
- No code tests required unless a lint or workflow guard is introduced

### References

- [Epic 18 story breakdown](/Users/thienpham/Documents/english_learning_app/_bmad-output/planning-artifacts/epic-18-nestjs-backend-migration-stories.md)
- [Route inventory root](/Users/thienpham/Documents/english_learning_app/apps/web/app/api)
- [Monorepo backend design spec](/Users/thienpham/Documents/english_learning_app/docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md)

## Dev Agent Record

### Agent Model Used

gpt-5.4

### Debug Log References

- The route inventory still includes many non-migrated groups, so a governance story is needed to stop the repo from quietly drifting back to web-owned backend logic.

### Completion Notes List

- The failure mode here is leaving backend ownership as tribal knowledge after a large migration effort.

### File List

- `_bmad-output/implementation-artifacts/18-13-1-enforce-backend-ownership-rules-and-inventory-remaining-route-groups.md`
