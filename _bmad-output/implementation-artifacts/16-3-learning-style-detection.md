# Story 16.3: Learning Style Detection

## Status: ready-for-dev
## Story ID: 16.3
## Epic: 16 — AI Content Generation
## Created: 2026-04-15

---

## User Story

**As** a learner,
**I want** the app to detect my learning style from my activity patterns,
**So that** the home page recommends study activities that match how I learn best.

## Business Value

Currently the home page "smart CTA" logic in `getSuggestedActivity` is rule-based (flashcards due → suggest flashcards). Learning Style Detection makes recommendations data-driven: it analyzes which modules a user engages with most, which they skip, and their performance patterns — then surfaces personalized recommendations on the home page, increasing engagement and retention.

---

## Acceptance Criteria (BDD)

### AC1: Learning Style Analysis API
**Given** a user has activity history
**When** the learning style API is called
**Then** return a profile with:
- Primary style: `visual` | `reading` | `conversational` | `practice`
- Module engagement scores (% time per module)
- Strength/weakness areas
- Top 3 personalized suggestions

### AC2: Style Detection Logic
**Given** the analytics data for a user
**When** the style is computed
**Then** map module activity to learning styles:
- **visual**: high reading + flashcard usage
- **reading**: high reading + grammar lesson engagement
- **conversational**: high chatbot + voice practice usage
- **practice**: high grammar quiz + daily challenge + exercise completion
**And** return the dominant style with confidence %

### AC3: Profile Card on Home Page
**Given** a user is on the home page
**When** their learning style has been detected
**Then** show a "Learning Style" card displaying:
- Style name + icon + brief description
- Module engagement breakdown (mini bar chart)
- 3 "Gợi ý cho bạn" recommendation links

### AC4: Personalized Recommendations
**Given** the user's learning style is known
**When** suggestions are generated
**Then** recommend activities that:
1. Reinforce their preferred learning style
2. Nudge them toward modules they're neglecting
3. Consider their current CEFR level
**And** each recommendation links to a specific page

### AC5: Fallback for New Users
**Given** a user has fewer than 10 activities
**When** the learning style card would render
**Then** show a "Chưa đủ dữ liệu" message
**And** show "Hãy học thêm X buổi nữa" with progress indicator

---

## Technical Requirements

### New API Endpoint

#### `GET /api/learning-style`
- No body needed (uses authenticated userId)
- Queries `activityLog` for module engagement distribution
- Returns:
```json
{
  "hasEnoughData": true,
  "activitiesCount": 47,
  "style": {
    "primary": "practice",
    "confidence": 0.72,
    "description": "Bạn học tốt nhất qua bài tập thực hành"
  },
  "engagement": {
    "grammar_quiz": 0.30,
    "chatbot_session": 0.20,
    "flashcard_review": 0.15,
    "writing_practice": 0.12,
    "grammar_lesson": 0.08,
    "study_set": 0.05,
    "voice_practice": 0.05,
    "listening_practice": 0.03,
    "daily_challenge": 0.02
  },
  "suggestions": [
    { "label": "Luyện thêm Grammar Quiz", "href": "/grammar-quiz", "reason": "Đây là điểm mạnh của bạn" },
    { "label": "Thử luyện nghe TOEIC", "href": "/listening", "reason": "Bạn chưa luyện kỹ năng này" },
    { "label": "Học theo chủ đề", "href": "/study-sets", "reason": "Kết hợp nhiều kỹ năng cùng lúc" }
  ]
}
```

### No New Database Tables
- Pure computation from existing `activityLog` data
- No persisted style — recomputed on each call (lightweight query)

### File Structure

```
app/
  api/
    learning-style/
      route.ts               ← New: style analysis endpoint
components/
  app/
    shared/
      LearningStyleCard.tsx  ← New: home page card
```

---

## Developer Context

### Style Detection Algorithm

```typescript
const STYLE_MAP: Record<string, string[]> = {
  visual: ["flashcard_review", "study_set"],
  reading: ["grammar_lesson", "study_set", "listening_practice"],
  conversational: ["chatbot_session", "voice_practice"],
  practice: ["grammar_quiz", "daily_challenge", "writing_practice"],
};

function detectStyle(engagement: Record<string, number>): { primary: string; confidence: number } {
  const scores: Record<string, number> = {};
  for (const [style, modules] of Object.entries(STYLE_MAP)) {
    scores[style] = modules.reduce((sum, m) => sum + (engagement[m] ?? 0), 0);
  }
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return {
    primary: sorted[0][0],
    confidence: total > 0 ? sorted[0][1] / total : 0,
  };
}
```

### Home Page Integration

The `LearningStyleCard` should be inserted after the stats row and before the study plan section on the home page. It replaces/enhances the existing `getSuggestedActivity` logic with data-driven recommendations.

### Style Descriptions (Vietnamese)

```typescript
const STYLE_INFO: Record<string, { icon: string; name: string; description: string }> = {
  visual: { icon: "👁️", name: "Học trực quan", description: "Bạn học tốt nhất qua hình ảnh và flashcard" },
  reading: { icon: "📖", name: "Học qua đọc", description: "Bạn thích đọc và phân tích ngữ pháp" },
  conversational: { icon: "💬", name: "Học qua giao tiếp", description: "Bạn tiến bộ nhanh qua hội thoại và luyện nói" },
  practice: { icon: "✍️", name: "Học qua thực hành", description: "Bạn học tốt nhất qua bài tập và thử thách" },
};
```

### Dependencies

| Dependency | Location | Usage |
|------------|----------|-------|
| `activityLog` | `lib/db/schema.ts` | Query engagement data |
| `useDashboard` | `hooks/useDashboard.ts` | Home page data fetching (may extend) |
| Home page | `app/(app)/home/page.tsx` | Card integration point |

---

## Testing Checklist

- [ ] API returns learning style for users with >10 activities
- [ ] API returns `hasEnoughData: false` for new users
- [ ] Engagement percentages sum to ~1.0
- [ ] Style detection correctly maps module activity
- [ ] Suggestions include both strengths and weaknesses
- [ ] LearningStyleCard renders on home page
- [ ] Fallback state for new users shows encouragement
- [ ] Mini bar chart displays correctly
- [ ] Suggestion links navigate to correct pages
- [ ] `pnpm build` passes
- [ ] Dark/light mode correct

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] `pnpm build` succeeds with zero errors
- [ ] Code review completed and patches applied
- [ ] Committed and pushed to master
