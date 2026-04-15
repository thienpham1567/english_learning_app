# Story 16.2: Topic-Based Content Sets

## Status: ready-for-dev
## Story ID: 16.2
## Epic: 16 — AI Content Generation
## Created: 2026-04-14

---

## User Story

**As** a learner preparing for TOEIC or IELTS,
**I want** themed study sets grouping related vocabulary, grammar, reading, and practice around a single topic,
**So that** I can do focused, deep study on specific subjects (e.g., "Business Meetings", "Travel", "Health").

## Business Value

Currently, content across modules (vocabulary, grammar, reading, pronunciation) is generated independently with no thematic link. Topic-Based Content Sets create a **guided study path** around one theme — this mirrors how real exam prep courses work. It increases engagement by giving learners a structured, goal-oriented experience within a single session.

---

## Acceptance Criteria (BDD)

### AC1: Study Sets Page
**Given** a user navigates to `/study-sets`
**When** the page loads
**Then** show a curated grid of topic cards organized by theme
**And** each card shows: topic name, icon, CEFR level, estimated time, module count

### AC2: Topic Cards
**Given** the topic grid is displayed
**When** user browses
**Then** show topics grouped by categories:
- 🏢 Business & Office (TOEIC)
- ✈️ Travel & Tourism
- 🏥 Health & Wellness
- 🎓 Education & Study
- 🌍 Environment & Society
- 💻 Technology & Science
**And** exam mode (TOEIC/IELTS) filters relevant topics

### AC3: Study Set Detail View
**Given** user clicks a topic card (e.g., "Business Meetings")
**When** the study set loads
**Then** show 4 mini-modules in tabs/sections:
1. **Vocabulary** (8-10 key words with definition, example, pronunciation)
2. **Grammar in Context** (1 grammar point applied to the topic)
3. **Reading Passage** (short paragraph + comprehension questions)
4. **Practice Sentences** (3 fill-in-the-blank exercises)
**And** all content is AI-generated around the chosen topic

### AC4: Sequential Progress
**Given** user is in a study set
**When** they complete a module section
**Then** show a checkmark on that section
**And** track progress: "2/4 hoàn thành"
**And** after all 4 sections: award XP and show completion screen

### AC5: Completion & XP
**Given** user completes all 4 sections of a study set
**When** completion screen appears
**Then** award +30 XP
**And** mark topic as completed (session only)
**And** show "Tiếp tục chủ đề khác" and "Về trang chủ" buttons

### AC6: Navigation Integration
**Given** study sets page exists
**When** user navigates the app
**Then** "Chủ đề học tập" link appears in sidebar under a new "Học theo chủ đề" group
**And** home page can suggest study sets via smart CTA

---

## Technical Requirements

### New API Endpoint

#### `POST /api/study-sets/generate`
- Body: `{ topicId: string, topicTitle: string, examMode: string, level: string }`
- Returns full study set content:
```json
{
  "topic": "business-meetings",
  "title": "Business Meetings",
  "vocabulary": [
    { "word": "agenda", "ipa": "/əˈdʒɛndə/", "meaning": "Vietnamese meaning", "example": "Let's review the agenda.", "exampleVi": "..." }
  ],
  "grammar": {
    "title": "Modals for Suggestions",
    "formula": "S + should/could + V",
    "explanation": "Vietnamese explanation...",
    "topicExample": "We should schedule a follow-up meeting."
  },
  "reading": {
    "passage": "Short paragraph about the topic...",
    "questions": [
      { "question": "...", "options": ["A", "B", "C", "D"], "answer": "B", "explanation": "..." }
    ]
  },
  "exercises": [
    { "sentence": "We need to ___ the meeting.", "options": ["schedule", "scheduling", "scheduled", "schedules"], "answer": "schedule", "explanation": "..." }
  ]
}
```

#### `POST /api/study-sets/complete`
- Body: `{ topicId: string, sectionsCompleted: number }`
- Awards +30 XP
- Returns `{ xpAwarded }`

