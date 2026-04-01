import type {
  FuelAssistantRun,
  FuelChatMessage,
  FuelChatTurn,
  FuelToolExecutionStep,
} from "@/lib/fuel-prices/types";

export function buildFuelChatHistory(turns: FuelChatTurn[]): FuelChatMessage[] {
  return turns.flatMap<FuelChatMessage>((turn) => {
    if (turn.role === "user") {
      return [{ role: "user", text: turn.text }];
    }

    const text = serializeFuelAssistantRun(turn.run);
    if (!text) {
      return [];
    }

    return [{ role: "assistant", text }];
  });
}

export function serializeFuelAssistantRun(run: FuelAssistantRun): string {
  return run.tools
    .map(serializeToolStep)
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function serializeToolStep(step: FuelToolExecutionStep): string {
  const body = step.resultMarkdown ?? step.resultPreview ?? formatToolError(step.error);
  if (!body) {
    return "";
  }

  return [`[Tool: ${step.name}]`, body].join("\n");
}

function formatToolError(error?: string) {
  return error ? `Lỗi: ${error}` : "";
}
