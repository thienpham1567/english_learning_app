# Interactive Examples & Per-Sense Synonyms

**Date:** 2026-03-28
**Files:**
- `lib/schemas/vocabulary.ts`
- `lib/dictionary/prompt.ts`
- `components/dictionary/DictionaryResultCard.tsx`
- `app/(app)/co-lanh-dictionary/page.tsx`

---

## Goal

Upgrade the dictionary result card with two UX improvements: (1) examples now display in English with a hover tooltip revealing the Vietnamese translation, and (2) each sense gains a clickable synonyms section that triggers a new search for the clicked word.

---

## Code Review Notes (Pre-existing)

- Race condition handling with `latestRequestIdRef` in the page is correct.
- Cache hit-before-LLM is the right approach.
- `examplesVi: string[]` is a schema gap — no English counterpart exists, inconsistent with the `overviewVi`/`overviewEn` paired-field pattern. This feature corrects that.
- LLM prompt is minimal but `strict: true` structured output compensates.
- No client-side deduplication — same-session repeat searches hit the API twice, but the DB cache makes this cheap. Acceptable.

---

## Schema Changes — `lib/schemas/vocabulary.ts`

### Replace `examplesVi` with bilingual `examples`

In `DictionarySense`:

**Remove:** `examplesVi: z.array(z.string()).min(3).max(5)`

**Add:**
```ts
examples: z.array(z.object({ en: z.string(), vi: z.string() })).default([]),
examplesVi: z.array(z.string()).default([]),
```

`examples` is the new primary field. `examplesVi` is retained as optional with `.default([])` so old cached entries that only have `examplesVi` continue to pass Zod validation. The LLM will no longer generate `examplesVi`; old cache entries will regenerate naturally as their TTL expires.

### Add `synonyms` to `DictionarySense`

```ts
synonyms: z.array(z.string()).default([]),
```

3–5 semantically relevant English synonyms per sense. `.default([])` provides backward compat for cached entries that predate this field.

---

## LLM Prompt Changes — `lib/dictionary/prompt.ts`

In `buildDictionaryInstructions()`:

**Remove:**
```
All examples must be Vietnamese only.
Return 3 to 5 Vietnamese examples per sense.
```

**Add:**
```
For each sense, provide 3 to 5 examples. Each example must be a bilingual pair: an English sentence (en) and its Vietnamese translation (vi).
For each sense, provide 3 to 5 semantically relevant English synonyms.
```

---

## UI Changes — `components/dictionary/DictionaryResultCard.tsx`

### `SensePanel` — new props

Add `onSynonymClick: (word: string) => void` to `SensePanel`'s props.

### `SensePanel` — Examples section

Replace the current `examplesVi` list rendering with bilingual rendering from `sense.examples`. Fall back to `sense.examplesVi` if `sense.examples` is empty (backward compat for old cache entries).

When `sense.examples` is empty (old cache entry), fall back to rendering `sense.examplesVi` as plain strings with no icon and no tooltip — same `SENSE_ITEM_CLASS` list item, text only.

When `sense.examples` is non-empty (new cache entry), each example `<li>` keeps the existing `SENSE_ITEM_CLASS` styling. Inside, render:

```tsx
<span className="flex items-baseline gap-1.5">
  <span>{example.en}</span>
  {example.vi && (
    <Tooltip placement="top" title={example.vi}>
      <span className="inline-flex shrink-0 cursor-default items-center text-[var(--text-muted)] transition hover:text-[var(--accent)]">
        <Languages size={13} />
      </span>
    </Tooltip>
  )}
</span>
```

`Languages` icon from lucide-react. The tooltip wraps only the icon, not the sentence. No tooltip rendered if `example.vi` is absent.

### `SensePanel` — Synonyms section

Render after the examples section and before usage notes. Hidden when `sense.synonyms` is empty or not present.

```tsx
{sense.synonyms && sense.synonyms.length > 0 && (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
      Từ đồng nghĩa
    </h3>
    <div className="flex flex-wrap gap-2">
      {sense.synonyms.map((synonym) => (
        <button
          key={synonym}
          type="button"
          onClick={() => onSynonymClick(synonym)}
          className="rounded-full border border-(--border) bg-transparent px-3 py-1 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          {synonym}
        </button>
      ))}
    </div>
  </section>
)}
```

### `DictionaryResultCard` — new prop

Add `onSynonymClick: (word: string) => void` to `DictionaryResultCardProps`. Pass it through to `SensePanel`.

---

## Page Changes — `app/(app)/co-lanh-dictionary/page.tsx`

Add `handleSynonymClick`:

```ts
const handleSynonymClick = (word: string) => {
  setQuery(word);
  // Trigger search directly — reuse handleSearch logic but with explicit word
};
```

Because `handleSearch` reads from the `query` state (which is async to update), call the API directly with the word rather than relying on the `query` state having updated. The cleanest pattern:

Extract a `searchFor(word: string)` function from the existing `handleSearch` logic that accepts an explicit word parameter. `handleSearch` calls `searchFor(query)`. `handleSynonymClick` calls `setQuery(word)` then `searchFor(word)`.

Pass `onSynonymClick={handleSynonymClick}` to `DictionaryResultCard`.

---

## What Does NOT Change

- `DictionarySearchPanel` — no changes
- Hero banner on the dictionary page
- Tab switcher, overview block, header area in `DictionaryResultCard`
- `classifyDictionaryEntry`, `normalizeDictionaryQuery`, API route, DB schema
- Any other page or component

---

## Test Impact

- `components/dictionary/__tests__/DictionaryResultCard.test.tsx` — update fixtures to use `examples: [{ en, vi }]` instead of `examplesVi`. Add tests for: synonym pills render, synonym pill click calls `onSynonymClick`, English example text visible, tooltip icon present when `vi` is non-empty.
- No changes needed to `DictionarySearchPanel` tests.
- `app/(app)/co-lanh-dictionary/__tests__/page.test.tsx` — may need `onSynonymClick` prop added to mock if component renders `DictionaryResultCard` directly.
