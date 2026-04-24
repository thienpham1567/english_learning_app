---
inputDocuments:
  - _bmad-output/planning-artifacts/epic-21-26-adaptive-learning-upgrades-stories.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
generated: 2026-04-24
---

# Adaptive Learning Upgrades - Sprint Plan

## Planning Intent

This sprint plan sequences the adaptive learning upgrades after Epic 20. The plan prioritizes the smallest work that turns the current feature-rich app into a guided self-learning system:

1. Make Home use adaptive daily plans.
2. Give learners one review entry point.
3. Turn repeated errors into targeted remediation.
4. Personalize onboarding and starter pathways.
5. Normalize feedback and coach guidance.
6. Show progress as real English improvement.

## Sprint R17: Adaptive Home Activation

**Goal:** Make Home the primary daily learning command center and remove broken recommendation routes.

**Stories:**

- 21.1: Audit Recommendation Routes
- 21.2: Add Daily Plan Client Hook
- 21.3: Replace Manual Home Plan With Adaptive Plan
- 21.4: Add Daily Session Start CTA
- 21.5: Track Daily Plan Completion State

**Exit Criteria:**

- Home can render adaptive plan items from `/api/study-plan/daily`.
- Recommendation links are route-tested.
- Manual dashboard-based tasks remain as fallback.
- The learner can start the highest-priority task from one primary CTA.

## Sprint R18: Unified Review Foundation

**Goal:** Create one learner-facing review flow while preserving existing flashcard, review quiz, and error notebook behavior.

**Stories:**

- 22.1: Add Due Review Task API Adapter
- 22.2: Build Today's Review Hub
- 22.3: Implement Mixed Review Session Shell
- 22.4: Close Review Outcome Loop From Unified Session
- 22.5: Add Review Entry Points To Home And Sidebar

**Exit Criteria:**

- Due review tasks can be requested from a single API adapter.
- Review hub can show mixed task groups.
- Completing a task can update review scheduling and learning signals.
- Existing review pages still work.

## Sprint R19: Personal Error Remediation

**Goal:** Make repeated mistakes actionable, drillable, and measurable.

**Stories:**

- 23.1: Normalize Error Categories
- 23.2: Add Error Pattern Summary
- 23.3: Generate Targeted Error Drills
- 23.4: Show Error Improvement Trend
- 23.5: Connect Error Notebook To Daily Plan

**Exit Criteria:**

- Error Notebook shows top repeated patterns and recommended actions.
- Targeted drills can be generated from real mistakes.
- Repeated errors can influence the daily plan.
- Progress can show whether error categories are improving.

## Sprint R20: Goals, Onboarding, And Starter Pathways

**Goal:** Reduce choice overload for new learners by turning goals and diagnostic data into a first-week plan.

**Stories:**

- 24.1: Build Goal And Time Budget Onboarding
- 24.2: Connect Diagnostic To Baseline Skill State
- 24.3: Generate 7-Day Starter Pathway
- 24.4: Add Pathway View To Home
- 24.5: Replan After Goal Or Time Budget Changes

**Exit Criteria:**

- New learners can set goal, budget, weak skill, and learning style.
- Diagnostic/baseline data can seed skill state.
- The app can generate a 7-day starter pathway for core goals.
- Home can show current pathway context without hiding today's action.

## Sprint R21: Cross-Module Feedback And AI Coach

**Goal:** Make feedback from modules actionable and connect AI tutor behavior to the learner's real study context.

**Stories:**

- 25.1: Define End-Of-Lesson Summary Contract
- 25.2: Apply Summary Pattern To High-Value Modules
- 25.3: Persist Versioned AI Feedback Runs
- 25.4: Add Coach Summary To Chatbot
- 25.5: Capture Chat Corrections As Learning Signals

**Exit Criteria:**

- High-value module result screens can use a shared summary shape.
- AI feedback metadata is persisted for writing and speaking at minimum.
- Chatbot can summarize recent study context and link to next actions.
- Structured chat corrections can become learning signals safely.

## Sprint R22: Progress Insights And Outcome Motivation

**Goal:** Show learners clear evidence of English improvement and next actions beyond XP or streaks.

**Stories:**

- 26.1: Build Skill Mastery Progress Panel
- 26.2: Add Learner-Friendly Improvement Statements
- 26.3: Add Review Debt And Memory Risk Insight
- 26.4: Add Weekly Learning Retrospective
- 26.5: Rebalance Motivation Widgets Around Learning Outcomes

**Exit Criteria:**

- Progress explains strengths, weak spots, confidence, and review needs.
- Home and Progress can show review debt and memory risk.
- Weekly retrospective can be generated deterministically.
- Gamification remains visible but does not dominate the learning outcome view.

## Dependency Notes

- R17 should happen first because all later upgrades benefit from reliable daily plan routing.
- R18 should happen before R19 daily-plan integration so remediation can target the unified review flow.
- R20 can begin after R17, but the pathway view is stronger after R18 exists.
- R21 depends on stable summary contracts and should not block R17 or R18.
- R22 should happen after enough learning, review, and feedback signals exist to avoid empty insights.

## Recommended First Implementation Story

Start with **21.1: Audit Recommendation Routes**. It is small, testable, and removes a trust-breaking issue before the adaptive Home depends on recommendation links.
