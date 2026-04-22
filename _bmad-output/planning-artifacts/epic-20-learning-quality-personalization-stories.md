---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - docs/superpowers/specs/2026-04-15-monorepo-ready-backend-design.md
  - Current roundtable discussion on learning quality and personalization
---

# Epic 20: Learning Quality and Personalization

## Overview

This epic turns the existing English learning app from a broad set of learning modules into a coordinated adaptive learning system. The goal is not to add more learning modes. The goal is to make the app decide what each learner should do next, explain why, capture whether it helped, and feed that evidence back into future plans.

The current app already includes dashboard, dictionary, vocabulary/SRS, flashcards, grammar, listening, speaking, pronunciation, writing, reading, mock tests, error notebook, progress, analytics, push notifications, and study planning. Epic 20 adds the missing personalization foundation that connects those modules.

## Product Principle

Each time a learner opens the app, the system should guide them to the most useful next learning action and later prove whether that action improved mastery, reduced repeated errors, or improved completion.

## Requirements Inventory

### Functional Requirements

FR20.1: The system SHALL record normalized learning events from high-value learning actions across existing modules.

FR20.2: The system SHALL define a unified skill taxonomy for vocabulary, grammar, listening, speaking, pronunciation, reading, writing, and exam strategy.

FR20.3: The system SHALL maintain per-user skill mastery state with proficiency, confidence, recency, source signal count, and review timing metadata.

FR20.4: The system SHALL update mastery using normalized attempts, score, difficulty, duration, hints, error tags, and review outcomes.

FR20.5: The system SHALL provide a next-best-action service that ranks due reviews, weak skills, goal relevance, content difficulty, and time budget.

FR20.6: The daily study plan SHALL show 1-3 recommended actions with reason text, estimated minutes, action target, and completion state.

FR20.7: The review system SHALL support a unified review task queue for vocabulary, flashcards, grammar remediation, writing fixes, pronunciation drills, listening replays, and cloze retries.

FR20.8: Existing module-specific review producers SHALL be adapted incrementally without breaking current flashcard, vocabulary, and error notebook behavior.

FR20.9: AI feedback SHALL be stored with template version, rubric version, model metadata, input snapshot, structured findings, and user action outcome.

FR20.10: AI-generated feedback SHALL include actionable next steps that can schedule review tasks or update mastery signals.

FR20.11: Onboarding and placement SHALL create baseline mastery, learner goal, preferred daily time, and confidence per skill.

FR20.12: Progress reporting SHALL explain strengths, weaknesses, repeated errors, and recommended next actions using the unified mastery state.

### Non-Functional Requirements

NFR20.1: Existing module behavior SHALL remain backward compatible during migration.

NFR20.2: API routes in `apps/web/app/api` SHOULD stay thin; new domain logic SHOULD live in `packages/modules`, `packages/contracts`, and `packages/database`.

NFR20.3: Recommendation decisions SHALL be explainable to the learner with short reason text.

NFR20.4: The initial recommendation engine SHALL use deterministic scoring rules before introducing opaque model-based ranking.

NFR20.5: Learning event writes SHOULD be non-blocking where possible and SHALL not noticeably slow critical learning flows.

NFR20.6: AI feedback output SHALL be schema-validated before persistence or downstream scheduling.

NFR20.7: All new learning and recommendation rules SHALL have unit coverage.

NFR20.8: Data model changes SHALL be additive.

### Architecture Requirements

- Use the existing modular monorepo direction: Next.js route handlers as transport adapters, domain logic in packages.
- Add learning-related contracts under `packages/contracts/src/learning`.
- Add learning, recommendation, review, and AI feedback use cases under `packages/modules/src`.
- Add database schema and query/repository support under `packages/database/src`.
- Continue using the existing `apps/web` application; do not introduce a separate service in this epic.
- Instrument existing high-value routes incrementally instead of rewriting every module at once.

### UX Requirements

UX20.1: The Home dashboard SHALL evolve into a daily learning map that answers: what to study, why this item, and how long it takes.

UX20.2: Each recommendation SHALL display a concise reason such as "Because you missed this grammar pattern twice recently."

UX20.3: Feedback moments SHALL follow three layers: result, explanation, and next action.

UX20.4: Review tasks SHALL be presented as learner needs, not as disconnected module names.

UX20.5: Progress SHALL show actionable insights such as strengths, weak spots, repeated errors, and next drills.

## Sprint Plan

### Sprint R13: Learning Signal Foundation

Goal: Create the data language for personalization without changing major UX.

Stories:
- 20.1: Define Learning Event Contract
- 20.2: Establish Unified Skill Taxonomy
- 20.3: Persist Learning Events from High-Value Flows

### Sprint R14: Mastery and Daily Decisioning

Goal: Convert events into skill mastery and next-best-action recommendations.

Stories:
- 20.4: Build User Skill Mastery State
- 20.5: Implement Next-Best-Action Scoring
- 20.6: Generate Adaptive Daily Study Plan

