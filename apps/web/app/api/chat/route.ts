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
const PERSIST_ERROR_MESSAGE =
  "Không lưu được tin nhắn vào lịch sử. Bạn có thể tiếp tục trò chuyện, nhưng lượt này sẽ không xuất hiện khi tải lại.";

type AssistantSseEvent =
  | { type: "assistant_start" }
  | { type: "assistant_delta"; delta: string }
  | { type: "assistant_done" }
  | { type: "assistant_error"; message: string }
  | { type: "assistant_persist_error"; message: string };

function writeSseEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  payload: AssistantSseEvent,
) {
  try {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  } catch {
    // Controller may already be closed if the client aborted — ignore.
  }
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

async function persistExchange(args: {
  conversationId: string;
  userId: string;
  userMessageText: string;
  assistantText: string;
  personaId: string;
}): Promise<void> {
  const [conv] = await db
    .select({ userId: conversation.userId })
    .from(conversation)
    .where(eq(conversation.id, args.conversationId))
    .limit(1);

  if (!conv || conv.userId !== args.userId) return;

  await db.insert(message).values([
    { conversationId: args.conversationId, role: "user", content: args.userMessageText },
    { conversationId: args.conversationId, role: "assistant", content: args.assistantText },
  ]);
  await db
    .update(conversation)
    .set({ updatedAt: new Date(), personaId: args.personaId })
    .where(eq(conversation.id, args.conversationId));
}

async function streamOpenAiToSse(args: {
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
  instructions: string;
  input: ReturnType<typeof buildChatRequest>["input"];
  signal: AbortSignal;
}): Promise<{ fullText: string; doneSent: boolean; streamStarted: boolean }> {
  const { controller, encoder, instructions, input, signal } = args;
  let fullText = "";
  let doneSent = false;
  let streamStarted = false;

  const stream = openAiClient.responses.stream(
    { model: openAiConfig.chatModel, instructions, input },
    { signal },
  );

  writeSseEvent(controller, encoder, { type: "assistant_start" });
  streamStarted = true;

  for await (const event of stream) {
    if (signal.aborted) break;

    if (event.type === "response.output_text.delta" && event.delta) {
      fullText += event.delta;
      writeSseEvent(controller, encoder, { type: "assistant_delta", delta: event.delta });
    }

    if (event.type === "response.completed" && !doneSent) {
      writeSseEvent(controller, encoder, { type: "assistant_done" });
      doneSent = true;
    }

    if ((event.type === "response.failed" || event.type === "error") && !doneSent) {
      throw new Error("OpenAI chat stream failed");
    }
  }

  if (streamStarted && !doneSent && !signal.aborted) {
    writeSseEvent(controller, encoder, { type: "assistant_done" });
    doneSent = true;
  }

  return { fullText, doneSent, streamStarted };
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
    const signal = req.signal;

    return createChatSse(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          let result: Awaited<ReturnType<typeof streamOpenAiToSse>> | null = null;
          try {
            result = await streamOpenAiToSse({ controller, encoder, instructions, input, signal });
          } catch (error) {
            if (!signal.aborted) {
              console.error("Chat API error:", error);
              writeSseEvent(controller, encoder, {
                type: "assistant_error",
                message: CHAT_ERROR_MESSAGE,
              });
            }
          }

          // Persist only on successful completion — don't save half-streamed replies.
          if (
            result?.doneSent &&
            result.fullText &&
            conversationId &&
            session &&
            !signal.aborted
          ) {
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage) {
              try {
                await persistExchange({
                  conversationId,
                  userId: session.user.id,
                  userMessageText: lastUserMessage.text,
                  assistantText: result.fullText,
                  personaId,
                });
              } catch (dbError) {
                console.error("Failed to persist conversation:", dbError);
                writeSseEvent(controller, encoder, {
                  type: "assistant_persist_error",
                  message: PERSIST_ERROR_MESSAGE,
                });
              }
            }
          }

          try {
            controller.close();
          } catch {
            // Already closed.
          }
        },

        cancel() {
          // Client disconnected — AbortSignal on req already fires, and
          // `for await` above exits on the next tick.
        },
      }),
    );
  } catch (error) {
    console.error("Chat API error:", error);
    return createErrorSseResponse();
  }
}
