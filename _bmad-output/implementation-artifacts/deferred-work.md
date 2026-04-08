# Deferred Work

## Deferred from: code review of 1-1-flashcard-spaced-repetition (2026-04-08)

- **F7** — Triple-redundant `userId` filter in countdown query (`app/api/flashcards/due/route.ts:76-84`). Correct but noisy. Can simplify JOIN conditions in a future cleanup pass.
- **F8** — No retry feedback to user when `submitReview` API call fails (`hooks/useFlashcardSession.ts:71`). Card stays visible (no data lost), but user sees no error toast. Address in UX polish pass.
- **F9** — `senses` field uses JSONB `->` operator (returns object) while other fields use `->>` (returns text). The pg driver auto-parses JSONB so the string branch may never run. Harmless inconsistency; clean up when refactoring the query.

## Deferred from: code review of 1-2-grammar-quiz (2026-04-08)

- **F2** — Topic breakdown in `hooks/useGrammarQuiz.ts` assumes `answers` and `questions` arrays stay in sync. Current state logic prevents divergence, but a defensive length check would be cleaner.

## Deferred from: code review of 1-3-writing-practice (2026-04-08)

- **F3** — `BandScoreRadar.tsx` doesn't clamp scores to 0-9 range. If AI returns out-of-range scores, polygon may render off-canvas. Zod schema already validates 1-9, so risk is minimal.
