# Search Autocomplete — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Add autocomplete suggestions to the dictionary search input. Suggestions are fetched from the `vocabularyCache` table (community lookups), debounced at 250ms, and support full keyboard navigation with query highlighting.

---

## Architecture

### New API Route — `GET /api/dictionary/suggestions`

Query param: `q` (string, min 2 chars).

Validation:
- Strip and lowercase `q`.
- Reject if less than 2 chars → return `{ suggestions: [] }`.
- Reject if `q` fails the existing allowed-pattern regex → return `{ suggestions: [] }` (no 400 — silent for autocomplete).

Query:
```ts
db.select({ query: vocabularyCache.query })
  .from(vocabularyCache)
  .where(ilike(vocabularyCache.query, `${q}%`))
  .orderBy(desc(vocabularyCache.expiresAt))
  .limit(6)
```

Response: `{ suggestions: string[] }` — returns at most 6 entries.

No auth required. No rate-limit beyond input validation (short queries return empty).

### UI Changes — `components/dictionary/DictionarySearchPanel.tsx`

No new file. Add autocomplete state and dropdown directly inside `DictionarySearchPanel`.

**New state:**
```ts
const [suggestions, setSuggestions] = useState<string[]>([]);
const [highlightedIndex, setHighlightedIndex] = useState(-1);
const containerRef = useRef<HTMLDivElement>(null);
```

**Debounce:** 250ms via `useEffect` on `value`. Fetch `/api/dictionary/suggestions?q=<value>` when `value.length >= 2`. Clear suggestions when `value.length < 2`.

**Keyboard handling** (attached to the `<input>` `onKeyDown`):
- `ArrowDown`: increment `highlightedIndex` (clamp to `suggestions.length - 1`)
- `ArrowUp`: decrement `highlightedIndex` (clamp to `0`, or `-1` to return focus to input text)
- `Enter`: if `highlightedIndex >= 0`, call `onChange(suggestions[highlightedIndex])` then `onSearch()`; otherwise existing behavior (search current value)
- `Escape`: clear suggestions + reset `highlightedIndex`

**Outside click dismiss:** `mousedown` listener on `document`, comparing `containerRef.current.contains(e.target)`.

**Dropdown rendering:**
```tsx
{suggestions.length > 0 && (
  <ul role="listbox" className="...absolute dropdown styles...">
    {suggestions.map((s, i) => (
      <li
        key={s}
        role="option"
        aria-selected={i === highlightedIndex}
        onMouseDown={(e) => { e.preventDefault(); onChange(s); onSearch(); setSuggestions([]); }}
        className={i === highlightedIndex ? "bg-[var(--surface-hover)]" : ""}
      >
        <HighlightMatch text={s} query={value} />
      </li>
    ))}
  </ul>
)}
```

**`HighlightMatch` inline helper** (defined in the same file, not exported):
- Splits `text` at the prefix match boundary.
- Returns `<span><strong>{matchedPart}</strong>{rest}</span>`.

**After selection:** close dropdown (`setSuggestions([])`), reset `highlightedIndex(-1)`.

The `DictionarySearchPanel` wrapper `<div>` gets `ref={containerRef}` and `position: relative` so the dropdown is positioned correctly.

---

## Testing

| Area | Coverage |
|------|----------|
| `GET /api/dictionary/suggestions` | Returns suggestions for valid prefix; returns `[]` for `q < 2 chars`; returns `[]` for invalid pattern |
| `DictionarySearchPanel` | Suggestions appear after 250ms debounce; ArrowDown/Up changes highlighted item; Enter on highlighted item triggers search; Escape clears; outside click dismisses |

---

## Files Touched

| File | Change |
|------|--------|
| `app/api/dictionary/suggestions/route.ts` | **New** — GET suggestions endpoint |
| `app/api/dictionary/suggestions/__tests__/route.test.ts` | **New** — unit tests |
| `components/dictionary/DictionarySearchPanel.tsx` | Add autocomplete state, dropdown, keyboard nav |
| `components/dictionary/__tests__/DictionarySearchPanel.test.tsx` | Add autocomplete tests |
