# Supabase + Better Auth Integration

**Date:** 2026-03-27
**Scope:** Supabase setup as PostgreSQL database + Better Auth with Google OAuth only
**Out of scope:** Saved vocabulary, learning history, chat persistence, dictionary cache migration

## Decisions

- **Auth library:** Better Auth (v1.x) — runs in-app, not a hosted service
- **Database:** Supabase PostgreSQL via raw `pg` Pool (no ORM)
- **Auth method:** Google OAuth only (no email/password)
- **Route protection:** All `/(app)/*` routes require authentication
- **Session strategy:** Cookie-based, stored in Supabase (Better Auth default)

## Architecture

```
Browser
  ├─ /sign-in                    → Google OAuth button (public)
  ├─ /(app)/english-chatbot      → Protected
  ├─ /(app)/co-lanh-dictionary   → Protected
  └─ /api/auth/[...all]          → Better Auth catch-all handler

Server
  ├─ lib/auth.ts                 → Better Auth server config
  ├─ lib/auth-client.ts          → Better Auth React client
  ├─ middleware.ts                → Cookie-based redirect guard
  └─ Supabase PostgreSQL         → user, session, account, verification tables
```

Better Auth owns the full auth stack. Supabase is used purely as a PostgreSQL database — Supabase Auth is not used.

## Environment Variables

```
# Supabase (database only)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres

# Better Auth
BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
```

Existing vars (`OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_DICTIONARY_MODEL`) are unchanged.

## Dependencies

```
better-auth    — server + client + adapters + plugins (single package)
pg             — PostgreSQL client for raw pool connection
@types/pg      — TypeScript types (devDependency)
```

## Database Tables

Better Auth auto-creates 4 tables via `npx @better-auth/cli migrate`:

| Table | Purpose |
|-------|---------|
| `user` | User profiles (id, name, email, image, emailVerified, createdAt, updatedAt) |
| `session` | Active sessions (id, userId, token, expiresAt, ipAddress, userAgent) |
| `account` | OAuth provider links (id, userId, providerId, accountId, accessToken, refreshToken, etc.) |
| `verification` | Email/phone verification tokens (id, identifier, value, expiresAt) |

No custom tables in this scope.

## File Changes

### New Files

#### `lib/auth.ts` — Server config

Better Auth server instance configured with:
- `pg` Pool using `DATABASE_URL`
- Google social provider with client ID/secret from env
- `nextCookies()` plugin (required for Next.js cookie handling)
- No email/password (disabled)

#### `lib/auth-client.ts` — React client

`createAuthClient()` from `better-auth/react`. Auto-detects base URL on same domain.

Exports:
- `authClient` — the client instance
- `useSession` — re-exported hook for convenience

#### `app/api/auth/[...all]/route.ts` — API handler

Catch-all route using `toNextJsHandler(auth)`. Exports `GET` and `POST`.

Better Auth handles all `/api/auth/*` requests internally:
- `/api/auth/sign-in/social` — initiate OAuth flow
- `/api/auth/callback/:provider` — OAuth callback
- `/api/auth/get-session` — session check
- `/api/auth/sign-out` — sign out

#### `middleware.ts` — Route protection

Uses `getSessionCookie()` from `better-auth/cookies` to check cookie presence (no DB hit).

**Matcher:** `/((?!sign-in|api/auth|_next/static|_next/image|favicon.ico).*)` — matches everything except public routes and static assets.

Unauthenticated requests to protected routes redirect to `/sign-in`.

#### `app/sign-in/page.tsx` — Sign-in page

- Lives outside `(app)` layout group (no sidebar)
- Displays app branding: CM badge + "Cô Minh" title
- Single "Đăng nhập bằng Google" button
- Uses `authClient.signIn.social({ provider: "google" })` on click
- Redirects to `/english-chatbot` on success (via `callbackURL`)
- If already authenticated, redirects to `/english-chatbot`
- Styled with the editorial design system (Fraunces, stone palette)
- Motion entrance animations

### Modified Files

#### `app/(app)/layout.tsx`

- Server-side session validation via `auth.api.getSession({ headers: await headers() })`
- If no valid session, `redirect("/sign-in")`
- Passes `user` object (name, email, image) to `AppShell`

#### `components/app/AppShell.tsx`

- Accepts `user` prop with `{ name: string; image: string | null }`
- Passes `user` to `AppSidebar`

#### `components/app/AppSidebar.tsx`

- Receives `user` prop
- Bottom section: user avatar (Google profile picture, fallback to initials) + name
- On sidebar expand (hover): shows name + "Đăng xuất" button
- Sign out: calls `authClient.signOut()` then `router.push("/sign-in")`

#### `app/page.tsx`

- Currently redirects to `/english-chatbot`
- No change needed — middleware handles auth redirect before this runs

## Auth Flow

1. User visits any `/(app)/*` route
2. `middleware.ts` checks for session cookie
3. No cookie → redirect to `/sign-in`
4. User clicks "Đăng nhập bằng Google"
5. `authClient.signIn.social({ provider: "google" })` initiates OAuth
6. Google consent screen → callback to `/api/auth/callback/google`
7. Better Auth creates/updates user + session in Supabase, sets cookie
8. Redirect to `/english-chatbot`
9. `(app)/layout.tsx` validates session server-side, renders app

## Sign-out Flow

1. User clicks "Đăng xuất" in sidebar
2. `authClient.signOut()` calls `/api/auth/sign-out`
3. Better Auth deletes session from DB, clears cookie
4. Client redirects to `/sign-in`

## Error Handling

- **Google OAuth failure** (user cancels, provider error): Better Auth redirects back with error param. Sign-in page shows a dismissible error message.
- **Expired session**: Middleware redirects to `/sign-in`. Layout's server-side check is a safety net.
- **Database unreachable**: Better Auth returns 500. Sign-in page shows generic error.

## Testing Considerations

- Auth routes are external (Google OAuth) — not unit-testable
- Middleware can be unit-tested with mocked cookies
- Layout session check can be tested with mocked `auth.api.getSession`
- Existing tests for `/api/chat` and `/api/dictionary` remain unchanged (they don't check auth in this scope)
