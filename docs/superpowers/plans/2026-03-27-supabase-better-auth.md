# Supabase + Better Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth authentication using Better Auth with Supabase PostgreSQL as the database, protecting all app routes behind sign-in.

**Architecture:** Better Auth server instance connects to Supabase's PostgreSQL via a raw `pg` Pool. A catch-all API route handles OAuth flows. Middleware checks for session cookies and redirects unauthenticated users to a sign-in page. The app layout validates sessions server-side and passes user info to the sidebar.

**Tech Stack:** Better Auth, pg (PostgreSQL client), Next.js 16 App Router, Supabase PostgreSQL

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `lib/auth.ts` | Create | Better Auth server instance (pg pool, Google provider, nextCookies plugin) |
| `lib/auth-client.ts` | Create | Better Auth React client + useSession hook export |
| `app/api/auth/[...all]/route.ts` | Create | Catch-all API handler for all auth endpoints |
| `middleware.ts` | Create | Cookie-based route protection |
| `app/sign-in/page.tsx` | Create | Sign-in page with Google OAuth button |
| `app/globals.css` | Modify | Add sign-in page styles |
| `app/(app)/layout.tsx` | Modify | Server-side session validation, pass user to AppShell |
| `components/app/AppShell.tsx` | Modify | Accept and forward user prop |
| `components/app/AppSidebar.tsx` | Modify | Show user avatar + sign-out button |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install better-auth and pg**

```bash
yarn add better-auth pg
```

- [ ] **Step 2: Install @types/pg as dev dependency**

```bash
yarn add -D @types/pg
```

- [ ] **Step 3: Verify install succeeded**

Run: `yarn build`
Expected: Build succeeds (no new code yet, just deps)

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add better-auth and pg dependencies"
```

---

### Task 2: Better Auth Server Config

**Files:**
- Create: `lib/auth.ts`

- [ ] **Step 1: Create the auth server config**

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [nextCookies()],
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors (env vars are typed as string | undefined, the `!` asserts them)

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat: add Better Auth server config with Google provider"
```

---

### Task 3: Better Auth React Client

**Files:**
- Create: `lib/auth-client.ts`

- [ ] **Step 1: Create the auth client**

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export const { useSession } = authClient;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/auth-client.ts
git commit -m "feat: add Better Auth React client"
```

---

### Task 4: Auth API Route Handler

**Files:**
- Create: `app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create the catch-all route**

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

- [ ] **Step 2: Verify build succeeds**

Run: `yarn build`
Expected: Build succeeds, `/api/auth/[...all]` appears as a dynamic route

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/\[...all\]/route.ts
git commit -m "feat: add Better Auth catch-all API route"
```

---

### Task 5: Run Better Auth Migration

**Files:**
- Database: Supabase PostgreSQL (4 tables created)

- [ ] **Step 1: Ensure DATABASE_URL is set in .env.local**

Verify `.env.local` contains:
```
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

- [ ] **Step 2: Run the Better Auth migration**

```bash
npx @better-auth/cli migrate
```

Expected: Tables `user`, `session`, `account`, `verification` created in Supabase.

- [ ] **Step 3: Verify tables exist**

Check in Supabase Dashboard → Table Editor. You should see the 4 tables.

- [ ] **Step 4: Commit (no file changes — migration is DB-only)**

No git commit needed for this step.

---

### Task 6: Middleware for Route Protection

**Files:**
- Create: `middleware.ts` (project root)

- [ ] **Step 1: Create the middleware**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!sign-in|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for cookie-based route protection"
```

---

### Task 7: Sign-In Page

**Files:**
- Create: `app/sign-in/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add sign-in page styles to globals.css**

Append to the end of `app/globals.css`:

```css
/* ═══════════════════════════════════════════
   SIGN-IN PAGE
   ═══════════════════════════════════════════ */
.sign-in-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.sign-in-card {
  width: 100%;
  max-width: 400px;
  text-align: center;
  padding: 48px 36px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
}

.sign-in-card__badge {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  display: grid;
  place-items: center;
  background: var(--ink);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.04em;
  margin: 0 auto 20px;
}

.sign-in-card h1 {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--ink);
}

.sign-in-card__subtitle {
  margin: 0 0 32px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.5;
}

.sign-in-card__google-btn {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.sign-in-card__google-btn:hover {
  background: var(--surface-hover);
  border-color: var(--text-muted);
  box-shadow: var(--shadow);
}

.sign-in-card__google-btn:active {
  transform: scale(0.98);
}

.sign-in-card__google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sign-in-card__google-btn svg {
  flex-shrink: 0;
}

.sign-in-card__error {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #991b1b;
  font-size: 13px;
  line-height: 1.5;
}

.sign-in-card__footer {
  margin-top: 24px;
  font-size: 12px;
  color: var(--text-muted);
}
```

- [ ] **Step 2: Create the sign-in page**

