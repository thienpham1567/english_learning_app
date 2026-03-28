# Dictionary Result View Upgrade — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Upgrade the dictionary result card with three improvements:
1. Dual US/UK IPA phonetics with flag icons
2. Audio playback buttons (Web Speech API) with loading state and single-playback guard
3. Part of Speech (POS) display near the headword

---

## Schema Changes — `lib/schemas/vocabulary.ts`

Add three nullable fields to `VocabularySchema`. Keep existing `phonetic` field as a fallback for old cache entries.

```ts
phoneticsUs: z.string().nullable(),   // e.g. "/teɪk ɒf/"
phoneticsUk: z.string().nullable(),   // e.g. "/teɪk ɒf/"
partOfSpeech: z.string().nullable(),  // e.g. "phrasal verb", "noun"
phonetic: z.string().nullable(),      // kept — backward compat with cached entries
```

---

## LLM Prompt Changes — `lib/dictionary/prompt.ts`

Add to `buildDictionaryInstructions`:

```
Populate phoneticsUs with the American English IPA transcription (e.g. "/teɪk ɒf/").
Populate phoneticsUk with the British English IPA transcription.
Populate partOfSpeech with the grammatical category (e.g. "phrasal verb", "noun", "adjective").
```

---

## UI Changes — `components/dictionary/DictionaryResultCard.tsx`

### Part of Speech Badge

Render a small muted badge immediately after the entry type / level tags row:

```tsx
{vocabulary.partOfSpeech && (
  <Tag variant="outlined" className="!rounded-full !px-3 !py-1">
    {vocabulary.partOfSpeech}
  </Tag>
)}
```

### Phonetics Block

Replace the single `vocabulary.phonetic` motion span with a dual US/UK block.

**Logic:**
- If both `phoneticsUs` and `phoneticsUk` are null, fall back to rendering `phonetic` as before (single span, no flag/audio).
- If either US or UK is available, render the dual block.

**Dual block layout:**
```
🇺🇸  /tɛɪk ɒf/  🔊
🇬🇧  /teɪk ɒf/  🔊
```

Each row: flag span + IPA text span + audio `<button>`.

### Audio Button Behavior

- Uses `window.speechSynthesis` (Web Speech API).
- A **module-level** `currentUtterance: SpeechSynthesisUtterance | null` ref shared across all instances prevents simultaneous playback: cancel the current utterance before starting a new one.
- Button state: `speakingLocale: "en-US" | "en-GB" | null` — when non-null, show `<Loader2 size={13} className="animate-spin" />` for the active button; idle button shows `<Volume2 size={13} />`.
- On click:
  1. Cancel any in-progress utterance (`speechSynthesis.cancel()`).
  2. Create `new SpeechSynthesisUtterance(vocabulary.headword)` with `lang` set to `"en-US"` or `"en-GB"`.
  3. Set `onstart` → `setSpeakingLocale(locale)`, `onend/onerror` → `setSpeakingLocale(null)`.
  4. `speechSynthesis.speak(utterance)`.

### Backward Compatibility

Old cache entries will have `phoneticsUs: null`, `phoneticsUk: null`, `partOfSpeech: null`. The UI gracefully:
- Falls back to showing `phonetic` if both new phonetic fields are null.
- Omits the POS badge if `partOfSpeech` is null.

---

## Testing

| Area | Coverage |
|------|----------|
| `VocabularySchema` | Parses entries with new fields present; parses old entries with all three null |
| `buildDictionaryInstructions` | Returns prompt string containing "phoneticsUs", "phoneticsUk", "partOfSpeech" |
| `DictionaryResultCard` | Renders dual phonetics block when US/UK present; falls back to single phonetic; POS badge shown/hidden; audio button calls speechSynthesis |

---

## Files Touched

| File | Change |
|------|--------|
| `lib/schemas/vocabulary.ts` | Add `phoneticsUs`, `phoneticsUk`, `partOfSpeech` fields |
| `lib/dictionary/prompt.ts` | Add IPA + POS instructions |
| `components/dictionary/DictionaryResultCard.tsx` | Dual phonetics UI, POS badge, audio buttons |
| `components/dictionary/__tests__/DictionaryResultCard.test.tsx` | Update/add tests |
| `lib/dictionary/__tests__/prompt.test.ts` | Update to assert new prompt lines |
