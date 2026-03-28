# Sidebar & Toolbar Premium Redesign

**Date:** 2026-03-28
**Files:** `components/app/AppSidebar.tsx`, `components/app/AppShell.tsx`, new `components/app/ToolbarBreadcrumb.tsx`

---

## Goal

Redesign the app sidebar and toolbar with a frosted glass aesthetic and improved UX: toggle-controlled sidebar expansion (persisted), Tooltip labels on collapsed icons, and a breadcrumb page title in the toolbar.

---

## Design

### Sidebar — Glass Treatment

Replace the flat `bg-[var(--surface)]` with a warm frosted glass:

- **Background:** `bg-white/80 backdrop-blur-md` — warm cream `--bg: #f6f4f0` bleeds through for a soft, editorial frosted tone
- **Right edge:** `border-r border-white/40 shadow-[1px_0_20px_rgba(28,25,23,0.06)]`
- **Nav link hover:** `bg-white/50` wash
- **Nav link active:** `bg-[rgba(196,109,46,0.12)] text-[var(--accent)]` — amber-tinted glass, replacing flat `bg-[var(--accent-light)]`

### Sidebar — Toggle UX

Remove the CSS `hover:w-[264px]` expand mechanism entirely. Replace with:

- React state `isExpanded: boolean`, initialised from `localStorage.getItem("sidebar-expanded") === "true"` (default `false` = collapsed)
- On toggle: update state + `localStorage.setItem("sidebar-expanded", String(next))`
- **Toggle button:** small icon button (`PanelLeftOpen` when collapsed, `PanelLeftClose` when expanded) positioned at the top-right of the sidebar header area. Styled with `text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors`.
- Sidebar width: `w-[72px]` when collapsed, `w-[264px]` when expanded — controlled by className, not CSS hover. Smooth `transition-[width] duration-300`.
- `AppShell` grid column: `grid-cols-[72px_minmax(0,1fr)]` ↔ `grid-cols-[264px_minmax(0,1fr)]` — must be reactive. AppSidebar must expose `isExpanded` state upward, OR `AppShell` owns the state and passes it down.

**State ownership:** `AppShell` owns `isExpanded` and passes it as a prop to both `AppSidebar` (for its own width) and the grid class. `AppSidebar` calls an `onToggle` callback. Both `AppShell` and `AppSidebar` must be `"use client"` for this to work.

### Sidebar — Collapsed Tooltips

When `isExpanded === false`, wrap each nav `<Link>` in an Ant Design `<Tooltip placement="right" title={label}>`. When expanded, render without Tooltip (label is visible).

### Sidebar — Mobile

On `max-[920px]`: horizontal bar layout unchanged. Toggle button is hidden on mobile (`max-[920px]:hidden`). Sidebar always shows full labels on mobile (existing behaviour).

---

### Toolbar — Glass Treatment

Replace `bg-(--surface)` with:

- `bg-white/70 backdrop-blur-xl` — genuine frosted, content scrolls behind it
- `border-b border-white/30`

### Toolbar — Breadcrumb Content

Add a new `ToolbarBreadcrumb` client component rendered on the **left** of the toolbar header.

**Route → title map** (same source of truth as AppSidebar `navItems`):

| Route | Eyebrow | Title |
|---|---|---|
| `/english-chatbot` | Trợ lý học tập | Trò chuyện |
| `/co-lanh-dictionary` | Từ điển | Cô Lãnh |
| `/my-vocabulary` | Từ vựng của tôi | Từ vựng |

**Markup:**

```tsx
<div className="flex flex-col justify-center">
  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none">
    {eyebrow}
  </p>
  <h2 className="text-sm font-semibold text-[var(--ink)] leading-snug mt-0.5">
    {title}
  </h2>
</div>
```

`usePathname()` drives which eyebrow/title pair renders. Falls back to an empty fragment for unknown routes.

---

## What Does NOT Change

- `UserMenu` component — position, styling, behaviour
- Nav items list (`navItems` array in AppSidebar)
- Mobile horizontal layout behaviour
- `AppShell` outer grid structure (only the column width value changes)
- Any other page or component outside these three files

---

## Architecture Notes

- `AppShell` becomes `"use client"` to own `isExpanded` state
- `AppSidebar` receives `isExpanded: boolean` and `onToggle: () => void` props
- `ToolbarBreadcrumb` is a new file — `"use client"`, uses `usePathname`
- `localStorage` access guarded with `typeof window !== "undefined"` for SSR safety

## Test Impact

- `components/app/__tests__/AppShell.test.tsx` — currently asserts `bg-(--surface)` on the header element. Must be updated to `bg-white/70` after implementation.
- `components/app/__tests__/AppSidebar.test.tsx` — does not test background colour or toggle state; no changes needed.