### No New Database Tables
- XP via existing `activityLog` (activityType: `study_set`)
- Completion is session-only (React state)

### File Structure

```
app/
  (app)/
    study-sets/
      page.tsx                ← New: topic grid + study set view
  api/
    study-sets/
      generate/route.ts       ← New: AI content generation
      complete/route.ts       ← New: XP award
components/
  app/
    study-sets/
      TopicSetGrid.tsx        ← New: themed topic cards
      StudySetView.tsx         ← New: 4-section study set
```

### Schema Update
- Add `study_set` to `activityTypeEnum` in `lib/db/schema.ts`

---

## Developer Context

### Topic Data (Static)

```typescript
const STUDY_TOPICS = [
  {
    category: "Business & Office",
    icon: "🏢",
    topics: [
      { id: "business-meetings", title: "Business Meetings", level: "B1", time: "15 min" },
      { id: "email-writing", title: "Email Writing", level: "B1", time: "15 min" },
      { id: "job-interview", title: "Job Interviews", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Travel & Tourism",
    icon: "✈️",
    topics: [
      { id: "airport-travel", title: "Airport & Travel", level: "A2", time: "12 min" },
      { id: "hotel-booking", title: "Hotel Booking", level: "B1", time: "15 min" },
      { id: "restaurant-dining", title: "Restaurant & Dining", level: "A2", time: "12 min" },
    ],
  },
  {
    category: "Health & Wellness",
    icon: "🏥",
    topics: [
      { id: "doctor-visit", title: "Doctor's Visit", level: "B1", time: "15 min" },
      { id: "fitness-health", title: "Fitness & Health", level: "B1", time: "15 min" },
    ],
  },
  {
    category: "Education",
    icon: "🎓",
    topics: [
      { id: "campus-life", title: "Campus Life", level: "B1", time: "15 min" },
      { id: "academic-writing", title: "Academic Writing", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Environment & Society",
    icon: "🌍",
    topics: [
      { id: "climate-change", title: "Climate Change", level: "B2", time: "20 min" },
      { id: "urbanization", title: "Urbanization", level: "B2", time: "20 min" },
    ],
  },
  {
    category: "Technology",
    icon: "💻",
    topics: [
      { id: "artificial-intelligence", title: "Artificial Intelligence", level: "B2", time: "20 min" },
      { id: "social-media", title: "Social Media Impact", level: "B1", time: "15 min" },
    ],
  },
];
```

### StudySetView Design

4-section tabbed layout:
1. **📚 Từ vựng** — Word cards (word, IPA, meaning, example, listen button)
2. **📐 Ngữ pháp** — Grammar in context (formula, explanation, topic example)
3. **📖 Đọc hiểu** — Reading passage + 2-3 multiple choice questions
4. **✍️ Bài tập** — Fill-in-the-blank exercises

Each section has a "Hoàn thành" button at the bottom to mark as done.

### Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `openAiClient` | `lib/openai/client.ts` | AI content generation |
| `activityLog` | `lib/db/schema.ts` | XP logging (needs `study_set` enum) |
| `ExamModeProvider` | `components/app/shared/` | Filter topics by TOEIC/IELTS |
| `speechSynthesis` | Browser API | TTS for vocabulary words |

---

## Testing Checklist

- [ ] Study sets page renders at `/study-sets`
- [ ] Topic cards display with categories
- [ ] Clicking topic generates study set via AI
- [ ] Vocabulary section: words, IPA, meanings, listen button
- [ ] Grammar section: formula, explanation, example
- [ ] Reading section: passage + comprehension questions
- [ ] Exercises section: fill-in-the-blank with feedback
- [ ] Section completion tracking (checkmarks, progress)
- [ ] All 4 sections completed → +30 XP
- [ ] Sidebar navigation includes link
- [ ] `pnpm build` passes
- [ ] Dark/light mode correct

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
