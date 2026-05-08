# TOEIC Backbone — Design Spec

**Date:** 2026-05-08
**Status:** Draft for review
**Sub-project:** #0 of 10 (TOEIC roadmap)
**Sprint:** S1 (~1 week)

---

## Context

User is preparing for the full TOEIC 4-skill exam with a 16-week timeline and a target score of 800–900. The web app already has a sophisticated learning engine (mastery, SM-2 SRS, daily plan generator, error analysis, AI feedback, recommendation scoring) used by other modules, but TOEIC features are currently disconnected from it: the existing `/toeic-practice` page stores history in `localStorage`, questions live in static JSON files, and `LearningModuleType` enum has no TOEIC values.

This sub-project (#0) builds the **backbone** — the data model, contracts, event pipeline, and hub UI shell — that all subsequent TOEIC sub-projects (#1–#9) plug into. Without it, each future feature would invent its own schema and stay outside the learning engine, repeating today's problem.

## Goals

1. Make TOEIC a first-class citizen of the learning engine: every TOEIC answer flows through `learningEvent`, updates `userSkillState`, and enqueues `reviewTask` automatically.
2. Move TOEIC question content from static JSON to a queryable DB so SRS, drill, and recommendation can join against it.
3. Define a TOEIC skill taxonomy at "medium depth" (~25 subskill nodes) sufficient for accurate drill targeting without overfitting.
4. Establish a unified hub at `/toeic` that consolidates today's `/toeic-practice` and `/toeic-skills`, with sub-routes ready for future features.
5. Gate first-time access with a 30-question diagnostic that produces an `onboardingBaseline` for TOEIC, so day-1 recommendations are meaningful.
6. Prove the pipeline end-to-end with at least one mode (practice + diagnostic) live; defer mock test, Part 1/2, Speaking, Writing, etc., to later sub-projects.

## Non-goals (explicit defer to later sub-projects)

- Part 1 and Part 2 question content + audio → #1
- Full mock test mode with scaled scoring (5–495 per section) → #2
- Grammar drills classified by Part 5/6 question type → #3
- TOEIC vocabulary trainer (600 essential + topic packs) → #4
- Listening dictation mode → #5
- TOEIC Speaking 11-question test with AI grading → #6
- TOEIC Writing 8-question test with AI grading → #7
- Wrong-answer SRS UX surface (`/toeic/review`) → #8 (the *infrastructure* lands in #0; the dedicated page is #8)
- Predicted score formula and trend dashboard → #9

## Cross-cutting principles

### Authentic TOEIC format (binding for all sub-projects)

Every test surface MUST mirror the real exam:

| Section | Count | Notes |
|---|---|---|
| Listening Part 1 | 6 | Photo + 4 options, audio plays once |
| Listening Part 2 | 25 | Q-R, 3 options, audio plays once |
| Listening Part 3 | 39 | 13 conversations × 3 questions |
| Listening Part 4 | 30 | 10 talks × 3 questions |
| Reading Part 5 | 30 | Incomplete sentences |
| Reading Part 6 | 16 | 4 passages × 4 questions |
| Reading Part 7 | 54 | 29 single-passage + 25 multi-passage |
| **LR total** | **200** | **120 minutes, no break** |
| Speaking | 11 | ~20 min, per-question prep+speak timing |
| Writing | 8 | 60 min total |

UX rules: audio plays once and cannot scrub; per-section timer enforced; navigation locked within current section; scoring reported on the 5–495 scale per section. The mock test (#2) enforces these strictly; practice mode relaxes them but uses the same component primitives.

### AI provider strategy

- **Groq** for speech (STT `whisper-large-v3-turbo`, TTS `playai-tts`) — strongest at low-latency speech inference.
- **OpenAI SDK pointed at Gemini** (`gemini-2.5-flash` for fast/cheap, `gemini-2.5-pro` for complex reasoning) — strongest at reasoning, multimodal, long context, cost.

In #0 specifically, only Gemini is used (one-time auto-label of question subskills). Groq integration lands in #6.

## Roadmap context

This sub-project is sprint S1 of a 16-week TOEIC build, designed to stay 1 week ahead of the user's study phase:

| Sprint | Build | Done by week |
|---|---|---|
| **S1** | **#0 Backbone (this spec)** | **Week 0** |
| S2 | #3 Grammar drill + #4 Vocab trainer | Week 1 |
| S3 | #1 Part 1+2 + #5 Dictation | Week 4 |
| S4 | #2 Mock test + #8 SRS UX + #9 Predicted score | Week 9 |
| S5 | #6 Speaking | Week 12 |
| S6 | #7 Writing | Week 14 |

## Data model

### New DB tables (Drizzle, Postgres)

#### `toeic_exam`

Exam set metadata. Includes the synthetic `diagnostic_v1` exam.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `code` | text unique | e.g. `ets_2021_test_1`, `diagnostic_v1` |
| `title` | text | Human-readable |
| `source` | text | `ETS`, `synthetic`, etc. |
| `year` | int nullable | |
| `totalQuestions` | int | |
| `hasListening` | boolean | |
| `hasReading` | boolean | |
| `partCounts` | jsonb | `{ "1": 6, "2": 25, ... }` — flexible because partial exams exist |
| `createdAt`, `updatedAt` | timestamp | |

#### `toeic_question`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Stable: hash of `(examCode, number)` for idempotent reseed |
| `examId` | uuid FK → `toeic_exam` | |
| `number` | int | 1–200 within exam |
| `part` | int | 1–7 |
| `parentId` | uuid nullable | Group ID for Part 3/4/6/7 (siblings share audio/passage) |
| `groupOrder` | int nullable | Position within group |
| `questionText` | text nullable | Null for Part 1 (image-only stem) |
| `passageText` | text nullable | Reading passage; only on parent row for Part 6/7 |
| `options` | jsonb | `["A...", "B...", "C...", "D..."]` (Part 2 has 3) |
| `correctIndex` | int | 0–3 |
| `audioUrl` | text nullable | Path or full URL; populated in #1 for Parts 1–4 |
| `imageUrls` | jsonb nullable | `["..."]`; Part 1 + occasional Part 7 |
| `topic` | text nullable | `office`, `travel`, etc. |
| `skillIds` | jsonb | `["toeic.part5.verb_form", ...]` — auto-labeled by Gemini |
| `difficulty` | enum | Reuses `LearningDifficulty` |
| `explanationEn` | text nullable | |
| `explanationVi` | text nullable | |
| `createdAt`, `updatedAt` | timestamp | |

Indexes: `(examId, number)`, GIN on `skillIds`, `(part)`.

#### `toeic_attempt`

Single session of work — practice, mock test, diagnostic, or drill.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid FK | |
| `mode` | enum | `practice` \| `mock_test` \| `diagnostic` \| `drill` |
| `examId` | uuid nullable | Null for random/drill |
| `partFilter` | int nullable | Null for mock_test |
| `questionCount` | int | |
| `startedAt`, `completedAt` | timestamp / nullable | `completedAt` null means in-progress (resumable) |
| `durationMs` | int nullable | |
| `rawListening`, `rawReading` | int nullable | Raw correct counts (mock_test only) |
| `scaledListening`, `scaledReading`, `totalScaled` | int nullable | 5–495 / 10–990 (mock_test only, formula in #9) |
| `baselineSnapshot` | jsonb nullable | `{ skillId: estimatedMastery }` (diagnostic only) |

Index: `(userId, mode, completedAt DESC)`.

#### `toeic_answer`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `attemptId` | uuid FK → `toeic_attempt` | |
| `questionId` | uuid FK → `toeic_question` | |
| `selectedIndex` | int nullable | Null = skipped |
| `isCorrect` | boolean nullable | Null = skipped |
| `durationMs` | int | |
| `flagged` | boolean | Mock-test "review later" mark |
| `changedCount` | int | Times user switched answer |
| `createdAt` | timestamp | |

Constraints: unique `(attemptId, questionId)` (idempotent re-submit). Index `(attemptId)`.

### Contract changes (`packages/contracts/src/learning/`)

- **`learning-event.ts`** — extend `LearningModuleType` enum with: `toeic_practice`, `toeic_mock_test`, `toeic_diagnostic`, `toeic_speaking`, `toeic_writing`. (Speaking/Writing values reserved for #6, #7 but added now to keep migration count down.)
- **New file `toeic-skill-taxonomy.ts`** — define the 25-node taxonomy:

```
Part 1 (3): people_action, object_state, scene
Part 2 (3): wh_question, yn_question, statement
Part 3 (3): gist, detail, inference
Part 4 (3): gist, detail, inference
Part 5 (5): verb_form, preposition, conjunction, vocab, pronoun
Part 6 (2): grammar, discourse
Part 7 (5): detail, inference, vocab_in_context, main_idea, not_question
```

Plus helpers: `getSkillLabel(id)`, `getSkillsByPart(part)`, `TOEIC_SKILLS` const array.

- **New file `toeic-attempt.ts`** — Zod DTOs for attempt + answer, used by API routes.
- **`module-skill-mapping`** — register `toeic_practice`, `toeic_diagnostic`, `toeic_mock_test` → all 25 skills.

### Migration

`pnpm db:generate` produces SQL. Postgres enum extension for `LearningModuleType` requires `ALTER TYPE ADD VALUE` per new value (verify Drizzle generator emits this; if not, hand-edit migration).

## Hub architecture

### Routes

```
/toeic                           Hub homepage (dashboard)
/toeic/diagnostic                First-visit gate (30Q, 20min)
/toeic/practice                  Part 3–7 practice (refactored from /toeic-practice)
/toeic/practice/[attemptId]      Resume / review
/toeic/skills                    4-skill overview (refactored from /toeic-skills)

# Reserved for future sub-projects (route stubs not built in #0)
/toeic/mock-test                 #2
/toeic/listening                 #1
/toeic/dictation                 #5
/toeic/grammar                   #3
/toeic/vocab                     #4
/toeic/speaking                  #6
/toeic/writing                   #7
/toeic/review                    #8
/toeic/progress                  #9

# Backward compat
/toeic-practice → /toeic/practice (308 redirect)
/toeic-skills   → /toeic/skills (308)
```

### Layout shell `app/(app)/toeic/layout.tsx`

Server component responsibilities:
1. **First-visit gate**: query `onboardingBaseline` where `userId = current AND examMode = 'toeic'`. If missing and pathname is not `/toeic/diagnostic`, redirect to `/toeic/diagnostic`.
2. Render shared sub-navigation tabs: Tổng quan · Luyện đề · Mock test · Skills · Tiến độ.
3. Reuse the existing `ModuleHeader` component with TOEIC gradient.

### Hub homepage widgets

Skeleton with placeholders in #0; data wiring filled in by later sub-projects:

- **Predicted Score** (placeholder until #9): "Hoàn thành mock test đầu tiên để xem điểm dự đoán."
- **Daily Plan** (placeholder until enough events): generated by existing `daily-plan-generator` once user has data.
- **Streak / XP**: reuses existing `useDashboard` hook.
- **Review due** (placeholder until #8): count of due `reviewTask` rows.
- **Quick actions grid**: links to all sub-routes; greyed out for routes not yet built.

### Component refactor

The current 576-line `toeic-practice/page.tsx` splits into:
- `app/(app)/toeic/practice/page.tsx` (~50 lines, page wrapper)
- `_components/PracticeSetup.tsx` (exam/part/count picker)
- `_components/QuestionRunner.tsx` (UI for answering + reveal)
- `_components/ResultSummary.tsx` (score + retry-wrong)

The current `useToeicPractice` hook splits into:
- `useToeicSession` — generic session driver, used by practice + diagnostic + mock test + drill
- `useToeicPractice` — thin config wrapper for practice mode

### Sidebar update

Sidebar in `app/(app)/layout.tsx`: collapse `toeic-practice` and `toeic-skills` into a single TOEIC entry pointing to `/toeic`. Badge slot reserved for review-due count (zero in #0).

## Diagnostic flow

### Content

30 questions, 20 minutes, drawn from existing question pool (Parts 3–7 only; Parts 1–2 deferred to diagnostic_v2 once #1 lands):

- Part 3: 3 questions (1 conversation)
- Part 4: 3 questions (1 talk)
- Part 5: 8 questions (1–2 per grammar subskill)
- Part 6: 4 questions (1 passage)
- Part 7: 12 questions (2 single-passage + 1 multi-passage set)

Selection logic in `apps/web/scripts/build-diagnostic-set.ts` — runs once during seed, picks medium-difficulty questions to maximize discrimination, persists as the `diagnostic_v1` exam.

### Runtime flow

1. User hits `/toeic` for the first time → layout detects no baseline → redirect `/toeic/diagnostic`.
2. User starts → `POST /api/toeic-practice/start { mode: "diagnostic" }` creates the attempt.
3. User answers questions in `QuestionRunner` with a 20-minute timer → each answer hits `POST /api/toeic-practice/answer`.
4. On submit or timeout → `POST /api/toeic-practice/complete` computes per-skill % correct, writes `onboardingBaseline` (with `examMode = 'toeic'`), seeds `userSkillState` for the 25 subskills, returns a breakdown.
5. Result page shows skill breakdown, suggested target band, top-3 weakest subskills → "Bắt đầu lộ trình" → redirect `/toeic`.

## Event pipeline

### `POST /api/toeic-practice/answer` flow

```
INSERT toeic_answer (raw record)
    ↓
emit LearningEvent {
  moduleType: "toeic_practice" | "toeic_diagnostic" | "toeic_mock_test"
  contentId: questionId
  skillIds: question.skillIds        ← from auto-label seed
  attemptId
  eventType: "answer_graded"
  result: isCorrect ? "correct" : "incorrect"
  score: isCorrect ? 1 : 0
  durationMs
  difficulty: question.difficulty
  errorTags: []                      ← extended in #8
}
    ↓ (writes through learning-event-query-service)
learning_event table
    ↓
[fan-out, async, fire-and-forget]
├─ if !isCorrect → enqueue reviewTask {
│    sourceType: "error_retry", sourceId: questionId,
│    skillIds, priority (from current mastery), dueAt: now + 24h,
│    reviewMode: "recognition", easeFactor: 2.5
│  } via existing review-scheduler
└─ trigger mastery-engine update for skillIds
```

### Why this matters

Once events flow through `learningEvent`, the existing learning-engine modules pick them up automatically without any new code:

- `dashboard-query-service` reads `learningEvent` → dashboard widgets show TOEIC activity.
- `daily-plan-generator` reads `userSkillState` → daily plan recommends TOEIC tasks proportional to weakness.
- `error-pattern-summary` + `error-drill-generator` → automatic drill suggestions for weakest subskills.
- `weekly-retrospective` → TOEIC progress in weekly report.
- `recommendation-scorer` (via `module-skill-mapping`) → recommends correct TOEIC sub-route per skill gap.

The future predicted-score sub-project (#9) extends this with a TOEIC-specific scaled-score formula but does not change the event shape.

## API surface (#0)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/toeic-practice/start` | POST | Create new `toeic_attempt` (`mode: practice \| mock_test \| diagnostic \| drill`); returns attemptId + first batch of questions |
| `/api/toeic-practice/answer` | POST | Submit one answer; runs the event pipeline above |
| `/api/toeic-practice/complete` | POST | Close attempt, compute score, write baseline if diagnostic |
| `/api/toeic-practice/attempt/[id]` | GET | Resume or review |
| `/api/toeic-practice/questions` | GET | Filter `?part=&exam=&count=&shuffle=` |
| `/api/toeic-practice/exams` | GET | List `toeic_exam` rows |
| `/api/toeic-practice/import-history` | POST | Best-effort migrate `localStorage` history (optional) |

The current `/api/toeic-practice/route.ts` is deprecated but kept running through the next phase for backward compatibility.

## Migration & seed pipeline

1. **Drizzle migration** (`pnpm db:generate && pnpm db:migrate`) creates the four new tables and the enum extension.
2. **`apps/web/scripts/seed-toeic.ts`** reads the eight existing JSON files in `apps/web/data/toeic-exams/`, inserts `toeic_exam` and `toeic_question` rows. IDs are stable hashes of `(examCode, number)` so re-runs are idempotent.
3. **`apps/web/scripts/label-toeic-skills.ts`** (one-time, can run async) sends each question (text + options + correct option + Vietnamese explanation + part) to Gemini in batches of 50 with a prompt that asks for 1–2 skill IDs from a fixed list. Stores result in `skillIds`. Skips questions that already have labels. Uses `gemini-2.5-flash` (~$1–2 total for the existing 1320 questions).
4. **`apps/web/scripts/build-diagnostic-set.ts`** picks 30 medium-difficulty questions covering all subskills, persists `diagnostic_v1` exam.
5. **localStorage history migration** is best-effort: a one-shot client-side script in `useToeicPractice` reads old keys, posts to `/api/toeic-practice/import-history`, which materialises retroactive `toeic_attempt` rows (no events emitted to avoid skewing baseline).

## Implementation order (sprint S1, ~1 week)

Each step lands as an independent commit:

1. Extend `LearningModuleType` enum, add `toeic-skill-taxonomy.ts`, register module-skill mapping.
2. Add four Drizzle tables; generate + apply migration.
3. Write and run `seed-toeic.ts`; verify 8 exams + 1320 questions in DB.
4. Run `label-toeic-skills.ts` against Gemini; spot-check 50 samples for label quality.
5. Refactor `useToeicPractice` into `useToeicSession` + thin wrapper; behavior unchanged.
6. Implement the seven `/api/toeic-practice/*` endpoints.
7. Wire the event pipeline inside `/answer`: emit `LearningEvent`, enqueue `reviewTask`.
8. Run `build-diagnostic-set.ts`; verify `diagnostic_v1` exam exists.
9. Create routes `/toeic`, `/toeic/diagnostic`, `/toeic/practice`, `/toeic/skills` and the layout with first-visit gate.
10. Build hub homepage widget skeleton with placeholders.
11. Wire diagnostic completion → write `onboardingBaseline` + seed `userSkillState`.
12. Add 308 redirects from `/toeic-practice` and `/toeic-skills`.
13. Update sidebar to a single TOEIC entry.

**Critical path:** 1 → 2 → 3 → 5 → 6 → 7 → 8 → 9 → 11. Step 4 (Gemini labels) can run in parallel; if delayed, the system still works with empty `skillIds` (mastery just stays neutral until labels arrive).

## Risks & open questions

| Risk / question | Impact | Mitigation |
|---|---|---|
| Gemini auto-label quality | High (wrong labels skew mastery) | Manual-review 50 samples before full run; prompt version stored; `skillIds` is updatable. |
| Gemini cost | Low (~$1–2) | `gemini-2.5-flash`, batches of 50. |
| `onboardingBaseline` schema may not fit TOEIC shape | Medium | Read `onboarding-baseline.ts` at step 1; extend it if compatible, otherwise add a sibling `toeic_baseline` table. |
| Postgres enum extension migration friction | Medium | Verify Drizzle emits `ALTER TYPE ADD VALUE`; hand-edit if not. Test on empty DB first. |
| localStorage migration complexity | Low | Best-effort; defer or drop. |
| Audio for Parts 1–2 not yet sourced | High for #1, **not blocking #0** | Schema reserves `audioUrl` nullable. Diagnostic v1 skips Parts 1–2. |
| Diagnostic v1 missing Parts 1–2 | Medium | Accepted: those subskills start at neutral mastery. Regenerate `diagnostic_v2` once #1 ships. |
| Mastery formula calibration for TOEIC | Medium | Use existing `mastery-engine` defaults; review after first 100 attempts; tuning belongs to #9. |

### Open questions to resolve during implementation (do not block design)

1. Whether to include Part 1/2 placeholder questions in diagnostic v1 → recommended **no**; wait for #1.
2. Whether `partCounts` should be jsonb or seven int columns → recommended **jsonb** for flexibility.
3. Whether mock test (#2) writes per-answer rows or only a final snapshot → defer to #2 spec; current schema supports both.
4. Whether to feature-flag the `/toeic` rollout → not needed for a single-user app.

## Definition of done

- Visiting `/toeic` for the first time forces the diagnostic; completing it writes a baseline and seeds `userSkillState` for all 25 subskills.
- Visiting `/toeic/practice` and answering a question loads the question from DB, writes `toeic_answer`, emits `learningEvent`, and enqueues `reviewTask` on incorrect answers.
- The existing `/dashboard` page reflects TOEIC activity automatically (without TOEIC-specific code in the dashboard).
- Old routes `/toeic-practice` and `/toeic-skills` 308-redirect to the new ones.
- Sidebar shows a single TOEIC entry.
- Spot-check of 50 auto-labeled questions shows ≥80% acceptable labels (manual review during step 4).
