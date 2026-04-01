# Fuel Prices Tool Execution Redesign

**Date:** 2026-04-01
**Files:** `components/app/FuelPriceChat.tsx`, `components/app/fuel-chat/FuelChatParts.tsx`, `hooks/useFuelChat.ts`, `app/api/fuel-prices/route.ts`, `lib/fuel-prices/types.ts`, `lib/fuel-prices/timeline.ts`, `lib/fuel-prices/system-prompt.ts`, `lib/fuel-prices/tools.ts`

---

## Goal

Rework the `/fuel-prices` experience so it behaves like a tool-driven agent run instead of a normal chatbot conversation.

The user message remains as a compact prompt marker. The assistant no longer renders a separate chat bubble with the final answer. Instead, each prompt produces one execution panel that contains the full ordered tool run, and the final rendered output appears inside the `Result` block of the relevant tool card.

This should feel closer to Codex / Antigravity style execution logs:

- no `agent` layer in the UI
- only `tool` cards, shown in execution order
- detailed but friendly execution logs
- source provenance visible inside the tool card
- multi-step tool chains visible in one panel

---

## Product Decisions

### Confirmed interaction model

- Keep the user prompt bubble on the right.
- Replace the assistant bubble with a single `Execution Panel`.
- The panel contains all tool calls for that prompt, in order.
- Remove the current `agent` rows entirely from both data model and UI.
- For `get_fuel_prices`, the rendered markdown table appears inside that tool card's `Result` block.
- If the AI calls multiple tools in sequence, all of them stay visible in the same panel.
- `Source` shows:
  - source name
  - source update time if available
  - source link if available
- `Thinking` is shown as friendly execution logs, not hidden raw chain-of-thought.

### Non-goals

- No split-pane inspector UI.
- No detached assistant markdown bubble below the execution panel.
- No attempt to expose private model reasoning verbatim.
- No change to auth, rate limiting, or route ownership.

---

## UX Design

## Conversation structure

Each turn renders as:

1. user bubble
2. execution panel

The assistant side becomes a run viewer, not a message bubble.

### Execution panel anatomy

Each panel contains:

- panel header
  - run state: `Running`, `Completed`, or `Failed`
  - lightweight timestamp
- ordered list of tool cards

Each tool card contains:

- `Tool`
  - human-readable name such as `Lấy giá mới nhất`
- `Thinking`
  - friendly multi-line execution log
  - example style:
    - `Đang xác định nguồn có dữ liệu mới nhất`
    - `Đã chọn PVOIL vì trả về bảng giá trực tiếp`
    - `Đang chuẩn hóa 5 sản phẩm nhiên liệu`
- `Source`
  - one or more source entries
  - each entry can show source label, update time, and link
- `Rendering`
  - short status about what the AI is composing from the tool output
  - example: `Đang dựng bảng Markdown cho toàn bộ nhiên liệu`
- `Result`
  - final rendered output for that tool
  - markdown table, comparison summary, trip cost breakdown, Discord delivery result, or error state

### Expansion behavior

- All tool cards remain visible after completion.
- A running tool is expanded by default.
- Completed tools stay readable; no auto-collapse.
- Failed tools stay expanded and visually distinct.

### Empty / loading behavior

- Before the first tool starts, show one compact execution shell instead of a typing bubble.
- If the model is preparing the first call, show a lightweight pending state in the panel header.

---

## Data Model

## Turn-level message model

The current assistant message shape couples two things:

- timeline execution
- streamed assistant text

That coupling is what creates the extra bubble.

The redesigned assistant turn should behave like:

```ts
type FuelRunMessage = {
  id: string;
  role: "assistant";
  run: {
    status: "pending" | "running" | "done" | "error";
    tools: FuelToolExecutionStep[];
    startedAt?: string;
    finishedAt?: string;
    error?: string;
  };
};
```

The UI should stop treating assistant output as freeform `text` for this page.

