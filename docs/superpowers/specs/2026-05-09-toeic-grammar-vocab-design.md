# TOEIC Grammar Drill + Vocab Trainer — Design Spec

**Date:** 2026-05-09
**Status:** Approved
**Sub-projects:** #3 + #4 (combined into Sprint S2)
**Sprint:** S2 (~3-5 days)
**Depends on:** Sprint S1 (TOEIC Backbone) — see `2026-05-08-toeic-backbone-design.md`

---

## Context

Sprint S1 shipped the TOEIC backbone: 1313 questions in DB, skill taxonomy of 25 subskills, event pipeline writing to `learningEvent` / `userSkillState` / `reviewTask`. The user is now in Foundation phase (Week 1–3 of the 16-week roadmap), needing two modules:

- **Grammar drill** — focused practice on Part 5/6 subskills (verb_form, preposition, conjunction, vocab, pronoun, grammar, discourse)
- **Vocab trainer** — 600 TOEIC essential words organized by topic packs

Both modules plug into the existing learning engine via the backbone — no new SRS or mastery code is needed. They reuse existing engines (`useGrammarQuiz`, `flashcardProgress` SRS) with TOEIC-specific wrappers + content + UX enhancements.

## Goals

1. Drill Part 5 + Part 6 questions classified by subskill, supporting "skill-targeted", "mistake-focus", and "daily quota" modes.
2. Train 600 TOEIC essential words across ~10 topic packs (Office, Travel, Business, Finance, Marketing, Manufacturing, Health, Restaurants, Travel, Banking) using SM-2 SRS.
3. Cross-link vocabulary words to the TOEIC questions that use them.
4. Visualize per-subskill mastery progress over time.
5. Wire both modules into the existing `learningEvent` pipeline so dashboard, daily plan, and weekly retrospective automatically include this activity.

## Non-goals

- Sub-project #1 (Part 1+2 audio) — defer
- Sub-project #2 (mock test) — defer
- Sub-project #5 (dictation) — defer
- AI-generated grammar drills — out of scope; A/option-A content only (use seeded TOEIC questions + 600 word list)
- Custom SRS algorithm — reuse `flashcardProgress` SM-2

## Key principles (carry-over from S1)

- Authentic TOEIC format — drill items maintain the structure of real Part 5/6 (4 options, A-D)
- AI provider strategy — Groq (TTS for vocab audio) + OpenAI SDK with Gemini (LLM, e.g. seed AI-generated examples if needed)

## Architecture

### Reuse vs new

| Concern | Strategy |
|---|---|
| Question rendering | Reuse `QuestionRunner` from S1 |
| Grammar quiz state machine | Reuse `useGrammarQuiz` (or `useToeicSession` if simpler) |
| Vocab SRS | Reuse `flashcardProgress` table + algorithm |
| Vocab UI primitives | Reuse `flashcards/_components` |
| Mastery + event pipeline | Reuse from S1 (`emitToeicLearningEvent`) |
| Routing | Add `/toeic/grammar` + `/toeic/vocab` under existing hub |
| Sidebar | Already consolidated under single `/toeic` entry |

### New surface

- 1 new DB table (`toeic_vocab`) — 600 words with topic + IPA + audio + meaning + example
- 2 new module types in `LearningModuleType` enum (`toeic_grammar_drill`, `toeic_vocab`)
- 4 new routes:
  - `/toeic/grammar` — hub: choose mode (by-skill / mistake-focus / daily)
  - `/toeic/grammar/drill` — drill runner (query params: `skill`, `mode`, `count`)
  - `/toeic/vocab` — hub: topic packs grid + due review count
  - `/toeic/vocab/learn` — flashcard runner (query params: `pack`, `mode`)
- 3 new API endpoints under `/api/toeic-grammar/*` and `/api/toeic-vocab/*`

## Data model

### New table: `toeic_vocab`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Stable hash of `word` for idempotent reseed |
| `word` | text unique | Lowercase canonical form |
| `pos` | text | `noun` \| `verb` \| `adj` \| `adv` \| `phrase` |
| `ipa` | text nullable | Phonetic transcription |
| `meaningVi` | text | Primary Vietnamese meaning |
| `meaningEn` | text | English definition |
| `exampleEn` | text nullable | Sentence using the word |
| `exampleVi` | text nullable | Vietnamese translation |
| `topic` | text | `office` \| `travel` \| `business` \| `finance` \| `marketing` \| `manufacturing` \| `health` \| `restaurants` \| `banking` \| `general` |
| `level` | text | `beginner` \| `intermediate` \| `advanced` (default `intermediate`) |
| `audioUrl` | text nullable | TTS-generated mp3; populated lazily by Groq when first played |
| `frequency` | int | Rough usage rank (1=most common); used to order topic packs |
| `createdAt`, `updatedAt` | timestamp | |

