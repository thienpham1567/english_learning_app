# TOEIC Speaking Pronunciation Feedback — Design Spec

**Date:** 2026-05-10
**Status:** Approved
**Sub-project:** Enhancement on top of S7 (TOEIC Speaking)
**Sprint:** Single iteration (~1.5h)
**Depends on:** S7 (Speaking 11-question runner with Whisper STT + Gemini grading)

---

## Context

The current TOEIC Speaking grader transcribes user audio with Groq Whisper, then asks Gemini to score the transcript text against a rubric. This catches content + grammar issues but misses the actual pronunciation/fluency dimension that real TOEIC raters score on. For a learner targeting 800–900 (TOEIC Speaking 160+/200), pronunciation feedback is a binding gap: rubrics like "intelligibility" and "delivery" require sound-level signal, not just text.

This spec adds a deterministic pronunciation analysis layer on top of the existing pipeline using Whisper's word-level output (already free in the current Groq plan), with no new vendor or API key required.

## Goals

1. Compute fluency metrics from Whisper word-level data: pace (WPM), filler count, long pauses, average confidence, list of low-confidence words.
2. For Q1-2 (read aloud) only: forced alignment between expected text and spoken transcript → per-word accuracy plus lists of skipped/added words.
3. Feed metrics into the Gemini grading prompt so feedback can reference concrete pronunciation moments in Vietnamese.
4. Surface metrics on the result page next to the existing transcript + Vietnamese feedback so the user can see which words/spots to retrain.
5. Persist metrics in the existing `toeicSpeakingResponse.rubricScores` jsonb (no migration).

## Non-goals

- Phoneme-level pronunciation scoring (Speechace, Elsa, etc.). Approach defer-able to "Approach C" hybrid in the brainstorm; not in scope here.
- Acoustic comparison vs reference TTS audio.
- Accent classification or feedback ("you sound Vietnamese-influenced").
- Per-syllable timing analysis.
- Real-time feedback during recording.

## Architecture

### Reuse vs new

| Concern | Strategy |
|---|---|
| Audio capture | Reuse existing browser MediaRecorder + upload pipeline (S1 Phase 1B authenticated route) |
| STT | Reuse Groq Whisper, switch `response_format` from `"json"` → `"verbose_json"` |
| Grading | Reuse `gradeSpeaking` from `lib/toeic/speaking-grader.ts`; extend prompt to include new metrics |
| Storage | Reuse `toeicSpeakingResponse.rubricScores` jsonb — extend with `pronunciation` field |
| Result UI | Add a new "Phát âm" section card in `/toeic/speaking/[id]/result` |

### New unit

A single new pure-function module: `apps/web/lib/toeic/pronunciation-analysis.ts`

- One concern: convert raw Whisper word data into derived metrics. No DB calls, no I/O.
- Two exports: `computeFluency(words, durationMs)` and `computeAlignment(expectedText, spokenWords)`.
- All logic deterministic and easy to revisit later if Whisper output shape changes.

## Data shapes

### Whisper verbose_json (incoming)

```ts
type WhisperWord = {
  word: string;
  start: number;     // seconds
  end: number;       // seconds
  probability: number; // 0..1 confidence
};

type WhisperVerboseResult = {
  text: string;
  segments: Array<{ words: WhisperWord[] }>;
};
```

### `PronunciationMetrics` (output, stored in rubricScores.pronunciation)

```ts
type PronunciationMetrics = {
  // Fluency (all questions)
  wpm: number;
  fillerCount: number;
  fillerRate: number;          // per minute
  longPauseCount: number;      // pauses > 2s between words
  avgConfidence: number;       // 0..1
  lowConfidenceWords: string[]; // words with probability < 0.5

  // Alignment (Q1-2 only)
  alignment?: {
    expectedWords: number;
    spokenWords: number;
    matchedWords: number;
    missingWords: string[];
    addedWords: string[];
    accuracy: number;           // matchedWords / expectedWords
  };
};
```

## Algorithms

### Fluency metrics (`computeFluency`)

- **WPM**: `(words.length / (durationMs / 60000))` rounded.
- **Filler detection**: lowercase token in fixed set `{"uh", "um", "uhh", "umm", "hmm", "ah", "er", "like", "you know"}`. Match single-token. The two-word "you know" handled by joining adjacent tokens before set lookup.
- **Long pauses**: iterate `words[i+1].start - words[i].end`; count gaps > 2.0s.
- **Avg confidence**: arithmetic mean of `word.probability`.
- **Low-confidence words**: `word.word.toLowerCase()` for any `word.probability < 0.5`, deduplicated, max 10.

### Forced alignment (`computeAlignment`)

Used only when `prompt.type === "q1_2_read_aloud"`. Given `textToRead` and Whisper words:

1. Normalize both: lowercase, strip punctuation, split on whitespace.
2. Compute longest-common-subsequence (LCS) between expected and spoken token arrays. Returns alignment indices.
3. From LCS:
   - `matchedWords` = LCS length
   - `missingWords` = expected tokens not in LCS path
   - `addedWords` = spoken tokens not in LCS path (these are typically fillers, repeats, or substitutions)
4. `accuracy = matchedWords / expectedTokens.length`

