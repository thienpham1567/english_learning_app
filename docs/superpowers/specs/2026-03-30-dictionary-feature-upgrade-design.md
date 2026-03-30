# Dictionary Feature Upgrade Design

**Goal:** Extend the dictionary entry with nearby words, verb forms, grammatical number, register display, Oxford-style collocations, bold examples, a repositioned thesaurus button, and a fixed pronunciation row.

**Architecture:** Data model extended with three new LLM-generated fields (`verbForms`, `numberInfo`) and one server-computed field (`nearbyWords`). Nearby words resolved server-side via binary search on a static word list — no client bundle impact. All other new data comes from the LLM and is validated by Zod. UI changes are confined to `DictionaryResultCard`, a new `NearbyWordsBar` component, and a utility `parseBold` helper.

**Tech Stack:** Next.js 15 App Router, Zod, OpenAI, Framer Motion, Tailwind CSS, Vitest

---

## Section 1: Data Model

### 1.1 New fields on `VocabularySchema`

```ts
verbForms: z.object({
  base: z.string(),
  thirdPerson: z.string(),
  pastSimple: z.string(),
  pastParticiple: z.string(),
  presentParticiple: z.string(),
}).nullable().default(null)

numberInfo: z.object({
  plural: z.string().nullable(),
  isUncountable: z.boolean(),
  isPluralOnly: z.boolean(),
  isSingularOnly: z.boolean(),
}).nullable().default(null)

nearbyWords: z.array(z.string()).default([])
```

**Rules:**
- `verbForms` — populated by LLM only when `partOfSpeech` is a verb (including phrasal verbs). `null` for all other parts of speech.
- `numberInfo` — populated by LLM only when `partOfSpeech` is a noun. `null` otherwise. `plural` is `null` when `isUncountable`, `isPluralOnly`, or `isSingularOnly` is `true`. `isPluralOnly` and `isSingularOnly` are mutually exclusive.
- `nearbyWords` — server-computed after the LLM call; never sent to or from the LLM.

### 1.2 Existing fields — rendering changes only

- `register: string | null` — already in schema; now rendered as an amber pill tag in the header.
- `DictionarySense.collocations: Array<{ en: string, vi: string }>` — already in schema; display format changes from paired boxes to Oxford inline style. LLM now wraps the primary collocate in `**double asterisks**` within the `en` string (e.g., `"**make** a decision"`).
- `DictionarySense.examples[].en: string` — LLM now wraps the headword and any mandatory dependent words in `**double asterisks**` (e.g., `"She **took** the plane **off** at dawn."`). Vietnamese strings remain plain text.

### 1.3 No changes to

- `DictionarySense` structure (fields, types, order)
- `entryType`, `level`, `phonetic`, `phoneticsUs`, `phoneticsUk`, `partOfSpeech`
- `synonyms`, `antonyms`, `patterns`, `relatedExpressions`, `commonMistakesVi`

---

## Section 2: Server / API

### 2.1 Word list data file

**File:** `data/english-words.ts`

A server-only module exporting a single sorted string array of ~50k common English words sourced from the SCOWL / dwyl public-domain word list. Committed to the repo. Never imported by client components.

```ts
// data/english-words.ts
export const ENGLISH_WORDS: readonly string[] = [
  "a", "aardvark", "abandon", /* ... ~50k entries ... */
];
```

The array must be sorted case-insensitively and contain only single words (no phrases).

### 2.2 Nearby words utility

**File:** `lib/dictionary/nearby-words.ts`

```ts
import { ENGLISH_WORDS } from "@/data/english-words";

export function getNearbyWords(word: string, count = 4): string[] {
  const lower = word.toLowerCase();
  // binary search for lower in ENGLISH_WORDS
  // return up to `count` entries before and `count` entries after
  // skip the word itself if present
  // return [] if word list is empty
}
```

- Pure function, no side effects.
- Returns at most `count * 2` words (fewer at the boundaries of the list).
- Case-insensitive comparison; returned words preserve original casing from the list.

