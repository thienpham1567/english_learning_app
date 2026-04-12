# Story 10.1: Listening Exercise Schema & API

Status: review

## Story

As a developer,
I want a listening exercise API that generates audio-based exercises,
So that users can practice listening comprehension.

## Acceptance Criteria

1. **Given** a user requesting a listening exercise  
   **When** `POST /api/listening/generate` is called with `level` (A1-C2) and `exerciseType`  
   **Then** AI generates a short passage (50-150 words) appropriate to the CEFR level  
   **And** the passage is converted to audio via OpenAI TTS API (`tts-1` model)  
   **And** audio is uploaded to Supabase Storage with a hash-based key for cache reuse  
   **And** 3-4 MCQ questions are generated about the passage  
   **And** the exercise is stored in `listening_exercise` table  

2. **Given** a user submitting answers  
   **When** `POST /api/listening/submit` is called  
   **Then** answers are scored  
   **And** +40 XP is awarded via `awardXP()`  
   **And** activity is logged via `logActivity(userId, "listening_practice", 40, {...})`  

3. **Given** the migration  
   **Then** DB migration SQL is created at `drizzle/0006_add_listening_exercise.sql`  

## Tasks / Subtasks

- [x] Task 1: DB Schema & Migration (AC: #3)
  - [x] 1.1 Add `listening_exercise` table to `lib/db/schema.ts`
  - [x] 1.2 Create `drizzle/0006_add_listening_exercise.sql` migration
  - [x] 1.3 Add `ListeningExerciseRow` type export

- [x] Task 2: Exercise Generation API (AC: #1)
  - [x] 2.1 Create `POST /api/listening/generate` route
  - [x] 2.2 Implement OpenAI prompt for passage + MCQ generation
  - [x] 2.3 Integrate OpenAI TTS for audio generation (on-demand via /api/listening/audio/[id])
  - [x] 2.4 Audio served on-demand instead of Supabase Storage (project has no Supabase Storage setup)
  - [x] 2.5 Store exercise in DB

- [x] Task 3: Exercise Submission API (AC: #2)
  - [x] 3.1 Create `POST /api/listening/submit` route
  - [x] 3.2 Score answers against correct answers
  - [x] 3.3 Integrate awardXP + logActivity

- [x] Task 4: Listening Types & Schemas
  - [x] 4.1 Create `lib/listening/types.ts` with exercise types
  - [x] 4.2 Create Zod validation schemas for API inputs

## Dev Notes

### Critical Architecture Patterns (MUST FOLLOW)

1. **API Route Pattern** — Match existing routes:
   - Auth check: `const session = await auth.api.getSession({ headers: await headers() })` 
   - Return 401 if no session
   - Use Zod for request body validation
   - Reference: `app/api/daily-challenge/generate/route.ts`, `app/api/writing-practice/review/route.ts`

2. **OpenAI Config** — Uses OpenRouter for text generation, **direct OpenAI for TTS**:
   - Text generation (passage + questions): Use `openAiConfig` from `lib/openai/config.ts` (OpenRouter)
   - TTS audio: Use `OPENAI_DIRECT_API_KEY` env var, direct to `https://api.openai.com/v1/audio/speech`
   - Reference: `app/api/voice/synthesize/route.ts` for TTS pattern
   - **IMPORTANT**: Rate limit TTS — reuse pattern from `synthesize/route.ts`

3. **Supabase Storage** — Use existing Supabase client:
   - Check `lib/db/index.ts` for Supabase client setup
   - Upload audio to `listening-audio` bucket
   - Hash-based key: `SHA256(passage_text).substring(0, 16) + ".mp3"`
   - Before generating TTS, check if audio already exists in storage (cache hit)

4. **XP & Activity Log** — Fire-and-forget pattern:
   ```ts
   import { awardXP, XP_VALUES } from "@/lib/xp";
   import { logActivity } from "@/lib/activity-log";
   
   // Add to XP_VALUES:
   LISTENING_PRACTICE: 40
   
   // In submit route:
   void awardXP(userId, XP_VALUES.LISTENING_PRACTICE).catch(() => {});
   logActivity(userId, "listening_practice", XP_VALUES.LISTENING_PRACTICE, { score, level });
   ```

5. **Activity Type Enum** — Must add `"listening_practice"` to:
   - `lib/db/schema.ts` → `activityTypeEnum`
   - `lib/activity-log.ts` → `ActivityType` union
   - Migration SQL must `ALTER TYPE activity_type ADD VALUE`

### DB Schema Design

```sql
CREATE TABLE IF NOT EXISTS listening_exercise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  level TEXT NOT NULL,              -- 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  exercise_type TEXT NOT NULL,      -- 'comprehension' | 'dictation' | 'fill_blanks'
  passage TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  questions JSONB NOT NULL,         -- Array<{ question, options, correctIndex }>
  answers JSONB,                    -- User's answers (null until submitted)
  score INTEGER,                    -- null until submitted
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'listening_practice';
```

### Drizzle Schema Definition

```ts
export const listeningExercise = pgTable("listening_exercise", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  level: text("level").notNull(),
  exerciseType: text("exercise_type").notNull(),
  passage: text("passage").notNull(),
  audioUrl: text("audio_url").notNull(),
  questions: jsonb("questions").$type<ListeningQuestion[]>().notNull(),
  answers: jsonb("answers").$type<number[]>(),
  score: integer("score"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

### OpenAI Prompt Design (passage + questions)

```
System: You are an English language exercise creator specializing in listening comprehension.
Generate a short English passage (50-150 words) at CEFR level {level}.
Topic should be practical/everyday for A1-B1, professional/academic for B2-C2.

Then create 3-4 multiple choice questions testing comprehension.

Respond in JSON:
{
  "passage": "...",
  "questions": [
    { "question": "What did...?", "options": ["A", "B", "C", "D"], "correctIndex": 0 }
  ]
}
```

### Project Structure Notes

New files to create:
- `app/api/listening/generate/route.ts` — Exercise generation endpoint
- `app/api/listening/submit/route.ts` — Answer submission endpoint
- `lib/listening/types.ts` — TypeScript types and Zod schemas
- `drizzle/0006_add_listening_exercise.sql` — Migration

Files to modify:
- `lib/db/schema.ts` — Add `listeningExercise` table + update `activityTypeEnum`
- `lib/activity-log.ts` — Add `"listening_practice"` to `ActivityType`
- `lib/xp.ts` — Add `LISTENING_PRACTICE: 40` to `XP_VALUES`

### Previous Story Intelligence

From Sprint 8 (Story 9.1-9.3) code review findings:
- **P1 CRITICAL**: `logActivity` requires `.execute()` after Drizzle `.values()` — already fixed
- **P3**: Use `useState`+`useEffect` pattern for browser API detection (not relevant here — server only)
- **P6**: TTS rate limiting pattern established in `synthesize/route.ts` — reuse for listening TTS

### Git Intelligence

Recent commits establish these patterns:
- API routes use `auth.api.getSession` for auth
- Fire-and-forget XP + activity logging alongside each other
- OpenAI TTS via `OPENAI_DIRECT_API_KEY` at `api.openai.com/v1/audio/speech`
- `tts-1` model with `nova` voice

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 10 Story 10.1]
- [Source: lib/xp.ts] — XP_VALUES and awardXP pattern
- [Source: lib/activity-log.ts] — logActivity pattern
- [Source: lib/db/schema.ts] — Table definition patterns
- [Source: app/api/voice/synthesize/route.ts] — OpenAI TTS integration
- [Source: app/api/daily-challenge/generate/route.ts] — Exercise generation pattern
- [Source: app/api/daily-challenge/submit/route.ts] — Answer scoring + XP pattern

## Dev Agent Record

### Agent Model Used

Antigravity (Google DeepMind)

### Debug Log References

- Build passed with 0 errors after all tasks completed

### Completion Notes List

- Task 1: Added `listeningExercise` table, `ListeningQuestion` interface, `ListeningExerciseRow` type, and `listening_practice` to `activityTypeEnum`. Migration at `drizzle/0006_add_listening_exercise.sql` includes ALTER TYPE for enum extension.
- Task 2: Created generate route with AI passage+MCQ generation via OpenRouter, on-demand TTS audio via `/api/listening/audio/[id]` (no Supabase Storage since project doesn't have it — audio cached via HTTP Cache-Control 7 days). CorrectIndex stripped from client response during exercise.
- Task 3: Created submit route with scoring, XP award (40 XP), activity logging with full metadata. Prevents double submission via completedAt check.
- Task 4: Created shared types with CEFR_LEVELS, EXERCISE_TYPES constants, Zod schemas, and response interfaces.
- Deviation from spec: Used on-demand audio endpoint instead of Supabase Storage upload (project has no Supabase Storage client). This is simpler and uses HTTP caching effectively.

### File List

- `lib/db/schema.ts` (modified) — Added `listeningExercise` table, `ListeningQuestion` interface, `activityTypeEnum` extension
- `lib/activity-log.ts` (modified) — Added `listening_practice` to `ActivityType`
- `lib/xp.ts` (modified) — Added `LISTENING_PRACTICE: 40`
- `lib/listening/types.ts` (new) — Shared types and Zod schemas
- `drizzle/0006_add_listening_exercise.sql` (new) — Migration SQL
- `app/api/listening/generate/route.ts` (new) — Exercise generation endpoint
- `app/api/listening/audio/[id]/route.ts` (new) — On-demand TTS audio endpoint
- `app/api/listening/submit/route.ts` (new) — Answer submission endpoint
