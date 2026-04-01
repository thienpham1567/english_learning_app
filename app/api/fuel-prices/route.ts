import { headers } from "next/headers";
import type {
  ResponseFunctionToolCallOutputItem,
  ResponseInputItem,
} from "openai/resources/responses/responses";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import { checkRateLimit } from "@/lib/fuel-prices/rate-limiter";
import { writeSseEvent } from "@/lib/fuel-prices/sse-helpers";
import {
  FUEL_TOOLS,
  FUEL_PRICE_INSTRUCTIONS,
  executeFuelTool,
  buildFuelChatInput,
} from "@/lib/fuel-prices/tools";
import type { FuelChatMessage } from "@/lib/fuel-prices/types";

const MAX_TOOL_STEPS = 5;

const ERROR_MESSAGE =
  "Cô Kiều đang bị lỗi kỹ thuật rồi 😵 Thử lại sau nha!";

type ResponseFunctionCall = {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
};

type ResponseOutputText = {
  type: "output_text";
  text: string;
};

type ResponseMessage = {
  type: "message";
  content: ResponseOutputText[];
};

type FuelChatRequestBody = {
  messages?: unknown;
  discordWebhookUrl?: string;
};

function isFuelChatMessage(value: unknown): value is FuelChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant") && typeof m.text === "string"
  );
}

function parseRequestBody(body: FuelChatRequestBody | null) {
  const messages = Array.isArray(body?.messages)
    ? body.messages.filter(isFuelChatMessage)
    : [];

  const discordWebhookUrl = body?.discordWebhookUrl?.trim() || undefined;

  return { messages, discordWebhookUrl };
}

function createErrorSseResponse(message: string) {
  const encoder = new TextEncoder();
  return createChatSse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        writeSseEvent(controller, encoder, {
          type: "run_error",
          message,
        });
        controller.close();
      },
    }),
  );
}

async function runAgenticLoop(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  messages: FuelChatMessage[],
  discordWebhookUrl?: string,
) {
  let currentInput: ResponseInputItem[] = buildFuelChatInput(messages);
  let lastToolCallId: string | null = null;

  writeSseEvent(controller, encoder, {
    type: "run_start",
    startedAt: new Date().toISOString(),
  });

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const isLastStep = step === MAX_TOOL_STEPS - 1;

    const response = await openAiClient.responses.create({
      model: openAiConfig.chatModel,
      instructions: FUEL_PRICE_INSTRUCTIONS,
      input: currentInput,
      tools: FUEL_TOOLS,
    });

    const functionCalls = response.output.filter(isFunctionCallItem);

    if (functionCalls.length === 0) {
      const finalText = extractTextFromResponse(response.output);

      if (finalText && lastToolCallId) {
        writeSseEvent(controller, encoder, {
          type: "tool_result",
          toolCallId: lastToolCallId,
          resultMarkdown: finalText,
          finishedAt: new Date().toISOString(),
        });
      }

      writeSseEvent(controller, encoder, {
        type: "run_done",
        finishedAt: new Date().toISOString(),
      });
      return;
    }

    const execution = await executeToolCalls(
      functionCalls,
      controller,
      encoder,
      discordWebhookUrl,
    );

    lastToolCallId = execution.lastToolCallId ?? lastToolCallId;

    currentInput = [
      ...currentInput,
      ...functionCalls.map(
        (item): ResponseInputItem => ({
          type: "function_call",
          id: item.id,
          call_id: item.call_id,
          name: item.name,
          arguments: item.arguments,
        }),
      ),
      ...execution.toolOutputs,
    ];

    if (isLastStep) {
      writeSseEvent(controller, encoder, {
        type: "run_error",
        message: "AI cần thêm bước xử lý nhưng đã chạm giới hạn tool steps.",
        finishedAt: new Date().toISOString(),
      });
      return;
    }
  }
}

function extractTextFromResponse(output: unknown[]): string {
  let text = "";
  for (const item of output) {
    if (!isMessageItem(item)) continue;

    for (const content of item.content) {
      if (content.type === "output_text") {
        text += content.text;
      }
    }
  }
  return text;
}

