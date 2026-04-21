# Deferred Work

## Deferred from: code review of 19-2-1-ielts-toefl-essay-scoring-by-rubric (2026-04-20)

- **`text.indexOf(quote)` finds first occurrence only** — if the same phrase appears multiple times in an essay, only the first instance is highlighted. Acceptable for v1; a smarter approach would track context around the quote.
- **TOEFL `overall` not range-validated server-side** — model could return 8.5 (IELTS-style) for a TOEFL essay; UI would show it as 28/30. Low severity since model follows prompt well.
- **No `Retry-After` header on 429** — best practice for rate-limit responses; not required by the spec.
- **Prompt injection via essay text** — a crafted essay could contain JSON-like instructions to short-circuit rubric evaluation. Low exploitation risk in a learning app context; would need server-side output validation to fully mitigate.

## Deferred from: code review of 19-3-1-multi-speaker-dialogues (2026-04-21)

- **In-memory rate limiter never evicts stale entries** — `rateLimitMap` in `audio/[id]/route.ts` grows unbounded. Pre-existing pattern shared across all rate-limited API routes. Address when centralizing rate limiting (e.g., Redis or middleware).
- **No concurrency limit on parallel TTS calls in `buildDialogueAudio`** — `Promise.all` fires up to 10 simultaneous Groq API calls. Acceptable at current scale. Add `p-limit` or sequential fallback if Groq rate-limits are hit in production.

## Deferred from: code review of 19-3-2-ab-loop-variable-speed (2026-04-21)

- **Minor blob URL leak on unmount mid-synthesis** — `useSentenceAudio` race between abort and `createObjectURL`; newly created URL may not be revoked. Low severity; mitigate with a mounted-ref guard if memory pressure becomes an issue.
- **`eslint-disable-next-line` suppression in ShadowingMode/DictationMode** — `synthesize` is stable enough to omit from deps, but suppression is fragile. Refactor hook to return a ref-based callback if this causes future issues.
- **A-B markers persist on same-sentence retry** — AC6 clears on exercise switch; retry keeps markers. Arguably correct; revisit if user feedback indicates confusion.
- **StrictMode double-synthesis in dev** — React StrictMode double-invokes effects causing two TTS calls per sentence change; self-corrects. No prod impact.

## Deferred from: code review of 19-3-3-listen-and-summarize (2026-04-21)

- **Rate-limit map `entry.count++` mutates in-place** — Relies on object reference semantics; technically correct but non-obvious. Pre-existing pattern.
- **No auto-advance from listening → writing state** — Users click "Đã nghe xong" manually; audio completion doesn't trigger state change. Acceptable for v1.
- **`whereInSummary` in JSONB has no length cap** — AI could return long strings; low severity for a learning app.
- **Passage always returned server-side** — Reveal gate is client-only; server unconditionally exposes `exercise.passage` on every valid score call. Design simplicity trade-off.