### 2.3 `POST /api/dictionary` route change

After the LLM response is parsed and validated:

```ts
const nearbyWords = getNearbyWords(normalized);
return NextResponse.json({
  data: { ...vocabulary, nearbyWords },
  saved: ...,
});
```

`nearbyWords` is merged into the response object; the Zod schema's `.default([])` ensures existing cached entries without the field parse cleanly.

---

## Section 3: Shared Utility

### 3.1 `parseBold`

**File:** `lib/utils/parse-bold.ts`

```ts
export function parseBold(text: string): Array<{ text: string; bold: boolean }> {
  // splits on **...** delimiters
  // returns alternating plain/bold segments
  // e.g. "She **took** it **off**" →
  //   [{ text: "She ", bold: false }, { text: "took", bold: true },
  //    { text: " it ", bold: false }, { text: "off", bold: true }]
}
```

- Pure function. No React dependency.
- Handles edge cases: unmatched `**`, empty string, no markers.
- Used by both the examples renderer and the collocations renderer.

---

## Section 4: UI Components

### 4.1 Pronunciation row fix (`DictionaryResultCard`)

**Current:** US and UK phonetics rendered in two separate rows.

**Fix:** Render both in a single `flex` row with a separator:

```
🇺🇸 /rʌn/ [▶]  ·  🇬🇧 /rɑːn/ [▶]
```

Single-phonetic fallback (`phonetic` field only) remains one span, unchanged.

### 4.2 Header tag row (`DictionaryResultCard`)

**Current order:** Entry Type · Level · Part of Speech

**New order:** Entry Type · Level · Part of Speech · Register · Number

- **Register pill:** Amber/orange styling (e.g., `bg-amber-50 text-amber-700 ring-1 ring-amber-200`). Only rendered when `vocabulary.register` is non-null. Value displayed as-is (e.g., "informal", "formal", "slang").
- **Number pill:** Gray styling. Only rendered when `vocabulary.numberInfo` is non-null. Display logic:
  - `isUncountable` → "uncountable"
  - `isPluralOnly` → "plural only"
  - `isSingularOnly` → "singular only"
  - `plural` is non-null → "pl: {plural}" (e.g., "pl: children")

### 4.3 Verb Forms strip (`DictionaryResultCard`)

Positioned between the pronunciation block and the overview section. Only renders when `vocabulary.verbForms` is non-null.

**Collapsed by default.** Toggle button: `Verb forms ▾` / `Verb forms ▴`.

When expanded, displays a single line in monospace or small-caps:
```
take · takes · took · taken · taking
```

Collapse/expand animated with Framer Motion (height transition). State is local to the component (`useState`), not persisted.

### 4.4 Thesaurus button — repositioned

**Removed from:** the header row (alongside the save button).

**New position:** Right side of the sense tab row, visually separate from the sense tab buttons. The sense tabs sit on the left; the Thesaurus button floats to the right of the same row.

Styling: outlined pill button with a `BookOpen` icon and label "Thesaurus". Uses a distinct color from the sense tab active state (e.g., stone/neutral outline) so it reads as a navigation action, not a sense tab.

### 4.5 Collocations — Oxford inline style (`SensePanel`)

**Replaced from:** paired EN/VI box layout.

**New layout:** Each collocation is a single line:

```
**make** a decision — đưa ra quyết định
```

Rendered as: `<strong>make</strong> a decision — đưa ra quyết định`

- `parseBold` applied to `collocation.en` to render `<strong>` tags.
- Em dash (`—`) separates English from Vietnamese.
- Listed vertically, one collocation per line.
- Wrapped inside the existing collapsible section (toggle + Framer Motion height animation unchanged).

### 4.6 Examples — bold markup (`SensePanel`)

`parseBold` applied to `example.en`. Bold segments rendered as `<strong>` with the same font weight as surrounding text but slightly higher contrast (e.g., `font-semibold`). Vietnamese tooltip unchanged.

