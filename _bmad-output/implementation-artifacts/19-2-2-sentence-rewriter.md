# Story 19.2.2: Sentence Rewriter

Status: done

## Story

As a self-learner, I want to paste a sentence and get 3 upgraded versions at different sophistication levels (natural, formal, C1/academic) with a diff explanation — so I can grow out of A2/B1 patterns.

**Epic:** 19 — Four-Skills Enhancement
**Sprint:** R10 — Writing Core
**Story ID:** 19.2.2
**Dependencies:** —

## Acceptance Criteria

1. **AC1** — `POST /api/writing/rewrite` accepts `{ sentence, targetLevel?: "natural"|"formal"|"c1" (default all three), context?: string }` and returns `{ variants: Array<{ level, rewrite, changes: Array<{ original, replacement, reason }> }> }`.
2. **AC2** — Uses OpenAI structured output; falls back gracefully if the model returns a variant with no changes (drop it rather than show a no-op).
3. **AC3** — UI entry points: (a) standalone panel on `writing-practice` page; (b) contextual button inside score-page inline issues ("rewrite this sentence").
4. **AC4** — The UI shows each variant with an inline word-level diff (additions green, removals strikethrough red). Click to copy.
5. **AC5** — Rate-limited 20/min/user.
6. **AC6** — Sentence cap: 400 chars.

## Tasks

- [x] Task 1: Implement `/api/writing/rewrite` with the 3-variant prompt (AC1, AC2).
- [x] Task 2: Build `RewritePanel.tsx` component used in both entry points (AC3).
- [x] Task 3: Implement the word-level diff renderer using `diff` npm package (AC4).
- [x] Task 4: Rate-limit + input guards (AC5, AC6).

## Dev Notes

- Do NOT persist rewrites; they're ephemeral assistive suggestions.
- Prompt must explicitly ban meaning changes — rewrites are paraphrases, not content edits.
- If `targetLevel` is a single value, return one variant; otherwise all three.
- Reuse the same rate-limit pattern as existing endpoints.

## References

- [diff npm package](https://www.npmjs.com/package/diff)
- OpenAI client: [apps/web/lib/openai.ts](apps/web/lib/openai.ts)

## File List

- `apps/web/app/api/writing/rewrite/route.ts` — Rewrite endpoint (AC1, AC2, AC5, AC6)
- `apps/web/app/(app)/writing-practice/_components/RewritePanel.tsx` — Rewrite panel with word diff + copy (AC3, AC4)
- `apps/web/app/(app)/writing-practice/page.tsx` — Added "✨ Cải thiện câu" tab (AC3a)
- `apps/web/app/(app)/writing-practice/score/page.tsx` — Added `InlineIssueItem` + "✨ Viết lại" button (AC3b)

## Change Log

- 2026-04-20: Implemented all 4 tasks. API, RewritePanel, word-diff renderer, and both AC3 entry points complete.

## Dev Agent Record

### Completion Notes

- `diff` package installed via `pnpm add diff --filter web` (monorepo)
- AC1: endpoint supports single or all-three levels; validates `targetLevel` type; 400-char cap enforced
- AC2: variants filtered — dropped if `changes.length === 0` OR `rewrite === original`
- AC3a: writing-practice page wrapped in Tabs — "📝 Luyện viết" (existing) + "✨ Cải thiện câu" (RewritePanel)
- AC3b: `InlineIssueItem` sub-component with "✨ Viết lại" toggle button; expands compact RewritePanel pre-filled with the quoted phrase
- AC4: `diffWords()` renders additions in green/additions, removals in strikethrough red
- AC4: copy button with 2s "Copied!" feedback
- AC5: rate limit 20/min/user, same in-memory pattern as score endpoint
- No persistence (ephemeral as per dev notes)

### Review Findings

- [x] [Review][Patch] `context` field length cap added (500 chars) — **fixed**
- [x] [Review][Patch] `InlineIssueItem` `index` dead prop removed — **fixed**
- [x] [Review][Defer] Type definitions duplicated between route.ts and RewritePanel.tsx — deferred, low risk
- [x] [Review][Defer] `diffWords` may show whitespace noise for minor spacing differences — deferred, acceptable for v1
