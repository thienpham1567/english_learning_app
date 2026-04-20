# Story 19.1.1: Harden the Existing Whisper Transcribe Endpoint

Status: done

> **Context update (2026-04-20):** Initial scope proposed a Google Cloud STT integration. Discovery confirmed the app already ships a Groq Whisper transcribe endpoint and a `useVoiceInput` MediaRecorder hook. Groq's free tier (7200 req/day, Whisper Large V3 Turbo, ~10× faster than OpenAI) is a better fit than Google STT for a self-learner. Scope is narrowed to hardening the existing stack and exposing the primitives 19.1.2 and 19.1.3 need.

## Story

As a self-learner, I want the existing `/api/voice/transcribe` endpoint and `useVoiceInput` hook to expose rate limits, size/duration guards, word-level timestamps, and raw audio blob/duration — so later stories (pronunciation scoring, free-talk feedback) can score my speech accurately and safely.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R9 — Speaking Core
**Story ID:** 19.1.1
**Dependencies:** Existing `GROQ_API_KEY` (preferred) or `OPENAI_DIRECT_API_KEY` (fallback).

## Acceptance Criteria

1. **AC1 — Rate limiting**
   - `POST /api/voice/transcribe` enforces 10 requests/min/user, reusing the in-memory `Map` pattern from `app/api/voice/synthesize/route.ts`.
   - Exceeding the limit returns `429 { error: "Rate limit exceeded. Try again later." }`.

2. **AC2 — Size and duration guards**
   - Audio blob size limit: 1 MB. Over-limit returns `413 { error: "Audio too large (max 1MB)" }`.
   - Duration is inferred server-side via the client-provided `durationMs` form field (validated as `number` and `<= 25000`). Missing/invalid → `400`.
   - Accepted MIME types: `audio/webm`, `audio/webm;codecs=opus`, `audio/mp4`, `audio/wav`. Anything else → `415`.

3. **AC3 — Word-level timestamps**
   - The endpoint requests `response_format: "verbose_json"` and `timestamp_granularities[]=word` from Groq (Whisper V3 Turbo supports this); OpenAI fallback path requests the same params.
   - Response shape: `{ text: string, durationSec: number, words: Array<{ word: string, startMs: number, endMs: number }> }`.
   - If the provider omits words (older fallback), return `words: []` rather than failing.

4. **AC4 — Hook exposes blob + duration**
   - `useVoiceInput` gains `blob: Blob | null` and `durationMs: number` outputs. `durationMs` is measured from `recorder.start()` to `recorder.stop()` using `performance.now()`.
   - New hook option `{ autoTranscribe?: boolean (default true) }`. When `false`, the hook records and surfaces the blob but does not POST to `/voice/transcribe` — this lets 19.1.2 send the blob plus a reference text to the scoring endpoint instead.
   - Existing `transcript`/`fullTranscript` outputs remain for backward compatibility with current callers.

5. **AC5 — Word-level transcript surfaced to callers**
   - New output `words: Array<{ word: string, startMs: number, endMs: number }>` on the hook (empty when `autoTranscribe: false` or provider omitted).

6. **AC6 — Documentation and secrets**
   - `.env.local.example` documents `GROQ_API_KEY` (preferred, free) and `OPENAI_DIRECT_API_KEY` (paid fallback) with a brief note on tier selection.
   - No new env vars added. No Google STT work performed.

7. **AC7 — No regressions**
   - All existing callers of `useVoiceInput` (e.g. chatbot voice input) continue to work without code changes.
   - Lint + type-check pass. Smoke-test: record a short sentence, verify transcript + word timings appear.

## Tasks

- [ ] Task 1: Add rate-limit block at the top of `/api/voice/transcribe/route.ts` (AC1).
- [ ] Task 2: Add MIME, size, and duration guards; parse `durationMs` from form data (AC2).
- [ ] Task 3: Request verbose JSON with word timestamps and reshape the response (AC3).
- [ ] Task 4: Extend `useVoiceInput` to track `performance.now()` duration, expose `blob`, `durationMs`, `words`, and honor `autoTranscribe` (AC4, AC5).
- [ ] Task 5: Update `.env.local.example` and add a short README note near the voice endpoints (AC6).
- [ ] Task 6: Smoke-verify existing voice-input surfaces still work (AC7).

