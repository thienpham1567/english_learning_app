import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import { checkRateLimit } from "@/lib/fuel-prices/rate-limiter";
import { writeSseEvent, streamTextChunks } from "@/lib/fuel-prices/sse-helpers";
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
          type: "assistant_error",
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentInput: any[] = buildFuelChatInput(messages);

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    const isLastStep = step === MAX_TOOL_STEPS - 1;

    const response = await openAiClient.responses.create({
      model: openAiConfig.chatModel,
      instructions: FUEL_PRICE_INSTRUCTIONS,
      input: currentInput,
      tools: FUEL_TOOLS,
    });

    const functionCalls = response.output.filter(
      (o) => o.type === "function_call",
    );

    // ── Final text response (no tool calls or last allowed step) ──
    if (functionCalls.length === 0 || isLastStep) {
      const finalText = extractTextFromResponse(response.output);
      if (finalText) {
        await streamTextChunks(controller, encoder, finalText);
      }
      writeSseEvent(controller, encoder, { type: "assistant_done" });
      return;
    }

    // ── Execute tool calls ──
    const toolOutputs = await executeToolCalls(
      functionCalls,
      controller,
      encoder,
      discordWebhookUrl,
    );

    // Accumulate input for next iteration
    currentInput = [
      ...currentInput,
      ...response.output.map((item) => {
        if (item.type === "function_call") {
          return {
            type: "function_call" as const,
            id: item.id,
            call_id: item.call_id,
            name: item.name,
            arguments: item.arguments,
          };
        }
        return item;
      }),
      ...toolOutputs,
    ];
  }
}

// ── Helper: extract text from response output ───────────────

function extractTextFromResponse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any[],
): string {
  let text = "";
  for (const item of output) {
    if (item.type === "message") {
      for (const content of item.content) {
        if (content.type === "output_text") {
          text += content.text;
        }
      }
    }
  }
  return text;
}

// ── Helper: execute tool calls with SSE status updates ──────

async function executeToolCalls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functionCalls: any[],
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  discordWebhookUrl?: string,
) {
  const toolOutputs: Array<{
    type: "function_call_output";
    call_id: string;
    output: string;
  }> = [];

  for (const [index, fc] of functionCalls.entries()) {
    const args = JSON.parse(fc.arguments || "{}") as Record<string, unknown>;
    const agentMeta = getAgentMeta(fc.name);
    const toolMeta = getToolMeta(fc.name);
    const agentId = `agent-${fc.name}-${index + 1}`;
    const startedAt = new Date().toISOString();

    writeSseEvent(controller, encoder, {
      type: "agent_start",
      agentId,
      name: agentMeta.name,
      summary: agentMeta.summary,
      startedAt,
    });

    writeSseEvent(controller, encoder, {
      type: "tool_call",
      toolCallId: fc.call_id,
      agentId,
      name: toolMeta.name,
      tool: fc.name,
      summary: toolMeta.summary,
      params: args,
      startedAt,
    });

    try {
      const result = await executeFuelTool(fc.name, args, { discordWebhookUrl });
      const finishedAt = new Date().toISOString();

      writeSseEvent(controller, encoder, {
        type: "tool_result",
        toolCallId: fc.call_id,
        agentId,
        name: toolMeta.name,
        tool: fc.name,
        resultPreview: summarizeToolResult(fc.name, result),
        finishedAt,
      });

      writeSseEvent(controller, encoder, {
        type: "agent_done",
        agentId,
        resultPreview: agentMeta.donePreview,
        finishedAt,
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: fc.call_id,
        output: result,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể thực thi công cụ.";
      const finishedAt = new Date().toISOString();

      writeSseEvent(controller, encoder, {
        type: "tool_error",
        toolCallId: fc.call_id,
        agentId,
        name: toolMeta.name,
        tool: fc.name,
        message,
        finishedAt,
      });

      writeSseEvent(controller, encoder, {
        type: "agent_error",
        agentId,
        message: `Agent thất bại: ${message}`,
        finishedAt,
      });

      toolOutputs.push({
        type: "function_call_output",
        call_id: fc.call_id,
        output: JSON.stringify({ success: false, error: message }),
      });
    }
  }

  return toolOutputs;
}

function getAgentMeta(toolName: string) {
  switch (toolName) {
    case "get_fuel_prices":
    case "send_discord_report":
      return {
        name: "Trợ lý giá xăng",
        summary:
          toolName === "send_discord_report"
            ? "Chuẩn bị gửi báo cáo giá xăng lên Discord"
            : "Phân tích yêu cầu tra cứu giá mới nhất",
        donePreview:
          toolName === "send_discord_report"
            ? "Đã hoàn tất báo cáo giá xăng cho Discord."
            : "Đã sẵn sàng tổng hợp bảng giá xăng dầu.",
      };
    case "compare_fuel_prices":
      return {
        name: "Trợ lý so sánh biến động",
        summary: "Phân tích biến động giữa dữ liệu hiện tại và snapshot trước",
        donePreview: "Đã sẵn sàng tổng hợp biến động giá xăng dầu.",
      };
    case "calculate_fuel_cost":
      return {
        name: "Trợ lý tính chi phí",
        summary: "Phân tích hành trình và ước tính chi phí nhiên liệu",
        donePreview: "Đã sẵn sàng tổng hợp chi phí chuyến đi.",
      };
    default:
      return {
        name: "Trợ lý giá xăng",
        summary: "Đang xử lý yêu cầu giá xăng dầu",
        donePreview: "Đã xử lý xong yêu cầu giá xăng dầu.",
      };
  }
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

function summarizeToolResult(toolName: string, result: string) {
  const parsed = safeParseJson(result);

  if (toolName === "get_fuel_prices") {
    const count = Array.isArray(parsed?.prices) ? parsed.prices.length : 0;
    if (count > 0) {
      return `${count} loại nhiên liệu đã được cập nhật.`;
    }
  }

  if (toolName === "compare_fuel_prices") {
    const count = Array.isArray(parsed?.comparison) ? parsed.comparison.length : 0;
    if (count > 0) {
      return `${count} mục đã được so sánh với snapshot trước.`;
    }
  }

  if (toolName === "calculate_fuel_cost" && parsed?.totalCost) {
    return `Chi phí ước tính: ${String(parsed.totalCost)} VNĐ.`;
  }

  if (toolName === "send_discord_report") {
    if (parsed?.success) {
      return "Báo cáo đã được gửi lên Discord.";
    }
    if (parsed?.message) {
      return String(parsed.message);
    }
  }

  if (parsed?.message) {
    return String(parsed.message);
  }

  return "Công cụ đã trả kết quả thành công.";
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
            writeSseEvent(controller, encoder, { type: "assistant_start" });
            await runAgenticLoop(controller, encoder, messages, discordWebhookUrl);
          } catch (error) {
            console.error("Fuel price API error:", error);
            writeSseEvent(controller, encoder, {
              type: "assistant_error",
              message: ERROR_MESSAGE,
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
