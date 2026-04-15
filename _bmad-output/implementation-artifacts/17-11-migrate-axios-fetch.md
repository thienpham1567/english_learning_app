# Story 17.11 — Migrate axios → fetch API client

## Story

**As a** developer,
**I want** all FE→BE API calls to use native `fetch` via a thin typed wrapper,
**so that** we eliminate the `axios` dependency, leverage Next.js 16 built-in fetch extensions (caching, revalidation, deduplication), and unify the two competing patterns in the codebase.

**Epic:** 17 - Monorepo Backend Architecture
**Sprint:** R2 - Shared Packages
**Story ID:** 17.11
**Estimate:** 3h
**Dependencies:** 17.4 (@repo/shared — error types for typed error responses)

## Status

not_started

## Acceptance Criteria

- [ ] AC1: `lib/http.ts` (axios-based) replaced by `lib/api-client.ts` (fetch-based)
- [ ] AC2: All 15 files importing `@/lib/http` migrated to `@/lib/api-client`
- [ ] AC3: All 7 hooks using raw `fetch()` migrated to use `api-client`
- [ ] AC4: `axios` removed from `apps/web/package.json` dependencies
- [ ] AC5: `api-client.ts` uses `AppError` from `@repo/shared` for error handling
- [ ] AC6: `pnpm build --filter web` succeeds
- [ ] AC7: All existing tests pass (no regressions)
- [ ] AC8: Bundle size reduced (~13KB from removing axios)

## Tasks/Subtasks

- [ ] Task 1: Create `lib/api-client.ts`
  - [ ] 1.1: Create typed `apiClient<T>()` function wrapping fetch
  - [ ] 1.2: Support GET, POST, PUT, PATCH, DELETE
  - [ ] 1.3: Auto-JSON body serialization
  - [ ] 1.4: Error responses mapped to `AppError` from `@repo/shared`
  - [ ] 1.5: AbortController support for cancellation
- [ ] Task 2: Migrate axios imports (15 files)
  - [ ] 2.1: Replace `import http from "@/lib/http"` with `import { api } from "@/lib/api-client"`
  - [ ] 2.2: Replace `http.get(url)` → `api.get<T>(url)`
  - [ ] 2.3: Replace `http.post(url, data)` → `api.post<T>(url, data)`
  - [ ] 2.4: Replace `response.data` → direct return (no wrapper)
- [ ] Task 3: Migrate raw fetch() calls (7 hooks)
  - [ ] 3.1: Replace inline `fetch("/api/...")` with `api.get/post(...)`
  - [ ] 3.2: Remove manual `Response.json()` parsing
  - [ ] 3.3: Remove manual error status checking
- [ ] Task 4: Remove axios
  - [ ] 4.1: Delete `lib/http.ts`
  - [ ] 4.2: Remove `axios` from `apps/web/package.json`
  - [ ] 4.3: `pnpm install` to clean lockfile
- [ ] Task 5: Update tests
  - [ ] 5.1: Update test mocks from `vi.mock("@/lib/http")` to `vi.mock("@/lib/api-client")`
  - [ ] 5.2: Update `lib/__tests__/http-usage.test.ts` → `api-client-usage.test.ts`
  - [ ] 5.3: Verify all tests pass
- [ ] Task 6: Verify
  - [ ] 6.1: `pnpm build --filter web` succeeds
  - [ ] 6.2: Manual smoke test — dictionary, chat, flashcards
  - [ ] 6.3: No `axios` references remain (`grep -r "axios"`)

## Dev Notes

### Files to migrate

**Axios users (via `lib/http.ts`):**
1. `app/(app)/my-vocabulary/page.tsx`
2. `app/(app)/dictionary/page.tsx`
3. `components/app/my-vocabulary/VocabularyDetailSheet.tsx`
4. `components/app/shared/MiniDictionary.tsx`
5. `components/app/english-chatbot/ChatWindow.tsx`
6. `components/app/english-chatbot/ChatConversationProvider.tsx`
7. `components/dictionary/DictionarySearchPanel.tsx`
8. `hooks/useWritingPractice.ts`
9. `hooks/useGrammarQuiz.ts`
10. `hooks/useFlashcardSession.ts`
11. `hooks/useDailyChallenge.ts`

**Raw fetch users:**
12. `hooks/useDashboard.tsx` — `fetch("/api/dashboard")`
13. `hooks/useListeningExercise.ts` — `fetch("/api/listening/...")`
14. `hooks/useTextToSpeech.ts` — `fetch("/api/voice/synthesize")`
15. `hooks/useVoiceInput.ts` — `fetch("/api/voice/transcribe")`

**Test files:**
16. `app/(app)/my-vocabulary/__tests__/page.test.tsx`
17. `test/components/ChatConversationProvider.test.tsx`
18. `components/app/my-vocabulary/__tests__/VocabularyDetailSheet.test.tsx`
19. `components/dictionary/__tests__/DictionarySearchPanel.test.tsx`
20. `lib/__tests__/http-usage.test.ts`

### API client design

```ts
// lib/api-client.ts
import { AppError } from "@repo/shared";

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  params?: Record<string, string>;
};

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  const fullUrl = url.startsWith("/") ? `/api${url}` : `/api/${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw AppError.fromJSON({ ...errorBody, statusCode: res.status });
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, opts?: RequestOptions) => request<T>("GET", url, undefined, opts),
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) => request<T>("POST", url, body, opts),
  put: <T>(url: string, body?: unknown, opts?: RequestOptions) => request<T>("PUT", url, body, opts),
  patch: <T>(url: string, body?: unknown, opts?: RequestOptions) => request<T>("PATCH", url, body, opts),
  delete: <T>(url: string, opts?: RequestOptions) => request<T>("DELETE", url, undefined, opts),
};
```

### Migration pattern

```ts
// BEFORE (axios)
import http from "@/lib/http";
const res = await http.get("/dictionary/lookup", { params: { q: word } });
const data = res.data;

// AFTER (api-client)
import { api } from "@/lib/api-client";
const data = await api.get<DictionaryResult>(`/dictionary/lookup?q=${word}`);
```

```ts
// BEFORE (raw fetch)
const res = await fetch("/api/dashboard");
if (!res.ok) throw new Error("Failed");
const data = await res.json();

// AFTER (api-client)
import { api } from "@/lib/api-client";
const data = await api.get<DashboardData>("/dashboard");
```

### Why native fetch > axios for this project

1. Next.js 16 extends fetch with caching/revalidation — axios bypasses this
2. React Server Components only work with fetch
3. ~13KB bundle savings
4. AbortController is native (no axios CancelToken)
5. Current `lib/http.ts` only sets baseURL + Content-Type — trivial to replace

## Dev Agent Record

### Implementation Plan
### Debug Log
### Completion Notes

## File List
## Change Log