async function executeToolCalls(
  functionCalls: ResponseFunctionCall[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  discordWebhookUrl?: string,
) {
  const toolOutputs: Array<{
    type: ResponseFunctionToolCallOutputItem["type"];
    call_id: string;
    output: ResponseFunctionToolCallOutputItem["output"];
  }> = [];
  let lastToolCallId: string | null = null;

  for (const fc of functionCalls) {
    const args = JSON.parse(fc.arguments || "{}") as Record<string, unknown>;
    const startedAt = new Date().toISOString();

    writeSseEvent(controller, encoder, {
      type: "tool_start",
      toolCallId: fc.call_id,
      tool: fc.name,
      name: getFunctionName(fc.name),
      input: args,
      startedAt,
    });

    try {
      const result = await executeFuelTool(fc.name, args, { discordWebhookUrl });
      const finishedAt = new Date().toISOString();
      const parsedOutput = safeParseJson(result.content) ?? { raw: result.content };

      writeSseEvent(controller, encoder, {
        type: "tool_result",
        toolCallId: fc.call_id,
        output: parsedOutput,
        resultPreview: result.resultPreview,
        finishedAt,
      });

      lastToolCallId = fc.call_id;

      toolOutputs.push({
        type: "function_call_output",
        call_id: fc.call_id,
        output: result.content,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể thực thi công cụ.";
      const finishedAt = new Date().toISOString();

      writeSseEvent(controller, encoder, {
        type: "tool_error",
        toolCallId: fc.call_id,
        message,
        output: { success: false, message },
        finishedAt,
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: fc.call_id,
        output: JSON.stringify({ success: false, error: message }),
      });
    }
  }

  return {
    toolOutputs,
    lastToolCallId,
  };
}

function getFunctionName(toolName: string) {
  switch (toolName) {
    case "get_fuel_prices":
      return "gia_xang";
    case "send_discord_report":
      return "send_discord_message_via_webhook";
    case "compare_fuel_prices":
      return "so_sanh_gia_xang";
    case "calculate_fuel_cost":
      return "tinh_chi_phi_xang";
    default:
      return toolName;
  }
}

function safeParseJson(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function isFunctionCallItem(value: unknown): value is ResponseFunctionCall {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    item.type === "function_call" &&
    typeof item.id === "string" &&
    typeof item.call_id === "string" &&
    typeof item.name === "string" &&
    typeof item.arguments === "string"
  );
}

function isMessageItem(value: unknown): value is ResponseMessage {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    item.type === "message" &&
    Array.isArray(item.content) &&
    item.content.every(isOutputTextItem)
  );
}

function isOutputTextItem(value: unknown): value is ResponseOutputText {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return item.type === "output_text" && typeof item.text === "string";
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const rateCheck = checkRateLimit(session.user.id);
    if (!rateCheck.allowed) {
      return createErrorSseResponse(
        `Ôi, con hỏi nhanh quá! 😅 Chờ ${Math.ceil((rateCheck.retryAfterMs ?? 5000) / 1000)} giây rồi hỏi lại nha.`,
      );
    }

    const body = (await req.json().catch(() => null)) as FuelChatRequestBody | null;
    const { messages, discordWebhookUrl } = parseRequestBody(body);

    if (messages.length === 0) {
      return new Response("No messages provided", { status: 400 });
    }

    const encoder = new TextEncoder();

    return createChatSse(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            await runAgenticLoop(controller, encoder, messages, discordWebhookUrl);
          } catch (error) {
            console.error("Fuel price API error:", error);
            writeSseEvent(controller, encoder, {
              type: "run_error",
              message: ERROR_MESSAGE,
              finishedAt: new Date().toISOString(),
            });
          } finally {
            controller.close();
          }
        },
      }),
    );
  } catch (error) {
    console.error("Fuel price API error:", error);
    return createErrorSseResponse(ERROR_MESSAGE);
  }
}
