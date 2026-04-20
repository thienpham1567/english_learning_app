# Story 19.2.2: Sentence Rewriter

Status: ready-for-dev

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

- [ ] Task 1: Implement `/api/writing/rewrite` with the 3-variant prompt (AC1, AC2).
- [ ] Task 2: Build `RewritePanel.tsx` component used in both entry points (AC3).
- [ ] Task 3: Implement the word-level diff renderer (reuse `diff` npm package or hand-roll LCS — either is fine) (AC4).
- [ ] Task 4: Rate-limit + input guards (AC5, AC6).

## Dev Notes

- Do NOT persist rewrites; they're ephemeral assistive suggestions.
- Prompt must explicitly ban meaning changes — rewrites are paraphrases, not content edits.
- If `targetLevel` is a single value, return one variant; otherwise all three.
- Reuse the same rate-limit pattern as existing endpoints.

## References

- [diff npm package](https://www.npmjs.com/package/diff)
- OpenAI client: [apps/web/lib/openai.ts](apps/web/lib/openai.ts)
