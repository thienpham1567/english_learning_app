# PRD: Reading Practice — Interactive Article Reader

> **Product Manager:** John
> **Date:** 2026-04-12
> **Status:** Draft
> **Epic:** 12 — Reading Practice

---

## 1. Overview

Build an interactive English reading practice module that fetches real articles from The Guardian API and enables learners to look up words inline and see grammar pattern analysis — all without leaving the reading flow.

## 2. Problem Statement

English learners reading real-world articles face 3 friction points:
1. **Vocabulary gaps** — must switch to dictionary apps, losing reading flow
2. **Grammar confusion** — don't recognize patterns (passive, conditionals, etc.)
3. **No learning integration** — vocab looked up is never saved for review

## 3. Target Users

- TOEIC/IELTS candidates (B1-C1) practicing reading comprehension
- General learners building English reading habits

## 4. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Engagement | Articles read per user per week | ≥ 3 |
| Vocabulary | Words saved to flashcards per article | ≥ 2 |
| Retention | Return rate to reading page within 7 days | ≥ 40% |

## 5. Content Source

### 5.1 The Guardian Open Platform API

- **URL:** `https://content.guardianapis.com/search`
- **Auth:** API key (free developer tier — 500 calls/day)
- **Data:** Full article text via `show-fields=all`
- **Categories:** `world`, `science`, `technology`, `environment`, `culture`, `business`
- **License:** Non-commercial use, attribution required

### 5.2 Environment Variable

```
GUARDIAN_API_KEY=<developer-key>
```

## 6. Feature Requirements

### Story 12.1: Guardian API Integration & Article Feed

**As a** learner
**I want to** browse curated English articles by category
**So that** I can find interesting content to practice reading

**Acceptance Criteria:**
- [ ] AC1: API route `/api/reading/articles` fetches from Guardian API with caching (5-minute TTL)
- [ ] AC2: Response includes: title, body (HTML → clean text), author, date, thumbnail, section, wordCount
- [ ] AC3: Articles filterable by category via query param `?section=science`
- [ ] AC4: Article feed page at `/reading` displays cards in responsive grid
- [ ] AC5: Each card shows: thumbnail, title, source badge, read time, difficulty estimate
- [ ] AC6: Difficulty estimated client-side: avg word length < 5 = B1, < 6 = B2, else C1
- [ ] AC7: Click card navigates to `/reading/[guardianId]` (URL-encoded Guardian API ID)

### Story 12.2: Interactive Article Reader with Tap-to-Translate

**As a** learner
**I want to** click any word in the article to see its meaning instantly
**So that** I can learn vocabulary in context without switching apps

**Acceptance Criteria:**
- [ ] AC1: Article reader page at `/reading/[articleId]` fetches article by Guardian API ID
- [ ] AC2: Article body rendered as interactive text — every word is clickable
- [ ] AC3: Clicking a word triggers existing `useMiniDictionary` hook → shows MiniDictionary popup
- [ ] AC4: Popup shows: word, pronunciation, part of speech, Vietnamese meaning, example
- [ ] AC5: "Lưu từ" button saves to user's vocabulary (reuse existing `/api/vocabulary` endpoint)
- [ ] AC6: "Nghe" button plays pronunciation via Web Speech API
- [ ] AC7: Stats bar at bottom shows: words looked up count, words saved count
- [ ] AC8: Previously saved words are visually marked (dotted underline + accent color)
- [ ] AC9: Mobile: dictionary appears as bottom sheet; Desktop: floating popup near clicked word

### Story 12.3: AI Grammar Pattern Analysis

**As a** learner
**I want to** see grammar patterns identified in each paragraph
**So that** I can learn grammar rules in real-world context

**Acceptance Criteria:**
- [ ] AC1: API route `/api/reading/grammar` accepts paragraph text, returns grammar patterns
- [ ] AC2: Uses Gemini API to identify patterns: tense, voice, clause type, modifiers
- [ ] AC3: Response includes: pattern name (EN), explanation (VI), highlighted phrase, color code
- [ ] AC4: Grammar panel appears as collapsible section after each paragraph
- [ ] AC5: Default collapsed with badge showing pattern count (e.g., "💡 3 patterns")
- [ ] AC6: Expand to see each pattern with color-coded explanation
- [ ] AC7: Grammar analysis is lazy-loaded (triggered when paragraph enters viewport)
- [ ] AC8: Results cached per paragraph hash to avoid duplicate API calls

### Story 12.4: Navigation Integration

**As a** learner
**I want to** access Reading Practice from the sidebar and bottom nav
**So that** I can easily find the feature

**Acceptance Criteria:**
- [ ] AC1: Add "Luyện đọc" item to sidebar nav with `FileTextOutlined` icon
- [ ] AC2: Add to mobile bottom tab "Học" hub menu
- [ ] AC3: Add reading activity to home dashboard "Kế hoạch hôm nay" section

## 7. API Design

### GET `/api/reading/articles`

```typescript
// Query params
?section=science&page=1&pageSize=10

// Response
{
  articles: [{
    id: string,          // Guardian API ID (e.g., "science/2026/apr/10/climate")
    title: string,
    body: string,        // Clean text (HTML stripped)
    author: string,
    date: string,        // ISO date
    thumbnail: string,   // Image URL
    section: string,     // Category
    wordCount: number,
    readTime: number,    // minutes
    difficulty: "B1" | "B2" | "C1",
  }],
  currentPage: number,
  totalPages: number,
}
```

### GET `/api/reading/article/[id]`

```typescript
// Single article by encoded Guardian ID
// Response: same shape as above but single article
```

### POST `/api/reading/grammar`

```typescript
// Request
{ paragraph: string }

// Response
{
  patterns: [{
    name: string,        // "Present Perfect"
    explanation: string, // Vietnamese explanation
    phrase: string,      // "have conducted"
    color: string,       // "green" | "blue" | "yellow" | "purple"
  }]
}
```

## 8. Technical Constraints

- Guardian API: 500 calls/day free tier → cache aggressively (5-min TTL for list, 1-hour for single article)
- Grammar AI: Gemini API cost → lazy-load per paragraph, cache by content hash
- Attribution: Must display "Powered by The Guardian" on all article pages

## 9. Out of Scope (V1)

- User-uploaded articles
- Reading speed tracking
- Comprehension quizzes per article
- Text-to-speech for full article
- Bookmarking/reading list

## 10. Dependencies

- Guardian API key (env var)
- Existing: MiniDictionary component, useMiniDictionary hook, vocabulary API, Gemini API
