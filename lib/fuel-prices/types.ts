/* ── Shared types for the Fuel Price module ── */

export type FuelChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ToolExecutorOptions = {
  discordWebhookUrl?: string;
};

export type FuelExecutionStatus = "pending" | "running" | "done" | "error";

export type FuelExecutionStep = {
  id: string;
  kind: "agent" | "tool";
  name: string;
  status: FuelExecutionStatus;
  summary?: string;
  params?: Record<string, unknown>;
  resultPreview?: string;
  error?: string;
  parentId?: string;
  tool?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type FuelSseEventPayload =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string }
  | {
      type: "agent_start";
      agentId: string;
      name: string;
      summary?: string;
      startedAt?: string;
    }
  | {
      type: "agent_done";
      agentId: string;
      resultPreview?: string;
      finishedAt?: string;
    }
  | {
      type: "agent_error";
      agentId: string;
      message: string;
      finishedAt?: string;
    }
  | {
      type: "tool_call";
      toolCallId: string;
      agentId: string;
      name: string;
      tool: string;
      summary?: string;
      params?: Record<string, unknown>;
      startedAt?: string;
    }
  | {
      type: "tool_result";
      toolCallId: string;
      agentId: string;
      name: string;
      tool: string;
      resultPreview?: string;
      finishedAt?: string;
    }
  | {
      type: "tool_error";
      toolCallId: string;
      agentId: string;
      name: string;
      tool: string;
      message: string;
      finishedAt?: string;
    };

export type SseEventPayload = FuelSseEventPayload;
