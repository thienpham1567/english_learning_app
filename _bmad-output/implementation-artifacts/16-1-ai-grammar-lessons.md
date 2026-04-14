# Story 16.1: AI Grammar Lessons

## Status: ready-for-dev
## Story ID: 16.1
## Epic: 16 — AI Content Generation
## Created: 2026-04-14

---

## User Story

**As** a learner,
**I want** interactive grammar lessons with explanations, examples, and mini-exercises,
**So that** I understand grammar rules before testing them in the quiz.

## Business Value

Currently the app has grammar **quiz** (Part 5 practice) but no grammar **teaching**. Learners jump straight into testing without understanding the rules. Adding AI-generated grammar lessons closes this gap: learn → practice → test. Each lesson is dynamically generated based on the user's CEFR level and exam mode.

---

## Acceptance Criteria (BDD)

### AC1: Grammar Lessons Page
**Given** a user navigates to `/grammar-lessons`
**When** the page loads
**Then** show a grid of grammar topics organized by category
**And** topics adapt to user's exam mode (TOEIC/IELTS)

### AC2: Topic Categories
**Given** the topic grid is shown
**When** user browses
**Then** show 6 categories: Tenses, Modals, Conditionals, Passive Voice, Relative Clauses, Articles & Determiners
**And** each category has 3-5 subtopics
**And** difficulty tags shown (A2/B1/B2)

### AC3: AI-Generated Lesson Content
**Given** user selects a topic (e.g., "Present Perfect")
**When** the lesson loads
**Then** AI generates:
- Vietnamese explanation of the rule
- Formula/structure diagram
- 3 example sentences with translations
- Common mistakes for Vietnamese speakers
- 3 mini fill-in-the-blank exercises
**And** content adapts to TOEIC or IELTS context

### AC4: Mini Exercises
**Given** a lesson is displayed with exercises
**When** user answers a fill-in-the-blank exercise
**Then** show instant feedback: correct/incorrect
**And** show explanation if wrong
**And** track: correct count out of total

### AC5: Completion & XP
**Given** user completes all 3 exercises
**When** results are shown
**Then** award +15 XP per lesson completed
**And** show "Tiếp tục luyện" button linking to Grammar Quiz with same topic
**And** mark topic as completed (session only)

### AC6: Navigation Integration
**Given** grammar lessons page exists
**When** user is on any page
**Then** "Ngữ pháp" navigation item links to `/grammar-lessons`
**And** home page study plan can suggest grammar lessons

---

## Technical Requirements

### No New Database Tables
- XP logged via existing `activityLog` (activityType: `grammar_lesson`)
- Topic completion is session-only (React state)

### New API Endpoint

#### `POST /api/grammar-lessons/generate`
- Body: `{ topic: string, examMode: string, level: string }`
- Returns AI-generated lesson content:
```json
{
  "title": "Present Perfect",
  "titleVi": "Thì hiện tại hoàn thành",
  "explanation": "Vietnamese explanation...",
  "formula": "S + have/has + V3/ed",
  "examples": [
    { "en": "I have visited Paris.", "vi": "Tôi đã đến Paris.", "highlight": "have visited" }
  ],
  "commonMistakes": [
    { "wrong": "I have visit Paris.", "correct": "I have visited Paris.", "note": "..." }
  ],
  "exercises": [
    { "id": "1", "sentence": "She ___ (work) here since 2020.", "answer": "has worked", "options": ["has worked", "worked", "works", "is working"], "explanation": "..." }
  ]
}
```

#### `POST /api/grammar-lessons/complete`
- Body: `{ topic: string, correctCount: number, totalCount: number }`
- Awards +15 XP
- Returns `{ xpAwarded }`

### File Structure

```
app/
  (app)/
    grammar-lessons/
      page.tsx              ← New: topic grid + lesson view
  api/
    grammar-lessons/
      generate/route.ts     ← New: AI lesson generation
      complete/route.ts     ← New: XP award
components/
  app/
    grammar-lessons/
      TopicGrid.tsx         ← New: category/topic card grid
      LessonView.tsx        ← New: lesson content + exercises
```

---

## Developer Context

