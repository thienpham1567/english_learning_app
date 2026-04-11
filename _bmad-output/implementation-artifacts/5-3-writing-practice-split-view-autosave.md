# Story 5.3: Writing Practice Split-View & Autosave

Status: ready-for-dev

## Story

As a writer,
I want to see my text and the improved version side-by-side,
so that I can clearly see what I need to improve.

## Acceptance Criteria

1. **Desktop split-view (≥769px):** Feedback shows side-by-side — left panel = user's text with inline error highlights (red=grammar, blue=vocabulary, yellow=coherence), right panel = AI-improved version with additions in green.

2. **Mobile tabs (≤768px):** Three tabs: "Bài của bạn" | "Bản cải thiện" | "Đánh giá" replace the two-column grid.

3. **Word count progress bar:** A visual bar at the editor bottom: `[████░░░] 180/250 words` with color transitions (gray → green at target → amber at 120%).

4. **Autosave draft every 30s:** Drafts autosave to localStorage every 30 seconds with "Bản nháp đã lưu" indicator.

5. **Graceful degradation:** If localStorage is full or unavailable, autosave fails silently.

6. **Draft restoration:** Returning to writing practice offers to restore the saved draft.

## Tasks / Subtasks

- [ ] Task 1: Refactor FeedbackPanel to split-view layout
  - [ ] Desktop (≥769px): side-by-side using CSS grid `grid-cols-2`
  - [ ] Left panel: existing `AnnotatedText` (user text + error highlights — already implemented)
  - [ ] Right panel: `improvedVersion` with green background/border (already exists as third card)
  - [ ] Move radar + feedback below the split as full-width row
  - [ ] Update annotation type color mapping: red=grammar, blue=coherence, yellow=vocabulary (swap blue↔yellow to match AC)

- [ ] Task 2: Mobile tab layout for FeedbackPanel
  - [ ] When ≤768px, show 3 tabs: "Bài của bạn" | "Bản cải thiện" | "Đánh giá"
  - [ ] Tab 1: AnnotatedText
  - [ ] Tab 2: Improved version
  - [ ] Tab 3: Radar + general feedback
  - [ ] Use simple state-driven tab UI (not Ant Tabs)

- [ ] Task 3: Word count progress bar in WritingEditor
  - [ ] Replace the text-only word count with a visual progress bar
  - [ ] Bar container: full-width, 6px height, rounded
  - [ ] Fill percentage: `Math.min(wordCount / minWords * 100, 100)%`
  - [ ] Colors: gray default → green at 100% → amber at 120%
  - [ ] Label: `{wordCount}/{minWords} từ` next to bar

- [ ] Task 4: Autosave + draft restoration
  - [ ] Add `useAutosave` logic (either in `useWritingPractice` or new hook)
  - [ ] localStorage key: `writing-practice-draft`
  - [ ] Shape: `{ text: string; prompt: string; category: string; savedAt: string }`
  - [ ] Save every 30 seconds when in "writing" state and text.length > 0
  - [ ] Show "Bản nháp đã lưu" indicator (subtle text near submit button)
  - [ ] On mount in "writing" state, check for a matching draft (same prompt) and offer restore
  - [ ] Clear draft on successful submission
  - [ ] Wrap localStorage calls in try/catch for AC #5

## Dev Notes

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `components/app/writing-practice/FeedbackPanel.tsx` | 84 | Split-view layout + mobile tabs |
| `components/app/writing-practice/AnnotatedText.tsx` | 95 | Swap annotation color mapping (blue↔yellow) |
| `components/app/writing-practice/WritingEditor.tsx` | 100 | Word count progress bar + autosave integration |
| `hooks/useWritingPractice.ts` | 119 | Autosave draft + restore logic |

### Current FeedbackPanel Layout (to refactor)
Currently uses `grid gap-6 md:grid-cols-2`:
- Left column: AnnotatedText
- Right column: Radar + Feedback + Improved version (stacked)

### Target Desktop Layout
```
┌─────────────────────┬──────────────────────┐
│ Bài viết của bạn    │ Bài mẫu (Band 7+)   │
│ [AnnotatedText]     │ [improvedVersion]    │
│ red=grammar         │ green text           │
│ blue=coherence      │                      │
│ yellow=vocabulary   │                      │
└─────────────────────┴──────────────────────┘
┌────────────────────────────────────────────┐
│ Điểm chi tiết      │ Nhận xét             │
│ [Radar]             │ [generalFeedback]    │
└────────────────────────────────────────────┘
```

### Target Mobile Layout
```
┌──────────────────────────────┐
│ [Tab: Bài của bạn] [Bản cải thiện] [Đánh giá]
├──────────────────────────────┤
│ (content of active tab)      │
└──────────────────────────────┘
```

### Current Annotation Colors (AnnotatedText.tsx)
```ts
grammar:    "bg-red-100 border-b-2 border-red-400"      // ✅ matches AC: red
vocabulary: "bg-amber-100 border-b-2 border-amber-400"  // ❌ AC says yellow=coherence
coherence:  "bg-blue-100 border-b-2 border-blue-400"    // ❌ AC says blue=vocabulary
```

**Fix:** Swap vocabulary ↔ coherence colors to match AC spec.

### Word Count Progress Bar Target
```
[████████░░░░] 180/250 từ    (gray → green > 100% → amber > 120%)
```
Current: text-only `{wordCount} / {minWords} từ` with color class

### Autosave Draft Shape
```ts
type WritingDraft = {
  text: string;
  prompt: string;
  category: string;
  savedAt: string;
};
```

### CRITICAL: Do NOT
- **Do NOT** change API contracts
- **Do NOT** modify WritingFeedback or related types
- **Do NOT** use Tailwind custom config (use existing classes)
- **Do NOT** add external state management

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.3] — AC definition
- [Source: components/app/writing-practice/FeedbackPanel.tsx] — Current two-column layout
- [Source: components/app/writing-practice/WritingEditor.tsx] — Current editor and word count
- [Source: components/app/writing-practice/AnnotatedText.tsx] — Current annotation colors
- [Source: hooks/useWritingPractice.ts] — State machine for writing practice

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
