# UI Upgrade System Design

Date: 2026-04-22
Status: Draft for user review

## Summary

Upgrade the English learning app UI with a system-first pass, then apply that system page by page. The goal is to make the app feel like one coherent learning product while preserving the existing feature set, routes, data flows, and core interaction models.

The current app has strong feature coverage, but its UI is uneven because many pages define their own headers, cards, controls, colors, and session layouts inline. Several pages also reference design tokens that are not defined globally, such as `--card-bg`, `--text`, and `--radius-md`. This creates inconsistent dark mode, spacing, and visual hierarchy.

## Chosen Approach

Use a system-first plus page pass approach.

1. Create the missing design tokens and shared UI primitives.
2. Convert page chrome and repeated learning flows to shared patterns.
3. Upgrade high-impact pages first.
4. Continue through assessment, review, reading, speaking, and utility pages.

This approach gives visible improvements quickly without producing a collection of unrelated page redesigns.

## Goals

- Make all main pages feel visually consistent.
- Improve mobile navigation and mobile control density.
- Reduce duplicated inline UI patterns.
- Keep the learning task in focus on practice pages.
- Make assessment and review pages easier to scan.
- Improve dark mode reliability by fixing missing tokens.
- Preserve current routes, APIs, hooks, and feature behavior unless a small UI-only state change is required.

## Non-Goals

- No rewrite of business logic, APIs, database schema, or learning algorithms.
- No new design framework.
- No marketing landing page redesign beyond sign-in polish.
- No large copy rewrite beyond concise UI labels and empty states.
- No unrelated refactors outside UI structure needed for the upgrade.

## Design Principles

- Task-first screens: practice pages should make the current learning task the center of the viewport.
- Consistent chrome: headers, page padding, section titles, filters, loading, errors, and empty states should share patterns.
- Calm but distinct modules: module identity can use color accents, but avoid each page feeling like a different product.
- Mobile parity: every important workflow should be reachable and usable on mobile without cramped controls.
- Dense where needed: progress, review, vocabulary, and analytics pages should be scannable rather than decorative.
- Accessible interaction states: selected, correct, wrong, disabled, loading, and completed states must be visually clear without relying only on color.

## Design System Foundation

### Tokens

Add or normalize global tokens in `apps/web/app/globals.css`.

- `--card-bg`: alias to the default raised surface.
- `--text`: alias to primary text.
- `--radius-md`: alias to the standard radius.
- `--surface-alt`: subtle alternate surface for panels.
- `--error-bg`, `--success-bg`, `--warning-bg`, `--info-bg`: semantic soft backgrounds.
- Module accent tokens for grammar, listening, writing, reading, vocabulary, speaking, review, and assessment.

Keep existing palette compatibility. The teal brand palette remains the default system accent.

### Shared Components

Introduce or extend these shared components under `apps/web/components/shared`.

- `PageFrame`: handles full-height scrolling, page padding, max width, and mobile bottom spacing.
- `PageHeader`: consistent compact page header with icon, title, subtitle, optional badge, optional action.
- `ModuleHero`: richer hero header for major module landing screens.
- `SessionShell`: focused practice shell with progress, current task, actions, loading, error, and result slots.
- `FilterBar`: responsive desktop inline filters and mobile-friendly wrapped filters.
- `QuizOption`: unified option button with idle, selected, correct, wrong, disabled states.
- `ResultSummary`: unified score/result card with metric breakdown and next actions.
- `StateBlock`: loading, empty, and error states with consistent spacing and actions.

### Navigation

Improve navigation without changing route structure.

- Keep desktop sidebar grouping, but make active group and badges more readable.
- Expand the mobile learning hub beyond four items.
- Include key destinations on mobile: Listening, Reading, Pronunciation, Writing, Review, Progress, Mock Test.
- Keep bottom tab simple: Home, Chat, Learn, Review, Profile. The Learn and Review tabs open hubs.

## Page Upgrade Plan