`examplesVi` fallback strings (plain text, no bilingual pair) — `parseBold` also applied for consistency, though the LLM may not always annotate them.

### 4.7 `NearbyWordsBar` (new component)

**File:** `components/dictionary/NearbyWordsBar.tsx`

**Position:** Bottom of `DictionaryResultCard`, below the sense panels. Only renders when `vocabulary.nearbyWords.length > 0`.

**Layout:** Horizontally scrollable row of pill buttons. The searched word (`vocabulary.headword`) is rendered in the center in bold/accent color (not as a clickable button). Adjacent words are clickable buttons that call `onSearch(word)` (passed as a prop).

```tsx
interface NearbyWordsBarProps {
  words: string[];
  headword: string;
  onSearch: (word: string) => void;
}
```

Words are displayed in alphabetical order as received from the server (`nearbyWords` is already in sorted order from the binary search). The headword marker is inserted at the correct position between the before/after groups.

---

## Section 5: LLM Prompt Changes (`lib/dictionary/prompt.ts`)

Four additions to `buildDictionaryInstructions`:

1. **Verb forms:** "When `partOfSpeech` is a verb, populate `verbForms` with the base form, third-person singular present, past simple, past participle, and present participle. Set `verbForms` to `null` for all other parts of speech."

2. **Number info:** "When `partOfSpeech` is a noun, populate `numberInfo`. Set `plural` to the standard plural form, or `null` if the noun is uncountable, plural-only, or singular-only. Set the corresponding boolean flag. Set `numberInfo` to `null` for all other parts of speech."

3. **Bold in examples:** "In each example's `en` string, wrap the headword and any grammatically obligatory dependent words (prepositions, particles, fixed complements) in double asterisks: `**word**`. Do not bold optional or contextual words."

4. **Bold in collocations:** "In each collocation's `en` string, wrap the primary collocate (the word that most characterises the collocation) in double asterisks: `**make** a decision`, `**heavy** rain`."

---

## Section 6: Testing

| What | Where | How |
|------|-------|-----|
| `getNearbyWords` | `lib/dictionary/__tests__/nearby-words.test.ts` | Unit: found word returns neighbours; boundary (first/last word); word not in list returns `[]`; count param respected |
| `parseBold` | `lib/utils/__tests__/parse-bold.test.ts` | Unit: plain text, single bold, multiple bolds, unmatched `**`, empty string |
| `NearbyWordsBar` | `components/dictionary/__tests__/NearbyWordsBar.test.tsx` | Renders word pills; headword is not clickable; clicking adjacent word calls `onSearch`; empty `words` renders nothing |
| `DictionaryResultCard` | Extend existing test file | Add cases: verbForms strip renders + collapses; register pill renders; numberInfo pill renders; pronunciation on one row; thesaurus button in tab row |

---

## File Changelist

| File | Action |
|------|--------|
| `data/english-words.ts` | Create — sorted word list |
| `lib/dictionary/nearby-words.ts` | Create — `getNearbyWords` |
| `lib/dictionary/__tests__/nearby-words.test.ts` | Create |
| `lib/utils/parse-bold.ts` | Create — `parseBold` |
| `lib/utils/__tests__/parse-bold.test.ts` | Create |
| `lib/schemas/vocabulary.ts` | Modify — add `verbForms`, `numberInfo`, `nearbyWords` |
| `lib/dictionary/prompt.ts` | Modify — 4 prompt additions |
| `app/api/dictionary/route.ts` | Modify — call `getNearbyWords`, merge into response |
| `components/dictionary/DictionaryResultCard.tsx` | Modify — pronunciation row, tag row, verb forms strip, thesaurus button position, NearbyWordsBar |
| `components/dictionary/NearbyWordsBar.tsx` | Create |
| `components/dictionary/__tests__/NearbyWordsBar.test.tsx` | Create |
| `components/dictionary/SensePanel` (inline in ResultCard) | Modify — collocations Oxford style, examples bold |
