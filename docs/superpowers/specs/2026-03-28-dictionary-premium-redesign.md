# Dictionary Page Premium Redesign

**Date:** 2026-03-28
**Files:** `components/dictionary/DictionarySearchPanel.tsx`, `components/dictionary/DictionaryResultCard.tsx`

---

## Goal

Elevate the search panel and result card to a premium "elevated light" aesthetic — remove antd Card wrappers, improve typography hierarchy, add richer shadows and editorial spacing. The hero banner on `app/(app)/co-lanh-dictionary/page.tsx` is not changed.

---

## Design

### Shared Card Shell

Both panels drop the antd `Card` component. Replace with:

```tsx
<div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6">
```

`shadow-[var(--shadow-lg)]` provides more lift than the current `shadow-[var(--shadow-md)]`. No border (`border border-[var(--border)]` removed — the shadow alone defines the edge).

---

### Search Panel (`DictionarySearchPanel.tsx`)

**Currently:** Two antd `Card` wrappers — main search card + tips card.

**After:**

**Main search div** — `rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-[1121px]:sticky min-[1121px]:top-6`

- Eyebrow label: unchanged (`Sparkles` icon + "Tra cứu có cấu trúc" in accent)
- Heading: `text-3xl italic [font-family:var(--font-display)] text-(--ink)` (up from `text-2xl`, italic display font)
- Body text: unchanged

**Input** — replace antd `Input` with a native `<input>`:
```tsx
<input
  type="text"
  className="w-full border-b border-(--border) bg-transparent px-1 py-3 text-[15px] text-(--text-primary) outline-none transition-colors placeholder:text-(--text-muted) focus:border-b-2 focus:border-(--accent) disabled:cursor-not-allowed"
  placeholder="Ví dụ: take off"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && onSearch()}
  disabled={isLoading}
  maxLength={80}
  autoComplete="off"
/>
```
Same bottom-border-only style as the sign-in page inputs.

**Button** — replace antd `Button` with a plain `<button>`, full-width pill below the input:
```tsx
<motion.button
  type="button"
  onClick={onSearch}
  disabled={isLoading}
  whileTap={{ scale: 0.97 }}
  className="mt-5 w-full rounded-full bg-(--accent) py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
>
  {isLoading ? "Đang tra cứu..." : "Tra cứu"}
</motion.button>
```
No loading spinner — text change is sufficient.

Character-limit note `mt-4 text-sm text-[var(--text-muted)]`: unchanged.

**Tips div** — `rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 mt-5` (sibling div, not nested card)

- Header row (`BookOpenText` icon + "Mẹo sử dụng"): unchanged
- Each tip: remove the `rounded bg-[var(--bg-deep)] px-4 py-3` box. Replace with:
  ```tsx
  <li className="border-l-2 border-(--accent)/30 pl-4 text-sm leading-6 text-[var(--text-secondary)]">
  ```
  Keeps the staggered motion animation on each `<li>`.

---

### Result Card (`DictionaryResultCard.tsx`)

**Currently:** antd `Card` in loading, empty, and result states. antd `Tabs` for sense switching.

**After:**

#### Loading state

Replace `<Card>` with `<div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">`. Keep the existing `animate-pulse` skeleton markup unchanged inside.

#### Empty state

Replace `<Card>` with `<div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">`.

Simplify the inner content:
```tsx
<div className="flex min-h-[360px] flex-col items-center justify-center gap-3">
  <BookOpen size={32} className="text-[var(--text-muted)]" />
  <p className="text-sm text-[var(--text-muted)]">Nhập từ cần tra</p>
</div>
```
This replaces the icon-circle, large heading, and long description text for the `!hasSearched` state. The `hasSearched && !vocabulary` (no-result) state keeps its existing heading + description but also uses the same `<div>` shell.

#### Result state — outer wrapper

Replace `<Card>` with `<div className="rounded-2xl bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6 min-h-[400px]">`. All existing motion wrapper (`AnimatePresence` + `motion.div`) stays around this div.

