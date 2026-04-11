---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
lastStep: 14
inputDocuments:
- \_bmad-output/implementation-artifacts/1-1-flashcard-spaced-repetition.md
- \_bmad-output/implementation-artifacts/1-2-grammar-quiz.md
- \_bmad-output/implementation-artifacts/1-3-writing-practice.md
- \_bmad-output/implementation-artifacts/1-4-daily-challenge.md
- \_bmad-output/implementation-artifacts/deferred-work.md

---

# UX Design Specification english_learning_app

**Author:** Thienpham
**Date:** 2026-04-10

---

## Executive Summary

### Project Vision

ThienGlish is a comprehensive English learning platform designed for Vietnamese learners preparing for IELTS, TOEIC, or seeking native-level fluency. The app unifies seven learning modalities — AI tutoring, structured dictionary, personal vocabulary, spaced-repetition flashcards, grammar quizzes, IELTS writing practice, and daily challenges — into a single cohesive experience that builds consistent learning habits through gamification and AI-powered personalization.

The UX redesign aims to transform these individually functional modules into a unified, delightful learning journey that feels premium, motivating, and effortless to navigate — especially for learners who juggle multiple study goals daily.

### Target Users

**Primary Persona: Vietnamese English Learners (18–35)**

- Intermediate to upper-intermediate level (B1–C1)
- Preparing for standardized tests (IELTS 6.0–7.5, TOEIC 600–900)
- Use the app daily on both desktop and mobile
- Motivated but prone to dropping off without habit reinforcement
- Expect Vietnamese UI language with English learning content
- Comfortable with modern web apps but not power users

**Secondary Persona: Casual Fluency Seekers**

- Not test-focused, want conversational improvement
- Use the chatbot and dictionary most frequently
- Shorter sessions, mobile-dominant
- Value fun and low-friction interactions over structured study plans

### Key Design Challenges

1. **Module Fragmentation** — Seven features exist as independent silos. Users must context-switch between chatbot, dictionary, flashcards, quizzes, writing, and daily challenges without guidance on what to do next or how activities connect to their progress.

2. **No Learning Journey** — There's no dashboard, progress overview, or recommended learning path. A returning user sees whichever module they were last in, with no indication of what's due (flashcards? daily challenge? writing practice?).

3. **Inconsistent Interaction Patterns** — Each module was built independently with slightly different state machines (loading/active/summary vs. idle/generating/writing/feedback). The user mental model shifts with each module.

4. **Mobile Experience** — The current sidebar-and-content layout is desktop-first. Mobile learners (likely the majority for daily habit use) need a navigation pattern that prioritizes quick access to daily activities.

5. **Motivation and Retention** — Streak tracking exists only in Daily Challenge. There's no unified progress system, XP, or visual reward mechanism spanning the entire app to keep learners coming back.

6. **Onboarding Absence** — New users land on the chatbot with no guidance on which persona to choose, what the app offers, or how to build a study routine.

### Design Opportunities

1. **Unified Dashboard / Home Screen** — A "Today" view showing what's due: flashcard reviews, daily challenge status, streak info, recent vocabulary, and suggested activities. This becomes the learning hub.

2. **Cross-Module Vocabulary Flow** — Words encountered in chatbot conversations, grammar quizzes, or writing feedback can be 1-tap saved to vocabulary → automatically appear in flashcard reviews. This creates a natural learning loop.

3. **Progressive Gamification** — Extend streaks and badges system app-wide. Add XP for each activity, weekly goals, and visual progress that spans all modules — not just daily challenges.

4. **Adaptive Learning Path** — AI can analyze user activity (weak grammar topics, flashcard difficulty, writing band scores) and suggest which module to focus on next.

5. **Mobile-First Navigation** — Bottom tab bar for mobile with quick-access to the 3-4 most-used features. The sidebar becomes desktop-only, while mobile gets a streamlined nav.

6. **Micro-Interactions & Emotional Design** — Celebration moments (streak milestones, vocabulary growth, quiz improvements), progress animations, and satisfying feedback loops that make learning feel rewarding.

## Core User Experience

### Defining Experience

**The Daily Learning Loop** is the core experience. Users open ThienGlish → see a personalized Dashboard showing streak, due activities, and suggested next steps → complete 2-3 quick activities (flashcards, daily challenge, quick chat) in 10-15 minutes → see visible progress → come back tomorrow.

The AI chatbot remains the deepest engagement channel, but the Dashboard is the daily entry point that drives retention. Every other module is a spoke from this hub.

### Platform Strategy

**Adaptive responsive web app** — not purely mobile-first, not desktop-first.

| Breakpoint | Navigation | Layout |
|---|---|---|
| ≤768px (mobile) | Bottom tab bar: Home, Chat, Learn, Profile | Single-column, card-based, full-screen immersive for flashcards |
| 769–1024px (tablet) | Collapsible sidebar | Two-column where helpful |
| ≥1025px (desktop) | Full sidebar with all 7+ nav items | Multi-panel layouts (chat + conversation list, dictionary search + results) |

Mobile bottom tab "Learn" groups: Flashcards, Grammar Quiz, Writing Practice, Daily Challenge into a sub-hub to avoid navigation overload.

### Effortless Interactions

1. **Zero-decision app opens** — Dashboard shows exactly what to do next
2. **1-tap vocabulary save from anywhere** — Chatbot, quiz, writing feedback → all feed the flashcard pipeline
3. **Auto-advancing sessions** — Flashcards, quizzes, daily challenges flow without navigation decisions
4. **Smart notification badges** — Sidebar/tab badges showing due counts and streak status
5. **Contextual word lookup** — Tap any English word in chatbot or quiz → inline dictionary popup

### Critical Success Moments

