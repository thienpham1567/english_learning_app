# Epic 19: Four-Skills Enhancement (Speaking, Writing, Listening, Reading)

**Status:** planned
**Sprints:** R9–R12
**Owner:** Thienpham (self-learner)
**Created:** 2026-04-19

## Goal

Close the biggest gaps in the self-learner experience across the four core English skills. The app already has scaffolding for each skill (pronunciation, writing-practice, listening, reading) but lacks the feedback loops and auto-scoring that a learner without a human tutor needs.

## Why

As a self-learner, the most valuable improvements are those that simulate what a teacher would provide: scoring, correction, and progression. The highest-ROI gaps are:

1. **Speaking** has output (TTS) but no input scoring — users cannot measure pronunciation or fluency.
2. **Writing** has free composition but no rubric-based scoring or targeted rewriting.
3. **Listening** is single-voice and passive — missing multi-speaker, variable speed, and active-comprehension drills.
4. **Reading** lacks CEFR grading, inline vocab integration, and progress tracking.

## Scope (Sprints)

### R9 — Speaking Core (foundation: STT)
- 19.1.1 Integrate Google Cloud Speech-to-Text
- 19.1.2 Pronunciation Scoring (phoneme-level)
- 19.1.3 Free-Talk Timer with AI Feedback
- 19.1.4 Minimal Pairs Drill

### R10 — Writing Core (leverages existing OpenAI)
- 19.2.1 IELTS/TOEFL Essay Scoring by Rubric
- 19.2.2 Sentence Rewriter (C1-level suggestions)
- 19.2.3 Guided Writing (prompt + outline + vocab bank)
- 19.2.4 Error Pattern → Auto-Quiz in error-notebook

### R11 — Listening Advanced
- 19.3.1 Multi-Speaker Dialogues (Google TTS multi-voice)
- 19.3.2 A-B Loop + Variable Speed
- 19.3.3 Listen-and-Summarize with AI Scoring
- 19.3.4 Podcast/YouTube Import (Whisper)

### R12 — Reading Advanced
- 19.4.1 CEFR-Graded Reader + Vocab Prioritization
- 19.4.2 Click-to-Define Inline + Save to Vocab
- 19.4.3 Extensive Reading Tracker
- 19.4.4 Auto Cloze Test from Read Passage

## Dependencies

- Google Cloud TTS already integrated (Epic-post-18 work). Google Cloud Speech-to-Text uses the same billing account — enable API in same GCP project.
- OpenAI Responses API already wired via `lib/openai.ts`.
- Epic 18 (NestJS migration) is still in progress in `apps/api`. Epic 19 features land in `apps/web` as feature routes/endpoints first; they can be migrated to `apps/api` in a later epic.

## Non-Goals

- Do not migrate Epic 19 endpoints to `apps/api` in this epic — stay in `apps/web/app/api/*` for velocity.
- No mobile/native voice recording — web MediaRecorder only.
- No social/leaderboard features.
- No full LMS curriculum — stay focused on feedback loops, not content authoring.

## Success Criteria

- User can get a pronunciation score for any word/sentence within 3s of recording.
- User receives a 4-criterion (TR/CC/LR/GRA) score with specific inline suggestions within 10s of submitting an essay.
- User can import a YouTube/podcast URL and practice listening with transcript + quiz.
- Reading list is filtered by user's CEFR level and prioritizes unseen vocab.

## References

- [sprint-status.yaml](/Users/thienuser/Documents/english_learning_app/_bmad-output/implementation-artifacts/sprint-status.yaml)
- [Google Cloud STT docs](https://cloud.google.com/speech-to-text/docs)
- [Google Cloud TTS multi-voice](https://cloud.google.com/text-to-speech/docs/voices)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
