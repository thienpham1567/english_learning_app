---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/implementation-artifacts/1-1-flashcard-spaced-repetition.md
  - _bmad-output/implementation-artifacts/1-2-grammar-quiz.md
  - _bmad-output/implementation-artifacts/1-3-writing-practice.md
  - _bmad-output/implementation-artifacts/1-4-daily-challenge.md
---

# english_learning_app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the ThienGlish UX Redesign, decomposing the requirements from the UX Design Specification into implementable stories. Since this is a redesign of an existing, functional app, all epics build upon the current codebase rather than starting from scratch.

## Requirements Inventory

### Functional Requirements

FR1: The app SHALL have a Home Dashboard (`/home`) as the default landing page after login, replacing the current chatbot landing
FR2: The Dashboard SHALL display a time-aware greeting card with the user's name, current streak count, and XP total
FR3: The Dashboard SHALL show a "Today's Plan" checklist of due/suggested activities (flashcard due count, daily challenge status, suggested next activity)
FR4: The Dashboard SHALL provide quick action buttons for immediate access to main modules (Chat, Dictionary, Quiz)
FR5: The Dashboard SHALL display the last 10 looked-up vocabulary words as a horizontal scroll strip
FR6: The Dashboard SHALL show a weekly activity progress bar chart (CSS-only, no chart library)
FR7: The Dashboard SHALL display current streak with fire animation, best streak record, and badge gallery
FR8: A new `GET /api/dashboard` endpoint SHALL aggregate flashcard due count, daily challenge status, streak info, recent vocabulary, and weekly activity counts
FR9: The Chatbot SHALL highlight English vocabulary words in AI responses, making them tappable
FR10: Tapping a highlighted word in Chatbot SHALL show a mini floating card with word, phonetic, Vietnamese translation, and "Save"/"Lookup" buttons
FR11: Saving a word from Chatbot SHALL add it to the vocabulary list and flashcard pipeline automatically
FR12: The Chatbot SHALL display visual persona cards at the start of new conversations instead of a dropdown
FR13: The Flashcard session SHALL support a full-screen immersive mode (hidden header during active review)
FR14: The Flashcard card front SHALL display headword (36px), phonetic, CEFR badge, and part of speech with CEFR-colored gradient backgrounds
FR15: The Flashcard session SHALL show estimated time remaining ("3 of 10 · ~2 min left")
FR16: Upon completing all due flashcards, the app SHALL show a celebration overlay with streak integration
FR17: The Grammar Quiz SHALL display a visual CEFR difficulty path (A1→C2) with completion indicators instead of plain pills
FR18: The Grammar Quiz SHALL track and display combo scoring for consecutive correct answers
FR19: The Grammar Quiz SHALL provide expandable explanations (collapsed by default after answering)
FR20: The Grammar Quiz score summary SHALL highlight weak topics with "Luyện thêm →" links to the chatbot
FR21: The Writing Practice feedback SHALL display in a side-by-side split view on desktop (user text vs. improved version)
FR22: The Writing Practice SHALL show a visual word count progress bar at the bottom of the editor
FR23: The Writing Practice SHALL autosave drafts to localStorage periodically
FR24: The Daily Challenge SHALL use segmented progress bar instead of dots
FR25: The Daily Challenge SHALL display exercise type labels with emoji ("📝 Điền vào chỗ trống")
FR26: The Daily Challenge SHALL show tiered celebration animations based on score (5/5 = confetti, 4/5 = clapping, etc.)
FR27: The Daily Challenge streak display SHALL use animated fire particles that scale with streak length
FR28: The Dictionary SHALL display a recent lookups strip (horizontal scroll, last 8 words)
FR29: The Dictionary SHALL include Web Speech API pronunciation playback for searched words
FR30: The Dictionary SHALL highlight the target word in example sentences with accent color
FR31: The My Vocabulary page SHALL show mastery level indicators per word (New/Learning/Mastered) based on flashcard_progress data
FR32: The My Vocabulary page SHALL provide tab navigation: All | Saved ⭐ | TOEIC 📋
FR33: The Sign-in page SHALL display value proposition bullets and feature preview cards below the login button
FR34: An app-wide XP system SHALL award points for activities (flashcard=10, quiz=50, writing=100, daily=30 XP)
FR35: Cross-module vocabulary flow: words saved from chatbot, quiz corrections, or writing feedback SHALL appear in the flashcard pipeline