#### Result state — headword area

```tsx
<h2 className="mt-2 break-words text-4xl italic leading-tight [font-family:var(--font-display)] text-(--ink)">
  {vocabulary.headword}
</h2>
```
Up from `text-3xl`, add `italic`.

#### Result state — phonetic

Wrap in a pill:
```tsx
<motion.span
  className="mt-3 inline-block rounded bg-[var(--bg-deep)] px-2 py-0.5 text-sm [font-family:var(--font-mono)] text-[var(--accent)]"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.15, duration: 0.3 }}
>
  {vocabulary.phonetic}
</motion.span>
```

#### Result state — tags

Keep antd `Tag` but switch to `variant="outlined"` with `color="gold"` for the entry-type tag. Level tag keeps its `LEVEL_COLORS` mapping with `variant="outlined"`. Bookmark button unchanged.

#### Result state — overview block

Unchanged — the VI/EN overview `bg-[var(--bg-deep)]` block stays as-is.

#### Result state — tabs (sense switcher)

Replace antd `Tabs` with a custom pill-switcher controlled by `useState<string>`:

```tsx
const [activeKey, setActiveKey] = useState(vocabulary.senses[0]?.id ?? "");

<div className="mt-6">
  <div className="flex gap-2 border-b border-(--border) pb-3 mb-5 overflow-x-auto">
    {vocabulary.senses.map((sense) => (
      <button
        key={sense.id}
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
  {vocabulary.senses
    .filter((s) => s.id === activeKey)
    .map((s) => <SensePanel key={s.id} sense={s} />)}
</div>
```

When `vocabulary` changes (new search result), `activeKey` must reset to the first sense. Add:

```tsx
useEffect(() => {
  if (vocabulary) setActiveKey(vocabulary.senses[0]?.id ?? "");
}, [vocabulary?.headword]);
```

#### SensePanel — sections

Each section currently uses `rounded-[var(--radius-lg)] bg-[var(--bg-deep)] px-5 py-4`. Keep that treatment for the definition sections (Nghĩa tiếng Việt, Definition in English). For examples (`Ví dụ`), usage notes, patterns, related expressions, and common mistakes, replace the `bg-[var(--bg-deep)]` box with open spacing:

```tsx
<section className="space-y-2">
  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
    Ví dụ
  </h3>
  <ul className="space-y-2 pl-0">
    {sense.examplesVi.map((example) => (
      <li
        key={example}
        className="border-l-2 border-(--accent)/30 pl-4 text-sm italic leading-6 text-[var(--text-secondary)]"
      >
        {example}
      </li>
    ))}
  </ul>
</section>
```

Same `border-l-2 border-(--accent)/30 pl-4` motif used in the search panel tips — creates visual cohesion.

Definition sections (`definitionVi`, `definitionEn`) keep the `bg-[var(--bg-deep)]` box. Section headings shrink from `text-sm` to `text-xs`.

---

## What Does NOT Change

- Hero banner on `co-lanh-dictionary/page.tsx`
- `app/(app)/co-lanh-dictionary/page.tsx` layout structure (2-column grid, sticky left panel)
- Props interface of both components
- `AnimatePresence` / `motion.div` animation wrappers
- `ENTRY_TYPE_LABELS`, `LEVEL_COLORS` constants
- Bookmark button logic and styling
- VI/EN overview block
- `HELPER_TIPS` content

---

## Test Impact

- `components/dictionary/__tests__/DictionarySearchPanel.test.tsx` — tests that assert antd `Card`, antd `Input`, or antd `Button` class names must be updated to match native `<input>` and `<button>` elements, and plain `div` card shell.
- `components/dictionary/__tests__/DictionaryResultCard.test.tsx` — tests that assert antd `Card` or antd `Tabs` markup must be updated. Tab switching test must drive the new `<button>` pill switcher instead.
