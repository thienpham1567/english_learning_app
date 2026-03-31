"use client";

import { use } from "react";
import { ChatWindow } from "@/components/app/ChatWindow";

type Props = {
  params: Promise<{ conversationId: string }>;
};

export default function ConversationPage({ params }: Props) {
  const { conversationId } = use(params);
  return <ChatWindow conversationId={conversationId} />;
}
