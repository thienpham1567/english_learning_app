import { buildChatRequest } from "@/lib/chat/build-chat-input";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import type { ChatMessage } from "@/lib/chat/types";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const CHAT_ERROR_MESSAGE =
  "Cô Minh đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

function writeSseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  payload:
    | { type: "assistant_start" }
    | { type: "assistant_delta"; delta: string }
    | { type: "assistant_done" }
    | { type: "assistant_error"; message: string },
) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

function createErrorSseResponse() {
  const encoder = new TextEncoder();

  return createChatSse(
    new ReadableStream<Uint8Array>({
      start(controller) {
        writeSseEvent(controller, encoder, {
          type: "assistant_error",
          message: CHAT_ERROR_MESSAGE,
        });
        controller.close();
      },
    }),
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.text === "string"
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { messages?: unknown }
      | null;
    const messages = Array.isArray(body?.messages)
      ? body.messages.filter(isChatMessage)
      : [];
    const { instructions, input } = buildChatRequest(messages);
    const encoder = new TextEncoder();

    return createChatSse(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          let streamStarted = false;
          let doneSent = false;

          try {
            const stream = openAiClient.responses.stream({
              model: openAiConfig.chatModel,
              instructions,
              input,
            });

            writeSseEvent(controller, encoder, { type: "assistant_start" });
            streamStarted = true;

            for await (const event of stream) {
              if (event.type === "response.output_text.delta" && event.delta) {
                writeSseEvent(controller, encoder, {
                  type: "assistant_delta",
                  delta: event.delta,
                });
              }

              if (event.type === "response.completed" && !doneSent) {
                writeSseEvent(controller, encoder, { type: "assistant_done" });
                doneSent = true;
              }

              if (
                (event.type === "response.failed" || event.type === "error") &&
                !doneSent
              ) {
                throw new Error("OpenAI chat stream failed");
              }
            }

            if (streamStarted && !doneSent) {
              writeSseEvent(controller, encoder, { type: "assistant_done" });
            }
          } catch (error) {
            console.error("Chat API error:", error);
            writeSseEvent(controller, encoder, {
              type: "assistant_error",
              message: CHAT_ERROR_MESSAGE,
            });
          } finally {
            controller.close();
          }
        },
      }),
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return createErrorSseResponse();
  }
}
