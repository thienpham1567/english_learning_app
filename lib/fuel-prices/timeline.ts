import type {
  FuelFunctionCall,
  FuelSseEventPayload,
} from "@/lib/fuel-prices/types";

type FuelAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  functionCalls?: FuelFunctionCall[];
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
      functionCalls: updateFunctionCalls(message.functionCalls ?? [], event),
    };
  });
}

function updateFunctionCalls(
  functionCalls: FuelFunctionCall[],
  event: Exclude<
    FuelSseEventPayload,
    | { type: "assistant_start" }
    | { type: "assistant_delta"; delta: string }
    | { type: "assistant_done" }
    | { type: "assistant_error"; message: string }
  >,
) {
  switch (event.type) {
    case "function_call_start":
      return upsertFunctionCall(functionCalls, {
        id: event.callId,
        name: event.name,
        status: "running",
        input: event.input,
        startedAt: event.startedAt,
      });

    case "function_call_result":
      return upsertFunctionCall(functionCalls, {
        id: event.callId,
        name: event.name,
        status: "success",
        input: event.input,
        output: event.output,
        finishedAt: event.finishedAt,
      });

    case "function_call_error":
      return upsertFunctionCall(functionCalls, {
        id: event.callId,
        name: event.name,
        status: "error",
        input: event.input,
        output: event.output,
        error: event.message,
        finishedAt: event.finishedAt,
      });
  }
}

function upsertFunctionCall(
  functionCalls: FuelFunctionCall[],
  patch: Partial<FuelFunctionCall> & Pick<FuelFunctionCall, "id" | "name">,
) {
  const index = functionCalls.findIndex((call) => call.id === patch.id);

  if (index === -1) {
    const nextCall = {
      name: "",
      input: {},
      status: "running",
      ...patch,
    } satisfies FuelFunctionCall;

    return [...functionCalls, nextCall];
  }

  return functionCalls.map((call, callIndex) =>
    callIndex === index ? { ...call, ...patch } : call,
  );
}
