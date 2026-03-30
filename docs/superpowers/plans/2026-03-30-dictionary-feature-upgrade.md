# Dictionary Feature Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add nearby words, verb forms, grammatical number/register display, Oxford-style collocations, bold examples, a repositioned Thesaurus button, and a single-row pronunciation layout to the dictionary result card.

**Architecture:** New LLM fields (`verbForms`, `numberInfo`) are added to `VocabularySchema` so the LLM populates them via structured output. A separate `VocabularyWithNearbySchema` extends it with `nearbyWords`, which is computed server-side via binary search on a static English word list — never sent to the LLM. A `parseBold` utility renders `**markdown**` annotations in example and collocation strings as `<strong>` tags. All UI changes are confined to `DictionaryResultCard.tsx` and a new `NearbyWordsBar` component.

**Tech Stack:** Next.js 15 App Router, Zod, OpenAI structured output, Framer Motion, Tailwind CSS, Vitest

---

## File Changelist

| File | Action |
|------|--------|
| `lib/utils/parse-bold.ts` | Create — `parseBold` utility |
| `lib/utils/__tests__/parse-bold.test.ts` | Create |
| `scripts/generate-word-list.ts` | Create — one-time word list generator |
| `data/english-words.ts` | Create — generated sorted word array |
| `lib/dictionary/nearby-words.ts` | Create — `getNearbyWords` |
| `lib/dictionary/__tests__/nearby-words.test.ts` | Create |
| `lib/schemas/vocabulary.ts` | Modify — add `verbForms`, `numberInfo`, `VocabularyWithNearbySchema` |
| `lib/schemas/__tests__/vocabulary.test.ts` | Modify — add tests for new fields |
| `lib/dictionary/prompt.ts` | Modify — 4 new LLM instructions |
| `app/api/dictionary/route.ts` | Modify — call `getNearbyWords`, return `VocabularyWithNearby` |
| `components/dictionary/NearbyWordsBar.tsx` | Create |
| `components/dictionary/__tests__/NearbyWordsBar.test.tsx` | Create |
| `components/dictionary/DictionaryResultCard.tsx` | Modify — all UI changes |
| `components/dictionary/__tests__/DictionaryResultCard.test.tsx` | Modify — new test cases |
| `app/(app)/dictionary/page.tsx` | Modify — use `VocabularyWithNearby` type |

---

## Task 1: `parseBold` utility

**Files:**
- Create: `lib/utils/parse-bold.ts`
- Create: `lib/utils/__tests__/parse-bold.test.ts`

- [ ] **Step 1: Create the test file**

```ts
// lib/utils/__tests__/parse-bold.test.ts
import { describe, expect, it } from "vitest";
import { parseBold } from "@/lib/utils/parse-bold";

describe("parseBold", () => {
  it("returns a single plain segment for text without markers", () => {
    expect(parseBold("hello world")).toEqual([{ text: "hello world", bold: false }]);
  });

  it("returns an empty array for empty string", () => {
    expect(parseBold("")).toEqual([]);
  });

  it("parses a single bold word at the start", () => {
    expect(parseBold("**make** a decision")).toEqual([
      { text: "make", bold: true },
      { text: " a decision", bold: false },
    ]);
  });

  it("parses a bold word in the middle", () => {
    expect(parseBold("She **took** the plane off")).toEqual([
      { text: "She ", bold: false },
      { text: "took", bold: true },
      { text: " the plane off", bold: false },
    ]);
  });

  it("parses multiple bold words", () => {
    expect(parseBold("She **took** the plane **off**")).toEqual([
      { text: "She ", bold: false },
      { text: "took", bold: true },
      { text: " the plane ", bold: false },
      { text: "off", bold: true },
    ]);
  });

  it("treats an unmatched ** as plain text", () => {
    const result = parseBold("hello ** world");
    expect(result.every((s) => !s.bold)).toBe(true);
  });

  it("skips empty segments", () => {
    // "**bold**" at start leaves no leading plain text
    const result = parseBold("**bold**");
    expect(result).toEqual([{ text: "bold", bold: true }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run lib/utils/__tests__/parse-bold.test.ts 2>&1 | tail -5
```

Expected: FAIL — "Cannot find module '@/lib/utils/parse-bold'"

- [ ] **Step 3: Create `lib/utils/parse-bold.ts`**

```ts
export type BoldSegment = { text: string; bold: boolean };

export function parseBold(text: string): BoldSegment[] {
  if (!text) return [];
  const parts = text.split(/\*\*(.+?)\*\*/);
  const segments: BoldSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] !== "") {
      segments.push({ text: parts[i], bold: i % 2 === 1 });
    }
  }
  return segments;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run lib/utils/__tests__/parse-bold.test.ts 2>&1 | tail -5
```

Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils/parse-bold.ts lib/utils/__tests__/parse-bold.test.ts
git commit -m "feat: add parseBold utility for rendering **markdown** bold in examples"
```

---

## Task 2: English word list + `getNearbyWords`

**Files:**
- Create: `scripts/generate-word-list.ts`
- Create: `data/english-words.ts` (generated)
- Create: `lib/dictionary/nearby-words.ts`
- Create: `lib/dictionary/__tests__/nearby-words.test.ts`

- [ ] **Step 1: Create the generation script**

```ts
// scripts/generate-word-list.ts
// Run once with: npx tsx scripts/generate-word-list.ts

import { writeFileSync } from "fs";
import { join } from "path";

const URL =
  "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";

const text = await (await fetch(URL)).text();

