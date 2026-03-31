/* ── Shared types for the Fuel Price module ── */

export type FuelChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ToolExecutorOptions = {
  discordWebhookUrl?: string;
};

export type SseEventPayload =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "tool_status"; tool: string; status: "calling" | "done" }
  | { type: "assistant_error"; message: string };
