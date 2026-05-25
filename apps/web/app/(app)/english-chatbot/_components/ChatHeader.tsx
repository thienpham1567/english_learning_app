"use client";

import { findPersona } from "@/lib/chat/personas";

type Props = {
  personaId: string;
  isLoading?: boolean;
};

export function ChatHeader({ personaId, isLoading }: Props) {
  const persona = findPersona(personaId);
  const Avatar = persona.avatar;

  return (
    <div
      style={{
        display: "flex",
        height: 56,
        flexShrink: 0,
        alignItems: "center",
        gap: 12,
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "0 16px",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="anim-fade-in"
        key={personaId}
        style={{ display: "flex", alignItems: "center", gap: 12 }}
      >
        <div style={{ position: "relative" }}>
          <Avatar size={28} />
          {/* Online indicator */}
          <div
            style={{
              position: "absolute",
              bottom: -1,
              right: -1,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isLoading ? "var(--accent)" : "var(--success)",
              border: "2px solid var(--surface)",
              animation: isLoading ? "pulse 1.5s infinite" : "none",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: 1.3 }}>
            {persona.label}
          </span>
          <span
            style={{
              fontSize: 11,
              color: isLoading ? "var(--accent)" : "var(--text-muted)",
              transition: "color 0.2s",
            }}
          >
            {isLoading ? "đang trả lời..." : persona.specialty}
          </span>
        </div>
      </div>
    </div>
  );
}
