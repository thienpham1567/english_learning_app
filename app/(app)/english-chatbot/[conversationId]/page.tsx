"use client";

import { use } from "react";
import { EnglishChatbotView } from "@/components/app/EnglishChatbotView";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  return <EnglishChatbotView conversationId={conversationId} />;
}
