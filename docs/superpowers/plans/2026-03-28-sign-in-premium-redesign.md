# Sign-In Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `app/sign-in/page.tsx` into a luxury editorial split-screen layout with a dark Fraunces left panel and a clean cardless form on the right.

**Architecture:** Pure visual rewrite — no auth logic changes. Left panel is a presentational `div` with grain/glow overlays and staggered motion animations. Right panel removes the card container and uses bottom-border-only inputs for an editorial feel. A `.btn-shimmer` CSS class in `globals.css` provides the hover shimmer on the submit button.

**Tech Stack:** Next.js 14 App Router, React, Tailwind CSS v4, `motion/react` (already installed), Lucide React

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/sign-in/page.tsx` | Modify | Full visual rewrite — split layout, left panel, right panel form |
| `app/globals.css` | Modify | Add `.btn-shimmer` utility class |

---

### Task 1: Add `.btn-shimmer` CSS class to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add the shimmer class**

Open `app/globals.css` and append the following block after the existing `/* ── Ant overrides ── */` section (after line 110, at end of file):

```css
/* ── Button shimmer ── */
.btn-shimmer {
  position: relative;
  overflow: hidden;
}
.btn-shimmer::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(196, 109, 46, 0.18);
  transform: translateX(-100%);
  transition: transform 0.35s ease;
  pointer-events: none;
}
.btn-shimmer:hover:not(:disabled)::after {
  transform: translateX(0);
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: no errors (CSS isn't checked by tsc, but this confirms the project still compiles)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: add btn-shimmer utility class for amber hover sweep"
```

---

### Task 2: Rewrite `SignInPage` — split-screen outer layout

**Files:**
- Modify: `app/sign-in/page.tsx`

- [ ] **Step 1: Replace the `SignInPage` export**

Replace the entire `export default function SignInPage()` function (lines 149–164) with:

```tsx
export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left editorial panel — hidden on mobile */}
      <div className="relative hidden w-[45%] flex-col items-center justify-center overflow-hidden bg-(--ink) lg:flex">
        {/* Grain overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px 128px",
          }}
        />
        {/* Warm radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 75% 15%, rgba(196,109,46,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Editorial content */}
        <div className="relative z-10 mx-auto max-w-[340px] px-10 text-center">
          <motion.p
            className="text-[2.25rem] font-light italic leading-[1.35] text-white/90 [font-family:var(--font-display)]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
          >
            "Học tiếng Anh mỗi ngày, một câu chuyện mới mỗi ngày."
          </motion.p>

          <motion.div
            className="mx-auto mt-6 h-px w-12 bg-[rgba(196,109,46,0.4)]"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          />

          <motion.p
            className="mt-4 text-xs uppercase tracking-[0.22em] text-white/40"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.5, ease: "easeOut" }}
          >
            Trợ lý học tập tiếng Anh
          </motion.p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center bg-(--bg) px-8 py-16">
        <Suspense fallback={null}>
          <SignInContent />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "feat: split-screen outer layout for sign-in page"
```

---

### Task 3: Rewrite `SignInContent` — cardless right panel form

**Files:**
- Modify: `app/sign-in/page.tsx`

- [ ] **Step 1: Replace the `SignInContent` return statement**

Replace the entire `return (...)` block inside `function SignInContent()` (lines 67–146) with:

```tsx
  return (
    <motion.div
      className="flex w-full max-w-[380px] flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
    >
      {/* Logo + heading */}
      <div className="flex flex-col items-center text-center">
        <div className="grid size-10 place-items-center rounded-full bg-(--ink) text-white">
          <GraduationCap size={18} strokeWidth={2} />
        </div>

        <h1 className="mt-5 text-4xl italic [font-family:var(--font-display)] text-(--ink)">
          Xin chào
        </h1>
        <p className="text-xl [font-family:var(--font-display)] text-(--text-secondary)">
          Cô Minh đây
        </p>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Đăng nhập để bắt đầu luyện tiếng Anh
        </p>
      </div>

      {/* Email / password form */}
      <form className="mt-8 flex flex-col gap-4" onSubmit={handleEmailSignIn}>
        <input
          type="text"
          className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
          placeholder="Tên đăng nhập"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="username"
        />
        <input
          type="password"
          className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          autoComplete="current-password"
        />
        <motion.button
          type="submit"
          className="btn-shimmer mt-2 w-full rounded-(--radius) bg-(--ink) py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading || !email.trim() || !password.trim()}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-(--text-muted)">
        <div className="h-px flex-1 bg-(--border)" />
        <span>hoặc</span>
        <div className="h-px flex-1 bg-(--border)" />
      </div>

      {/* Google sign-in */}
      <motion.button
        className="flex w-full items-center justify-center gap-3 rounded-(--radius) border border-(--border) bg-transparent py-3 text-sm font-medium text-(--ink) transition-colors hover:bg-(--surface) disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        whileTap={{ scale: 0.97 }}
      >
        <GoogleIcon />
        Đăng nhập bằng Google
      </motion.button>

      {/* Error banner */}
      {error && (
        <motion.div
          className="mt-4 rounded-(--radius) border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}
    </motion.div>
  );
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Verify visually**

Run: `npm run dev`
Open `http://localhost:3000/sign-in` in a browser.

Check desktop (≥ 1024px wide):
- Left panel is dark `#1c1917` with visible warm glow top-right
- Grain texture is subtly visible on the left panel
- Fraunces italic quote appears with staggered fade-up
- Right panel is warm `#f6f4f0`, no card/border/shadow
- Inputs show only a bottom border line, no box
- Submit button hover slides an amber shimmer left-to-right

Check mobile (< 1024px wide or DevTools mobile):
- Only the right panel shows, full-screen

- [ ] **Step 4: Commit**

```bash
git add app/sign-in/page.tsx
git commit -m "feat: premium editorial sign-in redesign — split-screen, cardless form, shimmer button"
```