### Auth: `/sign-in`

Keep the split layout on desktop and focused single-column layout on mobile.

- Replace unverified-looking stats with product capability signals unless real metrics exist.
- Make the primary sign-in action visually dominant.
- Make feature cards more compact and less colorful.
- Align meta theme color with the app brand accent.

### Shell: `AppShell`, `AppSidebar`, `BottomTabBar`

- Move repeated spacing into shell tokens.
- Make mobile content padding consistent with the bottom tab.
- Expand mobile hub coverage.
- Improve sidebar badge color usage so badges match semantic purpose.
- Keep the collapsible desktop sidebar behavior.

### Dashboard: `/home`

Reframe as a daily mission dashboard.

- Top area: greeting, streak, level, XP, and one primary next action.
- Main area: today's plan with clear priority and completion state.
- Secondary widgets: word of the day, learning style, recent vocabulary, weekly activity, leaderboard, achievements.
- Reduce stacked-card heaviness by using section groups and compact repeated items.
- Make empty/new-user state lead directly into diagnostic or daily challenge.

### Chat: `/english-chatbot`

Keep the full-screen chat model.

- Improve mobile conversation drawer and hamburger placement.
- Keep composer sticky and unobstructed.
- Make persona and pronunciation controls compact and discoverable.
- Reduce visual noise in conversation list.
- Preserve mounted `ChatWindow` behavior across route changes.

### Dictionary: `/dictionary`

The existing two-column layout is good.

- Use `PageFrame` and responsive result sections.
- Improve empty state before search.
- Make save, thesaurus, and audio actions sticky or easy to reach on mobile.
- Keep recent lookups, nearby words, word family, verb forms, and thesaurus.
- Ensure long entries do not create layout jumps.

### My Vocabulary: `/my-vocabulary`

Convert from a bespoke list page into a vocabulary management workspace.

- Use a consistent page header and filter bar.
- Keep tabs: all, saved, TOEIC.
- On mobile, filters should wrap cleanly or collapse into a compact filter section.
- Group visual signals by mastery, level, and entry type without relying on emoji.
- Keep undo delete behavior and detail sheet.

### Flashcards: `/flashcards`

Keep immersive active review.

- Replace the outer framed card with `SessionShell`.
- Keep the top progress bar in active mode.
- Add a clearer pre-session queue/empty state.
- Improve summary with next review and distribution of ratings.
- Keep SM-2 review behavior unchanged.

### Review Quiz: `/review-quiz`

Make vocabulary and error review feel like one SRS product.

- Use shared tab/header and `SessionShell`.
- Use `QuizOption` for both vocabulary and error review.
- Standardize score result and per-item review list.
- Surface due counts and next action clearly.
- Link users toward Error Notebook or Vocabulary after results when useful.

### Grammar Quiz: `/grammar-quiz`

- Keep the focused quiz center layout.
- Use shared module header and result summary.
- Standardize option states and progress treatment.
- Make history drawer action consistent with page header actions.
- Remove page-specific radial decoration unless it is part of the module token system.

### Grammar Lessons: `/grammar-lessons`

Share the same library/detail pattern as Study Sets.

- Use a `LearningLibraryShell`.
- Topic grid cards should show level, progress, and completion.
- Lesson view should use consistent section panels for explanation, examples, mistakes, and practice.
- Keep generated lesson flow unchanged.

### Study Sets: `/study-sets`

- Use the same library/detail pattern as Grammar Lessons.
- Make active topic state feel like a lesson page rather than a local mode change.
- Standardize topic cards and completion indicators.
- Keep generated content and completion tracking.

### Writing Practice: `/writing-practice`

Turn the page into a writing workspace.

- Keep three modes: practice, rewrite, guided.
- Use tabs, but give each mode a clearer workspace structure.
- Desktop practice mode should support prompt/editor/feedback progression without excessive vertical movement.
- Mobile should remain a step flow.
- Keep history visible but secondary.

### Essay Score: `/writing-practice/score`

