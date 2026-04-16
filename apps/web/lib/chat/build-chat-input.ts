import type { ResponseInputItem } from "openai/resources/responses/responses";

import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";
import { detectLanguage } from "@/lib/chat/detect-language";
import type { ChatMessage } from "@/lib/chat/types";

const MAX_CONTEXT_MESSAGES = 20;
const MAX_CONTEXT_CHARS = 40_000;

export function countConsecutiveVietnameseTurns(messages: ChatMessage[]) {
  const recentUserMessages = messages.filter((message) => message.role === "user");
  let consecutiveVietnameseTurns = 0;

  for (let index = recentUserMessages.length - 1; index >= 0; index -= 1) {
    const language = detectLanguage(recentUserMessages[index].text);

    if (language === "vietnamese") {
      consecutiveVietnameseTurns += 1;
      continue;
    }

    if (language === "english") {
      if (consecutiveVietnameseTurns === 0) return 0;
      break;
    }

    // "mixed" or "unknown": skip without breaking or incrementing the streak
  }

  return consecutiveVietnameseTurns;
}

function buildOpenAiHistoryItem(message: ChatMessage): ResponseInputItem {
  if (message.role === "assistant") {
    return {
      id: message.id.startsWith("msg_") ? message.id : `msg_${message.id}`,
      type: "message",
      role: "assistant",
      status: "completed",
      content: [
        {
          type: "output_text",
          text: message.text,
          annotations: [],
        },
      ],
    };
  }

  return {
    type: "message",
    role: "user",
    content: [
      {
        type: "input_text",
        text: message.text,
      },
    ],
  };
}

function trimByCharBudget(messages: ChatMessage[]): ChatMessage[] {
  let total = messages.reduce((sum, m) => sum + m.text.length, 0);
  let start = 0;
  while (total > MAX_CONTEXT_CHARS && start < messages.length - 1) {
    total -= messages[start].text.length;
    start += 1;
  }
  return start > 0 ? messages.slice(start) : messages;
}

export function buildChatRequest(messages: ChatMessage[], personaId: string) {
  const recentMessages = trimByCharBudget(messages.slice(-MAX_CONTEXT_MESSAGES));
  const consecutiveVietnameseTurns = countConsecutiveVietnameseTurns(recentMessages);

  return {
    instructions: buildChatInstructions({ consecutiveVietnameseTurns, personaId }),
    input: recentMessages.map(buildOpenAiHistoryItem),
  };
}
