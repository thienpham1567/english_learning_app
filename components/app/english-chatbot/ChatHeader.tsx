"use client";

import { findPersona } from "@/lib/chat/personas";

type Props = {
  personaId: string;
};

export function ChatHeader({ personaId }: Props) {
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
        <Avatar size={28} />
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{persona.label}</span>
      </div>
    </div>
  );
}