## Tool step model

Replace the current mixed `agent/tool` execution step type with a tool-only shape:

```ts
type FuelToolExecutionStep = {
  id: string;
  tool: string;
  name: string;
  status: "pending" | "running" | "done" | "error";
  thinking: string[];
  rendering?: string;
  sources?: Array<{
    label: string;
    href?: string;
    updatedAt?: string;
  }>;
  params?: Record<string, unknown>;
  resultMarkdown?: string;
  resultPreview?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
};
```

Key point: `resultMarkdown` belongs to the tool card, not to the assistant bubble.

---

## SSE Contract

The current SSE contract is centered on:

- `assistant_delta`
- `agent_*`
- `tool_*`

That no longer matches the target UI. The route should move to a tool-first event model.

### New or revised events

```ts
type FuelSseEventPayload =
  | { type: "run_start"; startedAt?: string }
  | { type: "run_done"; finishedAt?: string }
  | { type: "run_error"; message: string; finishedAt?: string }
  | {
      type: "tool_start";
      toolCallId: string;
      tool: string;
      name: string;
      params?: Record<string, unknown>;
      startedAt?: string;
    }
  | {
      type: "tool_thinking";
      toolCallId: string;
      message: string;
    }
  | {
      type: "tool_source";
      toolCallId: string;
      source: {
        label: string;
        href?: string;
        updatedAt?: string;
      };
    }
  | {
      type: "tool_rendering";
      toolCallId: string;
      message: string;
    }
  | {
      type: "tool_result";
      toolCallId: string;
      resultMarkdown?: string;
      resultPreview?: string;
      finishedAt?: string;
    }
  | {
      type: "tool_error";
      toolCallId: string;
      message: string;
      finishedAt?: string;
    };
```

### Event rules

- `run_start` is emitted when the assistant run begins.
- `tool_start` is emitted once per function call.
- `tool_thinking` may be emitted multiple times for one tool.
- `tool_source` may be emitted multiple times for one tool.
- `tool_rendering` may be emitted while the final answer is being composed.
- `tool_result` closes the tool card with renderable markdown.
- `run_done` closes the panel.
- `run_error` closes the panel when the turn fails before a tool result can be produced.

### Final answer routing

When the model produces its final natural-language answer after one or more tool calls, the server should attach that final text to the most recent relevant tool as `tool_result.resultMarkdown` instead of streaming it as `assistant_delta`.

This is the critical behavior change that removes the extra assistant bubble.

---

## Server Flow

## Route responsibilities

`app/api/fuel-prices/route.ts` should keep the existing looped `responses.create` structure, but the output handling changes:

1. emit `run_start`
2. when the model requests a function:
   - emit `tool_start`
   - emit friendly `tool_thinking` entries before and after execution milestones
   - execute the tool
   - emit `tool_source` entries from normalized tool metadata
3. feed the function output back into the Responses loop
4. when the model returns final text:
   - do not emit `assistant_delta`
   - emit `tool_rendering` for the relevant tool
   - emit `tool_result` with the final markdown
5. emit `run_done`

## Tool metadata normalization

Tool executors should return structured metadata in addition to plain content. At minimum:

```ts
type FuelToolExecutionOutput = {
  content: string;
  thinking?: string[];
  sources?: Array<{
    label: string;
    href?: string;
    updatedAt?: string;
  }>;
  renderingHint?: string;
  resultPreview?: string;
};
```

`get_fuel_prices` should populate `sources` from scraper output so the UI can show provenance without brittle string parsing.

### Friendly logs

Execution logs should be authored server-side from known milestones, not copied from hidden model reasoning.

Examples:

- `Đang kiểm tra nguồn giá xăng hiện có`
- `Đã lấy dữ liệu từ PVOIL`
- `Đang đối chiếu thời điểm cập nhật trên nguồn`
- `Đang chuẩn hóa dữ liệu để hiển thị đủ tất cả loại nhiên liệu`