Indexes: `(topic)`, `(level)`, unique `(word)`.

### Reused: `flashcardProgress`

The existing `flashcardProgress` table tracks per-user, per-word SRS state. We use the existing `wordId` column to point at `toeicVocab.id` (or `userVocabulary.id` if the existing flow goes through `userVocabulary` first — verify during implementation). No schema change.

### Reused: `learningEvent`, `userSkillState`, `reviewTask`

Both new modules call `emitToeicLearningEvent` (from S1) with the appropriate `moduleType`:

- Grammar drill answer → `toeic_grammar_drill`
- Vocab review outcome → `toeic_vocab`

For vocab, `skillIds` includes all `toeic.partN.vocab` subskills (Part 5 vocab, Part 7 vocab_in_context).

### Contracts changes

`packages/contracts/src/learning/learning-event.ts`:

```ts
LearningModuleType += [
  "toeic_grammar_drill",
  "toeic_vocab",
]
```

`packages/contracts/src/learning/module-skill-mapping.ts`:

```ts
{ moduleType: "toeic_grammar_drill", skillIds: [
    "toeic.part5.verb_form", "toeic.part5.preposition", "toeic.part5.conjunction",
    "toeic.part5.vocab", "toeic.part5.pronoun",
    "toeic.part6.grammar", "toeic.part6.discourse",
] },
{ moduleType: "toeic_vocab", skillIds: [
    "toeic.part5.vocab", "toeic.part7.vocab_in_context",
] },
```

## Routes & UX

### `/toeic/grammar`

Hub page showing:
- 3 quick-start cards: **By skill** (radar chart of weakest 3 subskills, click → drill that one), **Mistake focus** (count of due `reviewTask` for Part 5/6), **Daily quota** (suggested 30-câu mix from daily-plan-generator)
- Skill matrix: 7 Part 5/6 subskills with proficiency bars, click any → start drill

### `/toeic/grammar/drill?skill=toeic.part5.verb_form&mode=skill&count=20`

- Loads N questions where `toeic_question.skillIds @> [skillId]` and `part IN (5,6)`
- For `mode=mistake`, joins `reviewTask` (sourceType=`error_retry`, due) and intersects with TOEIC questions
- Reuses `QuestionRunner` from S1 (same UI as practice)
- On answer, emit event with `moduleType: toeic_grammar_drill`

### `/toeic/vocab`

Hub page showing:
- Header: "X từ thuộc lòng / Y từ đang học / Z từ cần ôn hôm nay"
- Grid of 10 topic packs with progress bars
- Search box (look up any word, see TOEIC questions using it)

### `/toeic/vocab/learn?pack=office&mode=new|review`

- `mode=new` — pulls words from pack with no `flashcardProgress` row
- `mode=review` — pulls words with `flashcardProgress.nextReviewAt <= now`
- Flashcard UI: word → flip → meaning + example + IPA + audio (Groq TTS lazy-fetched on first click)
- Outcome buttons: Again / Hard / Good / Easy → SM-2 update

### `/toeic/vocab/[wordId]`

- Word detail
- Section "Trong đề TOEIC" — shows up to 10 questions where the word appears in `questionText` or `options` (server-side ILIKE search against `toeicQuestion`)

## API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/toeic-grammar/drill/start` | POST | Body: `{ mode: 'skill'\|'mistake'\|'daily', skill?, count }` → returns attempt + question list |
| `/api/toeic-vocab/pack/[topic]` | GET | List words in pack + per-user progress |
| `/api/toeic-vocab/word/[id]` | GET | Word detail + linked TOEIC questions |
| `/api/toeic-vocab/review` | POST | Body: `{ wordId, outcome: 'again'\|'hard'\|'good'\|'easy' }` → updates `flashcardProgress` + emits event |
| `/api/toeic-vocab/tts/[id]` | GET | Lazy-fetch Groq TTS, cache `audioUrl` |

For grammar drill submission, reuse the existing `/api/toeic-practice/answer` (the `attempt.mode` field already differentiates).

## Content seed

### Grammar drill content

Already in DB. Seed-time work:
- Verify Part 5/6 subskill labels are decently distributed (audit done in S1: 169 vocab, 49 verb_form, 76 discourse, 66 grammar, etc.)
- No additional seed step

### Vocab seed: 600 TOEIC essential

