"use client";

import { useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { MenuOutlined, CloseOutlined } from "@ant-design/icons";

import { ChatConversationProvider } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";
import { ConversationList } from "@/app/(app)/english-chatbot/_components/ConversationList";
import { ChatWindow } from "@/app/(app)/english-chatbot/_components/ChatWindow";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          position: "relative",
        }}
      >
        {/* Desktop sidebar — always visible */}
        <div className="desktop-only">
          <ConversationList activeId={activeId} />
        </div>

        {/* Mobile sidebar — overlay */}
        {sidebarOpen && (
          <div
            className="mobile-only"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              display: "flex",
            }}
          >
            {/* Backdrop */}
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(2px)",
              }}
            />
            {/* Sidebar panel */}
            <div style={{ position: "relative", zIndex: 1, height: "100%" }} onClick={() => setSidebarOpen(false)}>
              <ConversationList activeId={activeId} />
            </div>
          </div>
        )}

        {/* Mobile hamburger button */}
        <button
          className="mobile-only"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 60,
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
          aria-label={sidebarOpen ? "Đóng menu" : "Mở menu"}
        >
          {sidebarOpen ? <CloseOutlined style={{ fontSize: 14 }} /> : <MenuOutlined style={{ fontSize: 14 }} />}
        </button>

        <ChatWindow conversationId={activeId} />
      </div>
    </ChatConversationProvider>
  );
}
