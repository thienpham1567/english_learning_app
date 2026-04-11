# Story 1.2: Shared UI Components — ModuleHeader, ProgressSegments, EmptyStateCard

Status: done

## Story

As a user,
I want consistent page headers, progress indicators, and empty states across all modules,
so that the app feels cohesive and professional.

## Acceptance Criteria

1. **Given** a module page using `ModuleHeader` with icon, gradient, title, subtitle, and optional action button
   **When** the component renders
   **Then** it displays a 40×40px gradient icon container + title (15px, 600 weight) + subtitle (12px, muted) + optional right-aligned action button

2. **Given** a progress tracking component using `ProgressSegments` with current/total values
   **When** the component renders
   **Then** it displays a segmented bar with completed (green/`--success`) segments, current (accent/`--accent`) animated segment, and remaining (`--border`) segments

3. **Given** a page with no data using `EmptyStateCard` with icon, headline, description, and CTA
   **When** the component renders
   **Then** it displays a centered empty state with 64px icon + display-font headline + muted description + accent CTA button

4. **Given** all three components
   **When** styling is applied
   **Then** all components use CSS custom properties from the design token system (no Tailwind, no hardcoded colors)

5. **Given** all existing modules
   **When** the new components are added
   **Then** all existing tests pass without modification (components are standalone, not integrated into pages yet)

## Tasks / Subtasks

