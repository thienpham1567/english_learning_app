# 🎨 UX Design Spec: Reading Practice Page

> **Designer:** Sally (UX Designer)
> **Date:** 2026-04-12
> **Feature:** Interactive Reading with Inline Dictionary & Grammar Analysis
> **Route:** `/reading`

---

## 1. User Problem

Khi đọc báo tiếng Anh, learners phải liên tục chuyển tab để tra từ → **mất flow đọc** → giảm motivation. Không có công cụ nào kết hợp **đọc báo thực tế** + **tra từ inline** + **phân tích ngữ pháp** trong cùng 1 trải nghiệm.

## 2. User Persona

- **Primary:** TOEIC/IELTS learners (B1-B2) muốn cải thiện Reading Comprehension
- **Secondary:** General English learners muốn đọc tin tức bằng tiếng Anh

## 3. Information Architecture

```
/reading (Article Feed)
   ├── Category filter tabs (World, Science, Tech, Environment, Culture)
   ├── Article card grid
   └── /reading/[articleId] (Article Reader)
        ├── Article header (title, author, date, source)
        ├── Article body (interactive text)
        │    ├── Clickable words → Mini Dictionary popup
        │    └── Grammar highlights (colored underlines)
        ├── Grammar panel (collapsible sidebar/bottom sheet)
        └── Actions bar (save article, share, vocabulary count)
```

## 4. Screen Flows

### 4.1 Article Feed (`/reading`)

**Layout:** Follows existing page pattern (header + scrollable content)

```
┌──────────────────────────────────────────┐
│  ĐỌC HIỂU                               │
│  Luyện đọc                               │
├──────────────────────────────────────────┤
│                                          │
│  [World] [Science] [Tech] [Culture] [All]│
│                                          │
│  ┌─────────────┐ ┌─────────────┐        │
│  │ 📰          │ │ 📰          │        │
│  │ Climate..   │ │ AI Ethics.. │        │
│  │             │ │             │        │
│  │ The Guardian │ │ The Guardian│        │
│  │ 5 min read  │ │ 3 min read  │        │
│  │ B2 level    │ │ C1 level    │        │
│  └─────────────┘ └─────────────┘        │
│                                          │
│  ┌─────────────┐ ┌─────────────┐        │
│  │ 📰          │ │ 📰          │        │
│  │ Space...    │ │ Health...   │        │
│  │ ...         │ │ ...         │        │
│  └─────────────┘ └─────────────┘        │
└──────────────────────────────────────────┘
```

**Article Card Elements:**
- Thumbnail image (from Guardian API)
- Title (bold, 2 lines max)
- Source badge ("The Guardian")
- Estimated reading time (word count / 200 wpm)
- Difficulty badge (B1/B2/C1 — estimated by word complexity)
- Category pill

### 4.2 Article Reader (`/reading/[articleId]`)

**Desktop Layout:** Full-width reader with floating grammar panel

```
┌──────────────────────────────────────────────────┐
│  ← Quay lại     📰 The Guardian · Science        │
├──────────────────────────────────────────────────┤
│                                                  │
│   Climate Change: Scientists Warn of             │
│   Accelerating Ice Loss                          │
│   ─────────────────────────────                  │
│   By John Smith · Apr 10, 2026 · 5 min read      │
│                                                  │
│   The ̲r̲e̲s̲e̲a̲r̲c̲h̲e̲r̲s̲ have ̲c̲o̲n̲d̲u̲c̲t̲e̲d̲ an   │
│   ̲e̲x̲t̲e̲n̲s̲i̲v̲e̲ study showing that                │
│   global temperatures have ̲s̲i̲g̲n̲i̲f̲i̲c̲a̲n̲t̲l̲y̲      │
│   increased over the past decade.                │
│                                                  │
│   ┌─────────────────────────────┐                │
│   │ 📖 significantly            │                │
│   │ /sɪɡˈnɪfɪkəntli/    🔊    │                │
│   │ adv. một cách đáng kể       │                │
│   │ ─────────────────           │                │
│   │ Ex: "The results differ     │                │
│   │ significantly from..."      │                │
│   │ [⭐ Lưu từ] [📋 Xem thêm]  │                │
│   └─────────────────────────────┘                │
│                                                  │
│   ┌─ Grammar Highlights ────────────────┐        │
│   │ 💡 3 patterns found in this paragraph│        │
│   │                                      │        │
│   │ 🟢 Present Perfect                   │        │
│   │    "have conducted" — hành động       │        │
│   │    hoàn thành với kết quả hiện tại    │        │
│   │                                      │        │
│   │ 🔵 Adverb + Verb                     │        │
│   │    "significantly increased"          │        │
│   │                                      │        │
│   │ 🟡 Relative Clause                   │        │
│   │    "showing that..." — mệnh đề       │        │
│   │    quan hệ bổ sung thông tin          │        │
│   └──────────────────────────────────────┘        │
│                                                  │
│  ── Stats Bar ───────────────────────────        │
│  📖 3 từ đã tra  ⭐ 1 từ đã lưu  💡 5 grammar   │
└──────────────────────────────────────────────────┘
```

