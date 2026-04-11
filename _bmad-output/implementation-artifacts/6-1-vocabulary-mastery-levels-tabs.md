# Story 6.1: Vocabulary Mastery Levels & Tabs

Status: ready-for-dev

## Story

As a learner,
I want to see which words I've mastered and filter by learning stage,
so that I can focus on words that need more practice.

## Acceptance Criteria

1. **Mastery indicator:** Each word shows a mastery indicator: 🟡 New (no flashcard reviews), 🔵 Learning (SM-2 interval < 7 days), 🟢 Mastered (interval ≥ 21 days).

2. **Mastery data from API:** Mastery data is calculated from `flashcard_progress` at the API level (new field in vocabulary response).

3. **Tab navigation:** 3 tabs: "Tất cả" | "Đã lưu ⭐" | "TOEIC 📋".

4. **Inline styles migration:** The page uses inline styles with CSS custom properties (migrated from Tailwind utility classes).

5. **Existing functionality preserved:** All existing functionality (search, filters, delete, undo) works unchanged.

## Tasks / Subtasks

- [ ] Task 1: Add mastery data to vocabulary API
  - [ ] LEFT JOIN `flashcard_progress` in `/api/vocabulary` GET route
  - [ ] Add `mastery` field to response: `"new" | "learning" | "mastered"`
  - [ ] Logic: no progress row → "new", interval < 7 → "learning", interval < 21 → "learning", interval ≥ 21 → "mastered"
  - [ ] Update `VocabularyEntry` type in `page.tsx` to include `mastery`

- [ ] Task 2: Display mastery indicator on each entry
  - [ ] Add colored dot/emoji next to each word: 🟡 New, 🔵 Learning, 🟢 Mastered
  - [ ] Position: before the CEFR level badge on each row
  - [ ] Include tooltip or aria-label for clarity

- [ ] Task 3: Tab navigation ("Tất cả" | "Đã lưu ⭐" | "TOEIC 📋")
  - [ ] Add tab state: `"all" | "saved" | "toeic"`
  - [ ] "Tất cả" tab: shows current vocabulary list (default)
  - [ ] "Đã lưu ⭐" tab: filters to `saved === true` entries (replaces current inline "Đã lưu" filter button)
  - [ ] "TOEIC 📋" tab: shows existing `ToeicVocabularySection` (already in the page)
  - [ ] Tab bar: styled as horizontal underline tabs below the header
  - [ ] Move `ToeicVocabularySection` to only show when TOEIC tab active

- [ ] Task 4: Migrate Tailwind → inline styles with CSS custom props
  - [ ] **IMPORTANT**: AC says "uses inline styles with CSS custom properties (migrated from Tailwind)"
  - [ ] Convert all Tailwind `className` strings to inline `style={{ }}` objects using CSS vars
  - [ ] This is a large file (442 lines) — systematic conversion needed
  - [ ] Keep the same visual design, just replace the implementation

## Dev Notes

### Files to Modify
| File | Lines | What Changes |
|------|-------|-------------|
| `app/api/vocabulary/route.ts` | 37 | LEFT JOIN flashcard_progress, add mastery field |
| `app/(app)/my-vocabulary/page.tsx` | 442 | Add mastery indicator, tab nav, Tailwind→inline migration |

### Current API Response Shape
```ts
type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: "word" | "phrasal_verb" | "idiom" | null;
};
```

### Target API Response Shape (after Task 1)
```ts
type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: "word" | "phrasal_verb" | "idiom" | null;
  mastery: "new" | "learning" | "mastered";  // NEW
};
```

### Mastery Calculation SQL
```sql
LEFT JOIN flashcard_progress fp
  ON fp.user_id = uv.user_id AND fp.query = uv.query

CASE
  WHEN fp.id IS NULL THEN 'new'
  WHEN fp.interval < 21 THEN 'learning'
  ELSE 'mastered'
END AS mastery
```

### DB Schema (flashcard_progress)
```ts
// lib/db/schema.ts L58-73
flashcardProgress = pgTable("flashcard_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  query: text("query").notNull(),
  easeFactor: real("ease_factor").default(2.5),
  interval: integer("interval").default(0),  // ← mastery derives from this
  repetitions: integer("repetitions").default(0),
  nextReview: timestamp("next_review"),
  updatedAt: timestamp("updated_at"),
});
```

### Tab Navigation Target
```
┌──────────────────────────────────────────┐
│ [Tất cả]  [Đã lưu ⭐]  [TOEIC 📋]     │
└──────────────────────────────────────────┘
```
- "Tất cả": shows full vocabulary list + search + filters
- "Đã lưu ⭐": filters list to saved only (replaces existing savedOnly toggle)
- "TOEIC 📋": shows `ToeicVocabularySection` content only

### Mastery Indicator UI
```
🟡 happy   B1  word     2 giờ trước
🔵 run     A2  word     1 ngày trước
🟢 take off B2  phrasal  5 ngày trước
```

### CRITICAL: Do NOT
- **Do NOT** change the delete/undo mechanism
- **Do NOT** modify VocabularyDetailSheet or VocabularyStatsBar
- **Do NOT** change the filter logic (search, CEFR, entryType) — only migrate presentation
- **Do NOT** remove ToeicVocabularySection — move it into the TOEIC tab

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 6.1] — AC definition
- [Source: app/api/vocabulary/route.ts] — Current API query
- [Source: app/(app)/my-vocabulary/page.tsx] — Current page (442 lines)
- [Source: lib/db/schema.ts L58-73] — flashcard_progress table schema

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
