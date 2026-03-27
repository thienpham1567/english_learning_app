# Tailwind CSS v4 Integration Design

## Summary

Integrate Tailwind CSS v4 as the primary styling system for the entire frontend of the English learning app while preserving the existing product visual language and keeping Ant Design available where it already provides useful behavior. The migration will replace handwritten page- and component-level global CSS with Tailwind utility classes and a small token-driven global foundation.

## Goals

- Make Tailwind CSS v4 the default way to author frontend styles.
- Cover the whole current frontend in the first migration pass.
- Preserve the current editorial study-companion visual direction instead of redesigning the app.
- Keep Ant Design in the stack and compatible with the new styling model.
- Reduce `app/globals.css` to a thin global layer rather than a full component stylesheet.

## Non-Goals

- Replacing Ant Design with a Tailwind component library.
- Changing API behavior, route behavior, or backend contracts.
- Introducing a visual redesign unrelated to the migration.
- Refactoring unrelated business logic beyond what is necessary to support cleaner component markup.

## Current State

The project already includes `tailwindcss@^4` and `@tailwindcss/postcss@^4`, and `app/globals.css` already imports Tailwind via `@import "tailwindcss";`. PostCSS is configured correctly for Tailwind v4. However, the frontend still relies primarily on a large set of handwritten global classes in `app/globals.css` for layout, components, and route-specific UI.

This means the project is partially integrated at the tooling level but not yet migrated at the authoring level.

## Desired End State

After the migration:

- Frontend components are styled primarily with Tailwind classes in JSX.
- Shared visual tokens remain centralized and stable.
- `app/globals.css` contains only foundational concerns:
  - Tailwind import
  - global tokens
  - element resets and document-level defaults
  - shared keyframes or utility-like helpers that are not practical inline
  - minimal Ant Design compatibility overrides
- Existing pages and shared UI components no longer depend on legacy global component selectors like `.app-shell`, `.chat-page`, or `.dictionary-page`.
- The existing user-facing look and interaction quality remain intact.

## Architecture

### Styling Model

Tailwind v4 will become the source of truth for frontend styling. Styling decisions such as spacing, sizing, typography, colors, radii, shadows, layout behavior, hover states, and responsive changes will be expressed directly in component markup using Tailwind classes.

The existing design language will be preserved by exposing the current palette, typography, radii, shadows, and layout constants through CSS variables in the global stylesheet and using them through Tailwind-friendly values. This keeps the implementation modern without forcing a visual reset.

### Global Foundation

`app/globals.css` will remain the only global stylesheet, but its responsibility will narrow to:

- Import Tailwind
- Define app-wide design tokens in `:root`
- Define document-level defaults for `html`, `body`, and universal box sizing
- Register shared keyframes used across multiple components
- Host a minimal set of Ant Design overrides tied to the same tokens

Any selector that exists only to style a specific page or component should be migrated out of the global stylesheet and into the corresponding React component.

### Component Boundaries

The migration will follow the existing code structure:

- Foundation: `app/globals.css`, `app/layout.tsx`
- Shell/layout: `components/app/AppShell.tsx`, `components/app/AppSidebar.tsx`, `components/app/UserMenu.tsx`
- Route pages: `app/sign-in/page.tsx`, `app/(app)/english-chatbot/page.tsx`, `app/(app)/co-lanh-dictionary/page.tsx`
- Shared chat UI: `components/ChatMessage.tsx`, `components/TypingIndicator.tsx`
- Shared dictionary UI: `components/dictionary/DictionarySearchPanel.tsx`, `components/dictionary/DictionaryResultCard.tsx`

This preserves the current architectural boundaries while changing the styling strategy within those files.

## Migration Strategy

### Phase 1: Foundation

Keep the existing font loading in `app/layout.tsx` and ensure the font variables remain exposed for Tailwind-authored markup. Reduce `app/globals.css` to foundational tokens, resets, animation keyframes, and minimal third-party overrides.

### Phase 2: Layout And Shell

Migrate the app shell and navigation components first. This establishes Tailwind patterns for:

- grid and flex layouts
- sticky sidebar behavior
- responsive spacing and width control
- typography hierarchy
- hover, active, and focus states

These components set the baseline conventions for the rest of the frontend.

### Phase 3: Route-Level Screens

Migrate each current route so the visible product surfaces are Tailwind-first:

- sign-in page
- English chatbot page
- dictionary page