### Sprint R15: Unified Review Loop

Goal: Make review a shared pipeline across modules.

Stories:
- 20.7: Define Unified Review Task Model
- 20.8: Adapt Existing Producers into Review Queue
- 20.9: Close the Review Outcome Loop

### Sprint R16: Feedback Quality and Baseline Personalization

Goal: Improve AI feedback quality and initialize personalization from onboarding/placement.

Stories:
- 20.10: Version AI Feedback Templates and Rubrics
- 20.11: Add Structured Feedback Quality Gates
- 20.12: Create Placement and Onboarding Baseline

## Story Details

### Story 20.1: Define Learning Event Contract

As a product and engineering team,
I want a normalized learning event contract,
So that all modules can emit comparable signals for personalization.

**Acceptance Criteria:**

**Given** a learning action occurs in any supported module
**When** the action is converted to a learning event
**Then** the event includes user id, session id, module type, content id, skill ids, attempt id, result, score, duration, difficulty, error tags, optional AI/rubric version, and timestamp
**And** contracts exist for core event types: `exercise_submitted`, `answer_graded`, `mistake_detected`, `skill_practice_completed`, `review_completed`, `ai_feedback_generated`, `mastery_updated`
**And** invalid event payloads fail contract validation
**And** the contract can be imported by both app routes and package modules
**And** no existing module UX changes in this story

### Story 20.2: Establish Unified Skill Taxonomy

As a learner,
I want my progress to be measured by actual English skills rather than isolated modules,
So that recommendations reflect what I really need to improve.

**Acceptance Criteria:**

**Given** existing modules for vocabulary, grammar, listening, speaking, pronunciation, reading, writing, and test practice
**When** the unified taxonomy is defined
**Then** each module maps to canonical skill areas and subskills
**And** taxonomy entries include id, label, parent skill, CEFR relevance, supported modules, and version
**And** existing activity types are mapped to at least one skill
**And** unmapped future activities fail loudly in tests or validation
**And** the taxonomy can be versioned without rewriting historical events

### Story 20.3: Persist Learning Events from High-Value Flows

As a learning system,
I want high-value learner actions to emit events,
So that personalization can be based on real behavior.

**Acceptance Criteria:**

**Given** a learner completes high-value actions in existing modules
**When** the action completes successfully
**Then** learning events are persisted for vocabulary review, flashcard review, grammar quiz submit, writing score/review, listening submit/summary, pronunciation score, reading session/cloze, and mock test completion
**And** event persistence does not block the main user response when safe to defer
**And** duplicate event writes are prevented for repeated client retries
**And** failures to write telemetry are logged but do not break the learning action
**And** tests cover at least three representative producers before broad rollout

### Story 20.4: Build User Skill Mastery State

As a learner,
I want the app to understand my strengths and weaknesses over time,
So that study recommendations are based on my actual skill state.

**Acceptance Criteria:**

**Given** learning events exist for a user
**When** the mastery update engine processes those events
**Then** it creates or updates `UserSkillState` for each affected skill
**And** each state includes proficiency, confidence, last practiced time, last update time, success streak, failure streak, decay rate, recommended next review time, and source signal count
**And** correct high-difficulty low-hint attempts increase mastery more than easy or heavily hinted attempts
**And** repeated mistakes reduce confidence and increase review priority
**And** stale skills decay over time using a deterministic rule
**And** unit tests cover update, decay, confidence, and repeated-error behavior

### Story 20.5: Implement Next-Best-Action Scoring

As a learner,
I want the app to choose the most useful next task,
So that I do not have to decide between many modules.

**Acceptance Criteria:**

**Given** a learner has mastery states, due reviews, recent activity, and an optional goal
**When** recommendations are generated
**Then** the system ranks candidates using mastery gap, due urgency, skill importance, goal relevance, recency, difficulty match, estimated duration, and completion likelihood
**And** recommendations are grouped as `must_do`, `should_do`, and `could_do`
**And** each recommendation includes a concise learner-facing reason
**And** the ranking is deterministic for the same input
**And** tests cover due-review priority, weak-skill priority, time budget filtering, and goal relevance

### Story 20.6: Generate Adaptive Daily Study Plan

As a learner,
I want a daily plan with only the most important actions,
So that I can study effectively even with limited time.

**Acceptance Criteria:**

**Given** a learner opens the Home dashboard
**When** the daily plan is requested
**Then** the system returns 1-3 plan items with title, reason, estimated minutes, action URL, skill ids, priority, and completion state
**And** the plan supports 5, 10, and 20 minute variants
**And** the plan prefers due review before new study when memory risk is high
**And** the plan avoids recommending too many heavy tasks in one session
**And** the existing Home dashboard can render the new plan while preserving existing widgets

### Story 20.7: Define Unified Review Task Model

As a learner,
I want all things I need to review to appear in one coherent queue,
So that review feels purposeful instead of scattered.