```tsx
// app/sign-in/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { authClient } from "@/lib/auth-client";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get("error") ? "Đăng nhập thất bại. Vui lòng thử lại." : null,
  );

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/english-chatbot",
      });
    } catch {
      setError("Không thể kết nối đến Google. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in-page">
      <motion.div
        className="sign-in-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <motion.div
          className="sign-in-card__badge"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.35, type: "spring", stiffness: 200 }}
        >
          CM
        </motion.div>

        <h1>Cô Minh English</h1>
        <p className="sign-in-card__subtitle">
          Đăng nhập để bắt đầu luyện tiếng Anh
        </p>

        <motion.button
          className="sign-in-card__google-btn"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
        >
          <GoogleIcon />
          {isLoading ? "Đang chuyển hướng..." : "Đăng nhập bằng Google"}
        </motion.button>

        {error && (
          <motion.div
            className="sign-in-card__error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <p className="sign-in-card__footer">
          Ứng dụng học tiếng Anh cùng cô Minh
        </p>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build succeeds**

Run: `yarn build`
Expected: Build succeeds, `/sign-in` appears as a static route

- [ ] **Step 4: Commit**

```bash
git add app/sign-in/page.tsx app/globals.css
git commit -m "feat: add sign-in page with Google OAuth button"
```

---

### Task 8: App Layout — Server-Side Session Validation

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Update the app layout to validate session and pass user**

Replace the entire contents of `app/(app)/layout.tsx` with:

```tsx
// app/(app)/layout.tsx
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    image: session.user.image,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Error about `AppShell` not accepting `user` prop (expected — we fix this in Task 9)

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/layout.tsx
git commit -m "feat: add server-side session validation to app layout"
```

---

### Task 9: AppShell and AppSidebar — User Display + Sign Out

**Files:**
- Modify: `components/app/AppShell.tsx`
- Modify: `components/app/AppSidebar.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update AppShell to accept and forward user prop**

Replace the entire contents of `components/app/AppShell.tsx` with:

```tsx
// components/app/AppShell.tsx
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";

export type AuthUser = {
  name: string;
  image: string | null;
};

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  return (
    <div className="app-shell">
      <AppSidebar user={user} />
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Update AppSidebar with user section + sign out**

Replace the entire contents of `components/app/AppSidebar.tsx` with:

```tsx
// components/app/AppSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut, MessageCircleMore } from "lucide-react";
import { motion } from "motion/react";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/app/AppShell";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
];

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="app-sidebar__user-avatar"
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

  return <div className="app-sidebar__user-initials">{initials}</div>;
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <motion.div
          className="app-sidebar__badge"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          CM
        </motion.div>
        <div className="app-sidebar__brand-text">
          <p className="app-sidebar__eyebrow">Học tiếng Anh</p>
          <h1 className="app-sidebar__title">Cô Minh</h1>
        </div>
      </div>

      <div className="app-sidebar__divider" />

      <nav className="app-sidebar__nav" aria-label="Các mục trong ứng dụng">
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
                className={active ? "app-sidebar__link is-active" : "app-sidebar__link"}
              >
                <span className="app-sidebar__link-icon">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="app-sidebar__link-label">{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User section — pushed to bottom */}
      <div className="app-sidebar__spacer" />
      <div className="app-sidebar__divider" />
      <div className="app-sidebar__user">
        <UserAvatar user={user} />
        <div className="app-sidebar__user-info">
          <span className="app-sidebar__user-name">{user.name}</span>
          <button
            className="app-sidebar__sign-out"
            onClick={handleSignOut}
            title="Đăng xuất"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Add user section styles to globals.css**

Append inside the `/* ── Sidebar ── */` section of `app/globals.css`, after the existing sidebar styles and before the mobile `@media` rule:

```css
.app-sidebar__spacer {
  flex: 1;
}

.app-sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  overflow: hidden;
}

.app-sidebar__user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  object-fit: cover;
}

.app-sidebar__user-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  background: var(--bg-deep);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.app-sidebar__user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  opacity: 0;
  transition: opacity 0.2s ease 0.1s;
}

.app-sidebar:hover .app-sidebar__user-info {
  opacity: 1;
}

.app-sidebar__user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__sign-out {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 150ms ease;
}

.app-sidebar__sign-out:hover {
  color: var(--accent);
}
```

- [ ] **Step 4: Verify build succeeds**

Run: `yarn build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add components/app/AppShell.tsx components/app/AppSidebar.tsx app/globals.css
git commit -m "feat: add user avatar and sign-out to sidebar"
```

---

### Task 10: Verify Full Auth Flow

- [ ] **Step 1: Start the dev server**

```bash
yarn dev
```

- [ ] **Step 2: Test unauthenticated redirect**

Visit `http://localhost:3000/english-chatbot` in the browser.
Expected: Redirected to `/sign-in`.

- [ ] **Step 3: Test Google sign-in**

Click "Đăng nhập bằng Google" on the sign-in page.
Expected: Google consent screen appears. After granting access, redirected to `/english-chatbot` with user avatar visible in sidebar.

- [ ] **Step 4: Test sign-out**

Hover over the sidebar to expand it. Click "Đăng xuất".
Expected: Redirected to `/sign-in`. Visiting `/english-chatbot` directly redirects back to `/sign-in`.

- [ ] **Step 5: Test direct URL protection**

While signed out, visit `http://localhost:3000/co-lanh-dictionary`.
Expected: Redirected to `/sign-in`.

- [ ] **Step 6: Verify existing features still work**

Sign in, then test:
- Chat with Cô Minh (chatbot page)
- Search a word in the dictionary
Expected: Both features work as before.

- [ ] **Step 7: Run existing tests**

```bash
yarn test:run
```

Expected: All previously-passing tests still pass. The auth integration doesn't affect existing API route tests.
