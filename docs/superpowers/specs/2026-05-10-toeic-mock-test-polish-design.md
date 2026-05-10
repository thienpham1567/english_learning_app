# TOEIC Mock Test Polish — Design Spec (Sprint α)

**Date:** 2026-05-10
**Status:** Approved
**Sub-project:** Sprint α of "TOEIC enhancement" plan (D — pick highest ROI)
**Sprint:** Single iteration (~2h)
**Depends on:** S1 (toeicAttempt + toeicAnswer schema), S4 (mock test runner + result), S7 pronunciation feedback

---

## Context

After 7 build sprints + 4 polish phases, the TOEIC Mock Test runner works but feels rougher than a real exam:

- The result page shows scaled scores and per-Part %, but **no per-question review** — users can't see which questions they got wrong, what they answered, or why the right answer is right.
- Answering 200 questions with the mouse over 2 hours is fatiguing; **no keyboard shortcuts** for A/B/C/D selection or audio control.
- Real TOEIC lets you flag questions to revisit before submitting; **no flag/bookmark UI** in our runner.
- Mock score quality depends on the user not consulting external resources mid-test, but we **don't track tab-switches or paste attempts** — predicted score is calibrated against potentially polluted mock scores.

This spec bundles the highest-ROI fixes for these four gaps into a single ~2h sprint without changing the mock test core flow.

## Goals

1. After mock submit, surface a per-question review with three tabs: **Sai / Tất cả / Bookmarked**.
2. Add keyboard shortcuts to QuestionRunner: 1-4 / A-D pick option, space toggles audio, F toggles flag.
3. Add a flag/bookmark button in QuestionRunner; flagged-and-wrong questions enqueue a `reviewTask` (sourceType = `error_retry`) automatically; flagged-and-correct questions enqueue with sourceType = `bookmark_review` so they show up separately in the SRS hub.
4. Track tab-switches + paste attempts during mock; persist in `toeicAttempt.cheatViolations`. Surface a "score may be inflated" banner on the result page if violations > 0. No hard enforcement — soft self-honesty.
5. Block paste into Writing textareas (Q6-7 email + Q8 essay).

## Non-goals

- Hard enforcement (auto-submit on cheat) — explicitly chosen "soft track" path during brainstorm.
- Mock test resume rework — already shipped in Phase 1.
- Audio prompts for Speaking Q5-10 — separate Sprint β.
- Adaptive difficulty — separate Sprint β.

## Architecture

### Reuse vs new

| Concern | Strategy |
|---|---|
| Storing flagged state | Reuse existing `toeicAnswer.flagged` (already in schema since S1; never wired to UI) |
| Storing cheat counters | New `toeicAttempt.cheatViolations` jsonb (one small migration) |
| Review view fetch | New `/api/toeic-practice/attempt/[id]/full-review` returning answers + questions |
| Keyboard handling | Inline handler inside `QuestionRunner.tsx`; no new hook (only one consumer) |
| Visibility tracker | Inline in mock-test runner page; debounced 500ms |
| Paste blocker | Inline `onPaste` handlers in writing runner textareas |
| ReviewTask producer for bookmark | Reuse `produceReviewTask` from `@repo/modules`; new sourceType `bookmark_review` |

### New unit: `cheatViolations` shape

```ts
{
  tabSwitches: number;     // count of distinct visibilitychange→hidden events with blur >2s
  pasteAttempts: number;   // for Writing — paste prevented
  longBlurMs: number;      // total time the tab was hidden (cumulative)
}
```

Single field on `toeicAttempt`. NULL when never tracked (backward compat).

## API changes

### Modify: `/api/toeic-practice/answer/route.ts`

Extend the `BodySchema` to accept two optional fields:

```ts
flagged: z.boolean().optional()
cheatEvent: z.enum(["tabSwitch", "paste"]).optional()
durationMsOff: z.number().int().min(0).optional() // for tabSwitch only
```

When provided:
- `flagged` → write into `toeicAnswer.flagged` upsert.
- `cheatEvent === "tabSwitch"` → increment `toeicAttempt.cheatViolations.tabSwitches` and add `durationMsOff` to `longBlurMs`.
- `cheatEvent === "paste"` → increment `toeicAttempt.cheatViolations.pasteAttempts`.