## Dev Notes

### Existing implementation (audit, 2026-04-19)

- `apps/web/app/api/voice/transcribe/route.ts`
  - Auth-gated, accepts multipart `audio`.
  - Provider selection: `GROQ_API_KEY` → `OPENAI_DIRECT_API_KEY`.
  - Currently requests plain `response_format: "json"` (text only, no timings).
  - **Missing:** rate limit, size guard, duration guard, MIME allowlist, word timestamps.

- `apps/web/hooks/useVoiceInput.ts`
  - MediaRecorder wrapper with WEBM/Opus + MP4 fallback.
  - Auto-posts to `/voice/transcribe` on stop; exposes `transcript`, `fullTranscript`, `isListening`, `isTranscribing`, `isSupported`, `error`.
  - **Missing:** raw `blob`, `durationMs`, `words`, `autoTranscribe` toggle.

### Why Groq over Google Cloud STT

- Groq free tier is 7200 req/day for Whisper Large V3 Turbo, ~10× faster than OpenAI Whisper.
- Google Cloud STT would require a separate billing enablement, a second SDK surface, and a worse quality-per-dollar for our use case.
- Word-level timestamps are available on the Whisper verbose_json path, which covers 19.1.2's alignment needs.

### Why 19.1.2 needs `blob` and `durationMs` exposed

Pronunciation scoring (19.1.2) compares a recording against a reference text. It needs to:

1. Send the audio blob to a scoring endpoint together with `referenceText` and `accent` — not just the derived transcript.
2. Compute WPM-like metrics that depend on recording duration.

The scoring endpoint then internally calls transcription + aligner. Surface the blob from the hook so the page component can forward it without re-implementing MediaRecorder.

### Rate-limit pattern to reuse

From `apps/web/app/api/voice/synthesize/route.ts`:

```ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
// ...in handler, after auth:
const now = Date.now();
const entry = rateLimitMap.get(userId);
if (entry && entry.resetAt > now) {
  if (entry.count >= RATE_LIMIT_MAX) return Response.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  entry.count++;
} else {
  rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
}
```

Keep the Map local to the route file — do not introduce a shared limiter module in this story.

### MIME allowlist

```ts
const ALLOWED_AUDIO_MIME = new Set([
  "audio/webm",
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/wav",
]);
```

Normalize to the base MIME (strip params after `;`) before checking.

### Groq verbose_json parameters

```ts
whisperForm.append("response_format", "verbose_json");
whisperForm.append("timestamp_granularities[]", "word");
```

Verify the response shape matches Groq's current API docs; the OpenAI fallback uses the same field names.

### Testing Requirements

Smoke-level only:

- Record a short phrase, verify `transcript` + `words.length > 0`.
- Attempt to POST a >1MB blob → expect 413.
- Attempt >10 requests/min → expect 429 on the 11th.

Formal unit tests are out of scope; later stories (19.1.2, 19.1.3) will carry their own tests.

### Non-goals for this story

- Do not add Google Cloud STT.
- Do not add a new shared STT module (`lib/stt/...`). The route file is the integration surface.
- Do not build a demo UI — existing surfaces that consume the hook cover AC7 smoke-test.
- Do not rate-limit per-IP; per-user is sufficient.

## References

- Existing transcribe route: [apps/web/app/api/voice/transcribe/route.ts](apps/web/app/api/voice/transcribe/route.ts)
- Existing hook: [apps/web/hooks/useVoiceInput.ts](apps/web/hooks/useVoiceInput.ts)
- Rate-limit pattern: [apps/web/app/api/voice/synthesize/route.ts](apps/web/app/api/voice/synthesize/route.ts)
- [Groq Whisper API](https://console.groq.com/docs/speech-text)
- [OpenAI audio response_format: verbose_json](https://platform.openai.com/docs/api-reference/audio/createTranscription)
