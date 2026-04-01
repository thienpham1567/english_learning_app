import type {
  FuelAssistantRun,
  FuelChatTurn,
  FuelSseEventPayload,
  FuelToolExecutionStep,
} from "@/lib/fuel-prices/types";

function ensureAssistantRun(
  turn: Extract<FuelChatTurn, { role: "assistant" }>,
): FuelAssistantRun {
  return turn.run ?? { status: "pending", tools: [] };
}

export function applyFuelSseEvent(
  turns: FuelChatTurn[],
  assistantMessageId: string,
  event: FuelSseEventPayload,
): FuelChatTurn[] {
  return turns.map((turn) => {
    if (turn.id !== assistantMessageId || turn.role !== "assistant") {
      return turn;
    }

    const run = ensureAssistantRun(turn);
    const nextRun = updateRun(run, event);

    return {
      ...turn,
      run: nextRun,
    };
  });
}

function updateRun(
  run: FuelAssistantRun,
  event: FuelSseEventPayload,
): FuelAssistantRun {
  switch (event.type) {
    case "run_start":
      return {
        ...run,
        status: "running",
        startedAt: event.startedAt ?? run.startedAt,
      };

    case "run_done":
      return {
        ...run,
        status: run.status === "error" ? "error" : "done",
        finishedAt: event.finishedAt ?? run.finishedAt,
      };

    case "run_error":
      return {
        ...run,
        status: "error",
        error: event.message,
        finishedAt: event.finishedAt ?? run.finishedAt,
      };

    case "tool_start": {
      const nextTool: FuelToolExecutionStep = {
        id: event.toolCallId,
        tool: event.tool,
        name: event.name,
        status: "running",
        input: event.input,
        startedAt: event.startedAt,
      };

      return {
        ...run,
        status: "running",
        tools: [...run.tools, nextTool],
      };
    }

    case "tool_result":
      return patchTool(run, event.toolCallId, (tool) => ({
        ...tool,
        status: "done",
        output: event.output ?? tool.output,
        resultMarkdown: event.resultMarkdown ?? tool.resultMarkdown,
        resultPreview: event.resultPreview ?? tool.resultPreview,
        finishedAt: event.finishedAt ?? tool.finishedAt,
      }));

    case "tool_error":
      return patchTool(run, event.toolCallId, (tool) => ({
        ...tool,
        status: "error",
        output: event.output ?? tool.output,
        error: event.message,
        finishedAt: event.finishedAt ?? tool.finishedAt,
      }));
  }
}

function patchTool(
  run: FuelAssistantRun,
  toolCallId: string,
  update: (tool: FuelToolExecutionStep) => FuelToolExecutionStep,
): FuelAssistantRun {
  const index = run.tools.findIndex((tool) => tool.id === toolCallId);

  if (index === -1) {
    return run;
  }

  return {
    ...run,
    tools: run.tools.map((tool, toolIndex) =>
      toolIndex === index ? update(tool) : tool,
    ),
  };
}
