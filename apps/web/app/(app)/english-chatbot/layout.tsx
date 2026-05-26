"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { Menu, X } from "lucide-react";

import { ChatConversationProvider } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { ConversationList } from "@/app/(app)/english-chatbot/_components/ConversationList";
import { ChatWindow } from "@/app/(app)/english-chatbot/_components/ChatWindow";

export default function EnglishChatbotLayout({
  children: _children,
}: {
  children: ReactNode;
}) {
  const params = useParams<{ conversationId?: string }>();
  const activeId = params.conversationId ?? null;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ChatConversationProvider>
      <div className="relative flex h-[calc(100%+48px)] max-h-[calc(100%+48px)] min-h-0 flex-1 -m-6 overflow-hidden bg-(--chat-bg)">
        
        {/* Desktop sidebar — always visible */}
        <div className="hidden md:block h-full">
          <ConversationList activeId={activeId} />
        </div>

        {/* Mobile sidebar — overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex h-full">
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            />
            {/* Sidebar panel */}
            <div 
              onClick={() => setSidebarOpen(false)}
              className="relative z-10 h-full animate-in slide-in-from-left duration-250 ease-out"
            >
              <ConversationList activeId={activeId} />
            </div>
          </div>
        )}

        {/* Mobile hamburger button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-4 left-4 z-40 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-(--chat-surface)/90 backdrop-blur-md text-(--text-secondary) hover:text-(--ink) transition-all cursor-pointer shadow-md active:scale-95"
          aria-label={sidebarOpen ? "Đóng menu" : "Mở menu"}
        >
          {sidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>

        {/* Main chat window */}
        <ChatWindow conversationId={activeId} />
      </div>
    </ChatConversationProvider>
  );
}
