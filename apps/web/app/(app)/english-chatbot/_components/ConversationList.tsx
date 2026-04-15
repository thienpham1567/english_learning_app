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
        borderRight: "1px solid rgba(255,255,255,0.1)",
        background: "var(--ink)",
      }}
    >
      {/* Grain overlay */}
      <div className="grain-overlay" style={{ opacity: 0.035 }} />

      {/* Header identity row */}
      <div style={{ position: "relative", padding: "20px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div
            style={{
              display: "grid",
              width: 24,
              height: 24,
              flexShrink: 0,
              placeItems: "center",
              borderRadius: "50%",
              background: "var(--accent-light)",
              color: "var(--accent)",
            }}
          >
            <TrophyOutlined style={{ fontSize: 13 }} />
          </div>
          <span
            style={{
              fontSize: 14,
              fontStyle: "italic",
              color: "rgba(255,255,255,0.8)",
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
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "8px 12px",
            fontSize: 14,
            fontWeight: 500,
            color: "rgba(255,255,255,0.7)",
            background: "transparent",
            cursor: "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          <PlusOutlined style={{ fontSize: 15 }} />
          New chat
        </button>
      </div>

      <div style={{ position: "relative", flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
        {conversations.length === 0 ? (
          <p style={{ padding: "12px 8px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeId;
            const isConfirming = conv.id === confirmingId;
            const { text, truncated } = truncateTitle(conv.title);
            const titleSpan = (
              <span style={{ paddingRight: 20, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
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
                    borderRadius: "var(--radius)",
                    border: "1px solid #ef4444",
                    background: "rgba(239,68,68,0.1)",
                    padding: "10px 12px",
                  }}
                >
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#fca5a5" }}>
                    Xoá?
                  </span>
                  <button
                    onClick={() => {
                      deleteConversation(conv.id);
                      setConfirmingId(null);
                      if (conv.id === activeId) {
                        router.push("/english-chatbot");
                      }
                    }}
                    style={{
                      display: "grid",
                      width: 24,
                      height: 24,
                      placeItems: "center",
                      borderRadius: 4,
                      color: "#f87171",
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
                      color: "rgba(255,255,255,0.5)",
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
              <div key={conv.id} style={{ position: "relative" }} className="conv-item">
                <Link
                  href={`/english-chatbot/${conv.id}`}
                  style={{
                    display: "flex",
                    width: "100%",
                    flexDirection: "column",
                    gap: 2,
                    borderRadius: "var(--radius)",
                    borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                    padding: "10px 12px",
                    textAlign: "left",
                    transition: "background 0.2s, color 0.2s",
                    background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                    color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
                    textDecoration: "none",
                  }}
                >
                  {truncated ? <Tooltip title={conv.title}>{titleSpan}</Tooltip> : titleSpan}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
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
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "grid",
                    width: 24,
                    height: 24,
                    placeItems: "center",
                    borderRadius: 4,
                    color: "rgba(255,255,255,0.3)",
                    opacity: 0,
                    transition: "opacity 0.2s, color 0.2s",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label="Delete conversation"
                >
                  <DeleteOutlined style={{ fontSize: 13 }} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
