# Epic 19 — Story Breakdown

All stories: `ready-for-dev` unless noted.

## Sprint R9 — Speaking Core

| ID | Title | Depends on |
|---|---|---|
| 19.1.1 | Integrate Google Cloud Speech-to-Text | — |
| 19.1.2 | Pronunciation Scoring (phoneme-level) | 19.1.1 |
| 19.1.3 | Free-Talk Timer with AI Feedback | 19.1.1 |
| 19.1.4 | Minimal Pairs Drill | 19.1.2 |

## Sprint R10 — Writing Core

| ID | Title | Depends on |
|---|---|---|
| 19.2.1 | IELTS/TOEFL Essay Scoring by Rubric | — |
| 19.2.2 | Sentence Rewriter | — |
| 19.2.3 | Guided Writing | 19.2.1 |
| 19.2.4 | Error Pattern → Auto-Quiz | 19.2.1 |

## Sprint R11 — Listening Advanced

| ID | Title | Depends on |
|---|---|---|
| 19.3.1 | Multi-Speaker Dialogues | — |
| 19.3.2 | A-B Loop + Variable Speed | — |
| 19.3.3 | Listen-and-Summarize | 19.2.1 |
| 19.3.4 | Podcast/YouTube Import (Whisper) | 19.1.1 |

## Sprint R12 — Reading Advanced

| ID | Title | Depends on |
|---|---|---|
| 19.4.1 | CEFR-Graded Reader + Vocab Prioritization | — |
| 19.4.2 | Click-to-Define Inline + Save to Vocab | — |
| 19.4.3 | Extensive Reading Tracker | 19.4.2 |
| 19.4.4 | Auto Cloze Test from Read Passage | 19.4.1 |

## Execution order

Strict sprint order R9 → R10 → R11 → R12. Within a sprint, follow the dependency arrows; independent stories may run in parallel.
