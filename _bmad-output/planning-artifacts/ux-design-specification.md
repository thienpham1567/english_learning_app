---
stepsCompleted: [1, 2, 3, 4]
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
