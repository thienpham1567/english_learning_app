import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@repo/database";
import { conversation, message } from "@repo/database";
import { buildChatRequest } from "@/lib/chat/build-chat-input";
import { DEFAULT_PERSONA_ID, PERSONA_IDS } from "@/lib/chat/personas";
import { createChatSse } from "@/lib/chat/create-chat-sse";
import type { ChatMessage } from "@/lib/chat/types";
import { openAiClient } from "@/lib/openai/client";
import { openAiConfig } from "@/lib/openai/config";

const CHAT_ERROR_MESSAGE = "Gia sư đang gặp lỗi kỹ thuật. Bạn thử lại sau nhé.";

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
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    (m.role === "user" || m.role === "assistant") &&
    typeof m.text === "string"
  );
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
      conversationId?: unknown;
      personaId?: unknown;
    } | null;

    const messages = Array.isArray(body?.messages) ? body.messages.filter(isChatMessage) : [];

    const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

    const personaId =
      typeof body?.personaId === "string" && PERSONA_IDS.includes(body.personaId)
        ? body.personaId
        : DEFAULT_PERSONA_ID;

    const { instructions, input } = buildChatRequest(messages, personaId);
    const encoder = new TextEncoder();

    return createChatSse(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          let streamStarted = false;
          let doneSent = false;
          let fullAssistantText = "";

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
                fullAssistantText += event.delta;
                writeSseEvent(controller, encoder, {
                  type: "assistant_delta",
                  delta: event.delta,
                });
              }

              if (event.type === "response.completed" && !doneSent) {
                writeSseEvent(controller, encoder, { type: "assistant_done" });
                doneSent = true;
              }

              if ((event.type === "response.failed" || event.type === "error") && !doneSent) {
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

          // Persist conversation after stream is closed.
          // Errors here are logged but never sent as SSE — the client already has the full exchange.
          if (conversationId && session && fullAssistantText && doneSent) {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage) {
              try {
                const [conv] = await db
                  .select({ userId: conversation.userId })
                  .from(conversation)
                  .where(eq(conversation.id, conversationId))
                  .limit(1);

                if (conv && conv.userId === session.user.id) {
                  await db.insert(message).values([
                    {
                      conversationId,
                      role: "user",
                      content: lastUserMessage.text,
                    },
                    {
                      conversationId,
                      role: "assistant",
                      content: fullAssistantText,
                    },
                  ]);
                  await db
                    .update(conversation)
                    .set({ updatedAt: new Date(), personaId })
                    .where(eq(conversation.id, conversationId));
                }
              } catch (dbError) {
                console.error("Failed to persist conversation:", dbError);
              }
            }
          }
        },
      }),
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return createErrorSseResponse();
  }
}