**Mobile Layout:** Bottom sheet for dictionary + grammar

```
┌──────────────────────┐
│ ← 📰 Science         │
├──────────────────────┤
│                      │
│ Climate Change:      │
│ Scientists Warn...   │
│                      │
│ The researchers have │
│ conducted an         │
│ extensive study...   │
│                      │
│ [💡 3 grammar]       │
│                      │
├──────────────────────┤ ← Bottom sheet (swipe up)
│ 📖 significantly     │
│ adv. đáng kể         │
│ [⭐ Lưu] [🔊 Nghe]   │
└──────────────────────┘
```

## 5. Interaction Patterns

### 5.1 Word Click/Tap
1. User taps any word in article body
2. Word gets highlighted with underline animation
3. Mini Dictionary popup appears (reuse existing `MiniDictionary` component)
4. User can: listen pronunciation, save to vocabulary, view more details
5. Popup dismisses on click outside or tap another word

### 5.2 Grammar Analysis
- **Auto-analyze:** When article loads, AI analyzes grammar patterns per paragraph
- **Lazy load:** Only analyze visible paragraphs (IntersectionObserver)
- **Display:** Collapsible panel after each paragraph (default collapsed)
- **Tap to expand:** Shows pattern name + Vietnamese explanation + highlighted text

### 5.3 Article Navigation
- **Category tabs:** Horizontal scroll on mobile, fixed on desktop
- **Pull to refresh:** Fetch new articles
- **Infinite scroll:** Load more articles on scroll down
- **Back button:** Return to article feed with scroll position preserved

## 6. Component Inventory

| Component | Status | Notes |
|---|---|---|
| `ArticleFeed` | 🆕 New | Grid of article cards |
| `ArticleCard` | 🆕 New | Card with thumbnail, title, meta |
| `ArticleReader` | 🆕 New | Full article view with interactive text |
| `InteractiveText` | 🆕 New | Wraps text, makes each word clickable |
| `GrammarPanel` | 🆕 New | Collapsible grammar analysis per paragraph |
| `MiniDictionary` | ✅ Existing | Reuse from shared components |
| `useMiniDictionary` | ✅ Existing | Reuse hook |
| `CategoryTabs` | 🆕 New | Filter tabs for article categories |
| `ReadingStats` | 🆕 New | Bottom stats bar (words looked up, saved) |

## 7. Design Tokens

- **Card radius:** `var(--radius-xl)`
- **Card background:** `var(--surface)`
- **Header gradient:** `linear-gradient(180deg, var(--surface), var(--bg))`
- **Grammar colors:** Green (tense), Blue (modifier), Yellow (clause), Purple (passive)
- **Clickable word:** `border-bottom: 1px dashed var(--accent-muted)` on hover
- **Selected word:** `background: var(--accent-light); border-bottom: 2px solid var(--accent)`

## 8. Responsive Breakpoints

| Breakpoint | Article Grid | Dictionary | Grammar |
|---|---|---|---|
| Mobile (<640px) | 1 column | Bottom sheet | Inline collapsed |
| Tablet (640-920px) | 2 columns | Floating popup | Inline collapsed |
| Desktop (>920px) | 2-3 columns | Floating popup | Inline expanded |

## 9. Accessibility

- All interactive words have `role="button"` + `tabindex="0"`
- Grammar panel uses `aria-expanded` + keyboard toggle
- Color-blind safe: grammar patterns use icons + text labels (not just color)
- Reading time and difficulty level announced by screen reader
