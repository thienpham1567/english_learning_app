import type {
  FuelExecutionStep,
  FuelSseEventPayload,
} from "@/lib/fuel-prices/types";

type FuelAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timeline?: FuelExecutionStep[];
};

export function applyFuelSseEvent<T extends FuelAssistantMessage>(
  messages: T[],
  assistantMessageId: string,
  event: FuelSseEventPayload,
): T[] {
  return messages.map((message) => {
    if (message.id !== assistantMessageId || message.role !== "assistant") {
      return message;
    }

    if (event.type === "assistant_delta") {
      return {
        ...message,
        text: message.text + event.delta,
      };
    }

    if (
      event.type === "assistant_start" ||
      event.type === "assistant_done" ||
      event.type === "assistant_error"
    ) {
      return message;
    }

    return {
      ...message,
      timeline: updateTimeline(message.timeline ?? [], event),
    };
  });
}

function updateTimeline(
  timeline: FuelExecutionStep[],
  event: Exclude<
    FuelSseEventPayload,
    | { type: "assistant_start" }
    | { type: "assistant_delta"; delta: string }
    | { type: "assistant_done" }
    | { type: "assistant_error"; message: string }
  >,
) {
  switch (event.type) {
    case "agent_start":
      return upsertTimelineStep(timeline, {
        id: event.agentId,
        kind: "agent",
        name: event.name,
        status: "running",
        summary: event.summary,
        startedAt: event.startedAt,
      });

    case "agent_done":
      return upsertTimelineStep(timeline, {
        id: event.agentId,
        kind: "agent",
        status: "done",
        resultPreview: event.resultPreview,
        finishedAt: event.finishedAt,
      });

    case "agent_error":
      return upsertTimelineStep(timeline, {
        id: event.agentId,
        kind: "agent",
        status: "error",
        error: event.message,
        finishedAt: event.finishedAt,
      });

    case "tool_call":
      return upsertTimelineStep(timeline, {
        id: event.toolCallId,
        parentId: event.agentId,
        kind: "tool",
        name: event.name,
        tool: event.tool,
        status: "running",
        summary: event.summary,
        params: event.params,
        startedAt: event.startedAt,
      });

    case "tool_result":
      return upsertTimelineStep(timeline, {
        id: event.toolCallId,
        parentId: event.agentId,
        kind: "tool",
        name: event.name,
        tool: event.tool,
        status: "done",
        resultPreview: event.resultPreview,
        finishedAt: event.finishedAt,
      });

    case "tool_error":
      return upsertTimelineStep(timeline, {
        id: event.toolCallId,
        parentId: event.agentId,
        kind: "tool",
        name: event.name,
        tool: event.tool,
        status: "error",
        error: event.message,
        finishedAt: event.finishedAt,
      });
  }
}

function upsertTimelineStep(
  timeline: FuelExecutionStep[],
  patch: Partial<FuelExecutionStep> & Pick<FuelExecutionStep, "id" | "kind">,
) {
  const index = timeline.findIndex((step) => step.id === patch.id);

  if (index === -1) {
    const nextStep = {
      name: "",
      status: "pending",
      ...patch,
    } satisfies FuelExecutionStep;

    return [...timeline, nextStep];
  }

  return timeline.map((step, stepIndex) =>
    stepIndex === index ? { ...step, ...patch } : step,
  );
}
