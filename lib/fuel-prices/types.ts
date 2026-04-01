/* ── Shared types for the Fuel Price module ── */

export type FuelChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ToolExecutorOptions = {
  discordWebhookUrl?: string;
};

export type FuelFunctionCallStatus = "running" | "success" | "error";

export type FuelFunctionCall = {
  id: string;
  name: string;
  status: FuelFunctionCallStatus;
  input: Record<string, unknown>;
  output?: unknown;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type FuelExecutionStep = FuelFunctionCall;

export type FuelSseEventPayload =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string }
  | {
      type: "function_call_start";
      callId: string;
      name: string;
      input: Record<string, unknown>;
      startedAt?: string;
    }
  | {
      type: "function_call_result";
      callId: string;
      name: string;
      input: Record<string, unknown>;
      output: unknown;
      finishedAt?: string;
    }
  | {
      type: "function_call_error";
      callId: string;
      name: string;
      input: Record<string, unknown>;
      output?: unknown;
      message: string;
      finishedAt?: string;
    };

export type SseEventPayload = FuelSseEventPayload;
