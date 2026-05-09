# TOEIC Mock Test + SRS UX + Predicted Score — Design Spec (Sprint S4)

**Date:** 2026-05-09
**Status:** Approved
**Sub-projects:** #2 (Mock test) + #8 (SRS UX) + #9 (Predicted score)
**Sprint:** S4 (~half day)
**Depends on:** S1 backbone, S2 grammar+vocab, S3 listening (Part 2 audio)

---

## Context

Sprint S1 built the data + event pipeline. S2 added grammar drill + vocab. S3 added Part 2 audio + dictation infrastructure. Mock test, SRS UX, and predicted score are the natural next features that surface accumulated data:

- **Mock test (#2)** simulates a full TOEIC LR exam under timing constraints.
- **SRS UX (#8)** lets the user explicitly review due `reviewTask` rows (across error_retry + flashcard_review sources).
- **Predicted score (#9)** turns mastery into an estimated TOEIC score.

All three plug into existing tables; no new schema. The implementation is mostly UI + a couple of pure-function utilities.

## Goals

1. Mock test offers Full (194 question — Part 1 unavailable) and Mini (100 question) variants with section-strict timing (Listening 45min/22min, Reading 75min/37min).
2. Mock test result page shows scaled score 5-495 per section + total 10-990 + breakdown by Part.
3. SRS hub at `/toeic/review` shows due-task counts grouped by sourceType, click-through drill.
4. Predicted score widget on Hub: real-time prediction from `userSkillState`, plus "actual" from last completed mock test.
5. Progress page at `/toeic/progress` shows trend chart of activity over last 30 days.

## Non-goals

- Real ETS lookup table for raw→scaled (use linear approximation; calibrate later)
- Part 1 audio (defer)
- IRT-based predicted score (defer; simple mastery average is sufficient for MVP)
- Per-question time analytics (defer to later iteration)

## Cross-cutting (carry-over)

- Authentic TOEIC: timer enforced per section, audio plays once for Part 2-4, no review across sections during the exam, navigation locked to current section
- Reuse `useToeicSession` + `QuestionRunner` from S1/S3
- Event pipeline already wired — mock test answers emit `toeic_mock_test` events automatically

## Architecture

### Reuse vs new

| Concern | Strategy |
|---|---|
| Mock attempt storage | `toeicAttempt(mode=mock_test)` (already exists) |
| Mock question pool | Compose from existing `toeic_question` rows: 1 ETS exam (Part 3-7) + 25 Part 2 synthetic (Full); subset for Mini |
| Mock UI runner | New page using `useToeicSession` + `QuestionRunner` with section-locked navigation + per-section timer |
| Mock scoring | New pure function `lib/toeic/scoring.ts` (raw→scaled per section) |
| Mock result | Persist `rawListening`, `rawReading`, `scaledListening`, `scaledReading`, `totalScaled` on `toeicAttempt` (columns already exist) |
| SRS hub | `/toeic/review` queries `reviewTask` rows + offers drill links |
| Predicted score | New pure function `lib/toeic/predict.ts` from `userSkillState` |
| Progress chart | `/toeic/progress` queries `learningEvent` aggregated by day |

## Data model

No schema changes. Existing relevant fields:

- `toeicAttempt.{rawListening, rawReading, scaledListening, scaledReading, totalScaled}` — populate at mock_test completion
- `userSkillState.proficiency` — read for predicted score
- `learningEvent.{moduleType, createdAt, result}` — aggregate for trends

## Routes & UX

### `/toeic/mock-test`

Hub page:
- 2 cards: **Full Mock** (~1h54, 194 câu) | **Mini Mock** (~1h, 100 câu)
- Section "Lịch sử mock test" — list completed mock attempts with scaled scores
- "Bắt đầu" CTA → `/toeic/mock-test/runner?mode=full|mini`

### `/toeic/mock-test/runner?mode=full|mini`

- On mount: POST `/api/toeic-mock/start { mode }` → returns attemptId + question list (assembled from multiple parts in correct order)
- UI components:
  - Top bar: section name + countdown timer (red if <5 min)
  - Question runner (reuse `QuestionRunner` with `hideExplanation`, no inline reveal)
  - Section divider screen between Listening/Reading: 30-second pause + "Reading section starts now"
- Time-up per section: auto-submit current section, jump to next
- All sections done: POST `/api/toeic-mock/complete` → redirect to result page

### `/toeic/mock-test/[attemptId]/result`

- Headline: total scaled score (e.g. 720/990) + breakdown card
- Per-section: Listening 365/495, Reading 355/495
- Per-Part breakdown table: # correct / # total + accuracy %
- Top 3 weakest skills (linked to grammar drill / dictation)
- "Làm lại" / "Về Hub" buttons

### `/toeic/review`

SRS Hub:
- Big number: total due tasks
- 2 cards by source:
  - **Câu sai (error_retry)**: count of due Part 5/6 + Part 3/4/7 questions; click → existing `/toeic/grammar/drill?mode=mistake` (Part 5/6) or new `/toeic/practice?mistake=true` for any part
  - **Từ vựng (flashcard_review)**: count of due vocab; click → `/toeic/vocab/learn?mode=review`
- Recent SRS activity feed (last 10 reviews)

### `/toeic/progress`

Detailed analytics:
- Predicted Score card: Listening + Reading + Total with confidence band
- Last mock score card: actual scaled score + delta from previous
- 30-day activity chart: events per day, color-coded by moduleType
- Top 5 strongest skills + top 5 weakest skills (links to drill)

## API surface

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/toeic-mock/start` | POST | Body: `{ mode: 'full' \| 'mini', examCode? }` → assemble questions, create attempt |
| `/api/toeic-mock/complete` | POST | Body: `{ attemptId }` → compute raw + scaled scores, persist, return result |
| `/api/toeic-mock/history` | GET | List user's mock_test attempts |
| `/api/toeic-progress/trend` | GET | Daily event counts last 30 days |
| `/api/toeic-progress/snapshot` | GET | Predicted score + skill breakdown |

For SRS drill: reuse existing `/api/toeic-practice/start { drillSource: "mistake" }` (already supports error_retry).

For SRS vocab review: reuse existing `/api/toeic-vocab/due` + `/review`.

## Scoring logic

`lib/toeic/scoring.ts`:

```ts
// Approximate ETS Listening conversion (linear)
export function rawToScaledListening(rawCorrect: number, totalQuestions = 100): number {
  const ratio = rawCorrect / totalQuestions;
  return Math.max(5, Math.min(495, Math.round(5 + ratio * 490)));
}
// Same for Reading
export function rawToScaledReading(rawCorrect: number, totalQuestions = 100): number { ... }
// Mini mock: scale raw up before applying
export function adjustMiniRaw(rawCorrect: number, sectionTotal: number): number {
  return Math.round((rawCorrect / sectionTotal) * 100); // normalize to 100-question equivalent
}
```

## Predicted score logic

`lib/toeic/predict.ts`:

```ts
// Listening skills: Part 1-4 (12 subskills)
// Reading skills: Part 5-7 (12 subskills)
export function computePredictedScore(skillStates: UserSkillStateRow[]): {
  listeningScaled: number; readingScaled: number; total: number; confidence: number;
} {
  const listening = skillStates.filter(s => /^toeic\.part[1234]\./.test(s.skillId));
  const reading = skillStates.filter(s => /^toeic\.part[567]\./.test(s.skillId));
  const lAvg = listening.length ? avg(listening.map(s => s.proficiency)) : 0;
  const rAvg = reading.length ? avg(reading.map(s => s.proficiency)) : 0;
  const lConf = listening.length ? avg(listening.map(s => s.confidence)) : 0;
  const rConf = reading.length ? avg(reading.map(s => s.confidence)) : 0;
  return {
    listeningScaled: Math.round(5 + lAvg * 490),
    readingScaled: Math.round(5 + rAvg * 490),
    total: Math.round(5 + lAvg * 490 + 5 + rAvg * 490),
    confidence: (lConf + rConf) / 2,
  };
}
```

When no skill state exists → return null/skip widget.

## Mock question assembly

`/api/toeic-mock/start`:

```ts
async function assembleQuestions(mode: 'full' | 'mini'): Promise<ToeicQuestion[]> {
  const targetByPart =
    mode === 'full'
      ? { 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 } // 194 (no Part 1)
      : { 2: 13, 3: 20, 4: 15, 5: 15, 6: 8, 7: 29 };  // 100

  const result: ToeicQuestion[] = [];
  for (const [partStr, count] of Object.entries(targetByPart)) {
    const part = parseInt(partStr, 10);
    const rows = await db.select().from(toeicQuestion)
      .where(and(eq(toeicQuestion.part, part), sql`exam_id != (SELECT id FROM toeic_exam WHERE code='diagnostic_v1')`))
      .orderBy(sql`random()`)
      .limit(count);
    result.push(...rows);
  }
  return result;
}
```

Section ordering: Part 2 → 3 → 4 (Listening), then Part 5 → 6 → 7 (Reading).

## Implementation order

| # | Task |
|---|---|
| S4.1 | `lib/toeic/scoring.ts` + `lib/toeic/predict.ts` (pure functions, no I/O) |
| S4.2 | `/api/toeic-mock/start` + `/complete` + `/history` endpoints |
| S4.3 | `/toeic/mock-test` hub page |
| S4.4 | `/toeic/mock-test/runner` page with section timer |
| S4.5 | `/toeic/mock-test/[attemptId]/result` page |
| S4.6 | `/toeic/review` SRS hub |
| S4.7 | `/api/toeic-progress/{trend,snapshot}` + `/toeic/progress` page |
| S4.8 | Update Hub widget: Predicted Score real-time + QuickActions enable Mock test + Review |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Linear scaling diverges from real ETS | Acknowledge ±50 error band; recalibrate after 5+ real mock attempts using actual scores |
| Predicted score with sparse data is noisy | Show confidence indicator; suppress widget if user has <50 events |
| Section timer ticking continues across page refresh | Persist `attempt.startedAt`; on resume, recompute remaining time |
| Mini mock scaled score under-represents real ability | Note "Mini mock — kết quả chỉ tham khảo" caveat in UI |

## Definition of done

- `/toeic/mock-test` shows 2 cards + history; clicking starts a runner.
- Full mock loads 194 questions across Part 2-7; Mini loads 100; section timer enforces.
- On completion, scaled scores persist on `toeicAttempt`; result page shows breakdown.
- `/toeic/review` shows due counts for error_retry + flashcard_review; click drills the right module.
- `/toeic/progress` chart renders 30-day activity + predicted score.
- Hub widget shows predicted score (or "Cần thêm dữ liệu" if confidence too low).
- All 5 new endpoints work + existing dashboard auto-shows mock_test events.
