"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import type { ConversationItem } from "@/app/(app)/english-chatbot/_components/ConversationList";
import { api } from "@/lib/api-client";

type ChatConversationContextValue = {
  conversations: ConversationItem[];
  setConversations: React.Dispatch<React.SetStateAction<ConversationItem[]>>;
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
};

const ChatConversationContext = createContext<ChatConversationContextValue | null>(null);

export function useChatConversations(): ChatConversationContextValue {
  const ctx = useContext(ChatConversationContext);
  if (!ctx) {
    throw new Error("useChatConversations must be used within ChatConversationProvider");
  }
  return ctx;
}

export function ChatConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.get<ConversationItem[]>("/conversations");
      setConversations(data);
    } catch {
      // non-fatal: thread list just won't show
    }
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(`/conversations/${id}`);
      setConversations((curr) => curr.filter((c) => c.id !== id));
    } catch {
      // Keep the current list if deletion fails.
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  return (
    <ChatConversationContext.Provider
      value={{
        conversations,
        setConversations,
        loadConversations,
        deleteConversation,
      }}
    >
      {children}
    </ChatConversationContext.Provider>
  );
}
