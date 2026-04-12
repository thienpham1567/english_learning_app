# Story 10.3: Listening Vocabulary Integration

Status: done

## Story

As a learner,
I want to save difficult words from listening exercises to my vocabulary,
So that my listening practice feeds into flashcard reviews.

## Acceptance Criteria

1. **Given** a completed listening exercise showing the transcript
   **When** the transcript renders
   **Then** English words are highlighted and tappable (reusing chatbot word highlighting logic)
   **And** tapping a word opens MiniDictionary for lookup/save
   **And** saved words flow into the flashcard pipeline via existing vocabulary API

## Tasks / Subtasks

- [x] Task 1: Integrate HighlightedText into Results transcript
  - [x] 1.1 Import HighlightedText + MiniDictionary + useMiniDictionary into Results
  - [x] 1.2 Wrap transcript passage with HighlightedText for word clicking  
  - [x] 1.3 Add MiniDictionary popup below Results component

- [x] Task 2: Track saved words state
  - [x] 2.1 Add savedWords Set to page component
  - [x] 2.2 Update set when MiniDictionary confirms a save

## Dev Notes

### Reusable Components (ALREADY EXIST)

- `HighlightedText` from `@/components/app/english-chatbot/HighlightedText`
- `MiniDictionary` from `@/components/app/shared/MiniDictionary`
- `useMiniDictionary` from `@/hooks/useMiniDictionary`

### References

- ChatWindow.tsx lines 13-14, 176-177, 923-924 — existing integration pattern

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Completion Notes List

- Task 1: Added HighlightedText to Results transcript — words are dotted-underlined and clickable. MiniDictionary popup renders at page level for proper z-index. Added hint text "Nhấn vào từ để tra từ điển".
- Task 2: savedWords tracked as Set<string> in page component. onSave callback from MiniDictionary updates the set, highlighting saved words with accent color.
- Fixed onSaved → onSave prop name (matched MiniDictionary's actual props interface).

### File List

- `components/app/listening/Results.tsx` (modified) — Added HighlightedText import, onWordClick/savedWords props, hint text
- `app/(app)/listening/page.tsx` (modified) — Added MiniDictionary + useMiniDictionary + savedWords state
