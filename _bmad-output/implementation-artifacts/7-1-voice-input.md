---
storyId: "7.1"
title: "Voice Input Hook & Microphone Button"
epic: 7
sprint: 7
status: ready
points: 5
priority: P0
---

# Story 7.1: Voice Input Hook & Microphone Button

## User Story

As a learner,
I want to speak English into the chatbot instead of typing,
So that I can practice pronunciation and speaking fluency.

## Acceptance Criteria

1. A microphone button (🎙️) appears next to the send button in the chatbot input area
2. Pressing the mic button starts SpeechRecognition with a pulsing red indicator
3. Recognized text appears in the input field in real-time (interim results in lighter color)
4. Pressing again stops recording and populates the input (user sends manually)
5. A `useVoiceInput()` hook encapsulates: `{ isListening, transcript, start, stop, isSupported }`
6. If SpeechRecognition API is unavailable, the mic button is hidden (graceful degradation)
7. Error states (permission denied, no speech detected) show console.warn (no intrusive UI)

## Technical Notes

### New file: `hooks/useVoiceInput.ts`
- Uses `webkitSpeechRecognition` or `SpeechRecognition`
- `continuous: true`, `interimResults: true`, `lang: 'en-US'`
- Returns `{ isListening, transcript, interimTranscript, start, stop, isSupported }`

### Modified file: chatbot input component
- Add mic button next to send button
- When listening, show pulsing red dot
- Transcript populates input field

## Dependencies
- None
