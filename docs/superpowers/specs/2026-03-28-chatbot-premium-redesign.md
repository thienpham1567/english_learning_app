# Chatbot Page Premium Redesign

**Date:** 2026-03-28
**Files:** `app/(app)/english-chatbot/page.tsx`, `components/app/ConversationList.tsx`, `components/ChatMessage.tsx`
**Aesthetic direction:** Luxury/refined — stays within the existing warm/earthy editorial language, adds depth through dark sidebar, grain textures, and elevated component details

---

## Goal

Elevate the English chatbot page to feel premium and distinguished. The upgrade spans three zones: a dark ink sidebar (matching the sign-in left panel), a grain-textured chat scroll area with an editorial welcome state, and a floating elevated input bar. No auth or chat logic changes.

---

## Layout

No structural changes to the outer layout (`flex min-h-0 flex-1 overflow-hidden`). The split between `ConversationList` (220px) and the chat area (`flex-1`) stays as-is.

---

## Zone 1: Sidebar (`ConversationList.tsx`)

### Background
- `bg-(--ink)` (#1c1917) — dark panel, same language as the sign-in left panel
- Grain overlay: `::` positioned `div` with SVG `feTurbulence` noise, `opacity-[0.035]`

### Header area (`px-4 pt-5 pb-3`)
- App identity row: small `GraduationCap` icon in a `size-6` amber-tinted circle (`bg-(--accent-light) text-(--accent)`) + `"Cô Minh"` wordmark in Fraunces italic, `text-sm text-white/80`
- Sits above the "New chat" button, separated by `mb-3`

### New chat button
- Full-width, `border border-white/15`, `text-white/70`, `rounded-(--radius)`, `py-2`
- Hover: `bg-white/8`

### Conversation items
- Text: `text-white/65`, timestamps: `text-white/30`
- Active item: `border-l-2 border-(--accent)` + `bg-white/6` — editorial bookmark
- Hover (inactive): `bg-white/5 text-white/80`
- Delete button (appears on group-hover): `text-white/30` → `text-red-400`

---

## Zone 2: Chat scroll area & welcome state (`page.tsx`)

### Scroll area background
- Grain layer: absolutely-positioned `div`, `pointer-events-none inset-0 opacity-[0.03]`, SVG `feTurbulence` noise, `backgroundSize: "128px 128px"`
- Warm radial glow: absolutely-positioned `div`, `pointer-events-none inset-0`, `background: radial-gradient(ellipse 60% 40% at 50% 0%, rgba(196,109,46,0.07) 0%, transparent 70%)`
- Both overlays sit inside the `scrollContainerRef` div, behind content via `z-0`

### Welcome state
- **Avatar seal**: `size-16` circle, `bg-(--ink)`, `text-white`, `GraduationCap size={22} strokeWidth={2}` — replaces the `👩‍🏫` emoji
  - Online dot: `size-3 rounded-full bg-(--sage)` with `ring-2 ring-(--bg)` at `bottom-1 right-1`
- **Heading**: `"Xin chào! Cô Minh đây"`, Fraunces italic `text-5xl`, `text-(--ink)`, `mt-6`
- **Subtext**: unchanged copy, `text-base text-(--text-secondary) max-w-sm mt-3`
- **Suggested prompt cards**: same 2×2 grid — card gets `bg-(--surface) border border-(--border)` with `hover:border-(--accent)/40 hover:bg-(--surface-hover)` — icon circles stay `bg-(--accent-light) text-(--accent)`

### Message spacing
- Role-switch gap: `mt-[28px]` (up from `mt-[22px]`)
- Same-role gap: `mt-[4px]` (unchanged)

### AI avatar in messages (`ChatMessage.tsx`)
- Replace emoji circle with `size-8` circle: `bg-(--ink) text-white`, `GraduationCap size={14} strokeWidth={2}`
- No change to user avatar

---

## Zone 3: Input bar (`page.tsx`)

### Outer container
- `bg-(--bg)/80 backdrop-blur-md` — translucent float over scroll content
- Remove hard `border-t` line — relies on the blur + shadow to separate
- `px-4 py-4 md:px-8`

### Textarea box
- `bg-(--surface) rounded-2xl shadow-(--shadow-md) border border-(--border)` at rest
- On focus-within: `shadow-(--shadow-lg) border-(--accent) ring-2 ring-(--accent-muted)` — more dramatic elevation lift
- Padding: `p-3`

### Send button
- `size-11` filled circle, `bg-(--ink)` when empty/loading → `bg-(--accent)` when text present (existing logic preserved)
- `rounded-full shadow-(--shadow-sm)`
- `whileTap={{ scale: 0.88 }}` (unchanged)

### Scroll-to-bottom pill
- `bg-(--surface) border border-(--border) shadow-(--shadow-lg)` — slightly more elevated than current

---

## What Does NOT Change

- All chat logic (`send`, `handleScroll`, `handleSelectConversation`, etc.)
- `SSE` streaming and error handling
- `TypingIndicator` component
- `ChatMessage` bubble geometry (rounded corners, user/AI colors)
- Markdown rendering in AI messages
- `ConversationList` props interface
- Routing and auth

---

## Files Changed

| File | Action |
|---|---|
| `components/app/ConversationList.tsx` | Dark sidebar — background, header identity row, item styles |
| `components/ChatMessage.tsx` | AI avatar: emoji → ink seal with GraduationCap |
| `app/(app)/english-chatbot/page.tsx` | Grain/glow overlays, welcome state seal, spacing, input bar float |
