# Tailwind v4 Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current frontend to Tailwind CSS v4 as the primary styling system while preserving the existing look and keeping Ant Design compatible.

**Architecture:** Keep `app/globals.css` as a thin global layer for tokens, resets, shared keyframes, and minimal Ant Design overrides. Move page, shell, and component styling into Tailwind-authored JSX class names, migrating top-down so selectors can be deleted only after their consumers are converted.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, Ant Design 6, `motion/react`, Vitest, Testing Library

---

## File Structure

### Modify

- `app/globals.css`
  Keep only Tailwind import, root tokens, global resets, shared keyframes, markdown defaults, scrollbar styles, and minimal Ant Design overrides.
- `app/layout.tsx`
  Keep font loading, move font variables onto structural classes cleanly, and remove inline style usage that is no longer needed.
- `components/app/AppShell.tsx`
  Replace global shell selectors with Tailwind layout classes.
- `components/app/AppSidebar.tsx`
  Replace sidebar selector usage with Tailwind-authored navigation markup.
- `components/app/UserMenu.tsx`
  Replace dropdown selector usage with Tailwind-authored menu markup.
- `app/sign-in/page.tsx`
  Replace page/card/form selectors with Tailwind classes.
- `app/(app)/english-chatbot/page.tsx`
  Replace chat page, welcome, prompts, composer, and error selectors with Tailwind classes.
- `components/ChatMessage.tsx`
  Replace bubble/avatar/meta selectors with Tailwind classes.
- `components/TypingIndicator.tsx`
  Replace typing indicator selectors with Tailwind classes.
- `app/(app)/co-lanh-dictionary/page.tsx`
  Replace page/hero/layout selectors with Tailwind classes.
- `components/dictionary/DictionarySearchPanel.tsx`
  Replace card, controls, and tips selectors with Tailwind classes while keeping Ant components.
- `components/dictionary/DictionaryResultCard.tsx`
  Replace result card, empty state, tabs wrapper, and sense panel selectors with Tailwind classes while keeping Ant components.
- `components/app/AppSidebar.test.tsx`
  Adjust expectations only if accessible labels or text wrappers change.
- `components/dictionary/DictionarySearchPanel.test.tsx`
  Keep existing semantic checks stable after class migration.
- `components/dictionary/DictionaryResultCard.test.tsx`
  Keep existing semantic checks stable after class migration.

### Create

- `components/app/AppShell.test.tsx`
  Smoke-test shell layout semantics and user rendering.
- `components/app/UserMenu.test.tsx`
  Verify trigger rendering and dropdown open/close behavior.
- `app/sign-in/page.test.tsx`
  Verify sign-in page content and error state rendering.
- `app/(app)/english-chatbot/page.test.tsx`
  Verify welcome surface and starter prompts render.
- `app/(app)/co-lanh-dictionary/page.test.tsx`
  Verify dictionary hero copy and search surface render.
- `components/ChatMessage.test.tsx`
  Verify user and assistant message rendering stays intact.
- `components/TypingIndicator.test.tsx`
  Verify assistant typing indicator renders stable accessible content.

## Conventions For This Plan

- Tailwind classes should prefer existing CSS variables through arbitrary values, for example `bg-[var(--surface)]`, `text-[var(--text-primary)]`, `border-[var(--border)]`, and `shadow-[var(--shadow-md)]`.
- Keep `[font-family:var(--font-display)]` or `[font-family:var(--font-mono)]` only where display or mono styling is needed.
- Do not introduce a `tailwind.config.*` file unless implementation proves it is absolutely necessary.
- Do not remove Ant Design. Keep it visually aligned through wrapper classes and narrow overrides only.
- Delete legacy selectors from `app/globals.css` only after the owning component has been converted.

### Task 1: Foundation And Shell Frame

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/app/AppShell.tsx`
- Test: `components/app/AppShell.test.tsx`

- [ ] **Step 1: Write the failing shell smoke test**

```tsx
import { screen } from "@testing-library/react";

