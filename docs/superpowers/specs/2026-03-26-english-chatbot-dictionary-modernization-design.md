# English Chatbot And Dictionary Modernization Design

**Date:** 2026-03-26

## Goal

Modernize the existing Next.js English learning app by:

- moving AI integration onto OpenAI's official API stack
- fixing all Vietnamese UI copy so it consistently uses proper diacritics
- upgrading the English chatbot to prioritize English practice
- expanding `Từ điển cô Lành` from single-word lookup into a structured dictionary for words, collocations, phrasal verbs, and idioms

## Product Scope

This design covers one coordinated modernization pass across the current app shell, chatbot, dictionary API, dictionary data model, and all visible UI copy.

Included:

- replace unaccented Vietnamese UI strings with proper Vietnamese copy
- keep the existing two-route structure:
  - `English Chatbot`
  - `Từ điển cô Lành`
- switch backend AI calls to OpenAI's official SDK and `Responses API`
- add backend language detection for the chatbot
- gently remind the learner to return to English after two consecutive Vietnamese turns
- expand the dictionary to accept:
  - single words
  - collocations
  - phrasal verbs
  - idioms
- return structured dictionary data with Vietnamese and English explanations plus Vietnamese-only examples
- add shared server-side caching for dictionary lookups

Not included:

- user accounts
- per-user learning history
- pronunciation audio
- favorites or saved vocabulary
- database-backed persistence
- major visual rebranding outside the existing warm product language

## User Experience

### Global UI Language

All visible product copy must be Vietnamese with proper diacritics, including:

- sidebar labels
- page titles
- helper text
- placeholders
- button labels
- empty states
- loading states
- validation messages
- notifications
- error messages

The current issue is not a font-rendering problem. It is caused by hard-coded unaccented strings in the UI. The fix is to replace those strings at the source and keep new copy centralized enough to prevent regression.

### English Chatbot

The chatbot should feel like a disciplined but supportive English coach.

Tone requirements:

- serious but friendly
- low on teasing
- clear corrections
- concise responses
- always oriented toward helping the learner practice English

Behavior requirements:

- default to responding in English
- optionally use short Vietnamese clarification only when it helps comprehension
- end most replies with a prompt that keeps the learner speaking in English
- if the learner writes in Vietnamese for two consecutive turns, the assistant should gently remind them to switch back to English for practice

The reminder must feel supportive, not scolding.

### Dictionary Experience

`Từ điển cô Lành` becomes a richer reference tool instead of a single-word toy lookup.

Input rules:

- accept a normalized English query that may be:
  - a word
  - a collocation
  - a phrasal verb
  - an idiom
- reject empty input, unsupported characters, or overlong queries with clear Vietnamese feedback

Result layout:

- retain the existing two-panel page layout on desktop
- keep the search panel on the left
- show a larger result panel on the right
- on mobile, collapse to a single column

Chosen result pattern:

- use a main result panel with tabs or chips per sense
- show one sense at a time inside a larger editorial content area
- this pattern is preferred over stacked sense cards because it handles richer entries better on both desktop and mobile

Each dictionary result must present:

- the query or headword
- entry type
- phonetic transcription when available
- level
- one or more senses
- Vietnamese definition per sense
- English definition per sense
- a substantial set of Vietnamese-only example sentences per sense
- usage notes
- related patterns or expressions when relevant
- common learner mistakes when relevant

Example depth target:

- default target is `3-5` Vietnamese examples per sense

The content depth should feel closer to a learner dictionary entry than a one-line gloss.

## Technical Design

### Routing And UI Boundaries

Keep the existing App Router structure and current route split.

Expected feature routes:

- `/english-chatbot`
- `/co-lanh-dictionary`

Suggested responsibility boundaries:

- chatbot page component:
  - message state
  - input state
  - streaming UI
- chat API route:
  - conversation preprocessing
  - language detection
  - reminder-rule injection
  - OpenAI streaming call
- dictionary page component:
  - query state
  - loading state
  - request lifecycle
  - error notifications
- dictionary result component:
  - tab or chip navigation across senses
  - structured rendering for entry metadata, definitions, examples, usage notes, and related expressions
- dictionary API route:
  - query normalization
  - input classification
  - cache lookup
  - OpenAI structured generation
  - schema validation
  - cache write

Logic that is reusable or hard to test should be extracted from route handlers into focused library modules rather than kept inline in large files.

### OpenAI Integration

Use OpenAI's official API stack for both major AI-backed features.

Design choice:

- backend calls should use the official OpenAI SDK
- new work should target the `Responses API`

Why:

- aligns with current OpenAI platform guidance for new applications
- gives clearer control over structured output and request metadata
- keeps the AI integration contract explicit instead of hiding behavior behind a secondary wrapper layer

The frontend may continue to use the existing chat UI pattern, but server-side model calls should be owned by the app.

### Chatbot Language Detection

The chatbot needs lightweight backend language detection per user turn.

Required categories:

- `english`
- `vietnamese`
- `mixed`
- `unknown`

