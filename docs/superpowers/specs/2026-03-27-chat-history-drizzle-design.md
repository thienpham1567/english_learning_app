# Chat History with Drizzle ORM — Design Spec

**Date:** 2026-03-27
**Status:** Approved

---

## Overview

Add persistent chat history to the English Learning App using Drizzle ORM on top of the existing Supabase PostgreSQL database. Conversations are organized into named threads (like ChatGPT). Each user can have multiple conversations; each conversation holds an ordered list of messages.

---

## Database Schema

Two new tables, defined in TypeScript via Drizzle.

### `conversation`

| Column       | Type                        | Notes                                      |
|--------------|-----------------------------|--------------------------------------------|
| `id`         | `uuid` PK                   | `gen_random_uuid()` default                |
| `user_id`    | `text` FK → `user.id`       | References better-auth `user` table        |
| `title`      | `text`                      | Auto-set from first user message (~60 chars) |
| `created_at` | `timestamp with time zone`  | Default now()                              |
| `updated_at` | `timestamp with time zone`  | Bumped on every new message                |

### `message`

| Column            | Type                       | Notes                            |
|-------------------|----------------------------|----------------------------------|
| `id`              | `uuid` PK                  | `gen_random_uuid()` default      |
| `conversation_id` | `uuid` FK → `conversation.id` | Cascade delete                |
| `role`            | `enum` `user\|assistant`   |                                  |
| `content`         | `text`                     |                                  |
| `created_at`      | `timestamp with time zone` | Default now()                    |

---

## Drizzle Setup

- Schema file: `lib/db/schema.ts`
- Drizzle client: `lib/db/index.ts` — reuses the existing `pg.Pool` from `lib/auth.ts`
- Migrations: managed via `drizzle-kit`, output to `lib/db/migrations/`
- `drizzle.config.ts` at project root

---

## API Routes

All routes require an authenticated session (validated via `auth.api.getSession`). Return 401 if unauthenticated, 403 if the resource doesn't belong to the current user.

| Method   | Route                                   | Description                                      |
|----------|-----------------------------------------|--------------------------------------------------|
| `GET`    | `/api/conversations`                    | List user's threads (id, title, updated_at), ordered by `updated_at` desc |
| `POST`   | `/api/conversations`                    | Create new thread, returns `{ id, title }`       |
| `DELETE` | `/api/conversations/[id]`               | Delete thread + cascade messages                 |
| `GET`    | `/api/conversations/[id]/messages`      | Return full message list ordered by `created_at` |

The existing `POST /api/chat` streaming route is extended to:
1. Accept `conversationId` in the request body
2. After the stream completes, persist the user message and assistant response to the `message` table
3. Bump `conversation.updated_at`

If `conversationId` is absent (new chat), the frontend creates the conversation first via `POST /api/conversations`, then passes the returned id to `/api/chat`.

---

## Frontend Changes

### Chatbot page layout

The `/english-chatbot` page gains a left panel for thread management alongside the existing chat UI:

- **Thread list panel** — scrollable list of conversations showing title and relative time (`updated_at`). Clicking a thread loads its messages.
- **New chat button** — at the top of the thread list. Clears the current chat and creates a new conversation on first message.
- **Active thread highlight** — selected thread is visually distinguished.

### Conversation lifecycle

1. User clicks **New chat** → chat UI clears, no conversation created yet.
2. User sends first message → `POST /api/conversations` fires with a title derived from the message text (truncated to 60 chars). Returns `conversationId`.
3. `POST /api/chat` is called with the message and `conversationId`. After streaming, both messages are persisted.
4. Thread list refreshes to show the new conversation at the top.
5. User navigates to a past thread → `GET /api/conversations/[id]/messages` populates chat state.

### Type compatibility

The existing `ChatMessage` type (`id`, `role`, `text`) maps directly to the `message` table. No changes to `ChatMessage` type or existing rendering components.

---

## Packages

| Package          | Purpose                              |
|------------------|--------------------------------------|
| `drizzle-orm`    | ORM core                             |
| `drizzle-kit`    | CLI for generating and running migrations |

No new database driver needed — Drizzle uses the existing `pg` package.

---

## Out of Scope

- Renaming conversations (manual title editing)
- Search across conversation history
- Pagination of message history (load all messages for now)
- Sharing conversations