Cheat events do NOT require a `selectedIndex`; route accepts events without an answer (separate code path).

### Modify: `/api/toeic-mock/complete/route.ts`

After computing score, when iterating answers to enqueue review tasks:

- `isCorrect === false` → existing path, sourceType `error_retry`.
- `flagged === true && isCorrect !== false` → new path, sourceType `bookmark_review`. Lower priority (default 30 vs error_retry's 50). Different SRS interval class.

The existing event emitter handles `error_retry` already; we add a parallel branch for `bookmark_review`.

### New: `/api/toeic-practice/attempt/[id]/full-review/route.ts`

GET. Returns:

```ts
{
  attempt: { id, mode, completedAt, scaledListening, scaledReading, totalScaled, cheatViolations },
  questions: Array<{
    id, number, part, questionText, options, correctIndex,
    explanationVi, explanationEn, audioUrl, audioSegments, imageUrls, skillIds
  }>,
  answers: Array<{ questionId, selectedIndex, isCorrect, flagged, durationMs }>,
}
```

Auth: only attempt owner can fetch. Otherwise 403.

## UI changes

### `QuestionRunner.tsx`

Add three pieces:

1. **Keyboard handler** (mounts only when `question` is non-null):
   - Skip when `event.target` is INPUT/TEXTAREA (don't conflict with form fields elsewhere on the page).
   - `1`/`a` → handlePick(0); `2`/`b` → handlePick(1); `3`/`c` → handlePick(2); `4`/`d` → handlePick(3) (only if option exists for that index).
   - ` ` (space) → if audio element present, toggle play/pause; preventDefault to avoid page scroll.
   - `f` → toggle a local `isFlagged` state, fire-and-forget POST to `/api/toeic-practice/answer` with just `flagged: true/false` (no selection).
   - `Enter` → handleNext if canSubmit.

2. **Flag button** in the bottom action row:
   ```
   [🚩 Flag]   [Bỏ qua]   [Câu tiếp / Nộp bài]
   ```
   Toggles `isFlagged`. Persists immediately via the same answer endpoint (without selectedIndex).

3. **Keyboard hint footer** small text "Phím tắt: 1-4 / A-D · Space audio · F flag · Enter tiếp".

### Mock test runner page (`/toeic/mock-test/runner`)

Add a `useEffect` that registers `visibilitychange`:

```ts
useEffect(() => {
  if (!attemptId) return;
  let blurStart = 0;
  const onVisChange = () => {
    if (document.hidden) {
      blurStart = Date.now();
    } else if (blurStart > 0) {
      const blurMs = Date.now() - blurStart;
      if (blurMs > 2000) {
        // Fire-and-forget cheat event
        void api.post("/toeic-practice/answer", {
          attemptId,
          questionId: current.id,
          selectedIndex: null,
          durationMs: 0,
          cheatEvent: "tabSwitch",
          durationMsOff: blurMs,
        });
      }
      blurStart = 0;
    }
  };
  document.addEventListener("visibilitychange", onVisChange);
  return () => document.removeEventListener("visibilitychange", onVisChange);
}, [attemptId, current?.id]);
```

Note: the answer endpoint is reused for cheat events (no need for a separate route — keeps API surface flat).

### Writing runner page (`/toeic/writing/runner`)

Add `onPaste={handlePastePrevent}` to the Input.TextArea:

```tsx
const handlePastePrevent = (e: React.ClipboardEvent) => {
  e.preventDefault();
  // Toast: "Không paste khi làm Writing — gõ tay luyện kỹ năng"
  // Optional: track via cheat event endpoint (writing has no toeic_attempt — defer this for v2)
};
```

For Writing, there's no `toeicAttempt` row — Writing uses `toeicWritingSession`. We won't extend the cheat-tracking storage to Writing in this sprint; just block the action client-side and toast. (Document this limitation in the spec; OK for soft anti-cheat.)

### Result page (`/toeic/mock-test/[id]/result`)

Replace existing per-Part breakdown card render with a tab interface using Antd `<Tabs>`:

```
[Score header — unchanged]
[Per-Part breakdown — unchanged]
[ tab1: ❌ Sai (47) | tab2: 📋 Tất cả (200) | tab3: 🚩 Bookmarked (12) ]

For each tab, render a list of question cards:
  Q42 · Part 5 · [user answered B (red)] [correct: D (green)]
  Question stem text
  Options A/B/C/D — color-coded
  Explanation Vi (collapsible)

Top banner conditionally if cheatViolations:
  ⚠️ Tab switch 3 · ngoài tab 0:45 · paste 0
  → "Score chưa thể coi là exam-realistic. Mock test thật sự cần làm 1 mạch không tra cứu."
```

The existing result page fetches via server component. Switch to client-side `useEffect` + fetch from `/full-review` to support tab interactivity.

OR: keep server fetch, embed all data, hydrate client tabs. Server fetch is cleaner — no waterfall. Use server fetch + `<TabsClient>` client component for the interactive part.

## Storage

### Migration

```sql
ALTER TABLE toeic_attempt ADD COLUMN cheat_violations jsonb;
```

Drizzle schema:

```ts
cheatViolations: jsonb("cheat_violations").$type<{
  tabSwitches: number;
  pasteAttempts: number;
  longBlurMs: number;
}>(),
```

### Existing fields used

- `toeicAnswer.flagged` (boolean, default false) — already in schema since S1; this sprint finally wires it to UI + persistence.
- `reviewTask.sourceType` — already accepts arbitrary string; new value `bookmark_review` is just convention.

## Implementation order (~2h)

| # | Task | File | ETA |
|---|---|---|---|
| 1 | Schema: add `cheatViolations` jsonb to toeicAttempt + migration | schema + migration | 10m |
| 2 | Extend `/api/toeic-practice/answer` to accept `flagged` + `cheatEvent` | route.ts | 25m |
| 3 | Extend `/api/toeic-mock/complete` to enqueue reviewTask for flagged-and-correct (sourceType=bookmark_review) | route.ts | 15m |
| 4 | New `/api/toeic-practice/attempt/[id]/full-review` endpoint | new route | 20m |
| 5 | QuestionRunner: keyboard handler + flag button + UI hint | component | 30m |
| 6 | Mock runner: visibility tracker | runner page | 15m |
| 7 | Writing runner: paste blocker + toast | writing runner | 10m |
| 8 | Result page: 3-tab review + cheat banner | result page | 35m |

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Keyboard `f` clashes with browser find shortcut (Cmd+F unaffected, but lone `f` rare) | Lone `f` is fine; preventDefault only when target isn't an input |
| Keyboard handler fires when user is typing in Antd Modal/textarea | Skip when target is INPUT/TEXTAREA — already standard pattern |
| visibilitychange spams when user multitasks normally (e.g. swipe to other app on phone) | 2s threshold filters short blurs; further tuning possible after first user feedback |
| Reusing answer endpoint for cheat events couples concerns | Keeps API surface small; alternative would be 2 more endpoints. Document the dual-purpose clearly in route.ts |
| reviewTask `bookmark_review` sourceType not in existing ReviewSourceType enum (`@repo/contracts`) | Add to enum if needed — checked: existing enum already includes "flashcard_review" + "error_retry" but NOT "bookmark_review". Need to extend at impl time. |
| Result page tab "Tất cả 200" renders slow | Mini mock has 100, Full has 194. Each card is small (~100 DOM nodes). 200 nodes acceptable; if slow, paginate to 50/page. |
| Paste in Writing might be needed for legitimate use (e.g. quoting email body) | Real TOEIC tests don't allow paste; if user complains, relax to "warn instead of block". v1: block. |

## Definition of done

- After completing a mock test, the result page shows three tabs (Sai / Tất cả / Bookmarked) with per-question detail.
- Pressing `1`/`A`/`a` during a mock question selects option 0; pressing `Space` toggles audio playback (Part 2 segments rest aside — works for top-level audio); pressing `F` toggles a flag visible in the UI.
- Flagging a correct answer → reviewTask row created with sourceType `bookmark_review`; can be drilled later via existing /toeic/review SRS hub.
- Tab-switching during mock test for >2s increments `cheatViolations.tabSwitches`; result page shows the warning banner.
- Pasting into Writing Q6-Q8 textarea is blocked + toast shows.
- Existing flow (mock practice without keyboard / flag / cheat) still works unchanged for users on older devices.
