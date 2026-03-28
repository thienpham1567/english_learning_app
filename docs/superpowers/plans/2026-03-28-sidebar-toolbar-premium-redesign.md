# Sidebar & Toolbar Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `AppSidebar` and `AppShell` toolbar with frosted glass aesthetics, a toggle-controlled sidebar with localStorage persistence, Ant Design Tooltips on collapsed nav icons, and a breadcrumb page title in the toolbar.

**Architecture:** `AppShell` becomes a client component owning `isExpanded: boolean` state (persisted to `localStorage`); it passes `isExpanded`/`onToggle` down to `AppSidebar`. A new `ToolbarBreadcrumb` client component reads `usePathname` to render an eyebrow + page title. `AppSidebar` drops CSS hover-expand in favour of prop-driven width, gains a `PanelLeftOpen`/`PanelLeftClose` toggle button, and wraps collapsed nav icons in `antd` `Tooltip`.

**Tech Stack:** React, Next.js (`next/image`, `next/navigation`), Tailwind CSS v4, Ant Design (`Tooltip`), Lucide React (`PanelLeftClose`, `PanelLeftOpen`), Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/app/ToolbarBreadcrumb.tsx` | Create | Client component: renders eyebrow + page title from pathname |
| `components/app/__tests__/ToolbarBreadcrumb.test.tsx` | Create | Unit tests for per-route rendering + unknown-route fallback |
| `components/app/AppSidebar.tsx` | Modify | Glass bg, prop-driven width, toggle button, collapsed Tooltips |
| `components/app/__tests__/AppSidebar.test.tsx` | Modify | Replace hover-expand assertions with toggle-prop API tests |
| `components/app/AppShell.tsx` | Modify | Add `"use client"`, `isExpanded` state, glass header, ToolbarBreadcrumb |
| `components/app/__tests__/AppShell.test.tsx` | Modify | Update header class assertions, add ToolbarBreadcrumb mock |

---

### Task 1: ToolbarBreadcrumb component

**Files:**
- Create: `components/app/__tests__/ToolbarBreadcrumb.test.tsx`
- Create: `components/app/ToolbarBreadcrumb.tsx`

- [ ] **Step 1: Write failing tests**

Create `components/app/__tests__/ToolbarBreadcrumb.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

import { ToolbarBreadcrumb } from "../ToolbarBreadcrumb";