### Topic Data (Static)

```typescript
const GRAMMAR_CATEGORIES = [
  {
    id: "tenses",
    title: "Thì (Tenses)",
    icon: "🕐",
    color: "#52c41a",
    topics: [
      { id: "present-simple", title: "Present Simple", level: "A2" },
      { id: "present-continuous", title: "Present Continuous", level: "A2" },
      { id: "present-perfect", title: "Present Perfect", level: "B1" },
      { id: "past-simple", title: "Past Simple", level: "A2" },
      { id: "future-will-going", title: "Future (will/going to)", level: "B1" },
    ],
  },
  {
    id: "modals",
    title: "Động từ khiếm khuyết (Modals)",
    icon: "💡",
    color: "#6366f1",
    topics: [
      { id: "can-could-may", title: "Can / Could / May", level: "A2" },
      { id: "must-have-to", title: "Must / Have to", level: "B1" },
      { id: "should-ought", title: "Should / Ought to", level: "B1" },
    ],
  },
  {
    id: "conditionals",
    title: "Câu điều kiện (Conditionals)",
    icon: "🔀",
    color: "#f59e0b",
    topics: [
      { id: "zero-first", title: "Zero & First Conditional", level: "B1" },
      { id: "second-conditional", title: "Second Conditional", level: "B1" },
      { id: "third-conditional", title: "Third Conditional", level: "B2" },
    ],
  },
  {
    id: "passive",
    title: "Bị động (Passive Voice)",
    icon: "🔄",
    color: "#8b5cf6",
    topics: [
      { id: "passive-simple", title: "Simple Passive", level: "B1" },
      { id: "passive-perfect", title: "Perfect Passive", level: "B2" },
      { id: "causative", title: "Causative (have/get)", level: "B2" },
    ],
  },
  {
    id: "clauses",
    title: "Mệnh đề (Clauses)",
    icon: "🔗",
    color: "#ec4899",
    topics: [
      { id: "relative-who-which", title: "Relative (who/which/that)", level: "B1" },
      { id: "relative-advanced", title: "Non-defining Relatives", level: "B2" },
      { id: "noun-clauses", title: "Noun Clauses", level: "B2" },
    ],
  },
  {
    id: "determiners",
    title: "Mạo từ & Lượng từ",
    icon: "📌",
    color: "#14b8a6",
    topics: [
      { id: "articles", title: "A / An / The", level: "A2" },
      { id: "quantifiers", title: "Some / Any / Much / Many", level: "B1" },
      { id: "both-either-neither", title: "Both / Either / Neither", level: "B1" },
    ],
  },
];
```

### URL Pattern
- `/grammar-lessons` → TopicGrid (default)
- `/grammar-lessons?topic=present-perfect` → LessonView (client-side routing via query param)

### UI Design Notes

**Topic Grid:**
- Category cards with icon, title, topic count
- Click category → expand to show subtopics
- Each subtopic: title + CEFR level tag + completed checkmark

**Lesson View:**
- Back button → return to grid
- Sections: Formula → Explanation → Examples → Common Mistakes → Exercises
- Exercises: fill-in-the-blank with 4 options, instant feedback
- Completion card: score, XP, "Luyện quiz" button

### Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `openAiClient` | `lib/openai/client.ts` | AI lesson generation |
| `activityLog` | `lib/db/schema.ts` | XP logging |
| `ExamModeProvider` | `components/app/shared/` | TOEIC/IELTS context |
| Navigation | `components/app/shared/layout` | Add "Ngữ pháp" link |

---

## Testing Checklist

- [ ] Grammar lessons page renders at `/grammar-lessons`
- [ ] 6 categories with subtopics displayed
- [ ] Clicking topic generates AI lesson
- [ ] Lesson shows: formula, explanation, examples, mistakes, exercises
- [ ] Exercises: select answer → instant feedback
- [ ] Completing exercises awards +15 XP
- [ ] "Luyện quiz" button navigates to grammar quiz
- [ ] Completed topics show checkmark (session)
- [ ] Navigation includes grammar lessons link
- [ ] `pnpm build` passes
- [ ] Dark/light mode correct

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