import { AppShell } from "@/components/app/AppShell";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/AppSidebar", () => ({
  AppSidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock("@/components/app/UserMenu", () => ({
  UserMenu: ({ user }: { user: { name: string } }) => (
    <div data-testid="user-menu">{user.name}</div>
  ),
}));

describe("AppShell", () => {
  it("renders the shell chrome and page content", () => {
    renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
```

- [ ] **Step 2: Run the new shell test and verify it fails for the missing test file**

Run: `npm run test:run -- components/app/AppShell.test.tsx`
Expected: FAIL because `components/app/AppShell.test.tsx` does not exist yet.

- [ ] **Step 3: Add the test file and migrate the shell foundation**

```tsx
// components/app/AppShell.test.tsx
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";

import { AppShell } from "@/components/app/AppShell";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/AppSidebar", () => ({
  AppSidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

vi.mock("@/components/app/UserMenu", () => ({
  UserMenu: ({ user }: { user: { name: string } }) => (
    <div data-testid="user-menu">{user.name}</div>
  ),
}));

describe("AppShell", () => {
  it("renders the shell chrome and page content", () => {
    renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
```

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${sourceSans.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[var(--bg)] [font-family:var(--font-body)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
```

```tsx
// components/app/AppShell.tsx
export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  return (
    <div className="grid min-h-screen grid-cols-[72px_minmax(0,1fr)] bg-[var(--bg)] transition-[grid-template-columns] duration-300 md:grid-cols-[72px_minmax(0,1fr)]">
      <AppSidebar />
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-end border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_88%,white)] px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
```

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --bg: #f6f4f0;
  --bg-deep: #edeae4;
  --surface: #ffffff;
  --surface-hover: #f0ede8;
  --surface-raised: #ffffff;
  --accent: #c46d2e;
  --accent-hover: #b35f22;
  --accent-light: #fdf3eb;
  --accent-muted: rgba(196, 109, 46, 0.12);
  --ink: #1c1917;
  --text-primary: #1c1917;
  --text-secondary: #57534e;
  --text-muted: #a8a29e;
  --border: #e7e5e4;
  --border-strong: #d6d3d1;
  --bubble-user: #1c1917;
  --bubble-ai: #ffffff;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 32px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  --radius-sm: 8px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --font-display: "Fraunces", "Georgia", serif;
  --font-body: "Source Sans 3", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", monospace;
}

* {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

html,
body {
  min-height: 100%;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 999px;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: scale(0.85);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.ai-markdown {
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-primary);
}

.ai-markdown p {
  margin: 0 0 10px;
}

.ai-markdown p:last-child {
  margin-bottom: 0;
}

.ai-markdown strong {
  color: var(--ink);
  font-weight: 600;
}

.ai-markdown code {
  background: var(--bg-deep);
  color: var(--accent);
  padding: 2px 7px;
  border-radius: 5px;
  font-family: var(--font-mono);
  font-size: 0.86em;
}

.ant-layout {
  background: var(--bg) !important;
}

.ant-input,
.ant-input-affix-wrapper {
  background: transparent !important;
}

.ant-input::placeholder,
textarea.ant-input::placeholder {
  color: var(--text-muted) !important;
  opacity: 1;
}

.typing-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--text-muted);
  animation: blink 1.2s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}
```

- [ ] **Step 4: Run the shell test to verify it passes**

Run: `npm run test:run -- components/app/AppShell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the foundation and shell frame**

```bash
git add app/globals.css app/layout.tsx components/app/AppShell.tsx components/app/AppShell.test.tsx
git commit -m "refactor: move shell foundation to tailwind"
```

### Task 2: Sidebar And User Menu

**Files:**
- Modify: `components/app/AppSidebar.tsx`
- Modify: `components/app/UserMenu.tsx`
- Modify: `components/app/AppSidebar.test.tsx`
- Create: `components/app/UserMenu.test.tsx`

- [ ] **Step 1: Write the failing user menu interaction test**

```tsx
import { fireEvent, screen } from "@testing-library/react";

import { UserMenu } from "@/components/app/UserMenu";
import { renderUi } from "@/test/render";

describe("UserMenu", () => {
  it("opens the dropdown and shows the sign-out action", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    fireEvent.click(screen.getByRole("button", { name: /cô lành/i }));

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the sidebar and user menu tests and verify the new test fails first**

Run: `npm run test:run -- components/app/AppSidebar.test.tsx components/app/UserMenu.test.tsx`
Expected: FAIL because `components/app/UserMenu.test.tsx` does not exist yet.

- [ ] **Step 3: Add the user menu test and migrate both navigation components**

```tsx
// components/app/UserMenu.test.tsx
import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UserMenu } from "@/components/app/UserMenu";
import { renderUi } from "@/test/render";

const push = vi.fn();
const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut,
  },
}));

describe("UserMenu", () => {
  beforeEach(() => {
    push.mockReset();
    signOut.mockReset();
    signOut.mockResolvedValue(undefined);
  });

  it("opens the dropdown and shows the sign-out action", () => {
    renderUi(<UserMenu user={{ name: "Cô Lành", image: null }} />);

    fireEvent.click(screen.getByRole("button", { name: /cô lành/i }));

    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
  });
});
```

```tsx
// components/app/AppSidebar.tsx
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar sticky top-0 flex h-screen w-[72px] flex-col gap-2 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 transition-[width] duration-300 hover:w-[264px] hover:shadow-[var(--shadow-lg)]">
      <div className="flex min-h-14 items-center gap-3 overflow-hidden px-0 pb-3 pt-1">
        <motion.div
          className="grid size-10 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--ink)] text-white"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap size={20} strokeWidth={2} />
        </motion.div>
        <div className="min-w-0 translate-x-[-8px] whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Trợ lý học tập</p>
          <h1 className="m-0 text-lg font-semibold [font-family:var(--font-display)] text-[var(--ink)]">Tiếng Anh</h1>
        </div>
      </div>
      <div className="h-px bg-[var(--border)]" />
      <nav aria-label="Các mục trong ứng dụng" className="flex flex-col gap-2 pt-2">
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex items-center gap-3 overflow-hidden rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:opacity-100">
                  {label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
```

```tsx
// components/app/AppSidebar.test.tsx
describe("AppSidebar", () => {
  it("renders the Vietnamese sidebar labels", () => {
    renderUi(<AppSidebar />);

    expect(screen.getByRole("link", { name: "Trò chuyện" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ điển" })).toBeInTheDocument();
  });
});
```

```tsx
// components/app/UserMenu.tsx
function UserAvatar({ user }: { user: AuthUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="size-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

export function UserMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-left shadow-[var(--shadow-sm)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <UserAvatar user={user} />
        <span className="hidden text-sm font-medium text-[var(--ink)] md:inline">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--text-muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-[calc(100%+0.5rem)] min-w-40 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-raised)] p-1 shadow-[var(--shadow-lg)]"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="flex w-full items-center gap-2 rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
              onClick={handleSignOut}
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 4: Run the navigation tests and verify they pass**

Run: `npm run test:run -- components/app/AppSidebar.test.tsx components/app/UserMenu.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the navigation migration**

```bash
git add components/app/AppSidebar.tsx components/app/UserMenu.tsx components/app/AppSidebar.test.tsx components/app/UserMenu.test.tsx
git commit -m "refactor: migrate navigation chrome to tailwind"
```

### Task 3: Sign-In Surface

**Files:**
- Modify: `app/sign-in/page.tsx`
- Test: `app/sign-in/page.test.tsx`

- [ ] **Step 1: Write the failing sign-in page test**

```tsx
import { screen } from "@testing-library/react";

import SignInPage from "@/app/sign-in/page";
import { renderUi } from "@/test/render";

describe("SignInPage", () => {
  it("renders the sign-in form and Google action", () => {
    renderUi(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Trợ lý học tập" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the sign-in test and verify it fails for the missing test file**

Run: `npm run test:run -- app/sign-in/page.test.tsx`
Expected: FAIL because `app/sign-in/page.test.tsx` does not exist yet.

- [ ] **Step 3: Add the sign-in test and migrate the page markup to Tailwind**

```tsx
// app/sign-in/page.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SignInPage from "@/app/sign-in/page";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      social: vi.fn(),
      email: vi.fn(),
    },
  },
}));

describe("SignInPage", () => {
  it("renders the sign-in form and Google action", () => {
    renderUi(<SignInPage />);

    expect(screen.getByRole("heading", { name: "Trợ lý học tập" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Tên đăng nhập")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập bằng Google" })).toBeInTheDocument();
  });
});
```

```tsx
// app/sign-in/page.tsx
return (
  <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(196,109,46,0.12),transparent_38%),linear-gradient(180deg,var(--bg),var(--bg-deep))] px-4 py-12">
    <Suspense fallback={null}>
      <motion.div
        className="w-full max-w-md rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-lg)] backdrop-blur"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="mb-5 grid size-14 place-items-center rounded-[var(--radius-lg)] bg-[var(--ink)] text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, type: "spring", stiffness: 200 }}
        >
          <GraduationCap size={24} strokeWidth={2} />
        </motion.div>

        <h1 className="text-3xl [font-family:var(--font-display)] text-[var(--ink)]">Trợ lý học tập</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Đăng nhập để bắt đầu luyện tiếng Anh</p>

        <form className="mt-6 space-y-3" onSubmit={handleEmailSignIn}>
          <input
            type="text"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
            placeholder="Tên đăng nhập"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
          />
          <input
            type="password"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-muted)]"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
          />
          <motion.button
            type="submit"
            className="w-full rounded-[var(--radius)] bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !email.trim() || !password.trim()}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </motion.button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span>hoặc</span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <motion.button
          className="flex w-full items-center justify-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
        >
          <GoogleIcon />
          Đăng nhập bằng Google
        </motion.button>

        {error && (
          <motion.div
            className="mt-4 rounded-[var(--radius)] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <p className="mt-6 text-center text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Trợ lý học tập tiếng Anh
        </p>
      </motion.div>
    </Suspense>
  </div>
);
```

- [ ] **Step 4: Run the sign-in test to verify it passes**

Run: `npm run test:run -- app/sign-in/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the sign-in migration**

```bash
git add app/sign-in/page.tsx app/sign-in/page.test.tsx
git commit -m "refactor: migrate sign-in page to tailwind"
```

### Task 4: Chat Surface And Message Components

**Files:**
- Modify: `app/(app)/english-chatbot/page.tsx`
- Modify: `components/ChatMessage.tsx`
- Modify: `components/TypingIndicator.tsx`
- Test: `app/(app)/english-chatbot/page.test.tsx`
- Test: `components/ChatMessage.test.tsx`
- Test: `components/TypingIndicator.test.tsx`

- [ ] **Step 1: Write the failing chat UI tests**

```tsx
import { screen } from "@testing-library/react";

import EnglishChatbotPage from "@/app/(app)/english-chatbot/page";
import { ChatMessage } from "@/components/ChatMessage";
import { TypingIndicator } from "@/components/TypingIndicator";
import { renderUi } from "@/test/render";

describe("EnglishChatbotPage", () => {
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(screen.getByRole("heading", { name: "Xin chào! Cô Minh đây" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I goed to school/i })).toBeInTheDocument();
  });
});

describe("ChatMessage", () => {
  it("renders assistant markdown content", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "**Hello**" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

describe("TypingIndicator", () => {
  it("renders the assistant typing state", () => {
    renderUi(<TypingIndicator />);

    expect(screen.getByLabelText("Cô Minh đang nhập phản hồi")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the chat tests and verify they fail for the missing test files**

Run: `npm run test:run -- 'app/(app)/english-chatbot/page.test.tsx' components/ChatMessage.test.tsx components/TypingIndicator.test.tsx`
Expected: FAIL because the new test files do not exist yet.

- [ ] **Step 3: Add the tests and migrate the chat UI to Tailwind**

```tsx
// app/(app)/english-chatbot/page.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EnglishChatbotPage from "@/app/(app)/english-chatbot/page";
import { renderUi } from "@/test/render";

describe("EnglishChatbotPage", () => {
  it("renders the welcome state and starter prompts", () => {
    renderUi(<EnglishChatbotPage />);

    expect(screen.getByRole("heading", { name: "Xin chào! Cô Minh đây" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /I goed to school/i })).toBeInTheDocument();
  });
});
```

```tsx
// components/ChatMessage.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatMessage } from "@/components/ChatMessage";
import { renderUi } from "@/test/render";

vi.mock("@/components/app/UserContext", () => ({
  useUser: () => ({ name: "Người học", image: null }),
}));

describe("ChatMessage", () => {
  it("renders assistant markdown content", () => {
    renderUi(<ChatMessage message={{ id: "1", role: "assistant", text: "**Hello**" }} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

```tsx
// components/TypingIndicator.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TypingIndicator } from "@/components/TypingIndicator";
import { renderUi } from "@/test/render";

describe("TypingIndicator", () => {
  it("renders the assistant typing state", () => {
    renderUi(<TypingIndicator />);

    expect(screen.getByLabelText("Cô Minh đang nhập phản hồi")).toBeInTheDocument();
  });
});
```

```tsx
// components/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <motion.div
      className="flex items-end gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      aria-label="Cô Minh đang nhập phản hồi"
    >
      <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-light)] text-lg shadow-[var(--shadow-sm)]">
        👩‍🏫
      </div>
      <div className="inline-flex items-center gap-1 rounded-[22px] rounded-bl-md border border-[var(--border)] bg-[var(--bubble-ai)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  );
}
```

```tsx
// components/ChatMessage.tsx
function UserAvatar() {
  const user = useUser();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="size-10 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid size-10 place-items-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

return (
  <motion.div
    className={[
      "flex items-end gap-3 [animation:fadeUp_0.25s_ease-out_forwards]",
      isUser ? "justify-end" : "justify-start",
    ].join(" ")}
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {!isUser && (
      <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-light)] text-lg shadow-[var(--shadow-sm)]">
        👩‍🏫
      </div>
    )}

    <div className={["flex max-w-[min(42rem,80%)] flex-col gap-2", isUser ? "items-end" : "items-start"].join(" ")}>
      <div
        className={[
          "rounded-[22px] px-4 py-3 shadow-[var(--shadow-sm)]",
          isUser
            ? "rounded-br-md bg-[var(--bubble-user)] text-white"
            : "rounded-bl-md border border-[var(--border)] bg-[var(--bubble-ai)] text-[var(--text-primary)]",
        ].join(" ")}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{text}</span>
        ) : (
          <div className="ai-markdown">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        {time && <span>{time}</span>}
        {!isUser && <CopyButton text={text} />}
      </div>
    </div>

    {isUser && (
      <div className="grid size-10 place-items-center overflow-hidden rounded-full bg-[var(--ink)] text-xs font-semibold text-white shadow-[var(--shadow-sm)]">
        <UserAvatar />
      </div>
    )}
  </motion.div>
);
```

```tsx
// app/(app)/english-chatbot/page.tsx
return (
  <div className="relative flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-[var(--shadow-md)]">
    <div className="flex-1 px-4 py-6 md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        {!hasMessages && (
          <motion.div
            className="mx-auto flex max-w-3xl flex-col items-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <motion.div
              className="relative grid size-24 place-items-center rounded-full bg-[var(--surface)] text-4xl shadow-[var(--shadow-lg)]"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 180, damping: 14 }}
            >
              <span>👩‍🏫</span>
              <span className="absolute bottom-2 right-2 size-3 rounded-full bg-[var(--sage)] ring-4 ring-[var(--surface)]" />
            </motion.div>
            <motion.h2
              className="mt-6 text-4xl [font-family:var(--font-display)] text-[var(--ink)]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              Xin chào! Cô Minh đây
            </motion.h2>
            <motion.p
              className="mt-3 max-w-2xl text-base text-[var(--text-secondary)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              Hãy trả lời bằng tiếng Anh để luyện phản xạ. Cô sẽ sửa lỗi rõ ràng, giải thích ngắn gọn và giữ cuộc trò chuyện tiếp tục.
            </motion.p>
            <div className="mt-8 grid w-full gap-3 md:grid-cols-2">
              {SUGGESTED.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.button
                    key={s.text}
                    className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                    onClick={() => send(s.text)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.35, ease: "easeOut" }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)]">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="text-sm leading-6 text-[var(--text-primary)]">{s.text}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <motion.div
            className="rounded-[var(--radius)] border border-[rgba(239,68,68,0.16)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[rgb(153,27,27)]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  </div>
);
```

- [ ] **Step 4: Run the chat tests to verify they pass**

Run: `npm run test:run -- 'app/(app)/english-chatbot/page.test.tsx' components/ChatMessage.test.tsx components/TypingIndicator.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit the chat migration**

```bash
git add 'app/(app)/english-chatbot/page.tsx' 'app/(app)/english-chatbot/page.test.tsx' components/ChatMessage.tsx components/ChatMessage.test.tsx components/TypingIndicator.tsx components/TypingIndicator.test.tsx
git commit -m "refactor: migrate chat surfaces to tailwind"
```

### Task 5: Dictionary Surface

**Files:**
- Modify: `app/(app)/co-lanh-dictionary/page.tsx`
- Modify: `components/dictionary/DictionarySearchPanel.tsx`
- Modify: `components/dictionary/DictionaryResultCard.tsx`
- Test: `app/(app)/co-lanh-dictionary/page.test.tsx`
- Test: `components/dictionary/DictionarySearchPanel.test.tsx`
- Test: `components/dictionary/DictionaryResultCard.test.tsx`

- [ ] **Step 1: Write the failing dictionary page test**

```tsx
import { screen } from "@testing-library/react";

import CoLanhDictionaryPage from "@/app/(app)/co-lanh-dictionary/page";
import { renderUi } from "@/test/render";

describe("CoLanhDictionaryPage", () => {
  it("renders the hero copy and search panel", () => {
    renderUi(<CoLanhDictionaryPage />);

    expect(screen.getByRole("heading", { name: /Tra cứu từ vựng theo cách rõ ràng, dễ học lại/i })).toBeInTheDocument();
    expect(screen.getByText("Từ điển Cô Lành")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the dictionary page and component tests and verify the new page test fails first**

Run: `npm run test:run -- 'app/(app)/co-lanh-dictionary/page.test.tsx' components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx`
Expected: FAIL because `app/(app)/co-lanh-dictionary/page.test.tsx` does not exist yet.

- [ ] **Step 3: Add the page test, tighten semantic assertions, and migrate the dictionary UI**

```tsx
// app/(app)/co-lanh-dictionary/page.test.tsx
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import CoLanhDictionaryPage from "@/app/(app)/co-lanh-dictionary/page";
import { renderUi } from "@/test/render";

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  return {
    ...actual,
    message: {
      useMessage: () => [{ error: vi.fn() }, <div key="message-context" />],
    },
  };
});

describe("CoLanhDictionaryPage", () => {
  it("renders the hero copy and search panel", () => {
    renderUi(<CoLanhDictionaryPage />);

    expect(screen.getByRole("heading", { name: /Tra cứu từ vựng theo cách rõ ràng, dễ học lại/i })).toBeInTheDocument();
    expect(screen.getByText("Từ điển Cô Lành")).toBeInTheDocument();
  });
});
```

```tsx
// components/dictionary/DictionarySearchPanel.test.tsx
describe("DictionarySearchPanel", () => {
  it("shows accented Vietnamese helper copy", () => {
    const { getByRole, getByText, getByPlaceholderText } = renderUi(
      <DictionarySearchPanel
        value=""
        onChange={() => {}}
        onSearch={() => {}}
        isLoading={false}
      />,
    );

    expect(getByText("Tra cứu có cấu trúc")).toBeInTheDocument();
    expect(getByPlaceholderText("Ví dụ: take off")).toBeInTheDocument();
    expect(getByRole("button", { name: "Tra cứu" })).toBeInTheDocument();
  });
});
```

```tsx
// components/dictionary/DictionaryResultCard.test.tsx
describe("DictionaryResultCard", () => {
  it("shows the result heading and the active tab content", () => {
    const { getByRole, getByText } = renderUi(
      <DictionaryResultCard vocabulary={entry} hasSearched isLoading={false} />,
    );

    expect(getByText("Kết quả tra cứu")).toBeInTheDocument();
    expect(getByRole("tab", { name: "Nghĩa 1" })).toBeInTheDocument();
    expect(getByText("Cất cánh")).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Migrate the dictionary page and child components to Tailwind**

```tsx
// app/(app)/co-lanh-dictionary/page.tsx
return (
  <>
    {contextHolder}
    <div className="space-y-6">
      <motion.section
        className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(253,243,235,0.9))] px-6 py-8 shadow-[var(--shadow-md)] md:px-8 md:py-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Từ điển Cô Lành</p>
          <h1 className="mt-3 text-4xl [font-family:var(--font-display)] text-[var(--ink)]">
            Tra cứu từ vựng theo cách rõ ràng, dễ học lại
          </h1>
          <p className="mt-4 text-base text-[var(--text-secondary)]">
            Xem giải thích song ngữ, ví dụ tiếng Việt và ghi chú dùng cho từng nghĩa trong cùng một khung học tập.
          </p>
        </div>
      </motion.section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}>
          <DictionarySearchPanel
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}>
          <DictionaryResultCard
            vocabulary={result}
            hasSearched={hasSearched}
            isLoading={isLoading}
          />
        </motion.div>
      </section>
    </div>
  </>
);
```

```tsx
// components/dictionary/DictionarySearchPanel.tsx
return (
  <section className="space-y-5">
    <Card className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]" variant="borderless">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        <Sparkles size={14} />
        <span>Tra cứu có cấu trúc</span>
      </div>
      <h2 className="mt-4 text-2xl [font-family:var(--font-display)] text-[var(--ink)]">Nhập mục từ cần tra cứu</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        Công cụ này hỗ trợ từ đơn, collocation, phrasal verb và idiom để bạn học theo ngữ cảnh rõ ràng hơn.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <Input
          size="large"
          value={value}
          placeholder="Ví dụ: take off"
          onChange={(event) => onChange(event.target.value)}
          onPressEnter={onSearch}
          disabled={isLoading}
        />
        <motion.div whileTap={{ scale: 0.96 }}>
          <Button
            type="primary"
            size="large"
            onClick={onSearch}
            loading={isLoading}
            className="!h-12 !rounded-[var(--radius)] !border-0 !bg-[var(--ink)] !px-5 !font-semibold hover:!bg-[var(--accent)]"
          >
            Tra cứu
          </Button>
        </motion.div>
      </div>
      <p className="mt-4 text-sm text-[var(--text-muted)]">
        Hỗ trợ tối đa 80 ký tự, bao gồm khoảng trắng và dấu nháy hợp lệ.
      </p>
    </Card>

    <Card className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]" variant="borderless">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
        <BookOpenText size={16} />
        <span>Mẹo sử dụng</span>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
        {HELPER_TIPS.map((tip, i) => (
          <motion.li
            key={tip}
            className="rounded-[var(--radius)] bg-[var(--bg-deep)] px-4 py-3"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
          >
            {tip}
          </motion.li>
        ))}
      </ul>
    </Card>
  </section>
);
```

```tsx
// components/dictionary/DictionaryResultCard.tsx
return (
  <Card className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]" variant="borderless">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Kết quả tra cứu</p>
        <h2 className="mt-2 text-3xl [font-family:var(--font-display)] text-[var(--ink)]">{vocabulary.headword}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Tag className="!rounded-full !px-3 !py-1" color="default">
          {ENTRY_TYPE_LABELS[vocabulary.entryType]}
        </Tag>
        {vocabulary.level && (
          <Tag color={LEVEL_COLORS[vocabulary.level] ?? "default"} className="!rounded-full !px-3 !py-1">
            {vocabulary.level}
          </Tag>
        )}
      </div>
    </div>

    {vocabulary.phonetic && (
      <motion.p
        className="mt-4 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
        {vocabulary.phonetic}
      </motion.p>
    )}

    <motion.div
      className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4 text-sm leading-6 text-[var(--text-secondary)]"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <p>{vocabulary.overviewVi}</p>
      <p>{vocabulary.overviewEn}</p>
    </motion.div>

    <Tabs className="mt-6" items={tabItems} defaultActiveKey={vocabulary.senses[0]?.id} />
  </Card>
);
```

- [ ] **Step 5: Run the dictionary tests to verify they pass**

Run: `npm run test:run -- 'app/(app)/co-lanh-dictionary/page.test.tsx' components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit the dictionary migration**

```bash
git add 'app/(app)/co-lanh-dictionary/page.tsx' 'app/(app)/co-lanh-dictionary/page.test.tsx' components/dictionary/DictionarySearchPanel.tsx components/dictionary/DictionaryResultCard.tsx components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx
git commit -m "refactor: migrate dictionary surfaces to tailwind"
```

### Task 6: Legacy CSS Cleanup And Full Verification

**Files:**
- Modify: `app/globals.css`
- Verify: `components/app/AppShell.test.tsx`
- Verify: `components/app/AppSidebar.test.tsx`
- Verify: `components/app/UserMenu.test.tsx`
- Verify: `app/sign-in/page.test.tsx`
- Verify: `app/(app)/english-chatbot/page.test.tsx`
- Verify: `components/ChatMessage.test.tsx`
- Verify: `components/TypingIndicator.test.tsx`
- Verify: `app/(app)/co-lanh-dictionary/page.test.tsx`
- Verify: `components/dictionary/DictionarySearchPanel.test.tsx`
- Verify: `components/dictionary/DictionaryResultCard.test.tsx`

- [ ] **Step 1: Remove the obsolete legacy selectors from `app/globals.css`**

```css
/* Delete the old blocks for:
   .app-shell*
   .app-sidebar*
   .app-toolbar*
   .chat-page*
   .chat-msg*
   .chat-typing*
   .dictionary-page*
   .dictionary-hero*
   .dictionary-layout*
   .dictionary-search-panel*
   .dictionary-result-card*
   .dictionary-sense-panel*
   .sign-in-page*
   .sign-in-card*
*/
```

- [ ] **Step 2: Run the focused frontend test suite**

Run: `npm run test:run -- components/app/AppShell.test.tsx components/app/AppSidebar.test.tsx components/app/UserMenu.test.tsx app/sign-in/page.test.tsx 'app/(app)/english-chatbot/page.test.tsx' components/ChatMessage.test.tsx components/TypingIndicator.test.tsx 'app/(app)/co-lanh-dictionary/page.test.tsx' components/dictionary/DictionarySearchPanel.test.tsx components/dictionary/DictionaryResultCard.test.tsx`
Expected: PASS

- [ ] **Step 3: Run the full repo test suite**

Run: `npm run test:run`
Expected: PASS

- [ ] **Step 4: Run lint and production build**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit the cleanup and verification pass**

```bash
git add app/globals.css
git commit -m "refactor: remove legacy global css selectors"
```