For sentences of 30–80 tokens (typical Q1-2 length), LCS DP is O(n²) but trivially fast. No need for HTK/Kaldi-grade forced alignment.

## Gemini prompt extension

In `buildPrompt` for each question type, append a "Pronunciation metrics" block before the rubric. Example for Q1-2:

```
Pronunciation metrics (computed from Whisper word timing):
- Pace: 145 WPM (target for native-like fluency: 130–160)
- Filler words: 4 ("um" x2, "uh" x2)
- Long pauses: 2 (gaps over 2 seconds between words)
- Avg confidence: 0.82
- Unclear words (low Whisper confidence): "schedule", "environment"

Read accuracy: 18/20 words matched.
Words skipped (not spoken): "the", "to"
Words added (likely fillers/substitutions): "um", "uh"
```

The rubric instructs Gemini to weight intelligibility and delivery using these metrics, and produce 2–3 sentence Vietnamese feedback that references concrete numbers (e.g. "Tốc độ 145 WPM ổn nhưng có 4 filler — luyện ngắt câu rõ thay vì 'um'").

## Storage

No schema migration. Store as:

```ts
toeicSpeakingResponse.rubricScores = {
  // existing fields unchanged
  ...rubricScores,
  pronunciation: PronunciationMetrics, // new field
}
```

Backward compatible: existing rows without `pronunciation` simply don't render the new UI section.

## UI changes

`apps/web/app/(app)/toeic/speaking/[id]/result/page.tsx`:

For each response card, after the existing transcript + AI feedback blocks, render a new section:

```
┌─ 📊 Phát âm ─────────────────────────────────┐
│ Pace: 145 WPM ✓                              │
│ Filler: 4 lần (um, uh, ...)                  │
│ Pause dài: 2 (>2s)                           │
│ Từ không rõ: schedule · environment           │
│                                              │
│ [Q1-2 only:]                                 │
│ Accuracy: 90% (18/20 từ)                     │
│ Bỏ qua: "the", "to"                          │
│ Thêm: "um", "uh"                             │
└──────────────────────────────────────────────┘
```

Conditional render: only show the section if `r.rubricScores?.pronunciation` exists. WPM target gets a check/warning icon based on band (target 130–160).

## Pipeline change (submit-response route)

Inside `apps/web/app/api/toeic-speaking/submit-response/route.ts`:

1. `transcribeAudio` returns `{ text, words[] }` instead of just `text`.
2. Compute `metrics = computeFluency(words, durationMs)` always.
3. If `prompt.type === "q1_2_read_aloud"`, additionally compute `metrics.alignment = computeAlignment(prompt.textToRead, words)`.
4. Pass `metrics` to `gradeSpeaking` (new param), which formats the metrics block into the LLM prompt.
5. Store `rubricScores: { ...grade.rubricScores, pronunciation: metrics }`.

`recordLearningEvent` call unchanged — pronunciation metrics are response-level, not event-level.

## Implementation order (~1.5h)

| # | Task | Files | Notes |
|---|---|---|---|
| 1 | Write `lib/toeic/pronunciation-analysis.ts` with `computeFluency` + `computeAlignment` (pure functions, no I/O) | new file | TDD-friendly but tests skipped per project convention |
| 2 | Switch `transcribeAudio` to `verbose_json`; return `{ text, words[] }` | `lib/toeic/speaking-grader.ts` | Backward incompatible signature — fix all callers |
| 3 | Extend `gradeSpeaking` to accept optional `metrics` param; append metrics block to prompt | `lib/toeic/speaking-grader.ts` | |
| 4 | Update submit-response route to compute metrics + pass to grader + persist in `rubricScores.pronunciation` | `app/api/toeic-speaking/submit-response/route.ts` | |
| 5 | Add "Phát âm" section to result page (conditional on `rubricScores.pronunciation`) | `app/(app)/toeic/speaking/[id]/result/page.tsx` | |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Whisper word-level confidence is unreliable for VN-accented English | Treat as proxy only; document the limitation; allow upgrade to Speechace later (Approach C) |
| Filler detection has false positives ("like" in "like X better") | Set threshold: only count as filler if word is followed by long pause OR is a single-word utterance segment. Acceptable noise for v1. |
| LCS alignment fails when user pronounces words very differently than spelled | Acceptable edge case — Q1-2 reads visible text, so substantial deviation is rare. Returns low accuracy which still surfaces useful "you pronounced this differently" signal. |
| `verbose_json` response is much larger | Negligible for 30-60s clips (~10KB). |
| Existing `transcribeAudio` callers (only `/api/toeic-speaking/submit-response/route.ts` currently) need shape update | One-call refactor; trivial. |

## Definition of done

- A 30-second user recording produces correct WPM, filler count, long-pause count, and at least one `lowConfidenceWords` entry when the user mumbles.
- Q1-2 alignment computes accuracy = 1.0 when transcript matches expected text exactly, and < 1.0 with `missingWords` populated when user skips a word.
- `rubricScores.pronunciation` is persisted in DB after a Speaking session completes.
- Result page renders the "Phát âm" section under each response card with all metrics, and shows alignment block only for Q1-2.
- Gemini Vietnamese feedback in `feedbackVi` references at least one concrete metric value (e.g. WPM, filler word example) in spot-check of 5 sample responses.
