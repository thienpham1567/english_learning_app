# Story 11.1: PWA Setup & Service Worker

Status: done

## Story

As a user,
I want the app to be installable on my phone,
So that I can access it like a native app.

## Acceptance Criteria

1. **Given** a user visiting the app in a supported browser
   **When** the app loads
   **Then** a valid `manifest.json` is served with app name "ThienGlish", icons, and theme color
   **And** a service worker is registered to enable PWA installation
   **And** "Add to Home Screen" prompt is supported on mobile
   **And** a basic offline fallback page displays when no network is available
   **And** the service worker does NOT aggressively cache API responses (only static assets)

## Tasks / Subtasks

- [x] Task 1: Web App Manifest
  - [x] 1.1 Generate PWA icons (192x192 + 512x512)
  - [x] 1.2 Create `public/manifest.json`
  - [x] 1.3 Add manifest link + theme-color meta to root layout

- [x] Task 2: Service Worker
  - [x] 2.1 Create `public/sw.js` (static asset caching + offline fallback)
  - [x] 2.2 Create `public/offline.html` fallback page
  - [x] 2.3 Register service worker in app layout via PWAProvider

- [x] Task 3: Install Prompt
  - [x] 3.1 Create `hooks/usePWAInstall.ts` — capture beforeinstallprompt
  - [x] 3.2 Create `components/app/shared/PWAInstallBanner.tsx` — non-intrusive install prompt
  - [x] 3.3 Integrate banner into app layout via PWAProvider

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Completion Notes List

- Task 1: Generated app icon with indigo-violet gradient, T+speech bubble motif. 512px + 192px versions. Manifest with theme_color #6366f1, standalone display, portrait orientation.
- Task 2: Service worker uses cache-first for static assets, network-first for navigation with offline fallback. Does NOT cache API calls. Pre-caches offline.html and icons.
- Task 3: usePWAInstall captures beforeinstallprompt, manages session-dismissed state. PWAInstallBanner slides up from bottom with gradient CTA. PWAProvider wraps AppShell.

### File List

- `public/icon-512.png` (new) — PWA icon 512x512
- `public/icon-192.png` (new) — PWA icon 192x192
- `public/manifest.json` (new) — Web app manifest
- `public/sw.js` (new) — Service worker
- `public/offline.html` (new) — Offline fallback page
- `hooks/usePWAInstall.ts` (new) — PWA install prompt hook
- `components/app/shared/PWAInstallBanner.tsx` (new) — Install banner
- `components/app/shared/PWAProvider.tsx` (new) — SW registration + banner provider
- `app/layout.tsx` (modified) — Added manifest link + PWA meta tags
- `app/(app)/layout.tsx` (modified) — Added PWAProvider wrapper
