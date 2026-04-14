# Story 13.2: Dictation Mode

## Status: ready-for-dev
## Story ID: 13.2
## Epic: 13 — Shadowing, Dictation & Voice AI Upgrade
## Created: 2026-04-14

---

## User Story

**As** a learner,
**I want** to practice dictation (listen → type → check),
**So that** I train my ears to catch every word.

## Business Value

Dictation is a proven technique for developing listening accuracy and spelling simultaneously. Unlike passive listening quizzes, dictation requires word-level precision, forcing learners to parse every syllable. This complements the existing listening exercises (comprehension) and shadowing (pronunciation) to create a complete listening skills toolkit.

---

## Acceptance Criteria (BDD)

### AC1: Mode Selection
**Given** a user on the Listening page (`/listening`)
**When** the page loads
**Then** the mode selector shows 3 options: "Luyện nghe" | "Shadowing" | "Dictation"
**And** switching to Dictation shows the dictation exercise UI

### AC2: Sentence Generation
**Given** the user selects Dictation mode
**When** a session starts
**Then** 5 sentences are generated via `/api/pronunciation/sentences`
**And** difficulty matches the user's exam mode (TOEIC/IELTS)

### AC3: Listen → Type → Check Flow
**Given** a sentence is playing
**When** the user clicks "Play" (🔊)
**Then** audio plays via browser TTS (`speechSynthesis`)
**And** sentence text is HIDDEN (unlike shadowing where text is visible)
**When** user types their answer in a text input
**And** clicks "Kiểm tra"
**Then** word-level diff is shown: green=correct, red=wrong, yellow=missing
**And** accuracy % is shown per sentence

### AC4: Replay Limit
**Given** a sentence is active
**When** user taps "Nghe lại"
**Then** audio replays
**And** max 3 replays per sentence (counter shown: "Đã nghe: 2/3")
**And** button disables after 3 replays

### AC5: Session Summary
**Given** all 5 sentences have been completed
**When** summary renders
**Then** show: average accuracy %, total sentences, weakest sentence
**And** per-sentence accuracy % listed
**And** XP awarded: +25 XP per session

### AC6: XP & Skill Update
**Given** the session is complete
**When** results are saved via `POST /api/dictation/complete`
**Then** +25 XP logged to `activityLog` (activityType: "voice_practice")
**And** listening skill profile updated via `updateSkillProfile`

---

## Technical Requirements

### No New Database Tables Required
- Uses existing `activityLog` for XP (activityType: "voice_practice")
- Uses existing `user_skill_profile` for adaptive level updates

### Existing APIs to Reuse

| API | Usage |
|-----|-------|
| `POST /api/pronunciation/sentences` | Generate 5 sentences with text + IPA |
| `GET /api/skill-profile?module=listening` | Get current listening level |

### New API Endpoint

#### `POST /api/dictation/complete`
- Body: `{ scores: number[], avgAccuracy: number }`
- Awards +25 XP
- Updates listening skill profile
- Returns `{ xpAwarded, skillUpdate }`
- Pattern: identical to `/api/shadowing/complete` (copy + adjust metadata)

### Key Algorithm: Word-Level Diff

```typescript
function diffWords(target: string, typed: string): DiffWord[] {
  const targetWords = normalize(target).split(/\s+/);
  const typedWords = normalize(typed).split(/\s+/);
  
  return targetWords.map((word, i) => {
    if (i < typedWords.length && normalize(typedWords[i]) === normalize(word)) {
      return { word, status: "correct" };    // green
    } else if (i < typedWords.length) {
      return { word, typed: typedWords[i], status: "wrong" }; // red
    } else {
      return { word, status: "missing" };    // yellow
    }
  });
}
```

### Browser APIs
- **SpeechSynthesis** — play sentence audio (same as shadowing)
- No MediaRecorder needed (user types instead of speaks)

### File Structure

```
components/
  app/
    listening/
      DictationMode.tsx     ← New: dictation exercise component
app/
  api/
    dictation/
      complete/route.ts     ← New: save session + award XP
app/
  (app)/
    listening/
      page.tsx              ← Update: add "Dictation" to mode selector
```

---

## Developer Context

### Patterns from Story 13.1 (Shadowing)

The `ShadowingMode.tsx` component is the direct template for `DictationMode.tsx`. Key differences:

| Aspect | Shadowing | Dictation |
|--------|-----------|-----------|
| Text visible? | ✅ Yes (text + IPA shown) | ❌ No (hidden, revealed after check) |
| Input method | Voice recording (MediaRecorder) | Text input (keyboard) |
| Evaluation | AI pronunciation scoring | Word-level string diff (local) |
| Replays | Unlimited | Max 3 per sentence |
| Scoring | AI score 0-100 | Accuracy % (correct words / total words) |

### Component State Machine

```
idle → loading → ready → (typing) → checked → [next/retry]
                                                    ↓ (last sentence)
                                                 summary
```

### Critical Implementation Notes

1. **Word normalization**: Strip punctuation, lowercase before comparison
2. **Replay counter**: Track per-sentence, reset on next sentence
3. **Text hidden during listening**: Only show after user submits their typed answer
4. **Accuracy calculation**: `correctWords / totalTargetWords * 100`
5. **Session scores**: Array of accuracy percentages per sentence, passed to `/api/dictation/complete`

### Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `ShadowingMode.tsx` | `components/app/listening/` | Template for component structure |
| `updateSkillProfile` | `lib/adaptive/difficulty.ts` | Skill level update |
| `activityLog` table | `lib/db/schema.ts` | XP logging |
| `Segmented` component | `antd` | Mode selector (already 2 options, add 3rd) |
| Exam mode context | `ExamModeProvider` | TOEIC/IELTS preference |

### UI Design Notes

- **Sentence card**: Shows "🔊 Câu X/5" with play button + replay counter — NO text shown
- **Text input**: Full-width textarea, auto-focus after first play
- **Check button**: Enabled only when input is non-empty
- **Diff display**: Show target sentence with word-level coloring (green/red/yellow)
- **Revealed answer**: After check, show original text + IPA + typed text side by side
- **Summary**: Same layout as ShadowingMode (avg %, per-sentence tags, XP, skill level)

---

## Testing Checklist

- [ ] Dictation appears as 3rd tab in listening page mode selector
- [ ] Switching modes works without state leaks
- [ ] 5 sentences generated on session start
- [ ] Audio plays via TTS, text is hidden
- [ ] Replay limited to 3 per sentence, counter shown
- [ ] Word diff: green=correct, red=wrong, yellow=missing
- [ ] Accuracy % calculated correctly per sentence
- [ ] Summary shows avg accuracy, per-sentence scores, XP, skill update
- [ ] `/api/dictation/complete` awards 25 XP and updates skill profile
- [ ] `pnpm build` passes
- [ ] Dark/light mode renders correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
