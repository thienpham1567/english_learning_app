"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tooltip } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

import { useChatConversations } from "@/app/(app)/english-chatbot/_components/ChatConversationProvider";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
  personaId: string;
};

type Props = {
  activeId: string | null;
};

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function truncateTitle(title: string, max = 40): { text: string; truncated: boolean } {
  return title.length > max
    ? { text: title.slice(0, max) + "…", truncated: true }
    : { text: title, truncated: false };
}

export function ConversationList({ activeId }: Props) {
  const router = useRouter();
  const { conversations, deleteConversation } = useChatConversations();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleNew = useCallback(() => {
    router.push("/english-chatbot");
  }, [router]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: 220,
        flexShrink: 0,
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--sidebar-border)",
        background: "var(--sidebar-gradient)",
      }}
    >
      {/* Accent glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "var(--sidebar-glow)",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1, padding: "20px 14px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              display: "grid",
              width: 24,
              height: 24,
              flexShrink: 0,
              placeItems: "center",
              borderRadius: "50%",
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            <TrophyOutlined style={{ fontSize: 13 }} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontStyle: "italic",
              color: "var(--sidebar-text-active)",
              fontFamily: "var(--font-display)",
            }}
          >
            English Tutor
          </span>
        </div>

        <button
          onClick={handleNew}
          style={{
            display: "flex",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: "var(--radius)",
            border: "1px solid var(--sidebar-border)",
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--sidebar-text)",
            background: "transparent",
            cursor: "pointer",
            transition: "background 0.18s, color 0.18s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--sidebar-item-hover)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--sidebar-text-active)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--sidebar-text)";
          }}
        >
          <PlusOutlined style={{ fontSize: 13 }} />
          New chat
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--sidebar-border)", position: "relative", zIndex: 1, margin: "0 14px" }} />

      {/* Conversation list */}
      <div style={{ position: "relative", zIndex: 1, flex: 1, overflowY: "auto", padding: "8px 8px 8px", scrollbarWidth: "none" }}>
        {conversations.length === 0 ? (
          <p style={{ padding: "16px 8px", fontSize: 12, color: "var(--sidebar-text)", opacity: 0.5, textAlign: "center" }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isConfirming = conv.id === confirmingId;
            const { text, truncated } = truncateTitle(conv.title);
            const titleSpan = (
              <span style={{ paddingRight: 20, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
                {text}
              </span>
            );

            if (isConfirming) {
              return (
                <div
                  key={conv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 8,
                    border: "1px solid var(--error)",
                    background: "color-mix(in srgb, var(--error) 10%, transparent)",
                    padding: "10px 12px",
                    marginBottom: 2,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--error)" }}>
                    Xoá?
                  </span>
                  <button
                    onClick={() => {
                      deleteConversation(conv.id);
                      setConfirmingId(null);
                      if (conv.id === activeId) router.push("/english-chatbot");
                    }}
                    style={{
                      display: "grid",
                      width: 24,
                      height: 24,
                      placeItems: "center",
                      borderRadius: 4,
                      color: "var(--error)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    aria-label="Confirm delete"
                  >
                    <CheckOutlined style={{ fontSize: 13 }} />
                  </button>
                  <button
                    onClick={() => setConfirmingId(null)}
                    style={{
                      display: "grid",
                      width: 24,
                      height: 24,
                      placeItems: "center",
                      borderRadius: 4,
                      color: "var(--sidebar-text)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    aria-label="Cancel delete"
                  >
                    <CloseOutlined style={{ fontSize: 13 }} />
                  </button>
                </div>
              );
            }

            return (
              <div key={conv.id} style={{ position: "relative", marginBottom: 1 }} className="conv-item">
                <Link
                  href={`/english-chatbot/${conv.id}`}
                  style={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "column",
                    gap: 3,
                    borderRadius: 8,
                    borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                    padding: "9px 12px",
                    textDecoration: "none",
                    transition: "background 0.18s, color 0.18s",
                    background: isActive ? "var(--sidebar-active-bg)" : "transparent",
                    color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                  }}
                >
                  {truncated ? <Tooltip title={conv.title}>{titleSpan}</Tooltip> : titleSpan}
                  <span style={{ fontSize: 11, color: "var(--sidebar-text)", opacity: 0.55 }}>
                    {formatRelativeTime(conv.updatedAt)}
                  </span>
                </Link>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingId(conv.id);
                  }}
                  className="conv-delete-btn"
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "grid",
                    width: 24,
                    height: 24,
                    placeItems: "center",
                    borderRadius: 4,
                    color: "var(--sidebar-text)",
                    opacity: 0,
                    transition: "opacity 0.2s, color 0.2s",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label="Delete conversation"
                >
                  <DeleteOutlined style={{ fontSize: 12 }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