This page has high value but needs structure.

- Use `PageHeader` and `PageFrame`.
- Input state: exam selector, prompt, essay editor, word count, submit.
- Result state: sticky overall score on desktop, rubric cards, essay highlights, issue list, strengths, next steps.
- On mobile, inline issue details should behave like stacked cards or a sheet.
- Keep rewrite-per-issue behavior.

### Listening: `/listening`

Move mode selection out of the gradient header.

- Header shows current mode and state only.
- Mode selector becomes a toolbar below header or compact horizontal control.
- Standard listening, shadowing, dictation, and summarize modes each use `SessionShell`.
- Keep mini dictionary integration and audio player.
- Avoid cramped segmented labels on mobile.

### Listening Import: `/listening/import`

Make it a wizard.

- Step 1: URL input and supported source hints.
- Step 2: processing with clearer stage labels.
- Step 3: result workspace with sticky audio player and tabs for transcript, vocabulary, quiz.
- Keep legal note but make it secondary.
- Make transcript timestamps and active segment state more readable.

### Reading Library: `/reading`

Make it a content library.

- Use a module hero and filter bar.
- Article cards should have stable image area, metadata, difficulty, and read-time.
- Missing API key/empty state should be actionable and not look like a generic empty screen.
- Keep Guardian attribution.

### Article Reader: `/reading/[articleId]`

Make it a reader mode.

- Use constrained text width and more stable article typography.
- Add a compact sticky reader toolbar for back, difficulty, read time, words looked up, saved words.
- Make grammar analysis action less repetitive per paragraph.
- Keep mini dictionary and on-demand grammar analysis.

### Graded Reader: `/reading/graded`

- Keep CEFR filtering.
- Make level filters compact and scroll/wrap safely on mobile.
- Passage cards should show level, read status, word count, new words, and progress consistently.
- Reduce emoji dependence for section icons.

### Graded Passage: `/reading/graded/[id]`

- Use reader mode similar to Guardian article reader.
- Keep click-to-define text.
- Make mark-read and cloze-test actions sticky near the bottom on mobile.
- Show read time, word count, CEFR, and read status in a compact header.

### Cloze Test: `/reading/graded/[id]/cloze`

- Use `SessionShell` and `QuizOption`-style feedback.
- Keep inline blank input behavior.
- Improve submitted summary with save-missed action and retry.
- Ensure input width does not overflow on small screens.

### Daily Challenge: `/daily-challenge`

- Keep the five-exercise flow.
- Remove unnecessary card-in-card feel around exercise content.
- Use `SessionShell` with progress segments and timer.
- Result page should show score, streak impact, badges, and next recommended action.

### Progress: `/progress`

Turn into analytics dashboard.

- Top overview metrics: XP, saved words, streak, level.
- Primary insight area: predicted score and skill radar.
- Trend area: weekly XP, activity heatmap, reading stats, vocabulary growth.
- Use chart cards with consistent labels, legends, empty states, and tooltips where possible.
- Avoid treating every block as the same visual weight.

### Diagnostic: `/diagnostic`

- Use assessment shell across welcome, test, submitting, and results.
- Welcome should show value and prior result clearly.
- Test screen should use consistent progress and option buttons.
- Results should recommend next learning path, not only home/progress.
- Keep retake gating.

### Mock Test: `/mock-test`

High priority because it is an exam-like workflow.

- Desktop active test: split layout for passage and question when a passage exists.
- Sticky timer/progress/question navigator.
- Question navigator should show current, answered, flagged, unanswered.
- Review mode should separate score summary from answer explanations.
- Mobile should keep passage collapsible and navigation reachable.

### Error Notebook: `/error-notebook`

Make it a review triage workspace.

- Use page header with unresolved count.
- Move filters into `FilterBar`.
- Group errors by topic or source where useful.
- Make "mark as understood" and "review this" actions clear.
- Keep writing pattern section, but visually distinguish it from error list.

