# Story 19.1.3: Free-Talk Timer with AI Feedback

Status: ready-for-dev

## Story

As a self-learner, I want to be given a speaking topic and a 60–120s timer, record my response, and receive feedback on fluency, grammar, vocabulary range, and coherence — so I can practice impromptu speaking without a human partner.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R9 — Speaking Core
**Story ID:** 19.1.3
**Dependencies:** 19.1.1 (STT)

## Acceptance Criteria

1. **AC1** — New route `app/(app)/speaking-practice/page.tsx` with: topic display, CEFR-tunable difficulty (A2/B1/B2/C1), 60s/90s/120s timer, record button, live waveform, post-recording feedback panel.
2. **AC2** — `POST /api/speaking/topic` returns a fresh topic given `{ level }`. Uses OpenAI with a deterministic prompt; caches last 20 per user to prevent repeats.
3. **AC3** — `POST /api/speaking/feedback` accepts `{ audioBlob, topic, level }`, transcribes via 19.1.1, then calls OpenAI to produce:
   - `fluency: { wpm, fillerCount, pauseCount, score: 0-100 }`
   - `grammar: { errors: Array<{ quote, suggestion, explanation }>, score: 0-100 }`
   - `vocabulary: { rangeScore: 0-100, upgrades: Array<{ original, better, why }> }`
   - `coherence: { score: 0-100, note: string }`
   - `overall: 0-100`
   - `transcript: string`
4. **AC4** — Filler detection: count occurrences of `um|uh|like|you know|sort of|kind of|basically` (case-insensitive, word-bounded) in the transcript — do not rely on the LLM for this.
5. **AC5** — WPM = words / (recorded seconds / 60), shown alongside a target range for the chosen CEFR level (A2: 90–110, B1: 110–130, B2: 130–150, C1: 150+).
6. **AC6** — Results persist to `speakingAttempt` table: `{ userId, topic, level, durationMs, transcript, overall, fluencyScore, grammarScore, vocabScore, coherenceScore, createdAt }`.

## Tasks

- [ ] Task 1: Add `speakingAttempt` Drizzle schema + migration (AC6).
- [ ] Task 2: Add `/api/speaking/topic` (AC2).
- [ ] Task 3: Add `/api/speaking/feedback` with structured OpenAI call (use `response_format: { type: "json_schema" }`) (AC3, AC4, AC5).
- [ ] Task 4: Add `app/(app)/speaking-practice/page.tsx` UI (AC1).
- [ ] Task 5: Add topic-cache logic server-side (simple ring buffer in the DB or Redis-free in-memory scoped per-user-per-session is OK for self-learner app).

## Dev Notes

- Reuse `useVoiceRecorder` from 19.1.1.
- Cap audio at 150s server-side to keep the sync STT call safe; UI enforces chosen duration + 10s buffer.
- OpenAI prompt should explicitly ask for structured JSON and include the topic + transcript + target level for calibration.
- Keep the UI in the existing app-shell layout — match the pronunciation and listening page styles.

## References

- [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs)
- Existing app routes: [apps/web/app/(app)/pronunciation/page.tsx](apps/web/app/(app)/pronunciation/page.tsx)
