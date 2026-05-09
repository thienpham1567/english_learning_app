# TOEIC Part 2 + Dictation — Design Spec (Sprint S3)

**Date:** 2026-05-09
**Status:** Approved
**Sub-projects:** Partial #1 (Part 2 only) + #5 (Dictation)
**Sprint:** S3 (~2-3 days)
**Depends on:** S1 (Backbone), S2 (Grammar + Vocab)

---

## Context

User reaches Phase 4-5 of the 16-week roadmap (Week 4-8: TOEIC LR Strategy) needing intensive listening practice 30-50 questions/day. Current DB has Part 3-7 (no Part 1, no Part 2). This sprint adds **Part 2** (audio Q-R) and a **Dictation** module that drills listening at the sentence level.

Part 1 (photo questions) is **deferred** — would require real ETS-style scene photos which we don't have. Mock test (#2) will surface a "Part 1 unavailable" notice in the meantime.

## Goals

1. Add 25 Part 2 (Question-Response) audio questions: 1 prompt audio + 3 response audios per question, generated via Gemini text + Groq TTS (3 voices rotated).
2. Add 30 sentence-level dictation exercises generated similarly, stored in existing `listeningExercise` table (mode=`dictation`).
3. Expose `/toeic/listening` (Part 1 placeholder + Part 2 entry) and `/toeic/dictation` (entry + runner).
4. Keep all events flowing through `learningEvent` so dashboard, daily-plan, mastery auto-pickup.

## Non-goals

- Part 1 photo questions (deferred — needs real images)
- Real ETS Part 2 audio (synthetic via TTS only)
- Whisper transcription of existing Part 3/4 audio (defer to later)
- TTS audio caching/CDN (use `apps/web/public/` static files for now)
- Dictation grading via Whisper STT (use simple word-level diff)

## Cross-cutting (carry-over)

- AI strategy: Groq TTS (`playai-tts`) for audio, OpenAI SDK + Gemini for text generation
- Authentic TOEIC format: Part 2 audio is the only source — text shown as A/B/C labels for navigation only
- Event pipeline: Part 2 answers go through `/api/toeic-practice/answer` (mode=`practice`); dictation completions go through new `/api/toeic-dictation/complete`

## Architecture

### Reuse vs new

| Concern | Strategy |
|---|---|
| Part 2 storage | Reuse `toeic_question` table; add `audioSegments` jsonb column for Q + 3R audio URLs |
| Part 2 quiz state | Reuse `useToeicSession` (mode=practice) |
| Part 2 runner | Extend `QuestionRunner` to play Part 2 audio segments in order |
| Dictation storage | Reuse `listeningExercise` table (already has mode=`dictation`) |
| Dictation runner | New simple runner (`/toeic/dictation/[id]`) — type and submit |
| Dictation grading | Word-level Levenshtein-style diff (no Whisper at this phase) |
| TTS | New helper `lib/toeic/tts.ts` wrapping Groq SDK |
| Audio storage | `apps/web/public/toeic/audio/part2/*.mp3` and `.../dictation/*.mp3` (git-tracked, ~3MB total) |

## Data model

### Modified: `toeic_question`

Add one optional column:

| Column | Type | Notes |
|---|---|---|
| `audioSegments` | jsonb nullable | `{ question: string, options: string[] }` — relative URLs to mp3 files. Populated for Part 2; null for other parts. |

Existing `audioUrl` is kept for Part 3/4 (where it points to the real ETS audio of the conversation/talk).

### Reused: `listeningExercise`

The existing table already supports dictation mode. Field assumptions verified at implementation time.

### Module type additions

Add to `LearningModuleType`:

- `toeic_dictation` — for dictation events

Mapping in `module-skill-mapping.ts`:

- `toeic_dictation` → `["toeic.part3.detail", "toeic.part4.detail", "toeic.part3.gist", "toeic.part4.gist"]`

Part 2 questions emit events with `moduleType: toeic_practice` (existing) — no change.

## TTS strategy

### Groq PlayAI voices (3 selected)

- `Arista-PlayAI` — female US (used for Q in Part 2, narrator in dictation)
- `Atlas-PlayAI` — male US (used for option B + dictation variety)
- `Briggs-PlayAI` — older male US (used for option A + occasional dictation)

