# Story 13.1: Shadowing Mode

## Status: ready-for-dev
## Story ID: 13.1
## Epic: 13 — Shadowing, Dictation & Voice AI Upgrade
## Created: 2026-04-14

---

## User Story

**As** a learner,
**I want** to practice shadowing (listen → repeat → compare),
**So that** I improve my pronunciation and listening simultaneously.

## Business Value

Shadowing is a scientifically-proven technique for language acquisition used by polyglots and language schools. It trains both active listening and oral production through immediate imitation. Adding this to the listening page fills a gap between passive audio comprehension and full speaking exercises.

---

## Acceptance Criteria (BDD)

### AC1: Mode Selection
**Given** a user on the Listening page (`/listening`)
**When** the page loads
**Then** a mode selector is visible: "Luyện nghe" (default) and "Shadowing"
**And** switching to Shadowing shows the shadowing exercise UI

### AC2: Sentence Generation
**Given** the user selects Shadowing mode
**When** a session starts
**Then** 5 sentences are generated via existing `/api/pronunciation/sentences`
**And** each sentence includes: text, IPA transcription, and pronunciation tip
**And** difficulty matches the user's exam mode (TOEIC/IELTS)

### AC3: Listen → Repeat → Compare Flow
**Given** a sentence is presented
**When** the user taps "Play" (🔊)
**Then** the sentence audio plays via browser TTS (`speechSynthesis`)
**And** text + IPA are displayed side-by-side
**When** user taps "Record" (🎤)
**Then** recording starts (via MediaRecorder API + Whisper transcription)
**When** user stops recording
**Then** spoken text is sent to `/api/pronunciation/evaluate`
**And** score (0-100) and word-level analysis are displayed
**And** incorrect words are highlighted in red, correct in green

### AC4: Re-attempt
**Given** a sentence has been evaluated
**When** user taps "Thử lại"
**Then** recording resets for that sentence
**And** previous score is shown for comparison

### AC5: Session Summary
**Given** all 5 sentences have been completed
**When** the summary renders
**Then** show: average score, total time, weakest sentence (lowest score)
**And** per-sentence scores listed with sparkline indicators
**And** XP awarded: +25 XP per completed session

### AC6: XP & Skill Update
**Given** the session is complete
**When** results are saved
**Then** +25 XP logged to `activityLog` (activityType: "voice_practice")
**And** listening skill profile updated via existing `updateSkillProfile`

---

## Technical Requirements

### No New Database Tables Required
- Uses existing `activityLog` for XP (activityType: "voice_practice")
- Uses existing `user_skill_profile` for adaptive level updates

### Existing APIs to Reuse

| API | Usage |
|-----|-------|
| `POST /api/pronunciation/sentences` | Generate 5 practice sentences with IPA + tips |
| `POST /api/pronunciation/evaluate` | Score pronunciation (targetText vs spokenText) |
| `GET /api/skill-profile?module=listening` | Get current listening level |
| `POST /api/skill-profile` (via `updateSkillProfile`) | Update after session |

### New API Endpoint

#### `POST /api/shadowing/complete`
- Body: `{ scores: number[], avgScore: number, examMode: string }`
- Awards +25 XP
- Updates listening skill profile
- Returns `{ xpAwarded, skillUpdate }`

### Browser APIs Required

1. **SpeechSynthesis** — play sentence audio (already used in pronunciation page)
2. **MediaRecorder** — record user voice (already used in pronunciation page)
3. **Whisper transcription** — convert audio to text for comparison

### File Structure

```
app/
  (app)/
    listening/
      page.tsx              ← Add mode selector (existing → Shadowing)
components/
  app/
    listening/
      ShadowingMode.tsx     ← New: main shadowing exercise component
      ShadowingCard.tsx     ← New: individual sentence card with record/play
      ShadowingSummary.tsx  ← New: session summary with scores
app/
  api/
    shadowing/
      complete/route.ts     ← New: save session results + award XP
```

---

## Developer Context

### Existing Patterns to Follow

1. **Pronunciation page pattern** — The `/pronunciation` page already implements listen+record+evaluate. Shadowing reuses this flow but wraps it in a 5-sentence session.
2. **`/api/pronunciation/evaluate`** — Takes `{ targetText, spokenText }`, returns `{ score, accuracy, fluency, wordAnalysis, feedback, tips }`.
3. **`/api/pronunciation/sentences`** — Takes `{ level, count, examMode }`, returns `{ sentences: [{ text, ipa, tip }] }`.
4. **SpeechSynthesis** — Use `window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))` for TTS.
5. **MediaRecorder** — Use `navigator.mediaDevices.getUserMedia({ audio: true })` then `MediaRecorder(stream)`.
6. **Auth pattern** — All APIs use `auth.api.getSession({ headers: await headers() })`.
7. **XP logging** — Insert into `activityLog` with `activityType: "voice_practice"`.
8. **Skill update** — Use `updateSkillProfile(userId, "listening", accuracy)` from `lib/adaptive/difficulty.ts`.

### Critical Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `useListeningExercise` hook | `hooks/useListeningExercise.ts` | Reference for state management pattern |
| `AudioPlayer` component | `components/app/listening/AudioPlayer.tsx` | Reference for audio playback UI |
| `LevelSelector` component | `components/app/listening/LevelSelector.tsx` | Reuse for mode selection integration |
| `updateSkillProfile` | `lib/adaptive/difficulty.ts` | Update listening level after session |
| `activityLog` table | `lib/db/schema.ts` | Log XP (activityType: "voice_practice") |
| Exam mode context | `components/app/shared/ExamModeProvider` | Get user's TOEIC/IELTS preference |

### UI Design Notes

- **Mode selector**: Add tabs or segmented control at top of listening page: "Luyện nghe" | "Shadowing"
- **Sentence card**: Shows text + IPA, play button, record button, score badge, word analysis
- **Color coding**: Green words = correct, Red = wrong, Yellow = missing
- **Progress**: "Câu 2/5" with progress bar
- **Summary card**: Average score gauge, per-sentence sparklines, XP badge

---

## Previous Story Intelligence

### Sprint 11 (Epic 15) — learnings:
- F1 fix: Always use deterministic ID-based matching, not positional matching
- Pre-built content (question banks) is faster and cheaper than AI per-session
- Phase-based UI state (`loading → active → submitting → results`) works well

### Pronunciation page — patterns:
- Browser speech APIs require `"use client"` directive
- MediaRecorder needs error handling for denied permissions
- Whisper transcription may be slow — show loading state during processing
- `speechSynthesis.speak()` may need brief delay for voice loading

---

## Git Intelligence

Recent commits:
```
055e39c fix: Code review patches F1-F3 for Sprint 11
162ddb5 feat: Stories 15.2 + 15.3 — Scenario Engine with 4 scenarios
957bea6 feat: Story 15.1 — CEFR Diagnostic Test
d0a2968 fix: Code review patches F1-F2 for Story 15.4
86ee36e feat: Story 15.4 — Weekly Leaderboard
```

---

## Testing Checklist

- [ ] Mode selector renders on listening page
- [ ] Switching to Shadowing mode generates 5 sentences
- [ ] Play button synthesizes audio via TTS
- [ ] Record button captures audio and transcribes
- [ ] Pronunciation evaluation returns scores + word analysis
- [ ] Word-level coloring (green/red) displays correctly
- [ ] Re-attempt resets recording and preserves old score
- [ ] Summary shows avg score, weakest sentence, +25 XP
- [ ] `activityLog` entry created with "voice_practice" type
- [ ] `user_skill_profile` updated for listening module
- [ ] `pnpm build` passes
- [ ] Dark/light mode renders correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