Counting rule:

- only increment the consecutive counter when a message is clearly `vietnamese`
- `mixed` must not increment the counter
- `english` resets the counter
- `unknown` should be treated conservatively and must not trigger a reminder on its own

Reminder rule:

- when the learner sends two consecutive `vietnamese` turns, the next assistant reply should contain a gentle reminder to switch back to English
- the reminder should be injected by backend rules, not left to model chance alone

This keeps the English-first policy deterministic enough to test.

### Dictionary Query Handling

The dictionary must accept more than a single token.

Normalization requirements:

- trim leading and trailing whitespace
- collapse repeated internal whitespace to single spaces
- normalize case for cache keys
- preserve a display query string that keeps the normalized spacing while retaining readable user-facing casing

Classification requirements:

- detect likely single words
- detect likely multi-word entries
- treat multi-word entries as potential collocations, phrasal verbs, or idioms
- permit apostrophes and hyphens when reasonable

The validator should reject malformed input before calling the model.

### Dictionary Data Contract

Replace the current minimal schema with a richer strict schema that supports multiple senses.

Representative shape:

```ts
const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().optional(),
  examplesVi: z.array(z.string()).min(3).max(5),
  patterns: z.array(z.string()).default([]),
  relatedExpressions: z.array(z.string()).default([]),
  commonMistakesVi: z.array(z.string()).default([]),
});

const DictionaryEntrySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: z.enum(["word", "collocation", "phrasal_verb", "idiom"]),
  phonetic: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  register: z.string().optional(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});
```

Contract rules:

- every sense must include Vietnamese and English definitions
- every sense must include Vietnamese-only examples
- schema validation happens on the server before sending data to the client
- incomplete model output must be treated as an error, not partially rendered
- the schema shape above is the implementation contract unless a code-level constraint discovered during implementation requires a documented change to this spec

### Dictionary Caching

Dictionary lookups should use shared server-side caching.

Cache policy:

- key by normalized query
- shared across users
- store only entries that passed schema validation
- do not cache errors
- use a TTL so entries refresh periodically instead of living forever

Recommended starting TTL:

- `14` days

The implementation may start with a simple server-side cache abstraction. A database is not required in this phase.

## AI Output Requirements

### Chatbot

Prompt requirements:

- explicitly position the assistant as an English-practice coach
- instruct the assistant to prefer English
- permit short Vietnamese clarification when it genuinely helps
- require supportive correction style
- avoid an over-the-top comic persona

The assistant should not freely drift into predominantly Vietnamese conversation once the learner does.

### Dictionary

Prompt requirements:

- force structured learner-dictionary output
- distinguish entry types
- require detailed Vietnamese and English definitions
- require substantial Vietnamese examples for each sense
- prefer explanations that help learning and reuse, not just translation

The output should be modeled after the depth of a learner dictionary entry, but not by copying source material.

## Error Handling

### Chatbot

- if OpenAI fails or times out, return a friendly Vietnamese error in the chat stream
- do not expose raw stack traces or provider errors to the user
- if preprocessing fails before the streaming response starts, the route should still return a UI-safe response

### Dictionary

- invalid input returns a `400` with a clear Vietnamese message
- model output that fails schema validation returns a safe server error message
- network or provider failures return a generic Vietnamese fallback
- the client should not clear the last successful result just because a later lookup failed

## Testing Strategy

This work should be implemented with TDD for the new behavior-heavy units.

Priority tests:

- query normalization for dictionary input
- query classification for word versus multi-word entry
- language detection categorization for chatbot user turns
- reminder-rule logic after two consecutive Vietnamese turns
- schema validation guards for dictionary results
- rendering tests that cover Vietnamese UI copy with diacritics for key states

The tests should target deterministic helpers and UI states rather than attempting to assert exact model prose.

## Non-Goals

- no per-user dictionary history
- no persistent cross-session chatbot memory
- no grammar scoring dashboard
- no spaced repetition system
- no pronunciation playback
- no admin content workflow

## Acceptance Criteria

- every visible UI string in the app is Vietnamese with proper diacritics
- the chatbot uses OpenAI's official API integration on the backend
- the chatbot detects consecutive Vietnamese turns and gently redirects the learner back to English after two turns
- the chatbot tone is serious, friendly, and low on teasing
- the dictionary accepts single words and multi-word entries
- the dictionary can classify and return entries for collocations, phrasal verbs, and idioms
- each dictionary sense includes both Vietnamese and English definitions
- each dictionary sense includes `3-5` Vietnamese-only example sentences
- the dictionary result UI uses a tab or chip-based sense switcher
- dictionary results are schema-validated on the server before rendering
- dictionary results are cached by normalized query with TTL
- friendly Vietnamese errors are shown for invalid input and provider failures

## Implementation Notes

- the visual language should stay compatible with the current warm palette and layout style
- the modernization should improve structure and readability without introducing an unrelated redesign
- the `.superpowers/` brainstorming directory should be ignored by git if it is not already ignored