### Scenarios: `/scenarios`

- Present scenario list as learning pathways.
- Detail screen uses a step timeline with progress and locked/completed states.
- Step execution uses the shared session pattern.
- Completion should show XP, completed steps, and next step.
- Keep current scenario data and persistence.

### Pronunciation: `/pronunciation`

Use a shared voice-practice shell.

- Add microphone permission/preflight guidance in setup state.
- Keep level selector but make it a segmented control pattern.
- Recording state should show waveform or a clear active recording card.
- Results should separate phoneme score, spoken transcript, word chips, and tips.

### Minimal Pairs: `/pronunciation/minimal-pairs`

- Use the same voice/listening practice visual language.
- Setup should clearly explain listen vs speak mode.
- Weak contrast tags should be prominent and actionable.
- Playing state should focus on one contrast and one action.
- Result should drive focused retry on missed tags.

### Speaking Practice: `/speaking-practice`

- Use the same voice-practice shell as Pronunciation.
- Setup: CEFR, duration, exam mode, start.
- Ready: large topic card, regenerate topic action.
- Recording: timer, waveform, stop action.
- Result: overall score, fluency, grammar, vocabulary, coherence, transcript, retry/new/end session.

## Implementation Phases

### Phase 1: UI Foundation

- Add missing tokens and semantic module accents.
- Add `PageFrame`, `PageHeader`, `SessionShell`, `QuizOption`, `ResultSummary`, `FilterBar`, and `StateBlock`.
- Update shell/mobile hub.
- Verify dark mode and mobile base layout.

### Phase 2: High-Impact Pages

- Upgrade Home, Dictionary, Listening, Writing Practice, Mock Test.
- These are likely to have the largest perceived UX improvement.

### Phase 3: Review and Assessment

- Upgrade Review Quiz, Error Notebook, Diagnostic, Grammar Quiz, Daily Challenge, Progress.

### Phase 4: Content and Voice Pages

- Upgrade Reading pages, Grammar Lessons, Study Sets, Scenarios, Pronunciation, Minimal Pairs, Speaking Practice, Listening Import.

### Phase 5: Polish and Regression

- Run responsive checks on desktop and mobile.
- Run dark mode checks.
- Run existing tests and targeted component tests.
- Fix visual overflow, clipped labels, and inconsistent states.

## Acceptance Criteria

- No unresolved CSS variable references for core text, card, or radius tokens.
- All main app pages use shared page or session primitives for header/frame/state handling.
- Mobile bottom navigation provides reachable paths to the main learning, review, and progress areas.
- Quiz-like pages share option and result state patterns.
- Voice and recording pages share setup, recording, processing, and result patterns.
- Reading pages share reader typography and action treatment.
- Dark mode remains readable on all upgraded pages.
- No feature regression in existing hooks, API calls, routing, or saved state behavior.

## Verification Plan

- Run lint and typecheck for the web app.
- Run existing component and route tests after each phase.
- Add focused tests for shared primitives if their behavior is non-trivial.
- Use browser screenshots for desktop and mobile viewports after high-impact pages.
- Manually inspect dark mode on upgraded page families.

## Risks and Mitigations

- Risk: broad UI changes create visual regressions.
  Mitigation: phase the work and verify after each page family.

- Risk: shared primitives become too generic.
  Mitigation: design them around existing repeated patterns only.

- Risk: mobile navigation becomes crowded.
  Mitigation: keep four to five bottom destinations and place deeper routes in hubs.

- Risk: page-specific state flows break during refactor.
  Mitigation: keep hooks and API calls untouched, refactor render structure first.

## Implementation Defaults

- Phase 2 starts with Home, then Mock Test, then Listening, Writing Practice, and Dictionary. This order improves the daily entry point first, then the highest-risk exam workflow, then the most-used practice utilities.
- Do not create separate static mockups before implementation by default. Use the shared primitives as the design source of truth, then verify with desktop and mobile screenshots after each high-impact page.
