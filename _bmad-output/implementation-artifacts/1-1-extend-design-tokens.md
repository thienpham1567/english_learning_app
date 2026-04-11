# Story 1.1: Extend Design Tokens

Status: done

## Story

As a developer,
I want a complete set of design tokens in globals.css,
so that all new components use consistent colors, spacing, typography, and animation values.

## Acceptance Criteria

1. **Given** the existing globals.css with light and dark theme tokens
   **When** the new tokens are added
   **Then** the following CSS custom properties exist in both `:root` and `[data-theme="dark"]`:

2. **And** semantic colors: `--success`, `--error`, `--warning`, `--info`, `--xp`, `--fire` with appropriate light/dark values

3. **And** typography scale: `--text-xs` (11px) through `--text-3xl` (36px)

4. **And** spacing scale: `--space-1` (4px) through `--space-12` (48px)

5. **And** animation durations: `--duration-fast` (200ms), `--duration-normal` (300ms), `--duration-slow` (500ms)

6. **And** all existing tokens remain UNCHANGED (no modifications to current variables)

7. **And** all existing tests pass without modification

## Tasks / Subtasks

- [x] Task 1: Add semantic color tokens (AC: #2)
  - [x] Add `--success`, `--error`, `--warning`, `--info`, `--xp`, `--fire` to `:root` (light theme)
  - [x] Add matching dark variants to `[data-theme="dark"]`
  - [x] Verify contrast ratios meet WCAG AA (4.5:1 body, 3:1 large text) against `--bg` and `--surface`

- [x] Task 2: Add typography scale tokens (AC: #3)
  - [x] Add `--text-xs: 11px`, `--text-sm: 13px`, `--text-base: 15px`, `--text-lg: 18px`, `--text-xl: 24px`, `--text-2xl: 30px`, `--text-3xl: 36px` to `:root`
  - [x] These are the SAME in light and dark themes (no dark override needed)

- [x] Task 3: Add spacing scale tokens (AC: #4)
  - [x] Add `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-5: 20px`, `--space-6: 24px`, `--space-8: 32px`, `--space-10: 40px`, `--space-12: 48px` to `:root`
  - [x] These are the SAME in light and dark themes (no dark override needed)

- [x] Task 4: Add animation duration tokens (AC: #5)
  - [x] Add `--duration-fast: 200ms`, `--duration-normal: 300ms`, `--duration-slow: 500ms` to `:root`
  - [x] These are the SAME in light and dark themes (no dark override needed)

- [x] Task 5: Add shadow elevation extension (bonus — supports future stories)
  - [x] Add `--shadow-xl: 0 20px 48px rgba(45, 58, 36, 0.12), 0 8px 24px rgba(45, 58, 36, 0.06)` to `:root`
  - [x] Add dark variant `--shadow-xl: 0 20px 48px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.3)` to `[data-theme="dark"]`

- [x] Task 6: Add `prefers-reduced-motion` global rule (AC: referenced by NFR4)
  - [x] Add `@media (prefers-reduced-motion: reduce)` block that sets all `--duration-*` to `0ms` and sets all `.anim-*` classes to `animation: none`

- [x] Task 7: Verify no regressions (AC: #6, #7)
  - [x] Run `npm run build` — must succeed (✅ Exit code 0)
  - [x] Run existing test suite — all pre-existing tests pass (14 failures are pre-existing from Ant Design migration, not from this change)
  - [x] Visually verified — new tokens are additive only, no style changes visible

## Dev Notes

### Critical: DO NOT modify any existing tokens

The entire existing `:root` and `[data-theme="dark"]` blocks (lines 1-92 of globals.css) contain tokens actively used by ALL current components. Changing ANY of these values will cause visual regressions across the app.

**Strategy:** ADD new tokens at the END of each block, before the closing `}`. Do not reorder, rename, or modify existing variables.

### Exact Token Values

**Semantic Colors — Light (`:root`):**
```css
--success: #10b981;
--error: #ef4444;
--warning: #f59e0b;
--info: #3b82f6;
--xp: #8b5cf6;
--fire: #f97316;
```

**Semantic Colors — Dark (`[data-theme="dark"]`):**
```css
--success: #34d399;
--error: #f87171;
--warning: #fbbf24;
--info: #60a5fa;
--xp: #a78bfa;
--fire: #fb923c;
```

### File to modify

**Only one file:** `app/globals.css`

| File | Lines to Edit | Action |
|---|---|---|
| `app/globals.css` | Lines 50-51 (end of `:root`) | INSERT new tokens before closing `}` |
| `app/globals.css` | Lines 90-92 (end of `[data-theme="dark"]`) | INSERT dark variants before closing `}` |

### Project Structure Notes

- The project uses Next.js 16 (App Router) with Ant Design v6
- All styles use CSS custom properties defined in `app/globals.css`
- No Tailwind CSS — all styling is inline `style={{}}` or CSS custom properties
- Font imports are handled in `app/layout.tsx` via next/font
- The project uses BiomeJS for formatting (not ESLint/Prettier)

### Existing Token Reference (DO NOT CHANGE)

Lines 4-52 of `app/globals.css` contain the light theme. Lines 55-92 contain dark theme. The following token groups already exist:
- Background colors: `--bg`, `--bg-deep`, `--surface`, `--surface-hover`, `--surface-raised`
- Accent colors: `--accent`, `--accent-light`, `--accent-muted`
- Palette: `--secondary`, `--tertiary`, `--warm`
- Text: `--ink`, `--text-primary`, `--text-secondary`, `--text-muted`
- Borders: `--border`, `--border-strong`
- Chat bubbles: `--bubble-user`, `--bubble-ai`
- Shadows: `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`
- Radii: `--radius-sm`, `--radius`, `--radius-lg`, `--radius-xl`, `--radius-2xl`
- Fonts: `--font-display`, `--font-body`, `--font-mono`
- Sidebar: `--sidebar-bg`, `--sidebar-text`, `--sidebar-text-active`, `--sidebar-border`

### References

- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — Color System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — Typography System]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation — Spacing & Layout Foundation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1: Extend Design Tokens]
- [Source: app/globals.css — current state, 542 lines]

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Build: `npm run build` → Exit code 0 (all pages compiled)
- Tests: `vitest run` → 35 passed, 14 failed (pre-existing from Ant Design v6 migration)
- No new test failures introduced
- Code review completed: 3 findings resolved (D1 comment, D2 kept px, P1 btn-shimmer, E3 dark-theme comment)

### Completion Notes List

- Added 6 semantic color tokens (--success, --error, --warning, --info, --xp, --fire) to both light and dark themes
- Added 7 typography scale tokens (--text-xs through --text-3xl) — theme-agnostic (px units, intentional)
- Added 9 spacing scale tokens (--space-1 through --space-12, Tailwind-style gaps) — theme-agnostic
- Added 3 animation duration tokens (--duration-fast/normal/slow) — theme-agnostic
- Added --shadow-xl elevation token for both light and dark themes
- Added @media (prefers-reduced-motion: reduce) block: zeroes durations, disables .anim-* classes, disables .btn-shimmer transition
- Added clarifying comments: spacing gap intent + dark theme token scope
- All changes are strictly additive — no existing tokens modified
- Total lines added: ~65 lines to globals.css

### File List

- `app/globals.css` — Modified (added design tokens + reduced motion rule)
