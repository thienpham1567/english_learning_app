# Story 5.4: Dictionary Enhancements

Status: ready-for-dev

## Story

As a dictionary user,
I want recent lookups, pronunciation, and highlighted examples,
so that looking up words is faster and more informative.

## Acceptance Criteria

1. **Recent lookups strip:** A horizontal scroll strip above the search shows the last 8 looked-up words as chips (tappable to re-search).

2. **Pronunciation speaker icon:** After searching a word, a speaker icon next to the phonetic plays pronunciation via Web Speech API (`speechSynthesis.speak()`).

3. **Target word highlighting in examples:** In example sentences, the target word (headword) is highlighted with `var(--accent)` color.

4. **Chip persistence:** The recent lookup chips persist across page navigation (loaded from vocabulary API).

## Tasks / Subtasks

- [ ] Task 1: Recent lookups chip strip
  - [ ] Create `RecentLookups.tsx` component in `components/dictionary/`
  - [ ] Horizontal scroll container with chips for last 8 words
  - [ ] Chip style: small pill, accent border, tappable
  - [ ] Show above the search input inside `DictionarySearchPanel`
  - [ ] Source data from vocabulary API (saved vocabulary list) — use existing `/api/vocabulary` or derive from search history
  - [ ] Alternative: persist locally via localStorage key `dictionary-recent-lookups` with last 8 headwords
  - [ ] On successful search in `DictionaryPage`, push headword to recents list
  - [ ] On chip click, call parent's `onSubmit(word)`

- [ ] Task 2: Pronunciation is already implemented
  - [ ] **DONE** — `DictionaryResultCard` already has `AudioButton` with `SoundOutlined` icon next to phonetics (L352-386, L680-717)
  - [ ] Already uses Web Speech API `speechSynthesis.speak()` (L466-485)
  - [ ] No changes needed

- [ ] Task 3: Highlight target word in example sentences
  - [ ] In `SensePanel` (inside `DictionaryResultCard.tsx`), modify example rendering
  - [ ] When rendering `example.en`, find occurrences of the headword and wrap in accent-colored `<span>`
  - [ ] Pass `headword` prop through to `SensePanel`
  - [ ] Case-insensitive match for the headword
  - [ ] Note: existing `BoldText` uses `**bold**` markers — the highlight is independent

- [ ] Task 4: Wire everything together in DictionaryPage
  - [ ] Update `searchFor` in `page.tsx` to save headword to recent list on success
  - [ ] Pass `onChipClick={handleSubmit}` to the new strip component

## Dev Notes

### Files to Create
| File | Purpose |
|------|---------|
| `components/dictionary/RecentLookups.tsx` | Horizontal chip strip for last 8 lookups |

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `components/dictionary/DictionaryResultCard.tsx` | 796 | Pass headword to SensePanel, highlight target word in examples |
| `components/dictionary/DictionarySearchPanel.tsx` | 345 | Add RecentLookups strip above search |
| `app/(app)/dictionary/page.tsx` | 145 | Save headword to recents on search, pass to search panel |

### Current Pronunciation Implementation (ALREADY DONE — Task 2)
```
DictionaryResultCard.tsx:
  L352-386: AudioButton component with SoundOutlined icon
  L466-485: speak() function using SpeechSynthesis API
  L680-717: US/UK phonetic display with AudioButton next to each
```
No changes needed for AC #2.

### Target Word Highlighting Strategy
Currently examples render via `BoldText` which handles `**bold**` markers from the API.
The headword highlight is a separate concern — we need to additionally search for
the headword string within example text and wrap matches in accent color.

```tsx
// Current: <BoldText text={example.en} />
// Target:  <HighlightedExample text={example.en} headword={headword} />
```

### Recent Lookups Shape (localStorage)
```ts
// Key: "dictionary-recent-lookups"
// Value: string[] (max 8 headwords, most recent first)
```

### Recent Lookups UI Target
```
┌──────────────────────────────────────────┐
│ 🔍 Gần đây: [take off] [run] [happy] ...│  ← horizontal scroll
├──────────────────────────────────────────┤
│ Tra cứu có cấu trúc                     │
│ ...                                       │
```

### CRITICAL: Do NOT
- **Do NOT** change API contracts or vocabulary schema
- **Do NOT** modify the existing AudioButton or speak() function
- **Do NOT** break the existing BoldText parsing (additive only)
- **Do NOT** use external libraries for speech synthesis

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] — AC definition
- [Source: components/dictionary/DictionaryResultCard.tsx L352-485] — Existing AudioButton + speak()
- [Source: components/dictionary/DictionaryResultCard.tsx L152-170] — Example rendering
- [Source: components/dictionary/DictionarySearchPanel.tsx] — Search panel structure
- [Source: app/(app)/dictionary/page.tsx L58-68] — Search success flow

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
