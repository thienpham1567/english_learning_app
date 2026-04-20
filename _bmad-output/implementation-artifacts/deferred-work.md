# Deferred Work

## Deferred from: code review of 19-2-1-ielts-toefl-essay-scoring-by-rubric (2026-04-20)

- **`text.indexOf(quote)` finds first occurrence only** — if the same phrase appears multiple times in an essay, only the first instance is highlighted. Acceptable for v1; a smarter approach would track context around the quote.
- **TOEFL `overall` not range-validated server-side** — model could return 8.5 (IELTS-style) for a TOEFL essay; UI would show it as 28/30. Low severity since model follows prompt well.
- **No `Retry-After` header on 429** — best practice for rate-limit responses; not required by the spec.
- **Prompt injection via essay text** — a crafted essay could contain JSON-like instructions to short-circuit rubric evaluation. Low exploitation risk in a learning app context; would need server-side output validation to fully mitigate.