describe("ToolbarBreadcrumb", () => {
  it("renders eyebrow and title for /english-chatbot", () => {
    mockUsePathname.mockReturnValue("/english-chatbot");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Trợ lý học tập")).toBeInTheDocument();
    expect(screen.getByText("Trò chuyện")).toBeInTheDocument();
  });

  it("renders eyebrow and title for /co-lanh-dictionary", () => {
    mockUsePathname.mockReturnValue("/co-lanh-dictionary");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Từ điển")).toBeInTheDocument();
    expect(screen.getByText("Cô Lãnh")).toBeInTheDocument();
  });

  it("renders eyebrow and title for /my-vocabulary", () => {
    mockUsePathname.mockReturnValue("/my-vocabulary");
    render(<ToolbarBreadcrumb />);
    expect(screen.getByText("Từ vựng của tôi")).toBeInTheDocument();
    expect(screen.getByText("Từ vựng")).toBeInTheDocument();
  });

  it("renders nothing for an unknown route", () => {
    mockUsePathname.mockReturnValue("/unknown-route");
    const { container } = render(<ToolbarBreadcrumb />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/ToolbarBreadcrumb.test.tsx`

Expected: 4 failures — `Cannot find module '../ToolbarBreadcrumb'`.

- [ ] **Step 3: Implement ToolbarBreadcrumb**

Create `components/app/ToolbarBreadcrumb.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";

const BREADCRUMBS: Record<string, { eyebrow: string; title: string }> = {
  "/english-chatbot": { eyebrow: "Trợ lý học tập", title: "Trò chuyện" },
  "/co-lanh-dictionary": { eyebrow: "Từ điển", title: "Cô Lãnh" },
  "/my-vocabulary": { eyebrow: "Từ vựng của tôi", title: "Từ vựng" },
};

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? null;
  if (!crumb) return null;

  return (
    <div className="flex flex-col justify-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none">
        {crumb.eyebrow}
      </p>
      <h2 className="mt-0.5 text-sm font-semibold leading-snug text-[var(--ink)]">
        {crumb.title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/app/__tests__/ToolbarBreadcrumb.test.tsx`

Expected: 4 PASS.

- [ ] **Step 5: Commit**

```bash
git add components/app/ToolbarBreadcrumb.tsx components/app/__tests__/ToolbarBreadcrumb.test.tsx
git commit -m "feat: add ToolbarBreadcrumb with per-route eyebrow and page title"
```

---

### Task 2: Update AppSidebar tests for new props API

**Files:**
- Modify: `components/app/__tests__/AppSidebar.test.tsx`

The current tests assume `AppSidebar` takes no props and expands via CSS hover (`group/sidebar`, `group-hover/sidebar:*`, `hover:w-[264px]`). Replace the entire file with tests that cover the new props-based API.

- [ ] **Step 1: Replace the test file**

Replace the full contents of `components/app/__tests__/AppSidebar.test.tsx` with:

```tsx
import { screen, fireEvent } from "@testing-library/react";
import { expect, it, vi, describe } from "vitest";

import { AppSidebar } from "@/components/app/AppSidebar";
import { renderUi } from "@/test/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/english-chatbot",
}));

describe("AppSidebar", () => {
  it("renders all Vietnamese nav labels when expanded", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Trò chuyện" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ điển" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Từ vựng" })).toBeInTheDocument();
  });

  it("nav links have focus-visible outline classes", () => {
    renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Trò chuyện" })).toHaveClass(
      "focus-visible:outline",
      "focus-visible:outline-2",
      "focus-visible:outline-offset-2",
      "focus-visible:outline-[var(--accent)]",
    );
  });

  it("has glass background classes", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("bg-white/80", "backdrop-blur-md");
  });

  it("has w-[72px] class when collapsed", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("w-[72px]");
    expect(container.firstElementChild).not.toHaveClass("w-[264px]");
  });

  it("has w-[264px] class when expanded", () => {
    const { container } = renderUi(<AppSidebar isExpanded={true} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass("w-[264px]");
    expect(container.firstElementChild).not.toHaveClass("w-[72px]");
  });

  it("shows expand button when collapsed and calls onToggle on click", () => {
    const onToggle = vi.fn();
    renderUi(<AppSidebar isExpanded={false} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: "Expand sidebar" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows collapse button when expanded and calls onToggle on click", () => {
    const onToggle = vi.fn();
    renderUi(<AppSidebar isExpanded={true} onToggle={onToggle} />);
    const btn = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("has the 920px responsive mobile layout classes", () => {
    const { container } = renderUi(<AppSidebar isExpanded={false} onToggle={vi.fn()} />);
    expect(container.firstElementChild).toHaveClass(
      "sticky",
      "top-0",
      "z-50",
      "flex",
      "h-screen",
      "flex-col",
      "gap-2",
      "overflow-hidden",
      "border-r",
      "px-4",
      "py-5",
      "transition-[width]",
      "duration-300",
      "max-[920px]:relative",
      "max-[920px]:h-auto",
      "max-[920px]:w-full",
      "max-[920px]:flex-row",
      "max-[920px]:border-r-0",
      "max-[920px]:border-b",
      "max-[920px]:px-4",
      "max-[920px]:py-3",
      "max-[920px]:gap-4",
      "max-[920px]:items-center",
    );
    expect(screen.getByRole("navigation", { name: "Các mục trong ứng dụng" })).toHaveClass(
      "flex",
      "flex-col",
      "gap-2",
      "pt-2",
      "max-[920px]:ml-auto",
      "max-[920px]:flex-row",
      "max-[920px]:gap-[6px]",
      "max-[920px]:p-0",
      "max-[920px]:pt-0",
      "max-[920px]:w-auto",
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/AppSidebar.test.tsx`

Expected: 5–7 failures — `AppSidebar` still accepts no props, no toggle button exists, no glass classes, old hover-expand classes present. The "renders all Vietnamese nav labels" test may pass.

- [ ] **Step 3: Commit failing tests**

```bash
git add components/app/__tests__/AppSidebar.test.tsx
git commit -m "test: update AppSidebar tests for toggle-prop API and glass background"
```

---

### Task 3: Implement AppSidebar refactor

**Files:**
- Modify: `components/app/AppSidebar.tsx`

- [ ] **Step 1: Replace the full file**

Replace the entire contents of `components/app/AppSidebar.tsx` with:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, BookOpen, MessageCircleMore, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "antd";
import { motion } from "motion/react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
  { href: "/my-vocabulary", label: "Từ vựng", icon: BookMarked },
];

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function AppSidebar({ isExpanded, onToggle }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 z-50 flex h-screen flex-col gap-2 overflow-hidden border-r border-white/40 bg-white/80 backdrop-blur-md shadow-[1px_0_20px_rgba(28,25,23,0.06)] px-4 py-5 transition-[width] duration-300 ${isExpanded ? "w-[264px]" : "w-[72px]"} max-[920px]:relative max-[920px]:h-auto max-[920px]:w-full max-[920px]:flex-row max-[920px]:items-center max-[920px]:gap-4 max-[920px]:border-r-0 max-[920px]:border-b max-[920px]:px-4 max-[920px]:py-3`}
    >
      {/* Logo / toggle header */}
      <div className="flex min-h-14 items-center px-0 pb-3 pt-1 max-[920px]:min-h-0 max-[920px]:shrink-0 max-[920px]:pb-0 max-[920px]:pt-0">
        {isExpanded ? (
          <>
            <motion.div
              aria-hidden="true"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0"
            >
              <Image
                src="/english-logo-app.svg"
                alt="Thien English"
                width={250}
                height={150}
                className="h-10 w-auto rounded-lg"
                priority
              />
            </motion.div>
            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="ml-auto grid size-7 shrink-0 place-items-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--ink)] max-[920px]:hidden"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mx-auto grid size-7 shrink-0 place-items-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--ink)] max-[920px]:hidden"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      <div className="h-px bg-[var(--border)] max-[920px]:hidden" />

      <nav
        aria-label="Các mục trong ứng dụng"
        className="flex flex-col gap-2 pt-2 max-[920px]:ml-auto max-[920px]:flex-row max-[920px]:gap-[6px] max-[920px]:p-0 max-[920px]:pt-0 max-[920px]:w-auto"
      >
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          const linkContent = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 overflow-hidden rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] max-[920px]:min-h-[38px] max-[920px]:px-[10px]",
                active
                  ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
              ].join(" ")}
            >
              <span className="grid size-5 shrink-0 place-items-center max-[920px]:size-[18px]">
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span
                className={[
                  "whitespace-nowrap text-[14px] max-[920px]:text-[13px]",
                  !isExpanded ? "hidden max-[920px]:inline" : "",
                ]
                  .join(" ")
                  .trim()}
              >
                {label}
              </span>
            </Link>
          );

          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            >
              {!isExpanded ? (
                <Tooltip placement="right" title={label}>
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              )}
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Run AppSidebar tests to verify they pass**

Run: `npx vitest run components/app/__tests__/AppSidebar.test.tsx`

Expected: 8 PASS.

- [ ] **Step 3: Commit**

```bash
git add components/app/AppSidebar.tsx
git commit -m "feat: refactor AppSidebar — glass bg, toggle button, collapsed Tooltips"
```

---

### Task 4: Update AppShell — client state, glass header, ToolbarBreadcrumb

**Files:**
- Modify: `components/app/__tests__/AppShell.test.tsx`
- Modify: `components/app/AppShell.tsx`

- [ ] **Step 1: Write failing AppShell tests**

Replace the full contents of `components/app/__tests__/AppShell.test.tsx` with:

```tsx
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

vi.mock("@/components/app/ToolbarBreadcrumb", () => ({
  ToolbarBreadcrumb: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

describe("AppShell", () => {
  it("renders the shell chrome and page content", () => {
    const { container } = renderUi(
      <AppShell user={{ name: "Cô Lành", image: null }}>
        <div>Trang nội dung</div>
      </AppShell>,
    );

    expect(container.firstElementChild).toHaveClass(
      "grid",
      "min-h-screen",
      "grid-cols-[72px_minmax(0,1fr)]",
      "grid-rows-[minmax(0,1fr)]",
      "max-[920px]:min-h-dvh",
      "max-[920px]:grid-cols-1",
      "max-[920px]:grid-rows-[auto_minmax(0,1fr)]",
    );
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu")).toHaveTextContent("Cô Lành");
    expect(screen.getByTestId("breadcrumb")).toBeInTheDocument();
    expect(
      container.firstElementChild?.firstElementChild?.nextElementSibling,
    ).toHaveClass("flex", "min-w-0", "min-h-0", "flex-col");
    expect(screen.getByRole("banner")).toHaveClass(
      "flex",
      "h-[52px]",
      "shrink-0",
      "items-center",
      "justify-between",
      "border-b",
      "border-white/30",
      "bg-white/70",
      "backdrop-blur-xl",
      "px-5",
      "max-[920px]:h-12",
      "max-[920px]:px-4",
    );
    expect(screen.getByRole("main")).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
      "overflow-hidden",
    );
    expect(screen.getByRole("main")).not.toHaveClass("px-4", "py-6", "md:px-8", "md:py-8");
    expect(screen.getByRole("main")).toHaveTextContent("Trang nội dung");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/app/__tests__/AppShell.test.tsx`

Expected: 1 failure — `breadcrumb` testid not found, header has `bg-[var(--surface)]`/`justify-end` instead of glass classes/`justify-between`.

- [ ] **Step 3: Commit failing tests**

```bash
git add components/app/__tests__/AppShell.test.tsx
git commit -m "test: update AppShell test for glass header and ToolbarBreadcrumb"
```

- [ ] **Step 4: Implement new AppShell**

Replace the full contents of `components/app/AppShell.tsx` with:

```tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import { UserMenu } from "@/components/app/UserMenu";
import { UserProvider } from "@/components/app/UserContext";
import { ToolbarBreadcrumb } from "@/components/app/ToolbarBreadcrumb";

export type AuthUser = {
  name: string;
  image: string | null;
};

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    }
  }, []);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("sidebar-expanded", String(next));
  };

  return (
    <div
      className={`grid min-h-screen grid-rows-[minmax(0,1fr)] bg-(--bg) transition-[grid-template-columns] duration-300 ${isExpanded ? "grid-cols-[264px_minmax(0,1fr)]" : "grid-cols-[72px_minmax(0,1fr)]"} max-[920px]:min-h-dvh max-[920px]:grid-cols-1 max-[920px]:grid-rows-[auto_minmax(0,1fr)]`}
    >
      <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />
      <div className="flex min-w-0 min-h-0 flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-white/30 bg-white/70 backdrop-blur-xl px-5 max-[920px]:h-12 max-[920px]:px-4">
          <ToolbarBreadcrumb />
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6 max-[920px]:p-4">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run AppShell tests**

Run: `npx vitest run components/app/__tests__/AppShell.test.tsx`

Expected: 1 PASS.

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`

Expected: all tests pass. The pre-existing AppShell failure (v3/v4 class mismatch) is resolved by the test rewrite in Step 1.

- [ ] **Step 7: Commit**

```bash
git add components/app/AppShell.tsx
git commit -m "feat: AppShell — client state, glass toolbar, ToolbarBreadcrumb, sidebar toggle"
```
