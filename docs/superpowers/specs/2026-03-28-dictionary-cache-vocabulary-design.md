# Dictionary Cache + Vocabulary History + Saved Words — Design Spec

**Date:** 2026-03-28
**Status:** Approved

---

## Overview

Three related features built together around a shared DB schema:

1. **Dictionary cache** — replace the in-memory `Map` with a Supabase `vocabulary_cache` table. Lookups survive server restarts and are shared across all instances.
2. **Learning history** — every successful dictionary lookup auto-records a `user_vocabulary` row, giving users a personal history of words they've studied.
3. **Saved vocabulary** — users bookmark words via a star icon on the result card. A dedicated page lists all history and saved words.

---

## Database Schema

Two new tables added to the existing Drizzle schema in `lib/db/schema.ts`.

### `vocabulary_cache`

| Column       | Type                       | Notes                                         |
|--------------|----------------------------|-----------------------------------------------|
| `query`      | `text` PK                  | Normalized query (output of `normalizeDictionaryQuery`) |
| `data`       | `jsonb`                    | Full `Vocabulary` object                      |
| `createdAt`  | `timestamp with time zone` | Default now()                                 |
| `expiresAt`  | `timestamp with time zone` | Default now() + 14 days (matches current TTL) |

### `user_vocabulary`

| Column        | Type                       | Notes                                                    |
|---------------|----------------------------|----------------------------------------------------------|
| `id`          | `uuid` PK                  | `gen_random_uuid()` default                              |
| `userId`      | `text` FK → `user.id`      |                                                          |
| `query`       | `text` FK → `vocabulary_cache.query` |                                              |
| `saved`       | `boolean`                  | Default `false`                                          |
| `lookedUpAt`  | `timestamp with time zone` | Default now(). Updated on repeat lookups.                |
| UNIQUE        | `(userId, query)`          | One row per user per word                                |

---

## Cache Replacement

The existing `dictionaryCache` (in-memory `Map` in `lib/dictionary/cache.ts`) is replaced by DB reads/writes in the dictionary API route. The `cache.ts` file is deleted.

**Lookup flow in `app/api/dictionary/route.ts`:**

1. Normalize query → cache key
2. Query `vocabulary_cache` where `query = key AND expiresAt > now()`
3. **Hit:** return cached `data`, `cached: true`
4. **Miss:** call OpenAI, validate with `VocabularySchema`, insert row into `vocabulary_cache`
5. If session exists: upsert `user_vocabulary` — insert or update `lookedUpAt = now()`
6. Return `{ data, cached }`

The existing `DICTIONARY_CACHE_TTL_MS` env var continues to control TTL (default 14 days).

---

## API Routes

All new routes require authentication (401 if no session).

| Method  | Route                              | Description                                                |
|---------|------------------------------------|------------------------------------------------------------|
| `GET`   | `/api/vocabulary`                  | User's full history ordered by `lookedUpAt` desc. Returns array of `{ id, query, headword, level, entryType, saved, lookedUpAt }` — headword/level/entryType are extracted from `vocabulary_cache.data` via a JOIN. |
| `PATCH` | `/api/vocabulary/[query]/saved`    | Body: `{ saved: boolean }`. Updates `user_vocabulary.saved`. Returns the updated row. Returns 404 if the word isn't in the user's history. |

The existing `POST /api/dictionary` is modified (not a new route).

---

## Frontend Changes

### Dictionary page (`/co-lanh-dictionary`)

- After a successful lookup, a **bookmark icon** (star) appears in the result card header
- Icon state: filled star = saved, outline star = not saved
- Clicking toggles saved via `PATCH /api/vocabulary/[query]/saved` with optimistic update
- Icon only visible when a result is displayed (not in loading/empty state)

### New sidebar entry

Add `{ href: "/my-vocabulary", label: "Từ vựng", icon: BookMarked }` to `navItems` in `AppSidebar.tsx`.

### New page: `/my-vocabulary`

- Scrollable list of all `user_vocabulary` rows ordered by `lookedUpAt` desc
- Each row shows: headword, level badge (colour-coded by CEFR), entry type chip, relative time
- Star icon per row to toggle saved (same `PATCH` endpoint)
- **Filter toggle** at the top: "Tất cả" / "Đã lưu" — filters to `saved = true` client-side
- Empty state: "Chưa tra từ nào. Hãy thử từ điển nhé!"
- Loads via `GET /api/vocabulary` on mount

---

## Files Changed

| Action  | Path                                         | Notes                                  |
|---------|----------------------------------------------|----------------------------------------|
| Modify  | `lib/db/schema.ts`                           | Add `vocabulary_cache` + `user_vocabulary` tables |
| Delete  | `lib/dictionary/cache.ts`                    | Replaced by DB                         |
| Delete  | `lib/dictionary/cache.test.ts`               | No longer needed                       |
| Modify  | `app/api/dictionary/route.ts`                | DB cache + user_vocabulary upsert      |
| Modify  | `app/api/dictionary/route.test.ts`           | Update mocks                           |
| Create  | `app/api/vocabulary/route.ts`                | GET history                            |
| Create  | `app/api/vocabulary/[query]/saved/route.ts`  | PATCH saved toggle                     |
| Modify  | `components/dictionary/DictionaryResultCard.tsx` | Add bookmark icon                  |
| Modify  | `components/app/AppSidebar.tsx`              | Add "Từ vựng" nav item                 |
| Create  | `app/(app)/my-vocabulary/page.tsx`           | History + saved vocabulary page        |
| Run     | `npm run db:generate && npm run db:migrate`  | Apply new tables                       |

---

## Out of Scope

- Deleting individual history entries
- Exporting vocabulary list
- Spaced repetition / flashcards
- Pagination of history (load all for now)
