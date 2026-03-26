import { buildChatInstructions } from "@/lib/chat/build-chat-instructions";
import { detectLanguage } from "@/lib/chat/detect-language";
import type { ChatMessage } from "@/lib/chat/types";

const MAX_CONTEXT_MESSAGES = 20;

function countConsecutiveVietnameseTurns(messages: ChatMessage[]) {
  const recentUserMessages = messages.filter((message) => message.role === "user");
  let consecutiveVietnameseTurns = 0;

  for (let index = recentUserMessages.length - 1; index >= 0; index -= 1) {
    const language = detectLanguage(recentUserMessages[index].text);

    if (language === "vietnamese") {
      consecutiveVietnameseTurns += 1;
      continue;
    }

    if (language === "english" && consecutiveVietnameseTurns === 0) {
      return 0;
    }

    break;
  }

  return consecutiveVietnameseTurns;
}

export function buildChatRequest(messages: ChatMessage[]) {
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);
  const consecutiveVietnameseTurns =
    countConsecutiveVietnameseTurns(recentMessages);

  return {
    instructions: buildChatInstructions({ consecutiveVietnameseTurns }),
    input: recentMessages.map((message) => ({
      type: "message" as const,
      role: message.role,
      content: [
        {
          type: "input_text" as const,
          text: message.text,
        },
      ],
    })),
  };
}
