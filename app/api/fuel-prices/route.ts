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

  for (const fc of functionCalls) {
    writeSseEvent(controller, encoder, {
      type: "tool_status",
      tool: fc.name,
      status: "calling",
    });

    const args = JSON.parse(fc.arguments || "{}") as Record<string, unknown>;
    const result = await executeFuelTool(fc.name, args, { discordWebhookUrl });

    writeSseEvent(controller, encoder, {
      type: "tool_status",
      tool: fc.name,
      status: "done",
    });

    toolOutputs.push({
      type: "function_call_output",
      call_id: fc.call_id,
      output: result,
    });
  }

  return toolOutputs;
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