1. **First 30 seconds** — New user → welcoming Dashboard with clear "Start here" CTA
2. **First vocabulary loop** — Save word from dictionary → see it appear in flashcard session
3. **7-day streak unlock** — Satisfying badge animation that hooks the daily habit
4. **Band score improvement** — Writing scores tracked visually over time
5. **AI personalization moment** — Quiz weakness → chatbot proactively suggests practice

### Experience Principles

1. **Dashboard First, Depth Second** — Every session starts at the hub
2. **Everything Connects** — Vocabulary flows into flashcards, quiz weaknesses inform chatbot suggestions
3. **Progress Is Visible** — Every action produces tangible, animated feedback
4. **Low Friction, High Reward** — Minimize taps to start, maximize dopamine on completion
5. **Vietnamese Heart, English Brain** — UI speaks Vietnamese, content teaches English
6. **Consistent, Not Identical** — Unified card/motion/header patterns across all pages, but each module keeps its unique personality

---

## Page-by-Page Redesign Specifications

### Page 0: Sign-In / Landing

**Current state:** Split-screen — left half has a Vietnamese quote on a dark olive background, right half has logo + "Xin chào" + Google sign-in button. Clean but tells the user nothing about what the app does.

**Redesign spec:**

- **Hero section** (left/top on mobile): Animated showcase of app features — rotating screenshots or illustrated cards showing flashcards, chatbot, dictionary, and quiz in action. Use subtle parallax or fade-between animation.
- **Value proposition** (right/bottom): Replace the generic quote with 3 benefit bullets:
  - "🎯 Luyện IELTS & TOEIC với gia sư AI"
  - "📚 Tra từ, lưu từ, ôn tập tự động"
  - "🔥 Thử thách mỗi ngày, giữ vững streak"
- **Social proof**: Show a small stat like "Đã tra cứu 10,000+ từ" or "500+ bài viết đã được chấm"
- **CTA**: Keep Google sign-in button but make it larger and more prominent. Add a "Xem thêm" link below that scrolls to a feature overview section.
- **Feature preview section** (scrollable below fold): 4 cards showing key features with icons and 1-sentence descriptions. Only visible if user scrolls.

---

### Page 1: Home Dashboard (NEW)

**Current state:** Does not exist. Users land directly on the chatbot.

**Redesign spec — Layout:**

```
┌──────────────────────────────────────────────────────┐
│  [Greeting Card]                                     │
│  "Xin chào, Thiên! 🔥 5 ngày streak"                │
│  XP: 1,240 | Level: Intermediate                    │
├─────────────────────┬────────────────────────────────┤
│  [Today's Plan]     │  [Quick Actions]               │
│  □ 5 flashcards due │  💬 Chat with Simon            │
│  □ Daily challenge  │  📖 Look up a word             │
│  □ Writing practice │  🧠 Grammar quiz               │
│  ✓ 2 done today     │                                │
├─────────────────────┴────────────────────────────────┤
│  [Recent Vocabulary]  apple · break out · get along  │
├──────────────────────────────────────────────────────┤
│  [Weekly Progress Chart]                             │
│  Mon ██ Tue ████ Wed ██████ Thu ░░ Fri ░░            │
├──────────────────────────────────────────────────────┤
│  [Streak & Badges]                                   │
│  🔥5 days | 🏆 Best: 12 | Badges: ⭐⭐🔒🔒            │
└──────────────────────────────────────────────────────┘
```

**Components:**
1. **GreetingCard** — Welcome message with streak fire animation, XP count, and CEFR level indicator. Time-aware greeting (Chào buổi sáng/chiều/tối).
2. **TodaysPlan** — Checklist of due/suggested activities with completion states. Clickable → navigates to module. Items ordered by priority: due flashcards > daily challenge > suggested activities.
3. **QuickActions** — 3-4 pill buttons for immediate access to main activities.
4. **RecentVocabulary** — Horizontal scroll strip of last 10 looked-up words. Tap → dictionary detail.
5. **WeeklyProgress** — Simple bar chart (CSS-only, no chart library) showing XP or activity count per day for the current week.
6. **StreakBadges** — Current streak with fire animation, best streak record, and badge gallery row.

**API needs:** New `GET /api/dashboard` endpoint aggregating: flashcard due count, daily challenge status, streak info, recent vocabulary, weekly activity counts.

---

### Page 2: AI Chatbot

**Current state:** Conversation list sidebar + chat window with persona switcher, suggestion cards, and message input. Well-built but isolated from the rest of the app.

**Redesign upgrades:**

1. **Interactive word highlighting** — After each assistant message, detect English vocabulary words and make them tappable. On tap, show a mini floating card with:
   - Word, phonetic, part of speech
   - Vietnamese translation
   - "Lưu" (Save) button → saves to vocabulary + flashcard pipeline
   - "Tra cứu" → opens dictionary page with this word
   
2. **Persona cards upgrade** — Replace the dropdown persona switcher with visual persona cards at the top of new conversations. Each card shows the avatar, name, specialty, and 1-line description. Feels like choosing a tutor.

3. **Smart suggestions** — After a quiz or writing session, the chatbot should offer contextual follow-up: "Bạn vừa sai câu conditionals. Muốn luyện thêm không?" (Requires a lightweight event system between modules.)

4. **Conversation summary** — Long conversations get a collapsible summary at the top showing key vocabulary learned, errors corrected, and topics discussed.

5. **Typing indicator upgrade** — Show the persona avatar with animated dots (current) + a subtle "Simon đang suy nghĩ..." text.

---

### Page 3: Dictionary

**Current state:** Two-column grid — search panel (left) + result card (right). Clean and functional. Thesaurus is in a drawer.

**Redesign upgrades:**

1. **Recent lookups strip** — Horizontal scroll bar above the search panel showing the last 8 looked-up words as small chips. Quick re-access without re-typing.

2. **Word of the day card** — Small card in the search panel showing a featured word (randomly selected from B1-B2 vocabulary cache). Changes daily. "Đã biết?" → mark as known. "Lưu" → save to vocabulary.