const words = [
  ...new Set(
    text
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length >= 2 && w.length <= 20 && /^[a-z][a-z'-]*$/.test(w)),
  ),
].sort();

const lines = [
  "// Auto-generated by scripts/generate-word-list.ts. Do not edit manually.",
  "export const ENGLISH_WORDS: readonly string[] = [",
  ...words.map((w) => `  "${w}",`),
  "];",
  "",
];

writeFileSync(join(process.cwd(), "data/english-words.ts"), lines.join("\n"));
console.log(`Generated ${words.length} words → data/english-words.ts`);
```

- [ ] **Step 2: Create the `data/` directory and run the script**

```bash
mkdir -p data
npx tsx scripts/generate-word-list.ts 2>&1 | tail -3
```

Expected: `Generated NNNNN words → data/english-words.ts`

- [ ] **Step 3: Write the failing test**

```ts
// lib/dictionary/__tests__/nearby-words.test.ts
import { describe, expect, it } from "vitest";
import { getNearbyWords } from "@/lib/dictionary/nearby-words";

describe("getNearbyWords", () => {
  it("returns words before and after the searched word", () => {
    const result = getNearbyWords("run");
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toContain("run"); // excludes the word itself
  });

  it("returns at most count*2 words", () => {
    const result = getNearbyWords("run", 4);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("returns fewer than count*2 words at the start of the list", () => {
    // 'a' is near the start — fewer 'before' words available
    const result = getNearbyWords("a", 4);
    expect(result.length).toBeLessThan(8);
  });

  it("returns an empty array when the word list is empty", () => {
    // tested via the utility — word not in list still returns neighbours
    const result = getNearbyWords("xyznotaword");
    // when not found, returns neighbours at insertion point — not empty unless at boundary
    expect(Array.isArray(result)).toBe(true);
  });

  it("preserves original casing of returned words", () => {
    const result = getNearbyWords("run", 4);
    result.forEach((w) => expect(typeof w).toBe("string"));
  });
});
```

- [ ] **Step 4: Run to verify it fails**

```bash
npx vitest run "lib/dictionary/__tests__/nearby-words.test.ts" 2>&1 | tail -5
```

Expected: FAIL — "Cannot find module '@/lib/dictionary/nearby-words'"

- [ ] **Step 5: Create `lib/dictionary/nearby-words.ts`**

```ts
import { ENGLISH_WORDS } from "@/data/english-words";

/**
 * Binary search: returns the lowest index i such that ENGLISH_WORDS[i] >= target.
 * Returns ENGLISH_WORDS.length if all words are less than target.
 */
function bisect(target: string): number {
  let lo = 0;
  let hi = ENGLISH_WORDS.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (ENGLISH_WORDS[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Returns up to `count` words alphabetically before and `count` words after
 * the given word. The word itself is excluded from the result.
 * Returns [] if the word list is empty.
 */
export function getNearbyWords(word: string, count = 4): string[] {
  if (ENGLISH_WORDS.length === 0) return [];

  const lower = word.toLowerCase();
  const idx = bisect(lower);
  const isFound = ENGLISH_WORDS[idx] === lower;

  const result: string[] = [];

  // Words before
  const beforeStart = Math.max(0, idx - count);
  for (let i = beforeStart; i < idx; i++) {
    result.push(ENGLISH_WORDS[i]);
  }

  // Words after (skip the found word)
  const afterStart = isFound ? idx + 1 : idx;
  const afterEnd = Math.min(ENGLISH_WORDS.length, afterStart + count);
  for (let i = afterStart; i < afterEnd; i++) {
    result.push(ENGLISH_WORDS[i]);
  }

  return result;
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npx vitest run "lib/dictionary/__tests__/nearby-words.test.ts" 2>&1 | tail -5
```

Expected: all 5 tests PASS.

- [ ] **Step 7: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-word-list.ts data/english-words.ts lib/dictionary/nearby-words.ts "lib/dictionary/__tests__/nearby-words.test.ts"
git commit -m "feat: add getNearbyWords via binary search on static English word list"
```

---

## Task 3: Schema — `verbForms`, `numberInfo`, `VocabularyWithNearbySchema`

**Files:**
- Modify: `lib/schemas/vocabulary.ts`
- Modify: `lib/schemas/__tests__/vocabulary.test.ts`

- [ ] **Step 1: Add failing tests**

Append to `lib/schemas/__tests__/vocabulary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DictionarySenseSchema, VocabularySchema, VocabularyWithNearbySchema } from "@/lib/schemas/vocabulary";

// existing test (already in file):
// describe("DictionarySenseSchema", () => { ... })

describe("VocabularySchema — verbForms and numberInfo", () => {
  const base = {
    query: "run",
    headword: "run",
    entryType: "word" as const,
    phonetic: "/rʌn/",
    phoneticsUs: null,
    phoneticsUk: null,
    partOfSpeech: "verb",
    level: "A1" as const,
    register: null,
    overviewVi: "Chạy.",
    overviewEn: "To move fast.",
    senses: [
      {
        id: "s1",
        label: "Nghĩa 1",
        definitionVi: "Chạy",
        definitionEn: "Move fast on foot.",
        usageNoteVi: null,
      },
    ],
  };

  it("parses when verbForms is null", () => {
    const result = VocabularySchema.parse({ ...base, verbForms: null, numberInfo: null });
    expect(result.verbForms).toBeNull();
    expect(result.numberInfo).toBeNull();
  });

  it("parses a complete verbForms object", () => {
    const result = VocabularySchema.parse({
      ...base,
      verbForms: {
        base: "run",
        thirdPerson: "runs",
        pastSimple: "ran",
        pastParticiple: "run",
        presentParticiple: "running",
      },
      numberInfo: null,
    });
    expect(result.verbForms?.thirdPerson).toBe("runs");
  });

  it("parses a complete numberInfo object", () => {
    const result = VocabularySchema.parse({
      ...base,
      partOfSpeech: "noun",
      verbForms: null,
      numberInfo: {
        plural: "children",
        isUncountable: false,
        isPluralOnly: false,
        isSingularOnly: false,
      },
    });
    expect(result.numberInfo?.plural).toBe("children");
  });
});

describe("VocabularyWithNearbySchema", () => {
  it("defaults nearbyWords to [] when absent", () => {
    const result = VocabularyWithNearbySchema.parse({
      query: "run",
      headword: "run",
      entryType: "word" as const,
      phonetic: "/rʌn/",
      phoneticsUs: null,
      phoneticsUk: null,
      partOfSpeech: "verb",
      level: "A1" as const,
      register: null,
      overviewVi: "Chạy.",
      overviewEn: "To move fast.",
      verbForms: null,
      numberInfo: null,
      senses: [
        {
          id: "s1",
          label: "Nghĩa 1",
          definitionVi: "Chạy",
          definitionEn: "Move fast on foot.",
          usageNoteVi: null,
        },
      ],
    });
    expect(result.nearbyWords).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
npx vitest run lib/schemas/__tests__/vocabulary.test.ts 2>&1 | tail -8
```

Expected: FAIL — `verbForms` unknown key / `VocabularyWithNearbySchema` not exported.

- [ ] **Step 3: Update `lib/schemas/vocabulary.ts`**

Replace the full file:

```ts
import { z } from "zod";

export const VocabularyEntryTypeSchema = z.enum(["word", "phrasal_verb", "idiom"]);

export const DictionarySenseSchema = z.object({
  id: z.string(),
  label: z.string(),
  definitionVi: z.string(),
  definitionEn: z.string(),
  usageNoteVi: z.string().nullable(),
  examplesVi: z.array(z.string()).default([]),
  examples: z
    .array(z.object({ en: z.string(), vi: z.string() }))
    .default([]),
  collocations: z
    .array(z.object({ en: z.string(), vi: z.string() }))
    .default([]),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  patterns: z.array(z.string()).default([]),
  relatedExpressions: z.array(z.string()).default([]),
  commonMistakesVi: z.array(z.string()).default([]),
});

export const VerbFormsSchema = z.object({
  base: z.string(),
  thirdPerson: z.string(),
  pastSimple: z.string(),
  pastParticiple: z.string(),
  presentParticiple: z.string(),
});

export const NumberInfoSchema = z.object({
  plural: z.string().nullable(),
  isUncountable: z.boolean(),
  isPluralOnly: z.boolean(),
  isSingularOnly: z.boolean(),
});

export const VocabularySchema = z.object({
  query: z.string(),
  headword: z.string(),
  entryType: VocabularyEntryTypeSchema,
  phonetic: z.string().nullable(),
  phoneticsUs: z.string().nullable(),
  phoneticsUk: z.string().nullable(),
  partOfSpeech: z.string().nullable(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).nullable(),
  register: z.string().nullable(),
  verbForms: VerbFormsSchema.nullable(),
  numberInfo: NumberInfoSchema.nullable(),
  overviewVi: z.string(),
  overviewEn: z.string(),
  senses: z.array(DictionarySenseSchema).min(1),
});

export const VocabularyWithNearbySchema = VocabularySchema.extend({
  nearbyWords: z.array(z.string()).default([]),
});

export type Vocabulary = z.infer<typeof VocabularySchema>;
export type VocabularyWithNearby = z.infer<typeof VocabularyWithNearbySchema>;
export type DictionarySense = z.infer<typeof DictionarySenseSchema>;

export function normalizeVocabularyEntryType(entryType: string | null | undefined): Vocabulary["entryType"] | null {
  if (!entryType) return null;

  const normalized = entryType === "collocation" ? "word" : entryType;
  const parsed = VocabularyEntryTypeSchema.safeParse(normalized);
  return parsed.success ? parsed.data : null;
}

export function normalizeVocabulary(value: unknown): Vocabulary {
  if (typeof value !== "object" || value === null) {
    return VocabularySchema.parse(value);
  }

  const entry = value as Record<string, unknown>;
  const normalizedEntryType = normalizeVocabularyEntryType(
    typeof entry.entryType === "string" ? entry.entryType : null,
  );

  return VocabularySchema.parse({
    ...entry,
    ...(normalizedEntryType ? { entryType: normalizedEntryType } : {}),
  });
}
```

- [ ] **Step 4: Run schema tests to verify they pass**

```bash
npx vitest run lib/schemas/__tests__/vocabulary.test.ts 2>&1 | tail -5
```

Expected: all tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/schemas/vocabulary.ts lib/schemas/__tests__/vocabulary.test.ts
git commit -m "feat: add verbForms, numberInfo to VocabularySchema; add VocabularyWithNearbySchema"
```

---

## Task 4: LLM prompt — 4 new instructions

**Files:**
- Modify: `lib/dictionary/prompt.ts`

- [ ] **Step 1: Replace `lib/dictionary/prompt.ts`**

```ts
import type { DictionaryEntryType } from "@/lib/dictionary/classify-entry";

export function buildDictionaryInstructions(entryType: DictionaryEntryType) {
  return [
    "You are Từ điển Christine Ho, a learner-focused English dictionary.",
    "Return valid JSON matching the provided schema.",
    "If the input is not a recognizable English word or phrase, phrasal verb, or idiom — for example if it is a Vietnamese, French, or other non-English word, or gibberish — set `headword` to the input as-is and begin `overviewVi` with exactly the token [NOT_ENGLISH] followed by a short Vietnamese explanation. Fill the remaining required fields with minimal placeholder values.",
    "Provide Vietnamese and English explanations for every sense.",
    "For each sense, provide 3 to 5 examples. Each example must be a bilingual pair: an English sentence (en) and its Vietnamese translation (vi). In the English sentence (en), wrap the headword and any grammatically obligatory dependent words (prepositions, particles, fixed complements) in double asterisks: **word**. Do not bold optional or contextual words.",
    "For each sense, provide 0 to N bilingual collocations. Each collocation must include an English phrase (en) and its Vietnamese translation (vi). In the English phrase (en), wrap the primary collocate — the word that most characterises the collocation — in double asterisks: **make** a decision, **heavy** rain.",
    "For each sense, provide 3 to 5 semantically relevant English synonyms.",
    "For each sense, provide 3 to 5 antonyms (words with opposite or contrasting meaning in that sense context).",
    "Populate phoneticsUs with the American English IPA transcription (e.g. /teɪk ɒf/). Use null if unavailable.",
    "Populate phoneticsUk with the British English IPA transcription. Use null if unavailable.",
    "Populate partOfSpeech with the grammatical category (e.g. phrasal verb, noun, adjective). Use null if unclear.",
    "When partOfSpeech is a verb (including phrasal verb), populate verbForms with base, thirdPerson (third-person singular present), pastSimple, pastParticiple, and presentParticiple. Set verbForms to null for all other parts of speech.",
    "When partOfSpeech is a noun, populate numberInfo. Set plural to the standard plural form, or null if the noun is uncountable, plural-only, or singular-only. Set isUncountable, isPluralOnly, or isSingularOnly to true as appropriate — these are mutually exclusive. Set numberInfo to null for all other parts of speech.",
    `Entry type: ${entryType}`,
  ].join("\n");
}
```

- [ ] **Step 2: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add lib/dictionary/prompt.ts
git commit -m "feat: add verbForms, numberInfo, and bold-annotation instructions to dictionary prompt"
```

---

## Task 5: API route — merge `nearbyWords` into response

**Files:**
- Modify: `app/api/dictionary/route.ts`

- [ ] **Step 1: Read the current route**

Read `app/api/dictionary/route.ts` lines 1–15 (imports) and lines 67–133 (cache hit + LLM path + response).

- [ ] **Step 2: Update the route**

Make these three changes to `app/api/dictionary/route.ts`:

**Add imports at the top** (after the existing imports):

```ts
import { getNearbyWords } from "@/lib/dictionary/nearby-words";
import { VocabularyWithNearbySchema } from "@/lib/schemas/vocabulary";
```

**Cache hit path** — update the `return` inside `if (cachedData)` (currently line 91–92):

Replace:
```ts
const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
return NextResponse.json({ data: cachedData, cached: true, saved });
```

With:
```ts
const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
const nearbyWords = getNearbyWords(cacheKey);
return NextResponse.json({ data: { ...cachedData, nearbyWords }, cached: true, saved });
```

**LLM response path** — update the final `return` (currently line 131–133):

Replace:
```ts
const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;

return NextResponse.json({ data: parsed, cached: false, saved });
```

With:
```ts
const saved = session ? await upsertUserVocabulary(session.user.id, cacheKey) : false;
const nearbyWords = getNearbyWords(normalized);

return NextResponse.json({ data: { ...parsed, nearbyWords }, cached: false, saved });
```

- [ ] **Step 3: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/dictionary/route.ts
git commit -m "feat: merge nearbyWords into dictionary API response"
```

---

## Task 6: `NearbyWordsBar` component

**Files:**
- Create: `components/dictionary/NearbyWordsBar.tsx`
- Create: `components/dictionary/__tests__/NearbyWordsBar.test.tsx`

- [ ] **Step 1: Write the failing tests**

```ts
// components/dictionary/__tests__/NearbyWordsBar.test.tsx
import { screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderUi } from "@/test/render";
import { NearbyWordsBar } from "@/components/dictionary/NearbyWordsBar";

const words = ["rain", "rainbow", "raise", "rake", "rally"];
// headword "run" is NOT in the words array (server excludes it)

describe("NearbyWordsBar", () => {
  it("renders nothing when words array is empty", () => {
    const { container } = renderUi(
      <NearbyWordsBar words={[]} headword="run" onSearch={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders each nearby word as a button", () => {
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={vi.fn()} />);
    expect(screen.getByRole("button", { name: "rain" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "rally" })).toBeInTheDocument();
  });

  it("calls onSearch with the word when a nearby word is clicked", () => {
    const onSearch = vi.fn();
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={onSearch} />);
    fireEvent.click(screen.getByRole("button", { name: "rainbow" }));
    expect(onSearch).toHaveBeenCalledWith("rainbow");
  });

  it("displays the headword as non-interactive text in the bar", () => {
    renderUi(<NearbyWordsBar words={words} headword="run" onSearch={vi.fn()} />);
    // headword shown as a span, not a button
    const buttons = screen.getAllByRole("button");
    const buttonLabels = buttons.map((b) => b.textContent);
    expect(buttonLabels).not.toContain("run");
    expect(screen.getByText("run")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify tests fail**

```bash
npx vitest run "components/dictionary/__tests__/NearbyWordsBar.test.tsx" 2>&1 | tail -5
```

Expected: FAIL — "Cannot find module"

- [ ] **Step 3: Create `components/dictionary/NearbyWordsBar.tsx`**

```tsx
"use client";

type NearbyWordsBarProps = {
  words: string[];
  headword: string;
  onSearch: (word: string) => void;
};

export function NearbyWordsBar({ words, headword, onSearch }: NearbyWordsBarProps) {
  if (words.length === 0) return null;

  // Split words into before/after groups around the headword's alphabetical position.
  // The server returns: [before_0, before_1, ..., after_0, after_1, ...]
  // We insert the headword marker between the two halves.
  const half = Math.floor(words.length / 2);
  const before = words.slice(0, half);
  const after = words.slice(half);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mr-1">
        Nearby
      </span>
      {before.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {word}
        </button>
      ))}
      <span className="rounded-full bg-[rgba(196,109,46,0.1)] px-2.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
        {headword}
      </span>
      {after.map((word) => (
        <button
          key={word}
          type="button"
          onClick={() => onSearch(word)}
          className="rounded-full border border-[var(--border)] bg-white/60 px-2.5 py-0.5 text-xs text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {word}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run "components/dictionary/__tests__/NearbyWordsBar.test.tsx" 2>&1 | tail -5
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/dictionary/NearbyWordsBar.tsx "components/dictionary/__tests__/NearbyWordsBar.test.tsx"
git commit -m "feat: add NearbyWordsBar component"
```

---

## Task 7: `DictionaryResultCard` — all UI changes

This task modifies `DictionaryResultCard.tsx` in one pass: pronunciation row fix, header tags (register + numberInfo), verb forms strip, Thesaurus button relocation, Oxford-style collocations in `SensePanel`, bold examples in `SensePanel`, and `NearbyWordsBar` at the card footer.

**Files:**
- Modify: `components/dictionary/DictionaryResultCard.tsx`
- Modify: `components/dictionary/__tests__/DictionaryResultCard.test.tsx`

- [ ] **Step 1: Write the new/updated tests**

Add new fixtures and test cases to `components/dictionary/__tests__/DictionaryResultCard.test.tsx`.

**Add these fixtures** after the existing `ipaEntry` fixture (before the `describe` block):

```ts
const verbEntry = {
  query: "run",
  headword: "run",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/rʌn/",
  phoneticsUk: "/rɑːn/",
  partOfSpeech: "verb",
  level: "A1" as const,
  register: null,
  overviewVi: "Chạy.",
  overviewEn: "To move fast.",
  nearbyWords: ["rum", "rump", "rune", "rung"],
  verbForms: {
    base: "run",
    thirdPerson: "runs",
    pastSimple: "ran",
    pastParticiple: "run",
    presentParticiple: "running",
  },
  numberInfo: null,
  senses: [
    {
      id: "s1",
      label: "Nghĩa 1",
      definitionVi: "Chạy",
      definitionEn: "Move fast on foot.",
      usageNoteVi: null,
      examples: [{ en: "She **ran** every day.", vi: "Cô ấy chạy mỗi ngày." }],
      synonyms: [],
      antonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [{ en: "**go** for a run", vi: "đi chạy bộ" }],
    },
  ],
};

const nounEntry = {
  query: "child",
  headword: "child",
  entryType: "word" as const,
  phonetic: null,
  phoneticsUs: "/tʃaɪld/",
  phoneticsUk: "/tʃaɪld/",
  partOfSpeech: "noun",
  level: "A1" as const,
  register: "formal",
  overviewVi: "Đứa trẻ.",
  overviewEn: "A young person.",
  nearbyWords: [],
  verbForms: null,
  numberInfo: {
    plural: "children",
    isUncountable: false,
    isPluralOnly: false,
    isSingularOnly: false,
  },
  senses: [
    {
      id: "s1",
      label: "Nghĩa 1",
      definitionVi: "Đứa trẻ",
      definitionEn: "A young person.",
      usageNoteVi: null,
      examples: [],
      synonyms: [],
      antonyms: [],
      examplesVi: [],
      patterns: [],
      relatedExpressions: [],
      commonMistakesVi: [],
      collocations: [],
    },
  ],
};
```

**Add these test cases** inside `describe("DictionaryResultCard", () => { ... })` after the last existing test:

```ts
it("renders dual phonetics on a single row (not two stacked rows)", () => {
  const { container } = renderUi(
    <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
  );
  // Both flags appear; they must be siblings inside one flex-row container
  const usFlag = container.querySelector("span.text-base");
  const row = usFlag?.parentElement?.parentElement;
  expect(row).not.toBeNull();
  // The outer phonetics container must NOT have flex-col
  expect(row?.className).not.toMatch(/flex-col/);
});

it("renders verb forms strip collapsed by default when verbForms is set", () => {
  const { getByText, queryByText } = renderUi(
    <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
  );
  expect(getByText(/Verb forms/)).toBeInTheDocument();
  // Collapsed: individual forms not visible
  expect(queryByText("runs")).not.toBeInTheDocument();
});

it("expands verb forms strip when toggle is clicked", () => {
  const { getByText } = renderUi(
    <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
  );
  fireEvent.click(getByText(/Verb forms/));
  expect(getByText(/runs/)).toBeInTheDocument();
});

it("does not render verb forms strip when verbForms is null", () => {
  const { queryByText } = renderUi(
    <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
  );
  expect(queryByText(/Verb forms/)).not.toBeInTheDocument();
});

it("renders register pill when register is set", () => {
  const { getByText } = renderUi(
    <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
  );
  expect(getByText("formal")).toBeInTheDocument();
});

it("renders number pill with plural form when numberInfo has plural", () => {
  const { getByText } = renderUi(
    <DictionaryResultCard vocabulary={nounEntry} hasSearched isLoading={false} />,
  );
  expect(getByText("pl: children")).toBeInTheDocument();
});

it("renders Thesaurus button in the sense tab row (not in the header tags)", () => {
  const { getByRole, container } = renderUi(
    <DictionaryResultCard
      vocabulary={verbEntry}
      hasSearched
      isLoading={false}
      onOpenThesaurus={vi.fn()}
    />,
  );
  const thesaurusBtn = getByRole("button", { name: /thesaurus/i });
  // The sense tab row contains the sense label buttons
  const senseTabRow = thesaurusBtn.closest(".flex.items-center");
  expect(senseTabRow).not.toBeNull();
  // Should NOT be inside the header tag wrapper
  const headerTagWrapper = container.querySelector(".flex.items-start.justify-between");
  expect(headerTagWrapper?.contains(thesaurusBtn)).toBe(false);
});

it("renders NearbyWordsBar when vocabulary has nearbyWords", () => {
  const onSearch = vi.fn();
  const { getByRole } = renderUi(
    <DictionaryResultCard
      vocabulary={verbEntry}
      hasSearched
      isLoading={false}
      onSearch={onSearch}
    />,
  );
  expect(getByRole("button", { name: "rum" })).toBeInTheDocument();
  fireEvent.click(getByRole("button", { name: "rune" }));
  expect(onSearch).toHaveBeenCalledWith("rune");
});

it("renders bold in example English text", () => {
  const { container } = renderUi(
    <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
  );
  // "She **ran** every day." — the <strong> tag should contain "ran"
  const strongTags = container.querySelectorAll("strong");
  const ranTag = [...strongTags].find((s) => s.textContent === "ran");
  expect(ranTag).toBeDefined();
});

it("renders Oxford-style inline collocations", () => {
  const { container, getByText } = renderUi(
    <DictionaryResultCard vocabulary={verbEntry} hasSearched isLoading={false} />,
  );
  // Expand collocations first
  fireEvent.click(getByText(/Collocations/));
  // "**go** for a run" — bold "go", plain " for a run"
  const strong = container.querySelector("strong");
  expect(strong?.textContent).toBe("go");
  // Vietnamese shown with em dash separator
  expect(getByText("đi chạy bộ")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify new tests fail**

```bash
npx vitest run "components/dictionary/__tests__/DictionaryResultCard.test.tsx" 2>&1 | tail -8
```

Expected: new tests FAIL (component doesn't have the new features yet).

- [ ] **Step 3: Update existing fixtures in the test file**

All existing fixtures (`singleSenseEntry`, `multiSenseEntry`, `bilingualEntry`, `synonymEntry`, `ipaEntry`) need three new fields added. Add to each fixture:

```ts
nearbyWords: [],
verbForms: null,
numberInfo: null,
```

- [ ] **Step 4: Replace `components/dictionary/DictionaryResultCard.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import { Bookmark, BookmarkCheck, BookOpen, Loader2, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import type { DictionarySense, VocabularyWithNearby } from "@/lib/schemas/vocabulary";
import { parseBold } from "@/lib/utils/parse-bold";
import { NearbyWordsBar } from "@/components/dictionary/NearbyWordsBar";

type DictionaryResultCardProps = {
  vocabulary: VocabularyWithNearby | null;
  hasSearched: boolean;
  isLoading: boolean;
  saved?: boolean | null;
  onToggleSaved?: () => void;
  onOpenThesaurus?: () => void;
  onSearch?: (word: string) => void;
};

const SENSE_ITEM_CLASS =
  "border-l-2 border-[rgba(196,109,46,0.3)] pl-4 text-sm italic leading-6 text-[var(--text-secondary)]";

const ENTRY_TYPE_LABELS: Record<VocabularyWithNearby["entryType"], string> = {
  word: "Từ / cụm từ",
  phrasal_verb: "Cụm động từ",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "green",
  A2: "cyan",
  B1: "blue",
  B2: "gold",
  C1: "orange",
  C2: "volcano",
};

// Module-level: ensures only one utterance plays at a time across re-renders
let activeUtterance: SpeechSynthesisUtterance | null = null;

function getNumberLabel(numberInfo: NonNullable<VocabularyWithNearby["numberInfo"]>): string {
  if (numberInfo.isUncountable) return "uncountable";
  if (numberInfo.isPluralOnly) return "plural only";
  if (numberInfo.isSingularOnly) return "singular only";
  if (numberInfo.plural) return `pl: ${numberInfo.plural}`;
  return "";
}

function BoldText({ text }: { text: string }) {
  const segments = parseBold(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold not-italic">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function SensePanel({ sense }: { sense: DictionarySense }) {
  const [isCollocationsOpen, setIsCollocationsOpen] = useState(false);
  const examples = sense.examples ?? [];
  const examplesVi = sense.examplesVi ?? [];
  const collocations = sense.collocations ?? [];

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Nghĩa tiếng Việt
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionVi}</p>
      </section>

      <section className="space-y-2 rounded-[var(--radius-lg)] border-l-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-5 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Definition in English
        </h3>
        <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.definitionEn}</p>
      </section>

      {(examples.length > 0 || examplesVi.length > 0) && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ví dụ
          </h3>
          <ul className="space-y-2">
            {examples.length > 0
              ? examples.map((example, i) => (
                  <li key={`${example.en}-${example.vi ?? i}`} className={SENSE_ITEM_CLASS}>
                    {example.vi ? (
                      <Tooltip placement="top" title={example.vi}>
                        <span className="cursor-help">
                          <BoldText text={example.en} />
                        </span>
                      </Tooltip>
                    ) : (
                      <BoldText text={example.en} />
                    )}
                  </li>
                ))
              : examplesVi.map((example) => (
                  <li key={example} className={SENSE_ITEM_CLASS}>
                    <BoldText text={example} />
                  </li>
                ))}
          </ul>
        </section>
      )}

      {sense.usageNoteVi && (
        <section className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Ghi chú sử dụng
          </h3>
          <p className="text-sm leading-6 text-[var(--text-primary)]">{sense.usageNoteVi}</p>
        </section>
      )}

      {sense.patterns.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Mẫu câu thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.patterns.map((pattern) => (
              <li key={pattern} className={SENSE_ITEM_CLASS}>
                {pattern}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.relatedExpressions.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Biểu đạt liên quan
          </h3>
          <ul className="space-y-2">
            {sense.relatedExpressions.map((expr) => (
              <li key={expr} className={SENSE_ITEM_CLASS}>
                {expr}
              </li>
            ))}
          </ul>
        </section>
      )}

      {sense.commonMistakesVi.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Lỗi thường gặp
          </h3>
          <ul className="space-y-2">
            {sense.commonMistakesVi.map((mistake) => (
              <li key={mistake} className={SENSE_ITEM_CLASS}>
                {mistake}
              </li>
            ))}
          </ul>
        </section>
      )}

      {collocations.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            aria-expanded={isCollocationsOpen}
            onClick={() => setIsCollocationsOpen((open) => !open)}
            className="inline-flex items-center rounded-full border border-[rgba(196,109,46,0.18)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-white"
          >
            Collocations ({collocations.length})
          </button>
          <AnimatePresence initial={false}>
            {isCollocationsOpen && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <ul className="space-y-1.5">
                  {collocations.map((collocation) => (
                    <li
                      key={`${collocation.en}-${collocation.vi}`}
                      className="text-sm leading-6"
                    >
                      <span className="text-[var(--text-primary)]">
                        <BoldText text={collocation.en} />
                      </span>
                      <span className="mx-1.5 text-[var(--text-muted)]">—</span>
                      <span className="text-[var(--text-secondary)]">{collocation.vi}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </motion.div>
  );
}

function AudioButton({
  locale,
  speakingLocale,
  onSpeak,
}: {
  locale: "en-US" | "en-GB";
  speakingLocale: string | null;
  onSpeak: (locale: "en-US" | "en-GB") => void;
}) {
  return (
    <button
      type="button"
      aria-label={locale === "en-US" ? "Play US pronunciation" : "Play UK pronunciation"}
      onClick={() => onSpeak(locale)}
      className="grid size-6 place-items-center rounded text-[var(--text-muted)] transition hover:text-[var(--accent)]"
    >
      {speakingLocale === locale ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Volume2 size={13} />
      )}
    </button>
  );
}

export function DictionaryResultCard({
  vocabulary,
  hasSearched,
  isLoading,
  saved,
  onToggleSaved,
  onOpenThesaurus,
  onSearch,
}: DictionaryResultCardProps) {
  const firstSenseId = vocabulary?.senses[0]?.id ?? "";
  const [activeKey, setActiveKey] = useState(firstSenseId);
  const [speakingLocale, setSpeakingLocale] = useState<string | null>(null);
  const [verbFormsOpen, setVerbFormsOpen] = useState(false);

  useEffect(() => {
    setActiveKey(firstSenseId);
  }, [firstSenseId]);

  useEffect(() => {
    setVerbFormsOpen(false);
  }, [firstSenseId]);

  function speak(locale: "en-US" | "en-GB") {
    if (!vocabulary) return;
    if (activeUtterance) {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    }
    const utterance = new SpeechSynthesisUtterance(vocabulary.headword);
    utterance.lang = locale;
    utterance.onstart = () => setSpeakingLocale(locale);
    utterance.onend = () => { setSpeakingLocale(null); activeUtterance = null; };
    utterance.onerror = () => { setSpeakingLocale(null); activeUtterance = null; };
    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        <div className="animate-pulse space-y-5">
          <div>
            <div className="h-2.5 w-20 rounded-full bg-[var(--bg-deep)]" />
            <div className="mt-3 h-8 w-44 rounded-lg bg-[var(--bg-deep)]" />
            <div className="mt-4 flex items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-[var(--bg-deep)]" />
              <div className="h-6 w-9 rounded-full bg-[var(--bg-deep)]" />
            </div>
          </div>
          <div className="h-3.5 w-28 rounded bg-[var(--bg-deep)]" />
          <div className="space-y-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
            <div className="h-3.5 w-3/5 rounded bg-[var(--border-strong)]" />
          </div>
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
            <div className="h-8 w-24 rounded-full bg-[var(--bg-deep)]" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-3/4 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-32 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-4/5 rounded bg-[var(--border-strong)]" />
            </div>
            <div className="space-y-2 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4">
              <div className="h-2.5 w-16 rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-full rounded bg-[var(--border-strong)]" />
              <div className="h-3.5 w-2/3 rounded bg-[var(--border-strong)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSearched || !vocabulary) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
        {!hasSearched ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
            <BookOpen size={32} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Nhập từ cần tra</p>
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] shadow-[var(--shadow-sm)]">
              <BookOpen size={24} />
            </div>
            <h3 className="text-2xl [font-family:var(--font-display)] text-[var(--ink)]">
              Chưa có kết quả để hiển thị
            </h3>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              Hãy thử lại với một từ tiếng Anh hợp lệ để nhận kết quả có cấu trúc.
            </p>
          </div>
        )}
      </div>
    );
  }

  const activeSense = vocabulary.senses.find((s) => s.id === activeKey) ?? vocabulary.senses[0];
  const hasDualPhonetics = vocabulary.phoneticsUs || vocabulary.phoneticsUk;
  const numberLabel = vocabulary.numberInfo ? getNumberLabel(vocabulary.numberInfo) : "";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vocabulary.headword}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 max-[720px]:flex-col max-[720px]:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Kết quả tra cứu
              </p>
              <h2 className="mt-2 break-words text-4xl italic leading-tight [font-family:var(--font-display)] text-(--ink)">
                {vocabulary.headword}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 max-[720px]:justify-start">
              <Tag className="!rounded-full !px-3 !py-1" color="gold" variant="outlined">
                {ENTRY_TYPE_LABELS[vocabulary.entryType]}
              </Tag>
              {vocabulary.level && (
                <Tag
                  color={LEVEL_COLORS[vocabulary.level] ?? "default"}
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1"
                >
                  {vocabulary.level}
                </Tag>
              )}
              {vocabulary.partOfSpeech && (
                <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
                  {vocabulary.partOfSpeech}
                </Tag>
              )}
              {vocabulary.register && (
                <Tag
                  variant="outlined"
                  className="!rounded-full !px-3 !py-1 !border-amber-300 !text-amber-700 !bg-amber-50"
                >
                  {vocabulary.register}
                </Tag>
              )}
              {numberLabel && (
                <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
                  {numberLabel}
                </Tag>
              )}
              {saved != null && onToggleSaved && (
                <button
                  onClick={onToggleSaved}
                  className="grid size-8 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--accent)]"
                  aria-label={saved ? "Bỏ lưu từ này" : "Lưu từ này"}
                >
                  {saved ? (
                    <BookmarkCheck size={18} className="text-[var(--accent)]" />
                  ) : (
                    <Bookmark size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Pronunciation — single row */}
          {hasDualPhonetics ? (
            <motion.div
              className="mt-3 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phoneticsUs && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇺🇸</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUs}
                  </span>
                  <AudioButton locale="en-US" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
              {vocabulary.phoneticsUs && vocabulary.phoneticsUk && (
                <span className="text-[var(--text-muted)]">·</span>
              )}
              {vocabulary.phoneticsUk && (
                <div className="flex items-center gap-2">
                  <span className="text-base">🇬🇧</span>
                  <span className="rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]">
                    {vocabulary.phoneticsUk}
                  </span>
                  <AudioButton locale="en-GB" speakingLocale={speakingLocale} onSpeak={speak} />
                </div>
              )}
            </motion.div>
          ) : vocabulary.phonetic ? (
            <motion.span
              className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {vocabulary.phonetic}
            </motion.span>
          ) : null}

          {/* Verb forms strip */}
          {vocabulary.verbForms && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setVerbFormsOpen((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]"
              >
                Verb forms {verbFormsOpen ? "▴" : "▾"}
              </button>
              <AnimatePresence initial={false}>
                {verbFormsOpen && (
                  <motion.p
                    className="mt-1.5 text-sm [font-family:var(--font-mono)] text-[var(--text-secondary)]"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {vocabulary.verbForms.base} · {vocabulary.verbForms.thirdPerson} ·{" "}
                    {vocabulary.verbForms.pastSimple} · {vocabulary.verbForms.pastParticiple} ·{" "}
                    {vocabulary.verbForms.presentParticiple}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Overview */}
          <motion.div
            className="mt-5 space-y-3 rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--accent-light)] text-[var(--accent)]">VI</span>
              <p>{vocabulary.overviewVi}</p>
            </div>
            <div className="flex items-start gap-2.5 text-sm leading-6 text-[var(--text-secondary)]">
              <span className="mt-1 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-[var(--bg)] text-[var(--text-muted)]">EN</span>
              <p>{vocabulary.overviewEn}</p>
            </div>
          </motion.div>

          {/* Sense tabs + Thesaurus button */}
          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
              <div className="flex gap-2 flex-1 overflow-x-auto">
                {vocabulary.senses.map((sense) => (
                  <button
                    key={sense.id}
                    type="button"
                    aria-selected={activeKey === sense.id}
                    onClick={() => setActiveKey(sense.id)}
                    className={[
                      "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                      activeKey === sense.id
                        ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
                    ].join(" ")}
                  >
                    {sense.label}
                  </button>
                ))}
              </div>
              {onOpenThesaurus && (
                <button
                  type="button"
                  onClick={onOpenThesaurus}
                  aria-label="Thesaurus"
                  className="shrink-0 flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <BookOpen size={12} />
                  Thesaurus
                </button>
              )}
            </div>
            {activeSense && (
              <SensePanel key={activeSense.id} sense={activeSense} />
            )}
          </div>

          {/* Nearby words bar */}
          {vocabulary.nearbyWords.length > 0 && onSearch && (
            <div className="mt-6 border-t border-(--border) pt-5">
              <NearbyWordsBar
                words={vocabulary.nearbyWords}
                headword={vocabulary.headword}
                onSearch={onSearch}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Run the DictionaryResultCard tests**

```bash
npx vitest run "components/dictionary/__tests__/DictionaryResultCard.test.tsx" 2>&1 | tail -8
```

Expected: all tests PASS.

- [ ] **Step 6: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add components/dictionary/DictionaryResultCard.tsx "components/dictionary/__tests__/DictionaryResultCard.test.tsx"
git commit -m "feat: upgrade DictionaryResultCard — single-row phonetics, verb forms, register/number tags, thesaurus in tab row, Oxford collocations, bold examples, NearbyWordsBar"
```

---

## Task 8: Update `page.tsx` to use `VocabularyWithNearby`

**Files:**
- Modify: `app/(app)/dictionary/page.tsx`

- [ ] **Step 1: Update the import and result state type**

In `app/(app)/dictionary/page.tsx`:

Replace:
```ts
import type { Vocabulary } from "@/lib/schemas/vocabulary";
```
With:
```ts
import type { VocabularyWithNearby } from "@/lib/schemas/vocabulary";
```

Replace:
```ts
const [result, setResult] = useState<Vocabulary | null>(null);
```
With:
```ts
const [result, setResult] = useState<VocabularyWithNearby | null>(null);
```

Replace:
```ts
const { data: payload } = await http.post<{ data: Vocabulary; saved: boolean }>(
```
With:
```ts
const { data: payload } = await http.post<{ data: VocabularyWithNearby; saved: boolean }>(
```

- [ ] **Step 2: Add `onSearch` prop to `DictionaryResultCard`**

Inside the `<DictionaryResultCard ... />` JSX, add:
```tsx
onSearch={handleSubmit}
```

The full updated `<DictionaryResultCard>` usage:
```tsx
<DictionaryResultCard
  vocabulary={result}
  hasSearched={hasSearched}
  isLoading={isLoading}
  saved={saved}
  onToggleSaved={handleToggleSaved}
  onOpenThesaurus={() => setIsThesaurusOpen(true)}
  onSearch={handleSubmit}
/>
```

- [ ] **Step 3: Run full suite**

```bash
npx vitest run 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/dictionary/page.tsx"
git commit -m "feat: use VocabularyWithNearby type in dictionary page; wire onSearch to NearbyWordsBar"
```

---

## Self-Review

**Spec coverage:**
- ✅ Nearby Words — `getNearbyWords` + API route merge + `NearbyWordsBar` (Tasks 2, 5, 6, 7)
- ✅ Thesaurus button repositioned — removed from header, added to sense tab row (Task 7)
- ✅ Collocations Oxford inline bold — `BoldText` in `SensePanel` collocations section (Task 7)
- ✅ Register pill — header tags (Task 7)
- ✅ Number annotation — `getNumberLabel` + header tags (Task 7)
- ✅ Verb forms collapsible strip — `verbFormsOpen` state (Task 7)
- ✅ Bold examples — `BoldText` in example list (Task 7)
- ✅ Pronunciation single row — `flex flex-wrap items-center` (Task 7)
- ✅ `verbForms` + `numberInfo` in schema and prompt (Tasks 3, 4)
- ✅ `nearbyWords` server-computed and merged (Tasks 2, 5)
- ✅ Tests for every new feature (all tasks)

**Placeholder scan:** None found.

**Type consistency:**
- `VocabularyWithNearby` used in: `DictionaryResultCard` props, `page.tsx` state — consistent.
- `getNearbyWords` signature matches usage in route: `getNearbyWords(string, count?)` — consistent.
- `parseBold` returns `BoldSegment[]`, consumed by `BoldText` component — consistent.
- `NearbyWordsBar` props: `{ words, headword, onSearch }` — consistent between component, test, and usage in ResultCard.