(Rotate voices across questions for diversity. UK accent option deferred — Groq's UK voices are limited.)

### Per-question Part 2 TTS plan

For each generated Part 2 item:
1. Question prompt (e.g. "When does the meeting start?") — voice 1
2. Option A response — voice 2
3. Option B response — voice 3
4. Option C response — voice 1 (rotated)

Total: 4 calls per item × 25 items = 100 calls.

### Per-sentence dictation TTS

1 call per sentence × 30 sentences = 30 calls. Voice rotated.

**Total TTS budget: ~130 calls — well within Groq free tier rate limits (30 req/min) when paced.**

## Content generation

### Part 2 prompt to Gemini

```
Generate 25 TOEIC Part 2 (Question-Response) items.

Each item:
- "promptType": one of "wh_question", "yn_question", "statement"
- "promptText": the question or statement (under 12 words, business/office context)
- "options": array of 3 short responses (under 10 words each)
- "correctIndex": 0, 1, or 2 (most natural reply)
- "explanationVi": Vietnamese explanation of why the correct option is right and why the others are not
- "skillIds": one of ["toeic.part2.wh_question", "toeic.part2.yn_question", "toeic.part2.statement"]

Distribute: ~12 wh_question, ~7 yn_question, ~6 statement. Mix difficulty (10 beginner, 10 intermediate, 5 advanced). No duplicate prompts.

Return strict JSON: {"items": [...]}
```

### Dictation prompt to Gemini

```
Generate 30 short TOEIC-style listening sentences for dictation practice.

Each item:
- "text": natural English sentence in TOEIC business style (10-25 words; no quotation marks; standard punctuation)
- "level": "beginner" | "intermediate" | "advanced"
- "topic": "office" | "travel" | "business" | "finance" | "marketing" | "manufacturing" | "general"
- "vocabHints": array of 0-3 challenging words from the sentence with VN translations

Distribute: 10 beginner, 15 intermediate, 5 advanced. Mix topics.

Return strict JSON: {"items": [...]}
```

## Routes & UX

### `/toeic/listening`

- Header: "TOEIC Listening · Part 1-4"
- Cards:
  - **Part 1 — Photos** (badge "Sắp ra mắt", disabled)
  - **Part 2 — Q-R** (25 câu, click → `/toeic/practice` filtered to Part 2)
  - **Part 3 — Conversations** (existing 306 câu, click → `/toeic/practice?part=3`)
  - **Part 4 — Talks** (existing 235 câu, click → `/toeic/practice?part=4`)
  - **Dictation** (30 câu, click → `/toeic/dictation`)

This page is mostly a navigation hub — actual quizzing happens at `/toeic/practice`.

### `/toeic/dictation`

- Header: "TOEIC Dictation"
- Cards: 30 dictation items grouped by level (beginner/intermediate/advanced)
- Click an item → `/toeic/dictation/[id]`
- "Random" button → pick any item

### `/toeic/dictation/[id]`

- Audio player (play/pause/replay; can play multiple times)
- Textarea for user transcription
- Submit button
- After submit:
  - Word-level diff: correct in green, missing in red, extra in yellow
  - Score: % correct words
  - Show full transcript + vocab hints
  - "Tiếp" button → next item

## API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/toeic-dictation/list` | GET | List dictation items grouped by level |
| `/api/toeic-dictation/[id]` | GET | One item (audio URL + transcript HIDDEN until submit) |
| `/api/toeic-dictation/submit` | POST | Body: `{ exerciseId, userTranscript, durationMs }` → returns score + diff + true transcript; emits `learningEvent` |

For Part 2: reuse existing `/api/toeic-practice/start?part=2` and `/api/toeic-practice/answer`.

## Audio storage layout

```
apps/web/public/toeic/audio/
  part2/
    {questionId}_q.mp3   # question prompt
    {questionId}_a.mp3   # option A
    {questionId}_b.mp3   # option B
    {questionId}_c.mp3   # option C
  dictation/
    {exerciseId}.mp3     # one file per exercise
```

`toeicQuestion.audioSegments` for Part 2:
```json
{
  "question": "/toeic/audio/part2/<id>_q.mp3",
  "options": [
    "/toeic/audio/part2/<id>_a.mp3",
    "/toeic/audio/part2/<id>_b.mp3",
    "/toeic/audio/part2/<id>_c.mp3"
  ]
}
```

Dictation audio URL stored on `listeningExercise.audioUrl` (or equivalent field — verify schema during impl).

## Implementation order

| # | Task | File count |
|---|---|---|
| S3.1 | Schema: `audioSegments` column + `toeic_dictation` module type + migration | 4 |
| S3.2 | `seed-toeic-part2.ts`: generate 25 Q-R + 100 TTS calls + 4 audio files each | 1 + 100 mp3 |
| S3.3 | `seed-toeic-dictation.ts`: generate 30 sentences + 30 TTS calls + 30 audio files | 1 + 30 mp3 |
| S3.4 | Update `QuestionRunner` to detect Part 2 audio segments + sequential play | 1 |
| S3.5 | `/toeic/listening` hub page | 2 |
| S3.6 | `/toeic/dictation` hub + runner + 3 API endpoints | 6 |
| S3.7 | Update `QuickActions`: enable Part 1 & 2, Dictation; remove "coming soon" | 1 |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Groq free tier rate limit (30/min) | Throttle TTS calls in seed script (sleep 2.5s between calls) |
| Generated text quality varies | Manual review 5 random items per seed; regenerate if needed |
| Audio files in git balloon repo | ~130 mp3 × ~15KB avg = ~2MB total; acceptable |
| `listeningExercise` schema may not fit dictation needs | Read schema first; if mismatch, add `toeic_dictation` table instead |
| User might run seed twice | Idempotent: skip items already present (check by stable hash of text) |
| QuestionRunner backward-compat | Detect via `audioSegments` presence; fall back to existing `audioUrl` flow |

## Definition of done

- DB has 25 Part 2 questions with audioSegments populated; mp3s in public folder
- DB has 30 dictation items in listeningExercise; mp3s in public folder
- `/toeic/practice?part=2` works: plays Q audio, then 3 option audios in sequence, user picks A/B/C
- `/toeic/dictation` lists items; `/toeic/dictation/[id]` plays audio + accepts text + scores diff
- `/toeic` Hub QuickActions enables Listening + Dictation
- Dictation submission emits `learningEvent` (moduleType=`toeic_dictation`)
- Existing dashboard widgets reflect new module activity