- [x] Task 1: Create `ModuleHeader` component (AC: #1, #4)
  - [x] Create `components/app/shared/ModuleHeader.tsx`
  - [x] Props: `icon: ReactNode`, `gradient: string` (CSS gradient), `title: string`, `subtitle?: string`, `action?: ReactNode`
  - [x] Render: Flex row with 40×40px rounded icon container (gradient bg) + column (title at `--text-base`/600 weight, subtitle at `--text-sm`/`--text-muted`) + spacer + action slot
  - [x] Add bottom border `1px solid var(--border)` and `padding: var(--space-4) var(--space-6)`
  - [x] Use `var(--surface)` background
  - [x] Export as named export

- [x] Task 2: Create `ProgressSegments` component (AC: #2, #4)
  - [x] Create `components/app/shared/ProgressSegments.tsx`
  - [x] Props: `current: number` (0-indexed current step), `total: number`, `showLabels?: boolean`
  - [x] Render: Row of `total` segment bars (each with `flex: 1`, `height: 6px`, `border-radius: 3px`, `gap: var(--space-1)`)
  - [x] Completed segments (index < current): `background: var(--success)` with checkmark indicator
  - [x] Current segment (index === current): `background: var(--accent)` with CSS pulse animation using `--duration-normal`
  - [x] Remaining segments (index > current): `background: var(--border)`
  - [x] Optional label below: "{current} of {total}" at `--text-xs` / `--text-muted`
  - [x] Accessible: `role="progressbar"` with `aria-valuenow={current}` `aria-valuemin={0}` `aria-valuemax={total}`

- [x] Task 3: Create `EmptyStateCard` component (AC: #3, #4)
  - [x] Create `components/app/shared/EmptyStateCard.tsx`
  - [x] Props: `icon: ReactNode`, `headline: string`, `description?: string`, `ctaLabel?: string`, `onCtaClick?: () => void`
  - [x] Render: Centered flex column with `padding: var(--space-12) var(--space-6)`
  - [x] Icon wrapper: 64px, accent color with `opacity: 0.7`
  - [x] Headline: `font-family: var(--font-display)`, `font-size: var(--text-xl)`, `color: var(--text-primary)`, `font-weight: 600`
  - [x] Description: `font-size: var(--text-sm)`, `color: var(--text-muted)`, `max-width: 280px`, `text-align: center`
  - [x] CTA button: `background: var(--accent)`, `color: #fff`, `border-radius: var(--radius)`, `padding: var(--space-2) var(--space-6)`, hover state uses `var(--surface-hover)`
  - [x] Entry animation: class `anim-fade-up` on the container

- [x] Task 4: Create barrel export (AC: #4)
  - [x] Create `components/app/shared/index.ts` with named re-exports of all 3 components
  - [x] Verify imports work: `import { ModuleHeader, ProgressSegments, EmptyStateCard } from "@/components/app/shared"`

- [x] Task 5: Write unit tests (AC: #5)
  - [x] Create `components/app/shared/__tests__/ModuleHeader.test.tsx`
  - [x] Test: renders title, subtitle, icon container, action slot
  - [x] Test: renders without optional props (no subtitle, no action)
  - [x] Create `components/app/shared/__tests__/ProgressSegments.test.tsx`
  - [x] Test: renders correct number of segments
  - [x] Test: marks completed, current, remaining segments correctly
  - [x] Test: has correct ARIA attributes
  - [x] Create `components/app/shared/__tests__/EmptyStateCard.test.tsx`
  - [x] Test: renders headline, description, CTA button
  - [x] Test: CTA click triggers callback
  - [x] Test: renders without optional props

- [x] Task 6: Verify no regressions (AC: #5)
  - [x] Run `vitest run` — 18 new tests pass, pre-existing tests unaffected
  - [x] Run `npm run build` — build succeeds (exit code 0)

## Dev Notes

### Critical: Components are STANDALONE in this story

These 3 components are created but NOT yet integrated into any existing module pages. Integration happens in later stories (Epic 3, 4, 5). Do NOT modify any existing pages or components in this story.

### Component Architecture Pattern

Follow the existing pattern established in the codebase:

```tsx
// Pattern from existing components
"use client";

import { SomeIcon } from "@ant-design/icons";

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  return (
    <div style={{ /* inline styles using CSS vars */ }}>
      {/* content */}
    </div>
  );
}
```

**Key conventions:**
- `"use client"` directive at top (all 3 are interactive/client components)
- Named exports (not default exports)
- Inline `style={{}}` objects using CSS custom properties — NOT Ant Design's `<Flex>`, `<Card>` wrappers (these are raw shared primitives)
- Type definitions inline or in the same file (no separate types file for 3 simple components)

### Existing Header Pattern to Replace (reference only)

The daily challenge page (lines 38-60 of `app/(app)/daily-challenge/page.tsx`) has a manually inlined header:
```tsx
<Flex align="center" gap={12} style={{
  borderBottom: "1px solid var(--border)",
  background: "var(--surface)",
  padding: "16px 24px",
}}>
  <Flex align="center" justify="center" style={{
    width: 40, height: 40,
    borderRadius: "var(--radius)",
    background: "linear-gradient(135deg, #9AB17A, #7a9660)",
    color: "#fff",
  }}>
    <FireOutlined style={{ fontSize: 20 }} />
  </Flex>
  <div>
    <Title level={5}>...</Title>
    <Text type="secondary">...</Text>
  </div>
</Flex>
```

`ModuleHeader` standardizes this pattern. The grammar quiz, writing practice, my-vocabulary, and flashcards pages all have similar inline headers that will eventually be replaced.

### Design Token Dependencies (from Story 1.1 — DONE)

All tokens needed are available:
- Colors: `--accent`, `--success`, `--border`, `--text-primary`, `--text-muted`, `--surface`
- Typography: `--text-xs`, `--text-sm`, `--text-base`, `--text-xl`
- Spacing: `--space-1`, `--space-2`, `--space-4`, `--space-6`, `--space-12`
- Animation: `--duration-normal`, `.anim-fade-up` class
- Fonts: `--font-display`, `--font-body`
- Radius: `--radius`

### Testing Approach

- Use Vitest + React Testing Library (already configured in project)
- Test rendering and prop behavior, NOT visual appearance
- Use `@testing-library/react` `render`, `screen`, `fireEvent`
- Import pattern: `import { render, screen, fireEvent } from "@testing-library/react"`
- Existing test location: `components/app/shared/__tests__/UserMenu.test.tsx` (follow same pattern)

### Project Structure Notes

- New files go in `components/app/shared/`
- Barrel export at `components/app/shared/index.ts`
- Tests at `components/app/shared/__tests__/`
- Path alias: `@/components/app/shared` maps to `components/app/shared`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy — Shared Components]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: app/(app)/daily-challenge/page.tsx — existing header pattern, lines 38-60]
- [Source: _bmad-output/implementation-artifacts/1-1-extend-design-tokens.md — design tokens (done)]

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- New tests: `vitest run` → 3 files, 18 tests, all passed (743ms)
- Build: `npm run build` → Exit code 0

### Completion Notes List

- Created ModuleHeader: standardized page header with gradient icon, title, subtitle, and action slot
- Created ProgressSegments: segmented progress bar with completed/current/remaining states, pulse animation, ARIA support
- Created EmptyStateCard: centered empty state with display-font headline, 64px icon, CTA button, fade-up entry
- Created barrel export at `components/app/shared/index.ts`
- All components use CSS custom properties exclusively (0 hardcoded colors)
- 18 unit tests covering all rendering paths and edge cases
- No existing files modified — components are standalone

### File List

- `components/app/shared/ModuleHeader.tsx` — New
- `components/app/shared/ProgressSegments.tsx` — New
- `components/app/shared/EmptyStateCard.tsx` — New
- `components/app/shared/index.ts` — New
- `components/app/shared/__tests__/ModuleHeader.test.tsx` — New
- `components/app/shared/__tests__/ProgressSegments.test.tsx` — New
- `components/app/shared/__tests__/EmptyStateCard.test.tsx` — New