Source: well-known public TOEIC 600 word list (e.g. Barron's 600 Essential Words for TOEIC, organized by 50 categories of 12 words each). Many free CSV/JSON exports exist.

`apps/web/scripts/seed-toeic-vocab.ts`:
1. Reads `apps/web/data/toeic-vocab/600-essential.json` (committed to repo).
2. Idempotent upsert into `toeic_vocab` (PK = stable UUID hash of `word`).
3. Maps Barron's 50 categories → our 10 simplified topic packs.

Source file format:
```json
{
  "topic": "office",
  "words": [
    { "word": "abandon", "pos": "verb", "ipa": "/əˈbændən/",
      "meaningVi": "từ bỏ", "meaningEn": "to give up completely",
      "exampleEn": "The project was abandoned due to budget cuts." }
  ]
}
```

If a public CSV is unavailable, the spec accommodates AI generation as a fallback: a one-time Gemini job populates fields. This decision is made at implementation time, not blocking the spec.

## "Improvements" details (the user-requested upgrades)

### 1. Skill-targeted mode

`/toeic/grammar` queries `userSkillState` for the 7 Part 5/6 subskills. Lowest 3 by `proficiency` get a "Ưu tiên" badge. Click any subskill → `/toeic/grammar/drill?skill=<id>&mode=skill&count=20`.

### 2. Mistake-focus mode

Joins `reviewTask` filtered by sourceType=`error_retry` and dueAt<=now, then INNER JOINs `toeicQuestion` on `sourceId = id`. Returns the next 20 due TOEIC questions. After completion, calls `updateReviewTaskOutcome` per question (existing function in `@repo/database`).

### 3. Daily quota

Calls existing `generateDailyPlan` with TOEIC context. The plan generator already pulls from `userSkillState` to pick weak skills. If the plan includes a `toeic_grammar_drill` action item, surface it on the hub.

### 4. Per-subskill progress

Hub shows a skill matrix with progress bar per subskill (proficiency from `userSkillState`, color-coded: red <0.3 / yellow 0.3-0.7 / green >0.7). Clickable to drill that skill.

### 5. Topic packs

10 packs × 60 words = 600 (approximate). Each pack on the vocab hub shows: progress (X/60 known), color-coded.

### 6. Cross-link word ↔ questions

Word detail page runs a server-side ILIKE search against `toeicQuestion.questionText` and `options`. Caches result via `unstable_cache` for 24h since content is immutable. Limit 10 results.

## Implementation order

| # | Task | File count |
|---|---|---|
| 1 | Extend `LearningModuleType` enum (2 values) + extend `MODULE_SKILL_MAPPING` | 2 |
| 2 | Drizzle schema: `toeic_vocab` table + migration | 2 |
| 3 | `apps/web/scripts/seed-toeic-vocab.ts` + seed data file | 2 |
| 4 | `/toeic/grammar` hub + `/toeic/grammar/drill` runner + API endpoint for start | 5 |
| 5 | `/toeic/vocab` hub + `/toeic/vocab/learn` runner + word detail page + 4 API endpoints | 8 |
| 6 | Update `/toeic` QuickActions: enable Grammar drill + Vocab links | 1 |
| 7 | Update `/toeic` HubWidgets: real "Cần ôn lại" count from `reviewTask`, real "Daily plan" from `generateDailyPlan` | 1 |

## Risks & open questions

| Risk | Mitigation |
|---|---|
| 600-word public list quality varies | Use Barron's-derived list (well-known); manual review during seed |
| Cross-link search may be slow | `unstable_cache` 24h; create GIN index on questionText if needed (separate migration) |
| Groq TTS audioUrl storage | Lazy-fetch + cache URL on `toeic_vocab.audioUrl`; fallback to browser TTS if Groq fails |
| Daily-plan-generator may not yet emit toeic_grammar_drill action types | Verify during implementation; if not, file a follow-up to extend it (small change to the generator) |
| flashcardProgress schema mismatch | Verify wordId column accepts our `toeic_vocab.id` — may need to add `sourceTable` discriminator. Decide at impl time. |

## Definition of done

- `/toeic/grammar` shows skill matrix with real proficiency from `userSkillState`; clicking a subskill starts a 20-question drill.
- `/toeic/grammar/drill?mode=mistake` pulls from due `reviewTask` and submits outcomes back.
- `/toeic/vocab` shows 10 topic packs with progress; clicking starts a flashcard session.
- Vocab review writes `flashcardProgress` and emits `learningEvent` with `moduleType: toeic_vocab`.
- Word detail page shows up to 10 TOEIC questions using the word.
- Grammar drill answer submits to existing `/api/toeic-practice/answer`; event pipeline auto-fires.
- `/toeic` hub QuickActions enables both new entry points; HubWidgets shows real review-due count.