During this phase, parent layout containers, hero sections, panels, prompts, and form shells move out of legacy global selectors.

### Phase 4: Shared Leaf Components

Migrate the shared child components used by those pages so styling is not split between Tailwind-based parents and legacy CSS-based children. This includes message rows, typing indicators, dictionary cards, and search surfaces.

### Phase 5: Legacy CSS Cleanup

After all covered components no longer depend on their old global selectors, remove obsolete page- and component-specific CSS from `app/globals.css`. Only the thin foundation layer should remain.

## Ant Design Compatibility

Ant Design stays in the project. It should coexist with Tailwind rather than compete with it.

Rules for Ant Design usage:

- Keep Ant Design where it already provides behavior or convenience, such as `message`.
- Do not expand the app-wide styling model around Ant Design tokens or layout primitives.
- Prefer Tailwind-authored wrappers and surrounding layout even when an Ant component remains in use.
- Keep global Ant overrides small, token-driven, and limited to compatibility needs such as backgrounds, placeholder colors, and surface alignment.

This avoids unnecessary rewrite scope while keeping the app visually coherent.

## Motion And Interaction

Existing motion behavior built with `motion/react` should remain. Tailwind will handle visual styling, while animation behavior continues to live in component logic where appropriate.

Shared keyframes that are reused across multiple components may stay in `app/globals.css`. Component-specific animation wrappers should be expressed through Tailwind classes and inline motion props instead of legacy global class systems.

## Data Flow And Functional Behavior

This migration does not alter page data flow, API contracts, auth routing, or request lifecycles. Chat streaming, dictionary lookup, sign-in flows, and route protection should behave exactly as they do today.

If markup cleanup is required to support Tailwind classes, it must not change user-visible behavior beyond styling fidelity. Any incidental refactor must remain behavior-preserving.

## Error Handling

Primary risks are styling regressions rather than application logic failures.

Controls:

- Migrate components area-by-area so old selectors are only removed after replacement is in place.
- Keep behavior code separate from styling edits where possible.
- Preserve existing error surfaces such as chat failure messaging and dictionary lookup notifications.
- Keep minimal Ant Design overrides centralized so compatibility issues are easier to reason about.

If a component relies on a legacy selector for behavior-adjacent layout, convert that component completely before deleting the selector from the global stylesheet.

## Testing Strategy

The migration should use regression-focused verification:

- Run existing component and route tests and update them only where they rely on removed class names or changed DOM shape.
- Add or adjust targeted tests only when needed to preserve meaningful UI expectations.
- Run lint to catch JSX/class formatting and general code issues.
- Run production build to verify Tailwind v4 works correctly in the Next.js pipeline.

The migration does not require broad new feature tests because it is not intended to introduce new product behavior.

## Acceptance Criteria

- Tailwind CSS v4 is the primary styling model across the current frontend.
- All current frontend routes and shared UI components are migrated off legacy page/component global selectors.
- `app/globals.css` is reduced to tokens, resets, shared keyframes, and minimal Ant Design overrides.
- Ant Design remains functional and visually compatible with the Tailwind-based app shell.
- Existing tests, lint, and production build pass after the migration.
- The current visual identity remains recognizably consistent with the pre-migration UI.

## Implementation Notes

- Preserve existing CSS variables where they are still useful as design tokens.
- Avoid introducing a separate Tailwind config unless the migration proves it is necessary; Tailwind v4 should remain as close to its default setup model as possible.
- Prefer incremental component conversion over inventing a new abstraction layer prematurely.
- If repeated class combinations emerge during migration, extract only small, obvious wrappers or constants rather than rebuilding a custom design system API.

## Open Decisions Resolved

- Tailwind v4 will be the primary styling system: yes
- First migration pass scope: whole current frontend
- Ant Design removal: no
- Visual redesign: no

## Files Most Likely To Change During Implementation

- `app/globals.css`
- `app/layout.tsx`
- `app/sign-in/page.tsx`
- `app/(app)/english-chatbot/page.tsx`
- `app/(app)/co-lanh-dictionary/page.tsx`
- `components/app/AppShell.tsx`
- `components/app/AppSidebar.tsx`
- `components/app/UserMenu.tsx`
- `components/ChatMessage.tsx`
- `components/TypingIndicator.tsx`
- `components/dictionary/DictionarySearchPanel.tsx`
- `components/dictionary/DictionaryResultCard.tsx`
- Related frontend tests whose assertions depend on old class names or structure