**Acceptance Criteria:**

**Given** review-worthy learning signals exist
**When** a review task is created
**Then** the task stores user id, source type, source id, skill ids, priority, due time, estimated duration, review mode, status, last outcome, attempt count, next interval, and optional suppression reason
**And** source types include flashcard review, error retry, grammar remediation, writing rewrite, pronunciation drill, listening replay, and cloze retry
**And** existing vocabulary and flashcard SRS behavior can be represented by the unified model
**And** scheduling rules support success quality, urgency boost, and burnout protection
**And** unit tests cover scheduling and rescheduling rules

### Story 20.8: Adapt Existing Producers into Review Queue

As a learner,
I want mistakes from different modules to return at the right time,
So that I stop repeating the same errors.

**Acceptance Criteria:**

**Given** a learner makes a review-worthy mistake in existing modules
**When** the module completes grading or feedback
**Then** it can produce a review task without changing its main UX
**And** grammar errors, writing patterns, vocabulary misses, pronunciation issues, listening misses, and cloze misses are supported incrementally
**And** producers include skill ids and reason metadata
**And** existing flashcard, vocabulary review, and error notebook routes remain backward compatible
**And** tests cover at least vocabulary, writing error, and pronunciation task creation

### Story 20.9: Close the Review Outcome Loop

As a learning system,
I want review outcomes to update mastery and future scheduling,
So that review gets smarter over time.

**Acceptance Criteria:**

**Given** a learner completes a review task
**When** the result is submitted
**Then** the system records review outcome, updates task status, schedules the next interval, emits a learning event, and updates affected skill mastery
**And** failed review attempts return sooner than successful attempts
**And** repeated success can mark the task as stable or mastered
**And** the learner receives a short next-action message after review completion
**And** integration tests verify review completion through event, mastery, and schedule updates

### Story 20.10: Version AI Feedback Templates and Rubrics

As a product team,
I want AI feedback to be versioned,
So that feedback quality can be measured, compared, and rolled back safely.

**Acceptance Criteria:**

**Given** an AI feedback feature generates feedback
**When** the request is made
**Then** the system stores template id, template version, rubric version, model name, prompt hash, input snapshot, structured output, latency, cost estimate, and safety flags
**And** writing, speaking, listening summary, pronunciation, grammar, and reading feedback can use the shared metadata model
**And** old feedback remains comparable by version
**And** prompt/rubric changes require an explicit version bump
**And** tests cover metadata capture and version validation

### Story 20.11: Add Structured Feedback Quality Gates

As a learner,
I want AI feedback that tells me what to do next,
So that feedback directly improves my next practice session.

**Acceptance Criteria:**

**Given** an AI feedback output is returned
**When** it is parsed and validated
**Then** it must include summary, strengths, issues, priority issues, evidence spans where applicable, suggested rewrite or drill, confidence, and next action candidates
**And** malformed output is rejected or safely degraded
**And** high-priority issues can schedule review tasks
**And** accepted, ignored, edited, and retried feedback actions are tracked
**And** tests cover valid output, malformed output, and review-task scheduling from feedback

### Story 20.12: Create Placement and Onboarding Baseline

As a new learner,
I want the app to understand my goal, level, and available study time,
So that my first study plan is immediately relevant.

**Acceptance Criteria:**

**Given** a new or returning learner has no reliable mastery baseline
**When** onboarding or placement is completed
**Then** the system stores primary goal, daily time budget, self-reported weak skill, preferred learning style, baseline skill scores, and confidence per skill
**And** placement can initialize user skill mastery states
**And** the first daily plan uses placement results and goal relevance
**And** learners can skip placement and receive a conservative default plan
**And** tests cover baseline creation, skip behavior, and first-plan generation

## Dependencies and Sequencing

- Stories 20.1 and 20.2 must happen before broad event instrumentation.
- Story 20.3 should instrument only representative high-value flows first, then expand.
- Story 20.4 depends on events and taxonomy.
- Stories 20.5 and 20.6 depend on mastery state.
- Story 20.7 can begin after taxonomy but should integrate fully after mastery state exists.
- Story 20.8 depends on review task model.
- Story 20.9 depends on review producers and mastery updates.
- Story 20.10 can start in parallel with review work but should be integrated before using AI feedback to schedule tasks.
- Story 20.12 should be implemented before optimizing new-user personalization.

## Definition of Done for Epic 20

- Existing app modules continue to work.
- At least five high-value module flows emit normalized learning events.
- Each learner can have unified skill mastery state across core skill axes.
- Daily plan recommendations include reason text and estimated duration.
- Unified review queue can represent at least vocabulary, writing error, pronunciation, and grammar remediation tasks.
- AI feedback is versioned and schema-validated for at least two feedback-producing modules.
- Onboarding/placement can initialize baseline personalization.
- Tests cover contracts, ranking rules, mastery updates, review scheduling, and feedback validation.