### NonFunctional Requirements

NFR1: All pages SHALL load within 3 seconds on 3G mobile connections
NFR2: All text SHALL meet WCAG AA contrast ratios (4.5:1 for body, 3:1 for large text)
NFR3: All interactive elements SHALL have minimum 44×44px touch targets on mobile
NFR4: The app SHALL respect `prefers-reduced-motion` by disabling all animations
NFR5: All interactive elements SHALL have `aria-label` attributes in Vietnamese
NFR6: Focus indicators SHALL be visible on all interactive elements (`2px solid var(--accent)`)
NFR7: The app SHALL work on Chrome, Safari, Firefox (latest 2 versions) on desktop and mobile
NFR8: No new external charting or animation libraries SHALL be added (CSS-only charts, existing motion/react for animations)

### Additional Requirements

- The existing Ant Design v6 component library SHALL be preserved for utility components (Drawer, Tooltip, Spin, Modal)
- All new feature components SHALL use inline styles with CSS custom properties (no Tailwind)
- The existing light/dark theme system SHALL be maintained and extended with new tokens
- All existing tests SHALL continue to pass after redesign changes
- The existing database schema SHALL not require breaking changes (additive only)

### UX Design Requirements

UX-DR1: Extend `globals.css` with new design tokens: `--success`, `--error`, `--warning`, `--info`, `--xp`, `--fire` colors (both light and dark themes)
UX-DR2: Add typography scale tokens: `--text-xs` through `--text-3xl`
UX-DR3: Add spacing scale tokens: `--space-1` through `--space-12`
UX-DR4: Add animation duration tokens: `--duration-fast`, `--duration-normal`, `--duration-slow`
UX-DR5: Build shared `ModuleHeader` component (40×40 icon + gradient, title, subtitle, optional action button)
UX-DR6: Build shared `ProgressSegments` component (segmented progress bar for flashcards, quiz, daily challenge)
UX-DR7: Build shared `EmptyStateCard` component (64px icon, headline, description, CTA button)
UX-DR8: Build shared `CelebrationOverlay` component (confetti particles, scale-bounce, tiered celebrations)
UX-DR9: Build shared `StreakFire` component (CSS-only animated fire that scales with streak length)
UX-DR10: Build shared `XPCounter` component (animated number counter)
UX-DR11: Build shared `MiniDictionary` component (floating word lookup card for use in chatbot/quiz)
UX-DR12: Build shared `BadgeCard` component (locked/unlocked states with unlock animation)
UX-DR13: Build `BottomTabBar` component for mobile navigation (4 tabs: Home, Chat, Learn, Profile)
UX-DR14: Implement responsive layout: sidebar for desktop (≥1025px), collapsible sidebar for tablet (769-1024px), bottom tab bar for mobile (≤768px)
UX-DR15: All modules SHALL use standardized loading pattern (3 pulsing dots + contextual text) instead of Ant Design Spin
UX-DR16: All modules SHALL use standardized error state pattern (module icon + headline + description + retry CTA)
UX-DR17: Implement tiered success celebration system (small=green flash, medium=summary + scale-bounce, big=confetti + badge animation)
UX-DR18: Standardize page enter animation (fadeInUp 300ms) and state change animation (crossDissolve 250ms)
UX-DR19: Add sidebar badge counts showing due items per module (flashcards due, daily challenge status)
UX-DR20: "Learn" tab sub-hub SHALL display Flashcards, Grammar Quiz, Writing Practice, Daily Challenge as a grid of 4 cards on mobile
UX-DR21: Migrate My Vocabulary page from Tailwind utility classes to inline styles with CSS custom properties
UX-DR22: Build `WeeklyProgress` component (CSS-only bar chart showing daily activity for current week)
UX-DR23: Build `ActivityCard` component (dashboard today's plan item with completion state checkbox)
UX-DR24: Build `QuickActions` component (pill buttons for immediate module access)

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1-FR8 | Epic 1 | Home Dashboard (new page + API) |
| FR9-FR12 | Epic 4 | Chatbot word highlighting + persona cards |
| FR13-FR16 | Epic 3 | Flashcard immersive mode + celebrations |
| FR17-FR20 | Epic 5 | Grammar Quiz path + combo + explanations |
| FR21-FR23 | Epic 5 | Writing split-view + word count + autosave |
| FR24-FR27 | Epic 3 | Daily Challenge game aesthetics + fire |
| FR28-FR30 | Epic 5 | Dictionary recent lookups + pronunciation |
| FR31-FR32 | Epic 6 | Vocabulary mastery levels + tabs |
| FR33 | Epic 4 | Sign-in value proposition |
| FR34-FR35 | Epic 6 | XP system + cross-module vocabulary flow |
| UX-DR1-4 | Epic 1 | Design token extensions |
| UX-DR5-10 | Epic 1 | Shared UI components |
| UX-DR11 | Epic 4 | MiniDictionary component |
| UX-DR12 | Epic 3 | BadgeCard component |
| UX-DR13-14 | Epic 2 | Mobile navigation + responsive layout |
| UX-DR15-18 | Epic 1 | Standardized UX patterns |
| UX-DR19-20 | Epic 2 | Sidebar badges + Learn sub-hub |
| UX-DR21 | Epic 5 | Vocabulary page Tailwind migration |
| UX-DR22-24 | Epic 1 | Dashboard widget components |

## Epic List

### Epic 1: Design System Foundation & Home Dashboard
Users land on a personalized dashboard that shows what to study next, replacing the cold chatbot landing. Shared components and design tokens ensure all subsequent upgrades look and feel consistent.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR6, UX-DR7, UX-DR8, UX-DR9, UX-DR10, UX-DR15, UX-DR16, UX-DR17, UX-DR18, UX-DR22, UX-DR23, UX-DR24
**NFRs covered:** NFR2, NFR5, NFR6, NFR8

### Epic 2: Mobile Navigation & Responsive Layout
Mobile users get a native-feeling bottom tab navigation with a "Learn" sub-hub, while desktop users gain sidebar badge counts for due items.
**FRs covered:** (cross-cutting, supports all pages)
**UX-DRs covered:** UX-DR13, UX-DR14, UX-DR19, UX-DR20
**NFRs covered:** NFR1, NFR3, NFR7

### Epic 3: Flashcards & Daily Challenge Upgrade
Users experience immersive, game-like study sessions with satisfying celebrations. Flashcard reviews feel focused and rewarding. Daily challenges feel like mini-games with fire animations.
**FRs covered:** FR13, FR14, FR15, FR16, FR24, FR25, FR26, FR27
**UX-DRs covered:** UX-DR12

### Epic 4: Chatbot Intelligence & Sign-In Upgrade
Users can tap any word in chatbot conversations to look up, save, and flow into flashcards. New users see the app's value proposition before signing in. Persona selection feels personal.
**FRs covered:** FR9, FR10, FR11, FR12, FR33
**UX-DRs covered:** UX-DR11

### Epic 5: Grammar Quiz, Writing & Dictionary Polish
Grammar learners see their CEFR progression path and get combo scoring. Writers see side-by-side feedback with autosaved drafts. Dictionary users get pronunciation and recent lookups.
**FRs covered:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR28, FR29, FR30
**UX-DRs covered:** UX-DR21

### Epic 6: Cross-Module Integration & Gamification
Users see a unified learning system — vocabulary flows between modules, XP accumulates across all activities, mastery levels show learning progress, and streak milestones are celebrated app-wide.
**FRs covered:** FR31, FR32, FR34, FR35
**NFRs covered:** NFR4

---

## Epic 1: Design System Foundation & Home Dashboard

Users land on a personalized dashboard that shows what to study next. Shared components and design tokens ensure all subsequent upgrades look and feel consistent.

### Story 1.1: Extend Design Tokens

As a developer,
I want a complete set of design tokens in globals.css,
So that all new components use consistent colors, spacing, typography, and animation values.

**Acceptance Criteria:**

**Given** the existing globals.css with light and dark theme tokens
**When** the new tokens are added
**Then** the following CSS custom properties exist in both `:root` and `[data-theme="dark"]`:
**And** semantic colors: `--success`, `--error`, `--warning`, `--info`, `--xp`, `--fire` with appropriate light/dark values
**And** typography scale: `--text-xs` (11px) through `--text-3xl` (36px)
**And** spacing scale: `--space-1` (4px) through `--space-12` (48px)
**And** animation durations: `--duration-fast` (200ms), `--duration-normal` (300ms), `--duration-slow` (500ms)
**And** all existing tokens remain unchanged
**And** all existing tests pass without modification

### Story 1.2: Shared UI Components — ModuleHeader, ProgressSegments, EmptyStateCard

As a user,
I want consistent page headers, progress indicators, and empty states across all modules,
So that the app feels cohesive and professional.

**Acceptance Criteria:**

**Given** a module page using the shared components
**When** `ModuleHeader` is rendered with icon, gradient, title, subtitle, and optional action button
**Then** it displays a 40×40px gradient icon container + title (15px, 600 weight) + subtitle (12px, muted) + optional right-aligned action button
**And** when `ProgressSegments` is rendered with current/total values, it displays a segmented bar with completed (green), current (accent), and remaining (border) segments
**And** when `EmptyStateCard` is rendered with icon, headline, description, and CTA, it displays a centered empty state with 64px icon + display-font headline + muted description + accent CTA button
**And** all components use CSS custom properties for styling (no Tailwind, no hardcoded colors)

### Story 1.3: Shared UI Components — CelebrationOverlay, StreakFire, XPCounter

As a user,
I want satisfying visual celebrations when I complete activities,
So that I feel rewarded and motivated to continue learning.

**Acceptance Criteria:**

**Given** an activity completion event
**When** `CelebrationOverlay` is triggered with tier="small", it shows a green border flash (200ms)
**And** when triggered with tier="medium", it shows a scale-bounce animation + summary content
**And** when triggered with tier="big", it shows fullscreen confetti particles + scale-bounce + content overlay
**And** `StreakFire` renders CSS-only animated flame particles that scale visually with streak length (1-day=small, 7-day=medium, 30-day=large)
**And** `XPCounter` animates number counting up from previous value to new value
**And** all animations respect `prefers-reduced-motion` (static display, no animation)

### Story 1.4: Dashboard API Endpoint

As a user,
I want the dashboard to load all my learning data in a single request,
So that the page loads quickly without multiple API calls.

**Acceptance Criteria:**

**Given** an authenticated user with existing learning data
**When** `GET /api/dashboard` is called
**Then** the response includes: flashcard due count (from flashcard_progress), daily challenge status (completed/not today), current streak and best streak, last 10 vocabulary lookups (query + headword + level), weekly activity counts (last 7 days), and total XP
**And** the endpoint uses `Promise.all()` for parallel DB queries (flashcards, streak, vocabulary, activity) to meet the 500ms target
**And** the response returns within 500ms
**And** unauthenticated requests return 401

### Story 1.5: Home Dashboard Page

As a learner,
I want a dashboard that shows my streak, due activities, and suggested next steps,
So that I know exactly what to do when I open the app.

**Acceptance Criteria:**

**Given** an authenticated user navigating to `/home`
**When** the dashboard loads
**Then** the existing chatbot landing is replaced — `/` redirects to `/home` after login (this is the FIRST thing that must work)
**And** a GreetingCard shows a time-aware greeting ("Chào buổi sáng/chiều/tối, [name]!") + streak fire + XP counter
**And** TodaysPlan shows a checklist of due activities (flashcards due, daily challenge ready, suggested practice) with clickable items that navigate to the module
**And** QuickActions shows pill buttons for Chat, Dictionary, and Quiz
**And** RecentVocabulary shows a horizontal scroll strip of last 10 words (tappable → dictionary)
**And** WeeklyProgress shows a CSS-only bar chart of this week's daily activity
**And** StreakBadges shows current streak, best streak, and badge gallery
**And** given a NEW user with zero activity, the dashboard shows EmptyStateCard with "Bắt đầu học ngay!" CTA linking to the daily challenge or chatbot (no blank sections)

---

## Epic 2: Mobile Navigation & Responsive Layout

Mobile users get native-feeling bottom tab navigation. Desktop users gain sidebar badge counts.

### Story 2.1: Bottom Tab Bar Component

As a mobile user,
I want a bottom navigation bar with 4 tabs,
So that I can quickly navigate between main app sections without the sidebar.

**Acceptance Criteria:**

**Given** a user on a screen ≤768px wide
**When** the app loads
**Then** a fixed bottom tab bar (56px height, backdrop blur) displays 4 tabs: Home (🏠), Chat (💬), Learn (📚), Profile (👤)
**And** the active tab shows accent-colored icon + label; inactive tabs show muted
**And** tapping Home navigates to `/home`, Chat to `/english-chatbot`, Profile to settings/vocabulary
**And** tapping Learn opens a sub-hub overlay with 4 cards: Flashcards, Grammar Quiz, Writing Practice, Daily Challenge
**And** the desktop sidebar is hidden on screens ≤768px

### Story 2.2: Responsive AppShell & Sidebar Badges

As a desktop user,
I want to see badge counts on sidebar items showing what's due,
So that I know at a glance which modules need attention.

**Acceptance Criteria:**

**Given** a user on a screen ≥1025px with the sidebar visible
**When** sidebar nav items render
**Then** the Flashcards item shows a badge with the due card count (e.g., "5")
**And** the Daily Challenge item shows a fire emoji badge if not completed today, or a checkmark if completed
**And** badges update when the user navigates between pages
**And** on tablet screens (769-1024px), the sidebar is collapsible with badges visible in both expanded and collapsed states

---

## Epic 3: Flashcards & Daily Challenge Upgrade

Flashcard reviews become immersive. Daily challenges feel like mini-games.

### Story 3.1: Flashcard Immersive Mode & Card Redesign

As a learner reviewing flashcards,
I want a distraction-free, full-screen card experience with CEFR-colored cards,
So that I can focus entirely on memorization.

**Acceptance Criteria:**

**Given** a user starting a flashcard review session
**When** the session is active
**Then** the module header is hidden, showing only a thin progress bar at the top
**And** the card front displays: headword (36px), phonetic (muted), CEFR badge pill, part of speech tag
**And** the card background uses a subtle gradient based on CEFR level (green for A, amber for B, rose for C)
**And** given a word without a CEFR level, the card uses the default accent gradient (not blank)
**And** the session shows "3 of 10 · ~2 min left" estimated time
**And** the 4 rating buttons (Quên/Khó/Ổn/Dễ) are displayed at the bottom
**And** the ModuleHeader returns when the session ends (summary state)

### Story 3.2: Flashcard Session Celebration & Streak Integration

As a learner,
I want to see a celebration when I complete all due flashcards,
So that I feel accomplished and motivated to maintain my streak.

**Acceptance Criteria:**

**Given** a user completing all due flashcard reviews
**When** the session summary displays
**Then** a CelebrationOverlay (tier="medium") animates with "🎉 Bạn đã ôn xong!"
**And** the current streak count and fire animation are displayed
**And** the summary shows a difficulty distribution (Easy/Good/Hard/Again counts)
**And** a "Thử thách mỗi ngày?" prompt suggests the daily challenge if not yet completed
**And** all animations respect `prefers-reduced-motion` (static summary, no animation)

### Story 3.3: Daily Challenge Game Aesthetics

As a learner doing the daily challenge,
I want a game-like visual experience with progress tracking,
So that the challenge feels exciting rather than like homework.

**Acceptance Criteria:**

**Given** a user starting the daily challenge
**When** exercises are displayed
**Then** a segmented progress bar (not dots) shows completed (green+check), current (animated accent), and remaining segments
**And** each exercise shows a type label with emoji ("📝 Điền vào chỗ trống", "🔄 Sắp xếp câu", etc.)
**And** the streak display uses StreakFire component with animated flame particles
**And** time elapsed shows as a subtle "⏱ 2:34" in the header

### Story 3.4: Daily Challenge Celebration Animations

As a learner completing the daily challenge,
I want tiered celebration animations based on my score,
So that perfect scores feel extra special.

**Acceptance Criteria:**

**Given** a user completing all 5 daily challenge exercises
**When** the results screen displays
**Then** 5/5 triggers CelebrationOverlay tier="big" with "🎉 Hoàn hảo!" in golden text
**And** 4/5 shows "👏 Xuất sắc!" with clapping animation
**And** 3/5 shows "👍 Tốt lắm!" with thumbs up
**And** ≤2/5 shows "💪 Cố lên!" with encouraging message
**And** new badge unlocks trigger a BadgeCard bounce-in animation
**And** correct answers flash green + subtle confetti; incorrect answers shake + show correct answer in green
**And** all animations respect `prefers-reduced-motion` (static result display, no confetti/shake)

---

## Epic 4: Chatbot Intelligence & Sign-In Upgrade

Users can tap words in chatbot conversations to learn them. New users see the app's value.

### Story 4.1: MiniDictionary Component

As a user,
I want a floating dictionary popup that works across modules,
So that I can look up any English word without leaving my current context.

**Acceptance Criteria:**

**Given** a word is tapped in a supported context (chatbot, quiz)
**When** the MiniDictionary opens
**Then** it displays a floating card positioned near the tapped word with: word, phonetic, part of speech, Vietnamese translation
**And** a "Lưu" button saves the word to vocabulary + flashcard pipeline via existing `POST /api/vocabulary` endpoint
**And** a "Tra cứu" button navigates to the dictionary page with the word pre-filled
**And** tapping outside the card closes it
**And** the card adjusts position to avoid going off-screen

### Story 4.2: Chatbot Word Highlighting

As a learner chatting with an AI tutor,
I want English vocabulary words to be highlighted and tappable in AI responses,
So that I can learn new words in context without leaving the conversation.

**Acceptance Criteria:**

**Given** an AI assistant message containing English vocabulary
**When** the message renders
**Then** English words (detected via regex with word boundary heuristics) are rendered as tappable spans with subtle underline styling
**And** a stopword list prevents common short/ambiguous words ("a", "an", "I", "me", "no", "am", "is", "the", etc.) from being highlighted
**And** given a message with 200+ words, highlighting SHALL render within 100ms without visible layout shift
**And** tapping a highlighted word opens the MiniDictionary component for that word
**And** saving a word through MiniDictionary adds it to vocabulary AND creates a flashcard entry automatically
**And** previously saved words show a subtle accent indicator (underline color change)

### Story 4.3: Chatbot Persona Cards

As a new user starting a conversation,
I want to see visual persona cards for each AI tutor,
So that I can choose the right tutor for my learning goal.

**Acceptance Criteria:**

**Given** a new conversation with no messages
**When** the conversation starts
**Then** visual persona cards are displayed showing: avatar icon, persona name, specialty, and 1-line description
**And** tapping a persona card selects it as the conversation partner
**And** the selected persona is used for the first message and subsequent messages
**And** the persona cards replace the current dropdown selector

### Story 4.4: Sign-In Page Value Proposition

As a new visitor,
I want to understand what the app offers before signing in,
So that I'm motivated to create an account.

**Acceptance Criteria:**

**Given** an unauthenticated user visiting the sign-in page
**When** the page loads
**Then** value proposition bullets are displayed: "🎯 Luyện IELTS & TOEIC với gia sư AI", "📚 Tra từ, lưu từ, ôn tập tự động", "🔥 Thử thách mỗi ngày, giữ vững streak"
**And** below the Google sign-in button, a "Xem thêm" section shows 4 feature preview cards with icons and descriptions
**And** the existing Google OAuth flow continues to work unchanged

---

## Epic 5: Grammar Quiz, Writing & Dictionary Polish

Grammar, writing, and dictionary modules get polished UX upgrades.

### Story 5.1: Grammar Quiz CEFR Path & Combo Scoring

As a grammar learner,
I want to see my CEFR progression and earn combo streaks,
So that studying grammar feels like progression, not random quizzes.

**Acceptance Criteria:**

**Given** a user on the grammar quiz idle state
**When** the level picker displays
**Then** a visual CEFR path (A1──●──A2──●──B1──○──B2──○──C1──○──C2──○) replaces the pill buttons
**And** completed levels show a checkmark, current level is highlighted, uncompleted levels show empty circles
**And** during the quiz, consecutive correct answers display a "🔥 x3 Combo!" counter above the question
**And** the combo counter resets on incorrect answers
**And** the score summary shows combo statistics and weak grammar topics
**And** weak topics show "Luyện thêm →" links (navigate to chatbot with relevant persona)

### Story 5.2: Grammar Quiz Expandable Explanations & History

As a grammar learner,
I want explanations to be optional and to see my quiz history,
So that I can focus on flow or dive deep as I choose.

**Acceptance Criteria:**

**Given** a user answering a grammar question
**When** the answer is revealed
**Then** a compact result shows "Đúng ✓" or "Sai ✗" with correct answer highlighted
**And** an expandable "Xem giải thích" section (collapsed by default) contains the full explanation
**And** question transitions use slide-left/slide-right animation
**And** a "Lịch sử" icon in the header opens a panel showing last 10 quiz results (date, level, score)

### Story 5.3: Writing Practice Split-View & Autosave

As a writer,
I want to see my text and the improved version side-by-side,
So that I can clearly see what I need to improve.

**Acceptance Criteria:**

**Given** a user receiving writing feedback on desktop (≥769px)
**When** the feedback panel displays
**Then** a side-by-side layout shows: left panel = user's text with inline error highlights (red=grammar, blue=vocabulary, yellow=coherence), right panel = AI-improved version with additions in green
**And** on mobile (≤768px), three tabs are shown: "Bài của bạn" | "Bản cải thiện" | "Đánh giá"
**And** a visual word count progress bar shows at the editor bottom: "[████░░░] 180/250 words" with color transitions (gray → green at target → amber at 120%)
**And** drafts autosave to localStorage every 30 seconds with "Bản nháp đã lưu" indicator
**And** if localStorage is full or unavailable, autosave fails silently (no error shown to user, feature degrades gracefully)
**And** returning to writing practice offers to restore the saved draft

### Story 5.4: Dictionary Enhancements

As a dictionary user,
I want recent lookups, pronunciation, and highlighted examples,
So that looking up words is faster and more informative.

**Acceptance Criteria:**

**Given** a user on the dictionary page
**When** the page loads
**Then** a horizontal scroll strip above the search shows the last 8 looked-up words as chips (tappable to re-search)
**And** after searching a word, a speaker icon appears next to the phonetic that plays pronunciation via Web Speech API (`speechSynthesis.speak()`)
**And** in example sentences, the target word is highlighted with `var(--accent)` color
**And** the chips persist across page navigation (loaded from vocabulary API)

---

## Epic 6: Cross-Module Integration & Gamification

The learning system unifies — vocabulary flows everywhere, XP tracks progress.

### Story 6.1: Vocabulary Mastery Levels & Tabs

As a learner,
I want to see which words I've mastered and filter by learning stage,
So that I can focus on words that need more practice.

**Acceptance Criteria:**

**Given** a user viewing their vocabulary list
**When** entries render
**Then** each word shows a mastery indicator: 🟡 New (no flashcard reviews), 🔵 Learning (SM-2 interval < 7 days), 🟢 Mastered (interval ≥ 21 days)
**And** mastery data is calculated from flashcard_progress at the API level (new field in vocabulary response)
**And** tab navigation displays 3 tabs: "Tất cả" | "Đã lưu ⭐" | "TOEIC 📋"
**And** the page uses inline styles with CSS custom properties (migrated from Tailwind utility classes)
**And** all existing functionality (search, filters, delete, undo) works unchanged

### Story 6.2: XP System & Cross-Module Vocabulary Flow

As a learner,
I want to earn XP for all activities and have saved words appear in flashcards automatically,
So that I feel progress across the whole app and my learning loop is seamless.

**Acceptance Criteria:**

**Given** a user completing any learning activity
**When** the activity completes
**Then** XP is awarded: flashcard session = 10 XP per card, quiz complete = 50 XP, writing submission = 100 XP, daily challenge = 30 XP
**And** XP is stored in the user's profile (new `xp_total` column in users table, additive only)
**And** the dashboard GreetingCard reflects the updated XP total
**And** words saved from MiniDictionary (chatbot) automatically create flashcard entries via existing vocabulary → flashcard pipeline
**And** `prefers-reduced-motion` disables all celebration/fire animations (static fallback shown)
