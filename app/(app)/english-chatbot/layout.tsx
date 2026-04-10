"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import { ChatConversationProvider } from "@/components/app/english-chatbot/ChatConversationProvider";
import { ConversationList } from "@/components/app/english-chatbot/ConversationList";
import { ChatWindow } from "@/components/app/english-chatbot/ChatWindow";

export default function EnglishChatbotLayout({
  // children is intentionally not rendered: ChatWindow is mounted here directly
  // so its state persists across router.replace() calls during conversation
  // creation. Both child page components return null.
  children: _,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params.conversationId ?? null;

  return (
    <ChatConversationProvider>
      <div
        style={{
          display: "flex",
          height: "calc(100% + 48px)",
          maxHeight: "calc(100% + 48px)",
          minHeight: 0,
          flex: 1,
          margin: -24,
          overflow: "hidden",
        }}
      >
        <ConversationList activeId={activeId} />
        <ChatWindow conversationId={activeId} />
      </div>
    </ChatConversationProvider>
  );
}
