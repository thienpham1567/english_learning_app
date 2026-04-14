# Story 13.3: Voice Conversation Inline Feedback

## Status: ready-for-dev
## Story ID: 13.3
## Epic: 13 — Shadowing, Dictation & Voice AI Upgrade
## Created: 2026-04-14

---

## User Story

**As** a learner using voice conversation mode in the chatbot,
**I want** to receive inline pronunciation feedback after each voice message I send,
**So that** I can improve my pronunciation while practicing conversation.

## Business Value

The chatbot already has voice mode (Story 7.3) where users speak → Whisper transcribes → AI responds → TTS speaks back. However, there's no feedback on *how well* the user spoke. Adding inline pronunciation scoring turns conversational practice into active pronunciation training — the user gets both a conversation response AND pronunciation tips in the same exchange.

---

## Acceptance Criteria (BDD)

### AC1: Pronunciation Feedback Toggle
**Given** a user is in voice mode in the chatbot
**When** voice mode is active
**Then** a "Phản hồi phát âm" toggle appears next to the voice mode button
**And** it is ON by default when voice mode is enabled

### AC2: Inline Feedback After Voice Messages
**Given** pronunciation feedback is enabled
**When** user sends a voice message (recorded → transcribed → sent)
**Then** after the user message bubble, a compact pronunciation feedback card appears
**And** it shows: overall score (0-100), accuracy %, word-level highlights
**And** the card is collapsible (default: collapsed, showing only score badge)

### AC3: Word-Level Analysis
**Given** a pronunciation feedback card is expanded
**When** user clicks to expand
**Then** show word-level analysis: green=correct, red=incorrect with issue
**And** show 1-2 improvement tips
**And** a "Nghe lại" button to hear the correct pronunciation via TTS

### AC4: Non-Blocking Flow
**Given** pronunciation feedback is being evaluated
**When** the AI pronunciation evaluation is in progress
**Then** the conversation continues normally (AI response streams immediately)
**And** pronunciation feedback appears asynchronously after evaluation completes
**And** a small loading spinner shows in the feedback slot while waiting

### AC5: Feedback Persistence
**Given** pronunciation feedback has been generated
**When** user scrolls up or switches conversations
**Then** feedback cards persist in the message list for that session
**And** feedback is NOT persisted to the database (session-only)

---

## Technical Requirements

### No New Database Tables Required
- Feedback is session-only (stored in React state alongside messages)
- No API persistence needed

### Existing APIs to Reuse

| API | Usage |
|-----|-------|
| `POST /api/pronunciation/evaluate` | Score pronunciation (targetText vs spokenText) |
| `/api/voice/transcribe` | Already used by `useVoiceInput` hook |

### No New API Endpoints
- Pronunciation evaluation already exists
- The "targetText" for conversation mode will be the user's transcribed text (evaluate self-pronunciation quality)

### Key Design Decision: What is "targetText"?
In conversation mode, there's no predefined target sentence. Instead:
- **targetText** = the user's typed/intended message (from Whisper transcription)
- **spokenText** = same transcription (Whisper already handles this)
- The AI evaluator compares pronunciation quality of what was spoken vs what was intended

Alternative approach: Use the raw audio quality signals from the Whisper transcription confidence, but this is simpler: just re-evaluate the transcription against itself for pronunciation quality patterns.

**Chosen approach**: Send the transcribed text as both `targetText` and `spokenText` to `/api/pronunciation/evaluate`. The AI evaluator is smart enough to analyze pronunciation patterns, fluency, and common Vietnamese speaker issues from a single utterance.

### File Changes

```
components/
  app/
    english-chatbot/
      ChatWindow.tsx            ← Modify: add pronunciation feedback state + cards
      PronunciationFeedback.tsx ← New: collapsible inline feedback card
```

---

## Developer Context

### Existing Voice Mode Flow (Story 7.3)

```
User taps 🎙️ → MediaRecorder starts
User taps ⏹ → audio sent to /api/voice/transcribe (Whisper)
Whisper returns text → auto-populates input
Voice mode: auto-sends → AI response streams → TTS speaks response
```

The hook point is **after Whisper returns** and **before/during AI response**. We fire a parallel pronunciation evaluation.

### Integration Points in ChatWindow.tsx

1. **Line 161-169**: `useEffect` that handles `voice.transcript` → this is where we trigger pronunciation evaluation
2. **Line 417-428**: Voice mode auto-speak section in `finally` block → response already handles async
3. **Line 657-679**: Message rendering loop → add pronunciation feedback card after user messages

### State Design

```typescript
// Map of message ID → pronunciation feedback
const [pronFeedback, setPronFeedback] = useState<Map<string, PronFeedbackData>>(new Map());

type PronFeedbackData = {
  status: "loading" | "done" | "error";
  score?: number;
  accuracy?: number;
  fluency?: number;
  wordAnalysis?: WordAnalysis[];
  tips?: string[];
  feedback?: string;
};
```

### Component: PronunciationFeedback

```typescript
interface PronunciationFeedbackProps {
  data: PronFeedbackData;
  onListenCorrect?: () => void; // TTS the original text
}
```

- **Collapsed**: Score badge (e.g., "🎤 82/100") — single line
- **Expanded**: Full word analysis, tips, listen button
- **Loading**: Small spinner with "Đang phân tích..."
- **Error**: "Không thể phân tích" (dismissible)

### Critical Implementation Notes

1. **Non-blocking**: Fire pronunciation evaluation in parallel, don't await before sending chat
2. **Only for voice messages**: Track which messages came from voice input
3. **Session-only**: Store in React state Map, not in DB
4. **Collapsible by default**: Don't clutter the chat with large cards
5. **Reuse existing evaluate API**: No new endpoint needed

### Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `useVoiceInput` hook | `hooks/useVoiceInput.ts` | Detect voice messages |
| `useTextToSpeech` hook | `hooks/useTextToSpeech.ts` | "Listen correct" button |
| `ChatMessage` component | `components/ChatMessage.tsx` | Rendering context |
| `/api/pronunciation/evaluate` | Existing API | Score pronunciation |
| `voiceMode` state | `ChatWindow.tsx:151` | Only show when voice mode on |

---

## UI Design Notes

### Collapsed State (default)
```
┌─────────────────────────────────────────┐
│ 🎤 82/100 · Khá tốt  ▼                │
└─────────────────────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────────────┐
│ 🎤 82/100 · Accuracy: 85% · Fluency: 79%  ▲│
│                                             │
│ [The] [weather] [is] [beautful] [today]     │
│  ✅     ✅     ✅    ❌ beautiful   ✅     │
│                                             │
│ 💡 Chú ý phát âm "beautiful" — /bjuː.tɪ/  │
│ 🔊 Nghe lại                                │
└─────────────────────────────────────────┘
```

### Colors
- Score ≥ 80: green badge
- Score 50-79: yellow badge  
- Score < 50: red badge

---

## Testing Checklist

- [ ] Toggle appears when voice mode is active
- [ ] Pronunciation feedback fires after each voice message
- [ ] Chat response is not blocked during evaluation
- [ ] Feedback card renders collapsed by default
- [ ] Expanding shows word analysis and tips
- [ ] "Nghe lại" plays TTS of the original text
- [ ] Feedback persists during session (scroll up, back)
- [ ] Switching conversations clears feedback
- [ ] Non-voice messages don't trigger evaluation
- [ ] Error state renders gracefully
- [ ] `pnpm build` passes
- [ ] Dark/light mode renders correctly

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
