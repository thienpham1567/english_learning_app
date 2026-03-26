# Cô Lành Dictionary Design

**Date:** 2026-03-26

## Goal

Add a new `Từ điển Cô Lành` feature to the app, with left sidebar navigation and a structured AI-powered vocabulary lookup experience that follows the JSON schema described in `specs/spec.md`.

## Product Scope

- Keep the current English chatbot as one feature page inside the app.
- Add a persistent application shell with a left sidebar.
- Add a new dictionary page for single-word English vocabulary lookup.
- Use structured AI output validated with Zod.
- Render the returned data with Ant Design components instead of freeform markdown.

## User Experience

### Navigation

- The app becomes a two-column layout:
  - Left: persistent sidebar navigation.
  - Right: page content.
- Sidebar items:
  - `English Chatbot`
  - `Từ điển Cô Lành`
- The active item is visually highlighted.
- The `/` route redirects into the shared app shell and defaults to the English chatbot page.

### Visual Direction

The dictionary page should combine:

- The current app's warm teaching persona:
  - warm cream backgrounds
  - orange accent
  - friendly Vietnamese teacher tone
- The screenshot's cleaner structured layout:
  - airy spacing
  - soft gradient or glow backgrounds
  - distinct search and result panels
  - polished content blocks for explanation and examples

The result should feel more editorial and focused than the current chat UI, while still clearly belonging to the same app.

### Dictionary Page Layout

- Header section with title and supporting description.
- Main content area with two panels on desktop:
  - Left lookup panel
  - Right result panel
- Mobile layout collapses to a single column with the lookup panel above results.

#### Lookup Panel

- Title and short helper text.
- Input field for one English vocabulary word.
- Search button.
- Small usage tips card below the form.
- Validation guidance for empty input or invalid format.

#### Result Panel

- Empty state before the first search.
- Loading state while waiting for AI response.
- Structured result view after success:
  - word
  - phonetic transcription
  - difficulty tag
  - meaning
  - example
  - grammar notes

## Data Contract

The dictionary response must use a strict Zod schema:

```ts
const VocabularySchema = z.object({
  word: z.string(),
  phonetic: z.string(),
  meaning: z.string(),
  example: z.string(),
  grammar_notes: z.array(z.string()),
  level: z.enum(["Dễ", "Trung bình", "Khó"]),
});
```

### Field Semantics

- `word`: normalized English word being defined
- `phonetic`: pronunciation string
- `meaning`: Vietnamese meaning in a humorous `Cô Lành` tone
- `example`: a funny or slangy example sentence
- `grammar_notes`: short related grammar notes
- `level`: one of `Dễ`, `Trung bình`, `Khó`

## Technical Design

### Routing

- Introduce a shared shell layout for the app.
- Keep the English chatbot on its own route inside that shell.
- Add a new route for the dictionary page.

Suggested routes:

- `/english-chatbot`
- `/co-lanh-dictionary`

### Frontend Responsibilities

Create focused UI boundaries:

- Shell/layout component:
  - sidebar navigation
  - shared page container styling
- Dictionary page:
  - manages local search state
  - triggers lookup request
  - renders loading, empty, error, and success states
- Dictionary result component:
  - displays structured vocabulary data with Ant Design

### API Responsibilities

Add a dedicated dictionary API route that:

- accepts a single vocabulary term
- rejects empty input
- calls the model with `generateObject`
- uses the Zod schema as the response contract
- returns validated JSON to the client
- returns clear error responses for invalid or undefined words

### AI Behavior

The prompt must instruct the model to act as a lively dictionary and return data strictly in the schema shape. The server, not the client, is responsible for enforcing structured output.

## UI Component Mapping

- Input: Ant Design `Input` and `Button`
- Result container: Ant Design `Card`
- Structured fields: Ant Design `Descriptions`
- Difficulty: Ant Design `Tag`
- Grammar notes: Ant Design `Table` or a compact structured list inside the result card
- Loading: Ant Design `Skeleton`
- Errors: Ant Design `message`

`Descriptions` is preferred over `Table` for meaning and example because the response is a single object, not a data grid. Grammar notes can remain list-based unless a table materially improves readability.

## Error Handling

The client should show `message.error` when:

- the input is empty
- the API returns a validation failure
- the word cannot be defined
- the network request fails

The previous successful result should remain visible if a later request fails, unless the failure happens on the first request.

## Non-Goals

- No multi-turn dictionary chat
- No pronunciation audio
- No saved history or favorites
- No automated tests for this task, per user instruction

## Implementation Notes

- Reuse the current color tokens where possible, but add softer gradient backgrounds for the dictionary surface.
- Preserve the existing English chatbot behavior as one feature of the app.
- Prefer server-side schema enforcement over client-side defensive parsing.
- Keep files small and responsibility-focused; avoid making the chatbot page absorb dictionary logic.

## Acceptance Criteria

- The app has a left sidebar with both feature entries.
- The English chatbot remains available and functional inside the app shell.
- The new dictionary page accepts an English vocabulary word.
- The dictionary request uses Vercel AI SDK object generation, not freeform text generation.
- The response is validated with Zod on the server.
- The page renders the structured result using Ant Design `Card`, `Descriptions`, and `Tag`.
- A loading state is shown during lookup.
- Errors are surfaced with Ant Design `message`.
- The dictionary styling reflects both the current app's warmth and the screenshot's clean structured presentation.
