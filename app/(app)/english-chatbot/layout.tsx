"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { ChatConversationProvider } from "@/components/app/ChatConversationProvider";
import { ConversationList } from "@/components/app/ConversationList";

export default function EnglishChatbotLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // Extract conversationId from path: /english-chatbot/{id}
  const segments = pathname.split("/").filter(Boolean);
  const activeId = segments.length >= 2 ? segments[1] : null;

  return (
    <ChatConversationProvider>
      <div className="flex h-full max-h-full min-h-0 flex-1 overflow-hidden rounded-2xl border border-(--border) bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.7))] shadow-(--shadow-md)">
        <ConversationList activeId={activeId} />
        {children}
      </div>
    </ChatConversationProvider>
  );
}
