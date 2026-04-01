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
import type {
  FuelChatMessage,
  FuelToolExecutionOutput,
} from "@/lib/fuel-prices/types";

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

// ── Request Validation ──────────────────────────────────────

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

// ── Error SSE Response ──────────────────────────────────────

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

// ── Agentic Loop ────────────────────────────────────────────

async function runAgenticLoop(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  messages: FuelChatMessage[],
  discordWebhookUrl?: string,
) {
  let currentInput: ResponseInputItem[] = buildFuelChatInput(messages);
  let lastToolCallId: string | null = null;
  let lastToolResultPreview: string | undefined;

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const isLastStep = step === MAX_TOOL_STEPS - 1;

    const response = await openAiClient.responses.create({
      model: openAiConfig.chatModel,
      instructions: FUEL_PRICE_INSTRUCTIONS,
      input: currentInput,
      tools: FUEL_TOOLS,
    });

    const functionCalls = response.output.filter(isFunctionCallItem);

    // ── Final text response (no tool calls) ──
    if (functionCalls.length === 0) {
      const finalText = extractTextFromResponse(response.output);

      if (finalText && lastToolCallId) {
        writeSseEvent(controller, encoder, {
          type: "tool_result",
          toolCallId: lastToolCallId,
          resultMarkdown: finalText,
          resultPreview: lastToolResultPreview,
          finishedAt: new Date().toISOString(),
        });
      }

      writeSseEvent(controller, encoder, {
        type: "run_done",
        finishedAt: new Date().toISOString(),
      });
      return;
    }

    // ── Execute tool calls ──
    const execution = await executeToolCalls(
      functionCalls,
      controller,
      encoder,
      discordWebhookUrl,
    );

    lastToolCallId = execution.lastToolCallId ?? lastToolCallId;
    lastToolResultPreview = execution.lastToolResultPreview ?? lastToolResultPreview;

    // Accumulate input for next iteration
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

// ── Helper: extract text from response output ───────────────

function extractTextFromResponse(
  output: unknown[],
): string {
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

// ── Helper: execute tool calls with SSE status updates ──────

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
  let lastToolResultPreview: string | undefined;

  for (const fc of functionCalls) {
    const args = JSON.parse(fc.arguments || "{}") as Record<string, unknown>;
    const toolMeta = getToolMeta(fc.name);
    const startedAt = new Date().toISOString();

    writeSseEvent(controller, encoder, {
      type: "tool_start",
      toolCallId: fc.call_id,
      tool: fc.name,
      name: toolMeta.name,
      params: args,
      startedAt,
    });

    try {
      const result = await executeFuelTool(fc.name, args, { discordWebhookUrl });
      const finishedAt = new Date().toISOString();
      lastToolCallId = fc.call_id;
      lastToolResultPreview = result.resultPreview;

      for (const line of result.thinking ?? []) {
        writeSseEvent(controller, encoder, {
          type: "tool_thinking",
          toolCallId: fc.call_id,
          message: line,
        });
      }

      for (const source of result.sources ?? []) {
        writeSseEvent(controller, encoder, {
          type: "tool_source",
          toolCallId: fc.call_id,
          source,
        });
      }

      if (result.renderingHint) {
        writeSseEvent(controller, encoder, {
          type: "tool_rendering",
          toolCallId: fc.call_id,
          message: result.renderingHint,
        });
      }

      writeSseEvent(controller, encoder, {
        type: "tool_result",
        toolCallId: fc.call_id,
        resultMarkdown: buildToolResultMarkdown(fc.name, result),
        resultPreview: result.resultPreview,
        finishedAt,
      });

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
    lastToolResultPreview,
  };
}

function getToolMeta(toolName: string) {
  switch (toolName) {
    case "get_fuel_prices":
      return {
        name: "Lấy giá mới nhất",
        summary: "Lấy bảng giá mới nhất từ PVOIL",
      };
    case "send_discord_report":
      return {
        name: "Gửi Discord",
        summary: "Gửi báo cáo giá xăng dầu lên Discord",
      };
    case "compare_fuel_prices":
      return {
        name: "So sánh với snapshot trước",
        summary: "So sánh giá hiện tại với dữ liệu đã lưu trước đó",
      };
    case "calculate_fuel_cost":
      return {
        name: "Tính tiền xăng",
        summary: "Tính chi phí nhiên liệu theo quãng đường và mức tiêu thụ",
      };
    default:
      return {
        name: toolName,
        summary: `Thực thi công cụ ${toolName}`,
      };
  }
}

function buildToolResultMarkdown(
  toolName: string,
  result: FuelToolExecutionOutput,
) {
  const parsed = safeParseJson(result.content);

  if (toolName === "get_fuel_prices") {
    const prices = Array.isArray(parsed?.prices)
      ? parsed.prices.filter(isPriceRow)
      : [];
    if (prices.length === 0) {
      return parsed?.message ? String(parsed.message) : undefined;
    }

    const rows = prices
      .map(
        (price) =>
          `| ${price.name} | ${price.price} ${price.unit ?? ""} |`,
      )
      .join("\n");

    return [
      parsed?.updatedAt ? `Cập nhật lúc ${String(parsed.updatedAt)}.` : null,
      "",
      "| Sản phẩm | Giá |",
      "| --- | ---: |",
      rows,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (toolName === "compare_fuel_prices") {
    const comparison = Array.isArray(parsed?.comparison)
      ? parsed.comparison.filter(isComparisonRow)
      : [];
    if (comparison.length === 0) {
      return parsed?.message ? String(parsed.message) : undefined;
    }

    const rows = comparison
      .map(
        (item) =>
          `| ${item.name} | ${item.currentPrice} | ${item.previousPrice} | ${item.change} |`,
      )
      .join("\n");

    return [
      "| Sản phẩm | Hiện tại | Trước đó | Biến động |",
      "| --- | ---: | ---: | --- |",
      rows,
    ].join("\n");
  }

  if (toolName === "calculate_fuel_cost") {
    return [
      parsed?.fuelType ? `Loại nhiên liệu: **${String(parsed.fuelType)}**` : null,
      parsed?.litersNeeded
        ? `Lượng tiêu thụ ước tính: **${String(parsed.litersNeeded)} lít**`
        : null,
      parsed?.pricePerLiter
        ? `Giá mỗi lít: **${String(parsed.pricePerLiter)}**`
        : null,
      parsed?.totalCost ? `Tổng chi phí: **${String(parsed.totalCost)}**` : null,
      parsed?.note ? String(parsed.note) : null,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (toolName === "send_discord_report") {
    if (parsed?.message) {
      return String(parsed.message);
    }
    if (parsed?.success) {
      return "Đã gửi báo cáo lên Discord.";
    }
  }

  if (parsed?.message) {
    return String(parsed.message);
  }

  return undefined;
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

function isPriceRow(value: unknown): value is {
  name: string;
  price: string;
  unit?: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return typeof row.name === "string" && typeof row.price === "string";
}

function isComparisonRow(value: unknown): value is {
  name: string;
  currentPrice: string;
  previousPrice: string;
  change: string;
} {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.name === "string" &&
    typeof row.currentPrice === "string" &&
    typeof row.previousPrice === "string" &&
    typeof row.change === "string"
  );
}

// ── POST Handler ────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Rate limiting
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
            writeSseEvent(controller, encoder, {
              type: "run_start",
              startedAt: new Date().toISOString(),
            });
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
