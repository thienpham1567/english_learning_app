# Story 17.11: Migrate axios → fetch API client

Status: ready-for-dev

## Story

As a developer,
I want all FE→BE API calls to use native `fetch` via a thin typed wrapper,
so that we eliminate the `axios` dependency, leverage Next.js 16 built-in fetch extensions (caching, revalidation, deduplication), and unify the two competing patterns (axios + raw fetch) in the codebase.

**Epic:** 17 — Monorepo Backend Architecture
**Sprint:** R2 — Shared Packages
**Story ID:** 17.11
**Estimate:** 3h
**Risk:** 🟡 Medium — 11 axios files + 27 raw-fetch files + 5 test files = 43 files total
**Dependencies:** 17.4 (`@repo/shared` — ✅ done, provides `AppError` + `AppError.fromJSON`)

## Acceptance Criteria

1. **AC1 — New API client created:** `apps/web/lib/api-client.ts` exports a typed `api` object with `.get<T>()`, `.post<T>()`, `.put<T>()`, `.patch<T>()`, `.delete<T>()` methods wrapping native `fetch`.

2. **AC2 — Axios imports migrated (11 source files):** All files importing `@/lib/http` switched to `@/lib/api-client`. The `{ data }` destructure pattern replaced with direct return.

3. **AC3 — Raw fetch calls migrated (27 files):** All inline `fetch("/api/...")` calls replaced with `api.get/post(...)`. Manual `Response.json()` parsing and status checking removed.

4. **AC4 — Special response types supported:** The api-client supports a `raw: true` option that returns the raw `Response` object for:
   - Binary blob responses (`useTextToSpeech` — audio MP3)
   - Streaming responses (`ChatWindow` — `getReader()`)
   - FormData uploads (`useVoiceInput`, `pronunciation/page`, `ShadowingMode`)

5. **AC5 — axios removed:** `axios` deleted from `apps/web/package.json` dependencies. `lib/http.ts` deleted. No `axios` references remain in codebase.

6. **AC6 — Error handling uses AppError:** Non-ok JSON responses throw `AppError.fromJSON()` from `@repo/shared`.

7. **AC7 — Build succeeds:** `pnpm build --filter web` passes.

8. **AC8 — Tests updated and pass:** All test mocks migrated from `vi.mock("@/lib/http")` to `vi.mock("@/lib/api-client")`. `http-usage.test.ts` → `api-client-usage.test.ts` with updated assertions.

9. **AC9 — No regression:** Manual smoke test: dictionary, flashcards, chat (streaming), TTS, voice input, dashboard.

## Tasks / Subtasks