3. **Inline thesaurus toggle** — Replace the full-screen drawer with an expand/collapse section below the result card. Synonyms and antonyms shown as clickable chips inline. Less disruptive than a drawer modal.

4. **Example sentence highlighting** — In the result card's example sentences, highlight the target word with the accent color. Make examples feel more scannable.

5. **"Từ liên quan" section** — Below the result, show 4-6 related words from the same CEFR level or same semantic field. Creates browsing discovery.

6. **Pronunciation playback** — If the word has IPA/phonetics, add a speaker icon that uses Web Speech API for pronunciation (free, no API needed). Even approximate TTS is better than nothing.

---

### Page 4: My Vocabulary

**Current state:** Flat list with filters (CEFR, type, saved), search, TOEIC categories section, and a detail drawer. Uses Tailwind classes (needs migration to inline styles post-Ant Design refactor).

**Redesign upgrades:**

1. **Mastery level indicators** — Each word shows a visual mastery state:
   - 🟡 **New** — Just saved, never reviewed in flashcards
   - 🔵 **Learning** — Reviewed 1-3 times, SM-2 interval < 7 days
   - 🟢 **Mastered** — SM-2 interval ≥ 21 days
   - Calculated from flashcard_progress data at API level.

2. **Stats header upgrade** — Show: Total words | Mastered | Learning | New | Saved. As animated counters with subtle color coding.

3. **Group by theme** — Add a "view mode" toggle: List (current) vs. Grouped (by CEFR level, entry type, or theme). Grouped view shows collapsible sections.

4. **TOEIC categories as tabs** — Elevate the TOEIC section from an inline section to a tab alongside "Lịch sử tra cứu" and "Đã lưu". Three tabs: All | Saved ⭐ | TOEIC 📋.

5. **Quick quiz from vocabulary** — "Ôn tập nhanh" button → generates a 5-question mini-quiz using only the user's saved vocabulary. Deep integration with grammar quiz engine.

6. **Migrate to inline styles** — Current page uses Tailwind classes which were supposed to be migrated to Ant Design/inline styles. This redesign should complete that migration.

---

### Page 5: Flashcards

**Current state:** Card with header, centered layout, 3D flip animation, 4 rating buttons (Quên/Khó/Ổn/Dễ), progress bar at top. Solid core but feels like a utility, not an experience.

**Redesign upgrades:**

1. **Full-screen immersive mode** — Remove the module header when in active review. Just: progress bar (thin) at very top, card centered, rating buttons at bottom. Maximum focus. Sidebar stays accessible but the card fills the content area.

2. **Card design upgrade:**
   - **Front**: Large headword (36px), phonetic in muted text, CEFR badge as a floating pill, part of speech tag. Subtle gradient background that changes based on CEFR level (green for A-level, amber for B-level, rose for C-level).
   - **Back**: Vietnamese definition prominently, then collapsible sections for: example sentences, collocations, synonyms. Progressive disclosure — user sees the answer first, details on demand.

3. **Swipe gestures (optional)** — Add pointer event based swipe detection:
   - Swipe right → Good (3)
   - Swipe left → Again (0)
   - Buttons always available as fallback
   - Show directional hint arrows that pulse subtly

4. **Session countdown** — Instead of just "3/10", show: "3 of 10 · ~2 min left" (estimated from average review time).

5. **Streak integration** — After completing all due cards, show: "🎉 Bạn đã ôn xong! Streak: 5 ngày 🔥" with animated confetti. Connect flashcard completion to the daily activity tracker.

6. **Difficulty distribution** — In session summary, show a pie/donut of how many were Easy/Good/Hard/Again. Helps users see their retention health.

---

### Page 6: Grammar Quiz

**Current state:** Level picker (A1-C2 pills) → question card with 4 options → score summary. Uses inline-style card with a pink gradient accent. Functional but static.

**Redesign upgrades:**

