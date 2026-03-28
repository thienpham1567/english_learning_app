# Conversation Title Truncation

**Date:** 2026-03-28
**File:** `components/app/ConversationList.tsx`

---

## Goal

Truncate conversation titles in the sidebar at 40 characters, appending `…`. Show the full title via an Ant Design `Tooltip` on hover — only when the title was actually truncated.

---

## Design

### Helper function

Add at the top of `ConversationList.tsx`:

```ts
function truncateTitle(title: string, max = 40): { text: string; truncated: boolean } {
  return title.length > max
    ? { text: title.slice(0, max) + "…", truncated: true }
    : { text: title, truncated: false };
}
```

### Title rendering

Replace the existing title `<span>` (currently uses `line-clamp-2 pr-5 text-sm font-medium leading-snug`) with:

```tsx
const { text, truncated } = truncateTitle(conv.title);

const titleNode = (
  <span className="pr-5 text-sm font-medium leading-snug">
    {text}
  </span>
);

{truncated ? (
  <Tooltip title={conv.title}>{titleNode}</Tooltip>
) : (
  titleNode
)}
```

- `line-clamp-2` is removed — single-line truncation via character limit replaces it
- Tooltip fires **only** when `truncated === true`
- `Tooltip` imported from `antd` (already a project dependency)

---

## What Does NOT Change

- Props interface (`conversations`, `activeId`, `onSelect`, `onNew`, `onDelete`)
- `formatRelativeTime` function
- All click handlers and delete button behavior
- Sidebar styling (dark ink background, grain overlay, identity row, item colors)