- [ ] Task 1: Create `apps/web/lib/api-client.ts` (AC: #1, #4, #6)
  - [ ] 1.1: Create core `request<T>()` function wrapping `fetch`
  - [ ] 1.2: Auto-prepend `/api` prefix to relative URLs
  - [ ] 1.3: Auto-JSON serialize body and set `Content-Type: application/json`
  - [ ] 1.4: Parse JSON response by default, throw `AppError.fromJSON()` on non-ok
  - [ ] 1.5: Support `params` option (auto-serialize to query string, matching Axios pattern)
  - [ ] 1.6: Support `raw: true` option returning raw `Response` (for blob/stream/FormData)
  - [ ] 1.7: Support passing custom `signal` for AbortController cancellation
  - [ ] 1.8: Skip `Content-Type` header when body is `FormData` (browser sets boundary)
  - [ ] 1.9: Handle 204 No Content (return `undefined`)
  - [ ] 1.10: Export `api` object with `get`, `post`, `put`, `patch`, `delete` methods
- [ ] Task 2: Migrate axios imports — 11 source files (AC: #2)
  - [ ] 2.1: `app/(app)/my-vocabulary/page.tsx`
  - [ ] 2.2: `app/(app)/dictionary/page.tsx`
  - [ ] 2.3: `components/app/my-vocabulary/VocabularyDetailSheet.tsx`
  - [ ] 2.4: `components/app/shared/MiniDictionary.tsx`
  - [ ] 2.5: `components/app/english-chatbot/ChatWindow.tsx` (also uses raw fetch for streaming — see Task 3)
  - [ ] 2.6: `components/app/english-chatbot/ChatConversationProvider.tsx`
  - [ ] 2.7: `components/dictionary/DictionarySearchPanel.tsx` (uses `params:` option)
  - [ ] 2.8: `hooks/useWritingPractice.ts`
  - [ ] 2.9: `hooks/useGrammarQuiz.ts`
  - [ ] 2.10: `hooks/useFlashcardSession.ts`
  - [ ] 2.11: `hooks/useDailyChallenge.ts`
- [ ] Task 3: Migrate raw fetch calls — pages (AC: #3, #4)
  - [ ] 3.1: `app/(app)/home/page.tsx` (2 calls: `/api/skill-profile`, `/api/analytics`)
  - [ ] 3.2: `app/(app)/listening/page.tsx` (`/api/skill-profile?module=listening`)
  - [ ] 3.3: `app/(app)/progress/page.tsx` (`/api/analytics`)
  - [ ] 3.4: `app/(app)/review-quiz/page.tsx` (6 fetch calls — multiple endpoints)
  - [ ] 3.5: `app/(app)/diagnostic/page.tsx` (3 calls GET+POST)
  - [ ] 3.6: `app/(app)/pronunciation/page.tsx` (3 calls, incl. FormData upload)
  - [ ] 3.7: `app/(app)/mock-test/page.tsx` (2 calls)
  - [ ] 3.8: `app/(app)/scenarios/page.tsx` (2 calls GET+POST)
  - [ ] 3.9: `app/(app)/error-notebook/page.tsx` (3 calls)
  - [ ] 3.10: `app/(app)/reading/page.tsx` (1 call)
  - [ ] 3.11: `app/(app)/reading/[articleId]/page.tsx` (2 calls)
- [ ] Task 4: Migrate raw fetch calls — hooks (AC: #3, #4)
  - [ ] 4.1: `hooks/useDashboard.tsx`
  - [ ] 4.2: `hooks/useListeningExercise.ts` (2 calls)
  - [ ] 4.3: `hooks/useTextToSpeech.ts` (**blob response** — use `raw: true`)
  - [ ] 4.4: `hooks/useVoiceInput.ts` (**FormData upload** — use `raw: true`)
- [ ] Task 5: Migrate raw fetch calls — components (AC: #3, #4)
  - [ ] 5.1: `components/app/listening/DictationMode.tsx` (2 calls, incl. FormData)
  - [ ] 5.2: `components/app/listening/ShadowingMode.tsx` (2 calls, incl. FormData)
  - [ ] 5.3: `components/app/grammar-lessons/LessonView.tsx`
  - [ ] 5.4: `components/app/shared/ExamModeProvider.tsx`
  - [ ] 5.5: `components/app/shared/LearningStyleCard.tsx`
  - [ ] 5.6: `components/app/shared/NotificationBanner.tsx`
  - [ ] 5.7: `components/app/shared/PredictedScore.tsx`
  - [ ] 5.8: `components/app/shared/WeeklyLeaderboard.tsx`
  - [ ] 5.9: `components/app/shared/WordOfTheDay.tsx`
  - [ ] 5.10: `components/app/study-sets/StudySetView.tsx`
  - [ ] 5.11: `components/app/english-chatbot/ChatWindow.tsx` (**streaming** — use `raw: true`)
- [ ] Task 6: Remove axios (AC: #5)
  - [ ] 6.1: Delete `apps/web/lib/http.ts`
  - [ ] 6.2: Remove `axios` from `apps/web/package.json`
  - [ ] 6.3: `pnpm install` to clean lockfile
  - [ ] 6.4: Verify: `grep -r "axios" apps/web/ --include="*.ts" --include="*.tsx"` returns empty
- [ ] Task 7: Update tests (AC: #8)
  - [ ] 7.1: `app/(app)/my-vocabulary/__tests__/page.test.tsx` — update mock
  - [ ] 7.2: `test/components/ChatConversationProvider.test.tsx` — update mock
  - [ ] 7.3: `components/app/my-vocabulary/__tests__/VocabularyDetailSheet.test.tsx` — update mock
  - [ ] 7.4: `components/dictionary/__tests__/DictionarySearchPanel.test.tsx` — update mock
  - [ ] 7.5: `lib/__tests__/http-usage.test.ts` → rename to `api-client-usage.test.ts`, update assertions
- [ ] Task 8: Verify (AC: #7, #9)
  - [ ] 8.1: `pnpm build --filter web` succeeds
  - [ ] 8.2: `pnpm test --filter web` passes
  - [ ] 8.3: Manual smoke test: dictionary, flashcards, chat (streaming), TTS playback, voice recording, dashboard

## Dev Notes

### API client design — complete implementation

```ts
// apps/web/lib/api-client.ts
import { AppError } from "@repo/shared";

type RequestOptions = Omit<RequestInit, "body" | "method"> & {
  params?: Record<string, string | number | boolean | undefined>;
  raw?: boolean; // Return raw Response (for blob, stream, FormData)
};

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const { params, raw, ...fetchOptions } = options ?? {};

  // Build URL with /api prefix and query params
  let fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`;

  if (params) {
    const filtered = Object.entries(params).filter(([, v]) => v !== undefined);
    if (filtered.length > 0) {
      const qs = new URLSearchParams(
        filtered.map(([k, v]) => [k, String(v)]),
      ).toString();
      fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${qs}`;
    }
  }

  // Auto-set Content-Type for JSON, skip for FormData (browser sets multipart boundary)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers: HeadersInit = isFormData
    ? { ...((fetchOptions.headers as Record<string, string>) ?? {}) }
    : {
        "Content-Type": "application/json",
        ...((fetchOptions.headers as Record<string, string>) ?? {}),
      };

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  // For raw mode, just check ok status and return Response
  if (raw) {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw AppError.fromJSON({ ...errorBody, statusCode: res.status });
    }
    return res as unknown as T;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw AppError.fromJSON({ ...errorBody, statusCode: res.status });
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(url: string, opts?: RequestOptions) =>
    request<T>("GET", url, undefined, opts),
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", url, body, opts),
  put: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", url, body, opts),
  patch: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", url, body, opts),
  delete: <T>(url: string, opts?: RequestOptions) =>
    request<T>("DELETE", url, undefined, opts),
};
```

### Migration patterns

**Pattern A — Axios with `{ data }` destructure:**
```ts
// BEFORE
import http from "@/lib/http";
const { data } = await http.get<VocabularyEntry[]>("/vocabulary");

// AFTER
import { api } from "@/lib/api-client";
const data = await api.get<VocabularyEntry[]>("/vocabulary");
```

**Pattern B — Axios with `params` (DictionarySearchPanel):**
```ts
// BEFORE
const { data } = await http.get<{ suggestions: string[] }>("/dictionary/suggestions", {
  params: { q: draft },
});

// AFTER — params option is supported natively
const data = await api.get<{ suggestions: string[] }>("/dictionary/suggestions", {
  params: { q: draft },
});
```

**Pattern C — Raw fetch → api-client (standard JSON):**
```ts
// BEFORE
const res = await fetch("/api/dashboard");
if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
const data = await res.json();

// AFTER
const data = await api.get<DashboardData>("/dashboard");
```

**Pattern D — Binary blob response (useTextToSpeech):**
```ts
// BEFORE
const response = await fetch("/api/voice/synthesize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, speed: rate }),
  signal: abortController.signal,
});
if (!response.ok) throw new Error("TTS API error");
const audioBlob = await response.blob();

// AFTER — use raw: true to get the Response object
const response = await api.post<Response>("/voice/synthesize", { text, speed: rate }, {
  raw: true,
  signal: abortController.signal,
});
const audioBlob = await response.blob();
```

**Pattern E — FormData upload (useVoiceInput, pronunciation, ShadowingMode):**
```ts
// BEFORE
const formData = new FormData();
formData.append("audio", blob, "recording.webm");
const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });

// AFTER — FormData body auto-skips Content-Type header
const formData = new FormData();
formData.append("audio", blob, "recording.webm");
const data = await api.post<TranscribeResult>("/voice/transcribe", formData);
```

**Pattern F — Streaming response (ChatWindow):**
```ts
// BEFORE
const response = await fetch("/api/chat", { method: "POST", ... });
const reader = response.body.getReader();

// AFTER — use raw: true for streaming
const response = await api.post<Response>("/api/chat", payload, { raw: true });
const reader = response.body!.getReader();
```

**Pattern G — Fire-and-forget POSTs (error logging, XP tracking):**
```ts
// BEFORE
void http.post("/xp", { activity: "quiz_complete" }).catch(() => {});
fetch("/api/errors", { method: "POST", ... }).catch(() => {});

// AFTER
void api.post("/xp", { activity: "quiz_complete" }).catch(() => {});
void api.post("/errors", errorPayload).catch(() => {});
```

### Current `lib/http.ts` — being deleted

```ts
import axios from "axios";

const http = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default http;
```

Only 2 things to replicate: `/api` prefix and `Content-Type` header. Both are handled in the api-client.

### Important: ChatWindow uses BOTH axios and raw fetch

`ChatWindow.tsx` imports `http` from `@/lib/http` for non-streaming calls (conversation list, create) AND uses raw `fetch("/api/chat", ...)` for the streaming chat endpoint. Both patterns need migration in this file.

### Test migration

The existing `lib/__tests__/http-usage.test.ts` checks that specific files import from `@/lib/http` and don't use raw `fetch`. After migration, this test should:
1. Be renamed to `api-client-usage.test.ts`
2. Check that files import from `@/lib/api-client` instead
3. Update file paths (e.g., `components/app/VocabularyDetailSheet.tsx` → `components/app/my-vocabulary/VocabularyDetailSheet.tsx`)
4. Remove the "keeps fetch only for streaming chat" test (streaming now uses api-client too)

**Test mock migration pattern:**
```ts
// BEFORE
vi.mock("@/lib/http", () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

// AFTER
vi.mock("@/lib/api-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
```

Note: Axios `http.get()` returns `{ data: T }`, while `api.get()` returns `T` directly. Mock return values must change from `{ data: mockValue }` to just `mockValue`.

### Why native fetch > axios for this project

1. Next.js 16 extends `fetch` with caching/revalidation — axios bypasses this
2. React Server Components only work with `fetch`
3. ~13KB bundle savings (axios 1.13.6)
4. AbortController is native (no axios CancelToken)
5. Current `lib/http.ts` only sets baseURL + Content-Type — trivial to replace

### Package dependencies

- `AppError` imported from `@repo/shared` (workspace dependency, already in `apps/web/package.json`)
- `axios` version being removed: `1.13.6`
- No new dependencies needed — `fetch` is native

### Anti-patterns to avoid

- ❌ DO NOT leave any `import http from "@/lib/http"` — must be zero axios references
- ❌ DO NOT wrap blob/stream responses in JSON parsing — use `raw: true` option
- ❌ DO NOT set `Content-Type` header for FormData — browser must set multipart boundary
- ❌ DO NOT change API route handlers (backend) — only client-side fetch calls
- ❌ DO NOT add query params via string interpolation — use the `params` option for consistency
- ❌ DO NOT import `axios` types — replace `AxiosError` catches with `AppError` checks
- ❌ DO NOT miss the double-pattern in `ChatWindow.tsx` (both axios + raw fetch)

### Previous story learnings (17.7)

- Package scaffold: `main` + `types` both point to `./src/index.ts`
- `@repo/shared` exports `AppError` with `toJSON()` and `fromJSON()` static methods
- Error handling pattern: `AppError.fromJSON({ ...errorBody, statusCode: res.status })`
- `pnpm build` from root for full project verification
- Tests use `vitest` — same setup as other packages

### File reference: `packages/shared/src/errors/app-error.ts`

```ts
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(options: AppErrorOptions) { ... }
  toJSON() { return { code, message, statusCode }; }

  static fromJSON(json: { code?: string; message?: string; statusCode?: number }): AppError {
    return new AppError({
      code: json.code ?? "UNKNOWN",
      message: json.message ?? "An unknown error occurred",
      statusCode: json.statusCode ?? 500,
    });
  }
}
```

### Project Structure Notes

- New file: `apps/web/lib/api-client.ts` (alongside existing `http.ts`, `auth.ts`, `auth-client.ts`)
- Deleted file: `apps/web/lib/http.ts`
- Renamed test: `lib/__tests__/http-usage.test.ts` → `lib/__tests__/api-client-usage.test.ts`
- 11 source files updating axios imports (components, hooks, pages)
- 27 source files updating raw fetch (pages, hooks, components)
- 5 test files updating mocks

### Git commit conventions

Follow established pattern:
- `feat(17.11): Migrate axios → fetch API client`

### References

- [Source: _bmad-output/planning-artifacts/epic-17-monorepo-backend.md — Story 17.11 not in original epic, added during R2 sprint]
- [Source: apps/web/lib/http.ts — current axios wrapper being replaced]
- [Source: packages/shared/src/errors/app-error.ts — AppError + fromJSON]
- [Source: apps/web/package.json — axios 1.13.6]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2026-04-15: Story 17.11 created — comprehensive dev context with all 43 migration files identified, special response type patterns documented, and api-client design finalized