1. **Difficulty path visualization** — Replace the 6 pill buttons with a visual learning path (like Duolingo's tree):
   ```
   A1 ──● ── A2 ──● ── B1 ──○ ── B2 ──○ ── C1 ──○ ── C2 ──○
        ✓         ✓        current     locked
   ```
   Completed levels show a checkmark. Current level is highlighted. Locked levels are grayed out until the previous level is passed (soft lock — user can override).

2. **Combo scoring** — Consecutive correct answers build a combo multiplier displayed as "🔥 x3 Combo!" above the question. Adds mini-gamification without changing the quiz mechanics. Combo streak shown in summary.

3. **Question transition animation** — Slide-left exit for current question, slide-right entrance for next. Makes the progression feel like card dealing.

4. **Expandable explanations** — Currently the explanation shows immediately after answering. Upgrade: show a compact "Đúng ✓" / "Sai ✗" result first, then a "Xem giải thích" expandable section. Users in a flow state can skip explanations; learners can dive deep.

5. **Topic weakness tracking** — In score summary, highlight weak grammar topics with "Luyện thêm →" links that open the chatbot with Christine (IELTS) persona pre-loaded with a suggestion to practice that topic.

6. **Quiz history** — Add a small "Lịch sử" link in the header showing last 10 quiz results: date, level, score. Helps users see grammar improvement over time.

---

### Page 7: Writing Practice

**Current state:** Prompt gallery → writing editor → AI feedback panel. Uses Ant Design Card/Flex components. Feedback includes band scores, annotations, and improved version.

**Redesign upgrades:**

1. **Split-view feedback** — On desktop, show a true side-by-side:
   - **Left panel**: User's original text with inline error highlights (grammar: red underline, vocabulary: blue underline, coherence: yellow underline). Hover/click each highlight for tooltip with suggestion.
   - **Right panel**: AI-improved version with additions highlighted in green. Band score radar chart at the top.
   - On mobile: Tab switcher between "Bài của bạn" | "Bản cải thiện" | "Đánh giá".

2. **Band score progression chart** — Below the current session feedback, show a line chart of last 10 submissions' overall band scores. Visual proof of improvement is the strongest motivator for writing practice.

3. **Prompt gallery upgrade** — Add visual icons/illustrations for each category. Show word count target directly on each card. Add a "Gợi ý chủ đề" (Suggest topic) button for free writing that uses AI to suggest a topic based on the user's weak areas.

4. **Real-time word count bar** — Replace the simple word count number with a visual progress bar at the bottom of the editor:
   ```
   [████████████░░░░░░░░] 180 / 250 words
   ```
   Color transitions: gray → sage/green when target met → amber when over by 20%.

5. **Draft autosave** — Periodically save writing drafts to localStorage. Show "Bản nháp đã lưu" indicator. If user accidentally navigates away and returns, offer to restore draft.

6. **Vocabulary extraction** — After receiving feedback, automatically extract new vocabulary from the AI's improved version and offer to save them to the user's vocabulary list. "Chúng tôi tìm thấy 3 từ mới trong bản sửa. Lưu?" with word chips.

---

### Page 8: Daily Challenge

**Current state:** Header with streak display → exercise card → results/completed state. Uses Ant Design Card/Flex/Button/Spin. Progress shown as dots.

**Redesign upgrades:**

1. **Mini-game aesthetics** — Replace the plain Card wrapper with a more immersive, game-like container:
   - Dark/deep background gradient for the exercise area (sage-to-dark-olive)
   - Large exercise type label with emoji: "📝 Điền vào chỗ trống" / "🔄 Sắp xếp câu" / "🔍 Sửa lỗi"
   - Pulsing accent glow behind the current exercise card

2. **Progress bar upgrade** — Replace the small dots with a full-width segmented progress bar:
   ```
   [██ ✓ ][██ ✓ ][██▓▓▓][░░░░░][░░░░░]
     1       2      3       4       5
   ```
   Completed segments show green with checkmark. Current segment animates.

3. **Time elapsed display** — Show a subtle stopwatch in the header: "⏱ 2:34" — not a countdown (no pressure), just tracking. Shown in results for self-improvement.

4. **Answer feedback animations:**
   - Correct: Green check icon + card border flashes green + subtle confetti particles
   - Incorrect: Red X icon + card shakes slightly + correct answer revealed with green highlight
   - Sound-like visual cues (expanding rings) to simulate audio feedback

5. **Results celebration:**
   - 5/5: Full-screen confetti + "🎉 Hoàn hảo!" with golden text
   - 4/5: Clapping animation + "👏 Xuất sắc!"
   - 3/5: Thumbs up + "👍 Tốt lắm!"
   - ≤2: Encouraging fist + "💪 Cố lên!"
   - New badge unlock: Special animation with the badge bouncing into view

6. **Streak fire animation** — The streak display should have animated flame particles (CSS-only) that grow bigger with longer streaks. 1-day: small flicker. 7-day: medium flames. 30-day: roaring fire visual.

---

## Unified Design System Rules

### Consistent Page Header Pattern

Every page (except Home Dashboard) follows this header structure:

```
┌─[Icon]──[Title]──────────────────────[Action Button]─┐
│  🧠     Ôn tập từ vựng                  [Restart]    │
│         Spaced Repetition · Ghi nhớ lâu dài          │
└──────────────────────────────────────────────────────┘
```

- 40×40px icon container with gradient background (unique per module)
- Title (15px, 600 weight) + subtitle (12px, muted)
- Optional action button on the right (restart, new quiz, etc.)

### Card Component Standardization

All feature cards use the same base style:
- Border: `1px solid var(--border)`
- Border radius: `var(--radius-lg)` (12px)
- Background: `var(--surface)` or `linear-gradient(180deg, var(--surface), var(--bg))`
- Shadow: `var(--shadow-md)`
- Content padding: `24px`

### Motion Language

| Action | Animation | Duration |
|---|---|---|
| Page enter | fade-up (translateY 8px → 0, opacity 0→1) | 300ms |
| Page exit | fade-out (opacity 1→0) | 200ms |
| Card flip | rotateY 0° → 180° | 400ms |
| State change | cross-dissolve | 250ms |
| Success celebration | scale 0.9→1.1→1.0 + confetti | 600ms |
| Error shake | translateX ±4px oscillation | 300ms |
| Badge unlock | scale 0→1.2→1.0 + bounce | 500ms |
| Progress fill | width transition | 400ms ease-out |

### Empty State Pattern

Every module's empty state includes:
1. Relevant icon or persona avatar (64px)
2. Headline in `var(--font-display)`, italic (18px)
3. Description in `var(--text-muted)` (14px)
4. Primary CTA button with `var(--accent)` background

### Color Accents Per Module

| Module | Gradient | Purpose |
|---|---|---|
| Home Dashboard | `var(--accent)` warm amber | Central hub warmth |
| AI Chatbot | `#5a7a64 → #9AB17A` sage | Calm, conversational |
| Dictionary | `#9AB17A → #C3CC9B` olive | Knowledge, reference |
| Vocabulary | `#c46d2e → #d4924d` amber | Collection, warmth |
| Flashcards | `#8b5cf6 → #4f46e5` violet | Memory, focus |
| Grammar Quiz | `#ec4899 → #e11d48` pink | Challenge, energy |
| Writing Practice | `#9AB17A → #C3CC9B` sage | Creative, calm |
| Daily Challenge | `#f59e0b → #ea580c` fire | Motivation, urgency |

---

## Desired Emotional Response

### Primary Emotional Goals

1. **Accomplishment** — "I'm actually getting better." Every session should end with visible proof of progress. The dashboard XP, streak counter, and band score charts exist to deliver this feeling daily.
2. **Confidence** — "I can do this." The AI tutor should feel encouraging, not intimidating. Error corrections should feel like coaching, not judgment. Rating flashcards as "Quên" shouldn't feel like failure — it should feel like honest self-assessment.
3. **Momentum** — "I'm on a roll and I don't want to stop." The daily challenge streak, combo scoring in quizzes, and auto-advancing flashcards create flow state. Breaking a streak should feel like losing something valuable.

### Emotional Journey Mapping

| Stage | Desired Emotion | Design Lever |
|---|---|---|
| **First visit (sign-in)** | Curiosity + Welcome | Value proposition, warm Vietnamese tone, feature preview |
| **First dashboard load** | Clarity + Excitement | "Start here" CTA, pre-populated plan, no overwhelm |
| **Starting an activity** | Ease + Anticipation | 1-tap to begin, smooth entrance animation, no setup friction |
| **During practice** | Focus + Flow | Minimal chrome, auto-advance, no navigation required |
| **Correct answer** | Satisfaction + Pride | Green flash, subtle confetti, combo counter increment |
| **Wrong answer** | Curiosity (NOT shame) | Explanation reveal, "learn more" option, encouraging tone |
| **Completing a session** | Achievement + Reward | Summary stats, streak update, badge unlock animation |
| **Returning next day** | Anticipation + Habit | Dashboard shows "new challenge ready", streak at stake |
| **After error/failure** | Resilience + Trust | Graceful error states with persona avatar, retry button, no data lost |

### Micro-Emotions

**Critical to get right:**
- **Confidence over Confusion** — Every screen should be immediately understandable. Vietnamese labels, clear CTAs, consistent patterns.
- **Delight over Satisfaction** — Don't just show "done" — celebrate it. Confetti for 5/5, fire for streaks, bouncing badges for unlocks.
- **Accomplishment over Frustration** — Wrong answers are learning moments, not failures. Show the explanation, suggest practice, track improvement.

**Emotions to actively avoid:**
- ❌ **Overwhelm** — 7 modules is a lot. Dashboard curates and prioritizes so the user never thinks "where do I start?"
- ❌ **Guilt** — Missing a streak day should feel like "let's start fresh" not "you failed." Reset message: "Bắt đầu streak mới nào!"
- ❌ **Boredom** — Varied exercise types in daily challenges, rotating AI suggestions, and the word-of-the-day keep content fresh.
- ❌ **Isolation** — The AI personas (Simon, Christine, Eddie) create a sense of having a tutor team, even though it's solo learning.

### Design Implications

| Emotional Goal | UX Design Choice |
|---|---|
| Accomplishment | Animated counters, progress bars, streak visualizations, before/after comparisons |
| Confidence | Vietnamese UI, encouraging AI responses, friendly empty states, no "score" shaming |
| Momentum | Auto-advance in sessions, minimal tap-to-start, "one more?" prompts after sessions |
| Curiosity (on errors) | Expandable explanations, "Luyện thêm →" links, chatbot follow-up suggestions |
| Delight | Confetti particles, badge bounce animations, fire particle effects, scale-pop on achievements |
| Trust (on failures) | Persona avatars in error states, clear retry paths, no data loss, friendly error copy |

### Emotional Design Principles

1. **Celebrate progress, not perfection** — A user who reviews 10 flashcards and marks 7 as "Quên" has done a great job — they showed up. Celebrate the session completion, not just the accuracy.
2. **Make success louder than failure** — Correct answers get animation and sound-like cues. Wrong answers get gentle correction. The visual weight of success should always exceed the visual weight of failure (3:1 ratio in animation intensity).
3. **Create "just one more" moments** — After completing flashcards, suggest: "Daily challenge chưa làm. Thử luôn?" After a quiz, offer: "Muốn luyện thêm 5 câu?" The transition between modules should feel like a natural continuation, not a new decision.
4. **Warmth in every word** — All Vietnamese copy should feel like a supportive tutor, not a software interface. "Bạn đã ôn xong! 🎉" not "Session complete." "Cố lên, bạn gần đạt rồi!" not "Below target."
5. **Anticipation drives return** — The countdown to next challenge, the streak at stake, the flashcard due count — these create gentle FOMO that pulls users back without aggressive notifications.

---

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**1. Duolingo** — The retention king
- **Core UX win:** Streak mechanic + daily XP goal creates an unbreakable habit loop.
- **Navigation:** Bottom tab bar with 5 items. Home is a vertical skill tree — clear visual progression.
- **Celebrations:** Over-the-top animations for milestones. Makes small wins feel massive.
- **Weakness:** Repetitive lessons. No deep conversational practice. Superficial grammar explanations.

**2. Anki** — The flashcard benchmark
- **Core UX win:** SM-2 spaced repetition algorithm is proven. Users trust the system.
- **Card interaction:** Tap to reveal → rate difficulty. Dead simple.
- **Weakness:** Brutally utilitarian UI. Zero emotional reward. No streak system.
- **Lesson:** Take Anki’s algorithm purity but wrap it in Duolingo’s emotional design.

**3. Notion / Linear** — Information hierarchy masters
- **Core UX win:** Sidebar navigation that scales without overwhelming. Clean typography, generous whitespace.
- **Lesson:** Dictionary and vocabulary pages should borrow this calm information density.

**4. Elsa Speak** — AI-powered coaching done right
- **Core UX win:** Real-time pronunciation feedback. The AI feels like a patient personal tutor.
- **Lesson:** Chatbot should feel this personal. AI corrections should be visual and specific.

### Transferable UX Patterns

**Navigation:** Duolingo’s bottom tab bar for mobile (4 tabs: Home, Chat, Learn, Profile). Notion’s collapsible sidebar for desktop with badge counts.

**Interaction:** Anki’s reveal-then-rate (already built — enhance visually). Duolingo’s combo/streak counter for quizzes. Elsa’s inline feedback adapted for chatbot word highlighting.

**Visual:** Duolingo’s tiered celebration hierarchy (flash → confetti → full-screen). Linear’s thin elegant progress bars. Notion’s clean information density for reference pages.

**Gamification:** App-wide XP system (flashcard = 10 XP, quiz = 50 XP, writing = 100 XP, daily = 30 XP). Streak loss aversion via fire animation.

### Anti-Patterns to Avoid

1. **Anki’s blank-wall onboarding** — Pre-populate dashboard from day one.
2. **Duolingo’s forced linearization** — Allow free exploration. Soft guidance, not hard locks.
3. **Notification spam** — Gentle in-app nudges only.
4. **Feature overload on mobile** — Bottom-tab-with-sub-hub pattern prevents this.
5. **Inline ads or upsells** — No monetization UX. Keep it clean.

### Design Inspiration Strategy

**Adopt:** Streak mechanic + celebrations (Duolingo), reveal-then-rate (Anki), bottom tab bar (Duolingo), XP system.
**Adapt:** CEFR path instead of skill tree (Duolingo), word highlighting instead of pronunciation (Elsa), sidebar with badges (Notion).
**Avoid:** Forced lesson order, utilitarian UI, aggressive notifications, leaderboards/competition.

---

## Design System Foundation

### Design System Choice

**Hybrid: Ant Design v6 (base) + Custom Design Tokens + Vanilla CSS**

The project already uses Ant Design v6 as its component library (migrated from Tailwind in a recent refactor). Rather than replacing it again, the redesign will:

1. **Keep Ant Design** for structural components (Drawer, Tooltip, Spin, Modal, notification)
2. **Custom-build** all feature-specific components (flashcards, quiz cards, streak display, dashboard widgets) with inline styles and CSS variables
3. **Extend the design token system** in `globals.css` to cover all new patterns

### Rationale for Selection

| Factor | Decision |
|---|---|
| **Speed** | Ant Design provides battle-tested form controls, modals, and drawers — no need to rebuild |
| **Uniqueness** | Feature components (cards, celebrations, progress bars) are all custom — these define the app’s personality |
| **Consistency** | CSS custom properties (`--accent`, `--surface`, `--border`, etc.) enforce visual consistency without a CSS framework |
| **Team size** | Solo developer — needs proven components for utilities, custom code for differentiators |
| **Maintenance** | Ant Design handles accessibility, RTL, and edge cases for complex widgets. Custom components stay simple and focused |
| **Migration cost** | Zero — already on Ant Design v6 |

### Implementation Approach

**Layer 1 — Design Tokens (globals.css):**
All visual decisions flow from CSS custom properties. This is already partially implemented. Extend with:
- Animation tokens: `--duration-fast: 200ms`, `--duration-normal: 300ms`, `--duration-slow: 500ms`
- Spacing scale: `--space-xs: 4px` through `--space-3xl: 48px`
- Module accent colors (already defined in the design system rules section)
- Shadow elevation scale: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

**Layer 2 — Ant Design (utility components):**
Use for: Drawer, Modal, Tooltip, Spin, notification, Dropdown, message. These are invisible plumbing — no brand impact.

**Layer 3 — Custom Components (feature UI):**
All visible, brand-defining components are custom: FlashcardCard, QuestionCard, StreakDisplay, DashboardWidget, ProgressBar, CelebrationOverlay, BadgeGallery, etc.

### Customization Strategy

**Ant Design theme override** via ConfigProvider:
```
borderRadius: 10 (var(--radius))
colorPrimary: #c46d2e (var(--accent))
fontFamily: 'Source Sans 3' (var(--font-body))
colorBgContainer: var(--surface)
```

**Custom component conventions:**
- All styles via inline `style={{}}` objects (consistent with existing codebase)
- CSS custom properties for all color/spacing/shadow values
- No Tailwind classes in new components
- `motion/react` for all animations (AnimatePresence for mount/unmount)
- Shared animation presets in a `lib/animations.ts` utility

---

## Defining Core Experience

### The ThienGlish Defining Experience

**"Open the app → see what’s due → do it → feel progress → come back tomorrow."**

Like Tinder’s swipe or Snapchat’s disappearing photos, ThienGlish’s defining interaction is the **Daily Learning Loop**. If we nail this single flow, everything else follows.

### User Mental Model

Vietnamese English learners bring these mental models:
- **“Learning English = studying”** — They expect structured exercises (grammar drills, vocabulary lists, writing tasks). The app should feel productive, not casual.
- **“I need a teacher”** — The AI personas fulfill this expectation. Simon = conversation partner, Christine = IELTS coach, Eddie = pronunciation helper.
- **“I should study every day”** — They know consistency matters but lack accountability tools. The streak mechanic fills this gap.
- **“I don’t know what to study next”** — The #1 pain point. The Dashboard solves this by curating today’s plan automatically.

### Success Criteria

| Metric | Target | Measurement |
|---|---|---|
| Time to first activity | < 3 seconds from dashboard load | Click tracking on dashboard CTAs |
| Daily return rate (D7) | > 40% | Session analytics |
| Activities per session | ≥ 2 modules touched | Activity logging |
| Streak maintenance | > 50% users maintain 7+ day streak | Streak database |
| Vocabulary save rate | > 30% of looked-up words get saved | Save action / lookup ratio |

### Experience Mechanics

**1. Initiation:** User opens app → redirected to `/home` dashboard. Greeting card shows time-aware welcome + streak status. Today’s Plan shows prioritized activities.

**2. Interaction:** User taps first suggested activity (e.g., "5 flashcards due"). Navigates to flashcards module. Reviews cards with reveal-then-rate flow. Auto-advances between cards.

**3. Feedback:** Progress bar fills. Correct/incorrect gets immediate visual feedback. Session ends with summary + “just one more” suggestion.

**4. Completion:** Returns to dashboard. Completed activity shows checkmark. Streak counter updates. XP increments. Next suggestion highlighted.

---

## Visual Design Foundation

### Color System

The existing palette is already established and distinctive. Preserve and extend:

**Core palette (preserved):**

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#faf8f3` | `#141a10` | Page background |
| `--surface` | `#ffffff` | `#1c2318` | Card/panel background |
| `--accent` | `#9ab17a` | `#b1c892` | Primary actions, active states |
| `--ink` | `#2d3a24` | `#e4eadc` | Primary text |
| `--border` | `#e4dfb5` | `#2f3b26` | Dividers, card borders |

**New tokens to add:**

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--success` | `#10b981` | `#34d399` | Correct answers, completed states |
| `--error` | `#ef4444` | `#f87171` | Wrong answers, error states |
| `--warning` | `#f59e0b` | `#fbbf24` | Streak warnings, time alerts |
| `--info` | `#3b82f6` | `#60a5fa` | Tips, learning indicators |
| `--xp` | `#8b5cf6` | `#a78bfa` | XP counters, level indicators |
| `--fire` | `#f97316` | `#fb923c` | Streak fire, daily challenge |

**Module accent colors:**
Each module gets a unique gradient for its icon container (already defined in Unified Design System Rules section). These do NOT affect the global accent — they only color the 40×40px header icon.

### Typography System

**Preserved from current implementation:**

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| Display | Fraunces (serif) | 400 italic | 24-36px | Page titles, headword in dictionary |
| Body | Source Sans 3 (sans) | 400/500/600 | 13-15px | All body text, UI labels |
| Mono | JetBrains Mono | 400 | 13px | Code, phonetics |

**Type scale (add as tokens):**

```
--text-xs: 11px      /* Timestamps, meta labels */
--text-sm: 13px      /* Secondary text, captions */
--text-base: 15px    /* Body text (default) */
--text-lg: 18px      /* Card titles, section headers */
--text-xl: 24px      /* Page subtitles */
--text-2xl: 30px     /* Page titles */
--text-3xl: 36px     /* Hero/display text */
```

### Spacing & Layout Foundation

**Base unit: 4px** (consistent with current `gap`, `padding` values)

```
--space-1: 4px       --space-2: 8px       --space-3: 12px
--space-4: 16px      --space-5: 20px      --space-6: 24px
--space-8: 32px      --space-10: 40px     --space-12: 48px
```

**Layout principles:**
- Page content max-width: `800px` for single-column (writing, quiz), `1200px` for multi-column (dictionary, dashboard)
- Card internal padding: `24px` (desktop), `16px` (mobile)
- Section spacing: `24px` gap between major sections
- Component spacing: `8-12px` between related elements

### Accessibility Considerations

- All text meets WCAG AA contrast ratios (4.5:1 for body, 3:1 for large text)
- Focus indicators: `2px solid var(--accent)` with `2px offset` on all interactive elements
- Touch targets: minimum `44×44px` for mobile interactions
- Reduced motion: `@media (prefers-reduced-motion: reduce)` disables all animations
- Screen reader: All interactive elements have `aria-label` in Vietnamese
- Keyboard navigation: Tab order follows visual reading order; Enter/Space activates

---

## User Journey Flows

### Journey 1: New User First Session

```
Sign-in page → Google OAuth → Dashboard (first visit)
                                    │
                         [Welcome card: "Chào mừng!"]
                         [Pre-populated Today's Plan]
                                    │
                         User taps "Tra từ đầu tiên"
                                    │
                         Dictionary → searches word → saves
                                    │
                         Returns to Dashboard
                         ["Thử thách mỗi ngày" suggested]
                                    │
                         Daily Challenge → completes 5 exercises
                                    │
                         Results celebration → first badge
                                    │
                         Dashboard: "1 ngày streak! 🔥"
```

### Journey 2: Returning Daily Learner

```
Open app → Dashboard loads
              │
     [Greeting: "Chào buổi sáng, Thiên! 🔥5 ngày"]
     [Today: 5 flashcards due, Daily Challenge ready]
              │
     Tap "5 thẻ cần ôn" → Flashcard session
     Review 5 cards (2 min) → Summary → "Đã ôn xong!"
              │
     "Daily challenge chưa làm. Thử luôn?" → tap
     Daily Challenge → 5 exercises → Results
              │
     Dashboard: 2/3 done → streak updated
     Optional: chatbot or writing practice
```

### Journey 3: Deep Study Session

```
Dashboard → Tap "Grammar Quiz"
              │
     Select B2 level → 10 questions
     Score: 7/10 → Weak topic: "Conditionals"
              │
     "Luyện thêm với Christine?" → Tap
              │
     Chatbot opens with Christine persona
     Practices conditional sentences in conversation
     Taps highlighted word → mini dictionary → saves
              │
     Switches to Writing Practice
     Writes IELTS Task 2 essay → submits
     Feedback panel: Band 6.0 → sees improvement chart
     Extracts 3 new vocabulary from corrections
              │
     Dashboard: XP +210, 4 new words learned
```

---

## Component Strategy

### Shared Components (New)

| Component | Location | Purpose |
|---|---|---|
| `StreakFire` | `components/shared/` | Animated fire icon, scales with streak length |
| `XPCounter` | `components/shared/` | Animated number counter for XP display |
| `ProgressSegments` | `components/shared/` | Segmented progress bar (flashcards, quiz, daily) |
| `CelebrationOverlay` | `components/shared/` | Confetti/scale-bounce overlay for achievements |
| `BadgeCard` | `components/shared/` | Badge display with locked/unlocked states |
| `MiniDictionary` | `components/shared/` | Floating word lookup card (used in chatbot, quiz) |
| `ActivityCard` | `components/shared/` | Dashboard today’s plan item with completion state |
| `EmptyStateCard` | `components/shared/` | Standardized empty state with icon + CTA |
| `ModuleHeader` | `components/shared/` | Standardized page header (icon + title + action) |
| `BottomTabBar` | `components/shared/` | Mobile bottom navigation (4 tabs) |

### Dashboard Components (New)

| Component | Purpose |
|---|---|
| `GreetingCard` | Time-aware welcome + streak + XP summary |
| `TodaysPlan` | Prioritized activity checklist |
| `QuickActions` | Pill buttons for immediate module access |
| `RecentVocabulary` | Horizontal scroll strip of recent words |
| `WeeklyProgress` | CSS bar chart of daily activity |
| `StreakBadges` | Streak display + badge gallery |

### Existing Components to Upgrade

| Component | Current | Upgrade |
|---|---|---|
| `FlashcardCard` | Basic flip with 4 buttons | Immersive mode, CEFR-colored gradients, swipe optional |
| `QuestionCard` | Static 4-option layout | Combo counter, slide transitions, expandable explanations |
| `ExerciseCard` | Plain card wrapper | Game-like aesthetic, answer feedback animations |
| `FeedbackPanel` | Single column feedback | Split-view with diff highlighting |
| `StreakDisplay` | Text-only numbers | Animated fire particles, visual scale |
| `AppSidebar` | Desktop only | Add badge counts, responsive hide for mobile |
| `LevelPicker` | 6 pill buttons | Visual CEFR path with progress indicators |

---

## UX Consistency Patterns

### Loading States

All modules use the same loading pattern:
- 3 pulsing dots (accent color) centered in content area
- Text below: "[Đang tải/contextual message]..."
- No Ant Design `Spin` component (replace with custom dots)

### Error States

All modules follow:
- 64px icon in error container (module-specific icon, not generic)
- Headline: "Không thể [action]" (Can’t [action])
- Description: specific, helpful message
- CTA: "Thử lại" (Try again) button with accent color

### Success/Completion States

Tiered celebration system:
- **Small win** (correct answer): green border flash, 200ms
- **Medium win** (session complete): scale-bounce + summary card with stats
- **Big win** (streak milestone/badge): full-screen overlay with confetti + badge animation

### Navigation Transitions

- Page enter: `fadeInUp` 300ms
- Page exit: `fadeOut` 200ms (handled by layout, not per-page)
- Within-page state changes: `crossDissolve` 250ms
- Card dealing (quiz/flashcard): `slideInRight` 300ms

### Form Patterns

- Text inputs: borderless bottom-border style (as in vocabulary search)
- Buttons: filled accent for primary, ghost for secondary
- Selection: highlighted pills/chips (as in level picker, filters)

---

## Responsive Design & Accessibility Strategy

### Breakpoint System

```css
/* Mobile-first breakpoints */
@media (min-width: 769px)  { /* Tablet */ }
@media (min-width: 1025px) { /* Desktop */ }
@media (max-width: 768px)  { /* Mobile-only */ }
```

### Mobile Adaptations

| Feature | Desktop | Mobile |
|---|---|---|
| Navigation | Sidebar (collapsible) | Bottom tab bar (4 tabs) |
| Dictionary | Two-column grid | Stacked: search → result |
| Flashcards | Card in content area | Full-screen immersive |
| Writing feedback | Side-by-side split | Tabbed view |
| Dashboard | 2-column grid | Single-column stack |
| Quiz | Centered card + header | Full-width card, no header |

### Bottom Tab Bar Specification

```
┌─────────┬─────────┬─────────┬─────────┐
│  🏠     │  💬     │  📚     │  👤     │
│  Home   │  Chat   │  Learn  │ Profile │
└─────────┴─────────┴─────────┴─────────┘
```

- Fixed at bottom, 56px height, `backdrop-filter: blur(12px)`
- Active tab: accent color icon + label. Inactive: muted.
- "Learn" tab opens sub-hub with: Flashcards, Grammar Quiz, Writing Practice, Daily Challenge as a grid of 4 cards.

### Accessibility Checklist

- [x] All interactive elements have `aria-label` (Vietnamese)
- [x] Color is never the only indicator (always paired with icon/text)
- [x] Focus indicators visible on all interactive elements
- [x] Touch targets ≥ 44×44px on mobile
- [x] `prefers-reduced-motion` respected
- [x] Heading hierarchy: single `h1` per page, sequential `h2`/`h3`
- [x] Images/icons have alt text
- [x] Form inputs associated with labels
- [x] Error messages are announced to screen readers

---

## Implementation Priority & Phasing

### Phase 1: Foundation (Week 1-2)
1. Extend `globals.css` with new tokens (colors, spacing, typography, animation)
2. Build shared components: `ModuleHeader`, `ProgressSegments`, `EmptyStateCard`, `CelebrationOverlay`
3. Create `BottomTabBar` component with responsive show/hide
4. Build Home Dashboard page (`/home` route) with `GreetingCard`, `TodaysPlan`, `QuickActions`
5. Add dashboard API endpoint aggregating cross-module data

### Phase 2: High-Priority Module Upgrades (Week 3-4)
6. Flashcards: immersive mode, card design upgrade, streak integration
7. Daily Challenge: game aesthetics, progress bar, celebration animations
8. Chatbot: word highlighting, persona cards
9. Sign-in page: value proposition, feature preview

### Phase 3: Medium-Priority Upgrades (Week 5-6)
10. Grammar Quiz: CEFR path, combo scoring, quiz history
11. Writing Practice: split-view feedback, word count bar, draft autosave
12. Dictionary: recent lookups, word of the day, pronunciation
13. My Vocabulary: mastery indicators, TOEIC tabs, migrate Tailwind

### Phase 4: Polish & Integration (Week 7-8)
14. Cross-module vocabulary flow (chatbot → save → flashcard)
15. XP system implementation
16. Weekly progress chart on dashboard
17. Badge gallery and streak milestone celebrations
18. Mobile responsive testing and optimization
