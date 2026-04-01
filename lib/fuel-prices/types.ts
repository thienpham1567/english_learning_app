/* ── Shared types for the Fuel Price module ── */

export type FuelChatMessage = {
  role: "user" | "assistant";
  text: string;
};

export type ToolExecutorOptions = {
  discordWebhookUrl?: string;
};

export type FuelExecutionStatus = "pending" | "running" | "done" | "error";

export type FuelSourceInfo = {
  label: string;
  href?: string;
  updatedAt?: string;
};

export type FuelToolExecutionStep = {
  id: string;
  tool: string;
  name: string;
  status: FuelExecutionStatus;
  thinking: string[];
  rendering?: string;
  sources: FuelSourceInfo[];
  params?: Record<string, unknown>;
  resultMarkdown?: string;
  resultPreview?: string;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
};

export type FuelAssistantRun = {
  status: FuelExecutionStatus;
  tools: FuelToolExecutionStep[];
  startedAt?: string;
  finishedAt?: string;
  error?: string;
};

export type FuelChatTurn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; run: FuelAssistantRun };

export type FuelToolExecutionOutput = {
  content: string;
  thinking?: string[];
  sources?: FuelSourceInfo[];
  renderingHint?: string;
  resultPreview?: string;
};

export type FuelSseEventPayload =
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
      source: FuelSourceInfo;
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

export type SseEventPayload = FuelSseEventPayload;
