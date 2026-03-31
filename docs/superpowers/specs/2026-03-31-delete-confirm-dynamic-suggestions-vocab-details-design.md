# Delete Confirmation, Dynamic Suggestions & Vocabulary View Details

**Date:** 2026-03-31

---

## Feature 1: Inline Delete Confirmation (ConversationList)

### Problem
Clicking the trash icon on a conversation deletes it immediately with no confirmation. Accidental deletions cannot be prevented.

### Design
When the user clicks the delete (Trash2) button on a conversation row, the row transforms in-place to show a confirmation state:

- The conversation title/preview is replaced with the text **"Xoá?"** and two icon buttons: checkmark (confirm delete) and X (cancel).
- The row background shifts to a subtle red tint (`bg-red-500/10` or similar) to signal a destructive action.
- Confirming calls `deleteConversation(id)` and redirects if the deleted conversation was active (existing behavior).
- Cancelling (X button, clicking outside, or pressing Escape) restores the row to its normal state.
- Only one row can be in the "confirming" state at a time — opening confirmation on another row cancels the previous one.

### Implementation

**File:** `components/app/ConversationList.tsx`

- Add a `confirmingId: string | null` state.
- In the conversation `map`, when `conv.id === confirmingId`, render the confirmation UI instead of the normal row content.
- The confirm button calls `deleteConversation(conv.id)` and resets `confirmingId`.
- The cancel button (and an `onBlur`/click-outside handler) resets `confirmingId` to `null`.
- Keyboard: Escape resets `confirmingId` to `null`.

**No new components or files needed.** This is a conditional render within the existing list.

### Tests
- Clicking delete shows confirmation UI (text "Xoá?" visible, confirm/cancel buttons present).
- Clicking confirm calls `deleteConversation`.
- Clicking cancel restores normal row.
- Only one row shows confirmation at a time.

---

## Feature 2: Dynamic Suggestions per Persona

### Problem
The `SUGGESTED` prompts in `ChatWindow` are hardcoded and do not change based on the active persona/mode.

### Design
Each persona defines a pool of ~8-10 suggested prompts. When the empty chat state is shown, 4 prompts are randomly sampled from the active persona's pool. The selection re-randomizes when the persona changes.

### Data Shape

Add a `suggestions` field to the `Persona` type:

```ts
export type Persona = {
  id: string;
  label: string;
  avatar: ComponentType<{ size?: number }>;
  buildInstructions: (input: PersonaInstructionInput) => string;
  suggestions: { text: string; icon: ComponentType<LucideProps> }[];
};
```

### Suggestion Content

**Simon (Native Fluency)** — casual conversation, idioms, slang, pronunciation, everyday English:
- e.g. "Sửa ngữ pháp giúm mình: I goed to school."
- e.g. "Giải thích một từ lóng của người Úc nhé."
- e.g. "'Break a leg' nghĩa là gì vậy?"
- ~8-10 total

**Christine (IELTS Master)** — academic writing, IELTS tasks, band scores, essay structure:
- e.g. "Chấm đoạn Writing Task 2 này theo tiêu chí IELTS."
- e.g. "Cho mình từ vựng học thuật thay cho 'very good'."
- ~8-10 total

**Eddie (TOEIC Master)** — business emails, meetings, workplace vocabulary, TOEIC practice:
- e.g. "Viết email xin nghỉ phép bằng tiếng Anh."
- e.g. "Cho mình một bài luyện TOEIC Part 5."
- ~8-10 total

### Implementation

**File:** `lib/chat/personas.ts`
- Add `suggestions` array to each persona definition.

**File:** `components/app/ChatWindow.tsx`
- Remove the hardcoded `SUGGESTED` constant.
- Add a helper to sample N random suggestions from the persona's pool:
  ```ts
  function sampleSuggestions(persona: Persona, count: number) { ... }
  ```
- Use `useMemo` keyed on `activePersona.id` so suggestions only re-shuffle when the persona changes, not on every render.
- Render the sampled suggestions in the empty chat state (replacing the current `SUGGESTED.map`).

### Tests
- Suggestions change when persona changes.
- Exactly 4 suggestions are shown.
- Suggestions come from the active persona's pool.

---

## Feature 3: "View Details" in VocabularyDetailSheet

### Problem
Users viewing a saved word in the detail sheet have no way to navigate to the full Dictionary page for a deeper lookup.

### Design
Add a **"Tra cứu trong từ điển"** (Look up in Dictionary) button inside the `VocabularyDetailSheet` header area. Clicking it navigates to `/dictionary?q={word}`, which triggers the Dictionary page's auto-search.

### Implementation

**File:** `components/app/VocabularyDetailSheet.tsx`
- Import `useRouter` from `next/navigation`.
- Add a button in the sheet header (near the save/close buttons) with an icon (e.g. `BookOpen` or `ExternalLink` from Lucide).
- On click: `router.push(\`/dictionary?q=\${encodeURIComponent(query)}\`)`.

**No changes to the Dictionary page** — it already reads `?q=` from the URL and auto-searches on mount.

### Tests
- "Tra cứu trong từ điển" button is visible in the detail sheet.
- Clicking it calls `router.push` with the correct `/dictionary?q=...` URL.

---

## Out of Scope
- No changes to the conversation delete API.
- No changes to the Dictionary page.
- No persistence of suggestion randomization across sessions.
