# Sign-In Page Premium Redesign

**Date:** 2026-03-28
**File:** `app/sign-in/page.tsx`
**Aesthetic direction:** Luxury/refined — editorial split-screen, cinematic feel, generous whitespace

---

## Goal

Redesign the sign-in page to feel premium and distinguished. The current design uses a centered card on a plain background; the redesign replaces this with a split-screen editorial layout that lets the Fraunces display font shine and creates a clear luxury lift without touching any auth logic.

---

## Layout

Full-screen two-column flex layout (`min-h-screen`, no outer container).

- **Left panel** (`w-[45%]`, `hidden lg:flex`): dark `--ink` (#1c1917) background. Hidden on mobile.
- **Right panel** (`flex-1`): warm `--bg` (#f6f4f0) background. Full-screen on mobile.

On screens `< lg`, only the right panel is shown, full-screen.

---

## Left Panel

### Background
- Base: `bg-(--ink)` (#1c1917)
- Grain overlay: CSS pseudo-element (`::after`) with SVG `feTurbulence` noise filter at low opacity (~0.04) for tactile depth
- Radial warm glow: `radial-gradient` from warm amber (~`rgba(196,109,46,0.18)`) positioned top-right, fading to transparent — creates a soft light bloom

### Content (vertically and horizontally centered)
1. **Quote** — Fraunces italic, `~text-4xl`, `font-weight: 300`, `rgba(255,255,255,0.92)`:
   > *"Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày."*
2. **Thin rule** — `1px` height, `w-12`, warm amber tint `rgba(196,109,46,0.4)`, `mt-6`
3. **Tagline** — Source Sans 3, `text-xs`, `tracking-[0.22em]`, `uppercase`, `rgba(255,255,255,0.4)`, `mt-4`:
   > `TRỢ LÝ HỌC TẬP TIẾNG ANH`

### Animation
Staggered fade-up on mount using `motion/react`:
- Quote: delay 0.15s
- Rule: delay 0.3s
- Tagline: delay 0.42s

Each element: `opacity: 0 → 1`, `y: 14 → 0`, duration 0.5s, `easeOut`

---

## Right Panel

### Background
`--bg` (#f6f4f0) — no card, no border, no shadow. Form floats on the surface.

### Form container
- Centered vertically and horizontally: `flex flex-col items-center justify-center h-full px-8 py-16`
- Content max-width: `max-w-[380px] w-full`

### Entry animation
Single `motion.div` wrapping all form content: `opacity: 0 → 1`, `y: 20 → 0`, duration 0.45s, `easeOut`, delay 0.1s

### Logo mark
- `size-10` circle, `bg-(--ink)`, `text-white`, centered
- `GraduationCap` icon with Lucide prop `size={18} strokeWidth={2}`
- Smaller and less prominent than current version

### Heading
- `Xin chào` — Fraunces, `text-4xl`, italic, `--ink`
- `Cô Minh đây` — on a second line, Fraunces, `text-xl`, normal weight, `--text-secondary`
- `mt-5` below logo

### Subtext
- `mt-2`, `text-sm`, `--text-secondary`
- `"Đăng nhập để bắt đầu luyện tiếng Anh"`

### Inputs
- `mt-8 space-y-4` between fields
- Style: `bg-transparent`, no border box — bottom-border only: `border-b border-(--border)`
- On focus: `border-b-2 border-(--accent)` (editorial bottom-line style, no ring/box)
- Padding: `py-3 px-1`, `text-[15px]`, `w-full`
- Placeholder: `--text-muted`
- No `rounded` — flat bottom-border inputs feel more refined/editorial

### Primary button
- `mt-6`, full-width, `bg-(--ink)`, `text-white`, `rounded-(--radius)`, `py-3`, `text-sm font-semibold`
- Hover: warm amber shimmer sweep implemented as a named CSS class `.btn-shimmer` added to `globals.css`. The class uses `overflow: hidden; position: relative` on the button and a `::after` pseudo-element that slides `translateX(-100%) → translateX(0)` with `background: rgba(196,109,46,0.18)` on hover. Applied via `className="... btn-shimmer"`.
- `disabled:opacity-50 disabled:cursor-not-allowed`
- `whileTap={{ scale: 0.97 }}`

### Divider
- `my-6`, thin `h-px bg-(--border)` lines with `"hoặc"` text — same structure as current but lighter

### Google button
- Same structure as current
- Style: `border border-(--border)`, `bg-transparent`, `hover:bg-(--surface)`, `rounded-(--radius)`, full-width, `py-3`

### Error state
- Unchanged in structure; same red tint banner below Google button

### Footer tagline
- Remove the `"Trợ lý học tập tiếng Anh"` footer text — it duplicates the left panel on desktop and adds noise on mobile

---

## What Does NOT Change

- All auth logic (`handleGoogleSignIn`, `handleEmailSignIn`, `authClient` calls)
- `GoogleIcon` SVG component
- `Suspense` wrapper
- `useSearchParams` error handling
- Routing (`callbackURL: "/english-chatbot"`, redirect on success)
- `SignInContent` / `SignInPage` component structure

---

## Files Changed

- `app/sign-in/page.tsx` — full JSX/Tailwind rewrite of the visual layer only
- `app/globals.css` — add `.btn-shimmer` class for the button hover shimmer effect
- No new files, no new dependencies (motion/react already installed)
