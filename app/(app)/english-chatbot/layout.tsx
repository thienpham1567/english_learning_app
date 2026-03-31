"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";

import { ChatConversationProvider } from "@/components/app/ChatConversationProvider";
import { ConversationList } from "@/components/app/ConversationList";
import { ChatWindow } from "@/components/app/ChatWindow";

export default function EnglishChatbotLayout({
  children: _,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params.conversationId ?? null;

  return (
    <ChatConversationProvider>
      <div className="flex h-full max-h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
        <ConversationList activeId={activeId} />
        <ChatWindow conversationId={activeId} />
      </div>
    </ChatConversationProvider>
  );
}