This preserves the "agentic" feel without exposing raw private reasoning.

---

## Component Design

## `FuelPriceChat.tsx`

- Keep the overall page shell, settings panel, prompt suggestions, and input bar.
- Replace `MessageBubble` assistant rendering with a dedicated execution-panel path.
- User turns remain compact message bubbles.
- Assistant turns render as `FuelExecutionPanel`.

## `FuelChatParts.tsx`

Refactor from nested `agent -> tool` timeline into:

- `FuelExecutionPanel`
- `FuelToolCard`
- `ToolThinkingLog`
- `ToolSourceList`
- `ToolResultBlock`

Remove:

- `FuelExecutionTimeline` agent hierarchy
- `Call Agent` badges
- agent result box

### Visual direction

- Keep the current warm editorial palette so the page still fits the app.
- Move from "chat bubble + debug card" to "clean run ledger".
- Use stronger section labels: `Thinking`, `Source`, `Rendering`, `Result`.
- Give `Result` the highest visual emphasis because it is now the final answer.

---

## Timeline Reducer Changes

`lib/fuel-prices/timeline.ts` should become a run reducer rather than a message-text appender.

Responsibilities:

- create the run on `run_start`
- append/update tool cards by `toolCallId`
- append `thinking` lines in order
- append `sources` without duplicates
- set `rendering`
- set `resultMarkdown`
- set run/tool error states

`assistant_delta` handling should be removed from this page flow once the UI no longer uses assistant text.

---

## Prompting Changes

`lib/fuel-prices/system-prompt.ts` should be updated so the model understands:

- the UI is tool-first, not chat-first
- the final user-visible answer will appear inside the active tool result block
- it should keep the final answer concise and structured for markdown rendering
- it should always include all returned fuel products

The prompt should continue requiring:

- Vietnamese output
- full fuel coverage
- markdown tables
- Discord tool only after user consent

It should stop assuming a conversational "ask follow-up after the table" structure when that would force extra chat-like prose. Follow-up prompts can still exist, but they should be concise and fit inside the tool result.

---

## Error Handling

- If a tool fails, the corresponding tool card shows an error `Result`.
- If the run fails before any tool starts, the execution panel shows a run-level error.
- If the model reaches the max tool step limit, emit a clear terminal result inside the last tool or run error state; do not leave the panel hanging.
- If source metadata is missing, the `Source` block still renders with the available fields instead of disappearing unpredictably.

---

## Testing Strategy

## Reducer tests

Update `lib/fuel-prices/__tests__/timeline.test.ts` to cover:

- tool-only timeline creation
- multiple `tool_thinking` events appended in order
- `tool_source` deduping and accumulation
- final `tool_result.resultMarkdown` replacing the need for assistant text
- run-level and tool-level error states
- multiple tool calls in a single run

## API tests

Add or update route tests for:

- `get_fuel_prices` emitting tool-first SSE events
- final model text being attached to `tool_result`
- no assistant markdown bubble event path for successful runs
- multi-tool sequence such as `get_fuel_prices` -> `send_discord_report`

## Component tests

Add UI coverage for:

- assistant turn renders execution panel, not chat bubble
- no `agent` label appears
- `Result` block renders markdown content from the tool card
- multiple tool cards appear in order
- `Source` renders source label, time, and link
- loading and error states remain visible

---

## Implementation Notes

- Prefer evolving the existing `messages` array rather than inventing a second conversation store.
- The route can keep the existing max tool loop.
- The scraper/tool layer should expose structured source metadata instead of forcing UI parsing from prose.
- This redesign is primarily a data-flow and rendering change; the existing scraper and Discord integrations remain usable.

---

## Out of Scope

- adding new fuel tools
- redesigning the whole app shell
- conversation persistence changes
- exposing raw chain-of-thought
- cross-turn execution inspector outside the current prompt
