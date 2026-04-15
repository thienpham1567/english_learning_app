"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "antd";

import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  value: string;
  onChange: (personaId: string) => void;
  disabled?: boolean;
};

export function PersonaSwitcher({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const activePersona = PERSONAS.find((p) => p.id === value) ?? PERSONAS[0];
  const ActiveAvatar = activePersona.avatar;

  function handleSelect(personaId: string) {
    onChange(personaId);
    setOpen(false);
  }

  const content = (
    <div style={{ minWidth: 220, margin: -12 }}>
      {PERSONAS.map((persona) => {
        const Avatar = persona.avatar;
        const isActive = persona.id === value;
        return (
          <button
            key={persona.id}
            type="button"
            onClick={() => handleSelect(persona.id)}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              textAlign: "left",
              fontSize: 14,
              transition: "background 0.2s",
              background: isActive ? "var(--accent-light)" : "transparent",
              color: "var(--text-primary)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Avatar size={28} />
            <span>{persona.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="topLeft"
      overlayStyle={{ padding: 0 }}
    >
      <button
        type="button"
        aria-label="Switch persona"
        disabled={disabled}
        style={{
          display: "grid",
          width: 36,
          height: 36,
          flexShrink: 0,
          placeItems: "center",
          borderRadius: "50%",
          border: "none",
          background: "transparent",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          transition: "box-shadow 0.2s",
        }}
      >
        <ActiveAvatar size={32} />
      </button>
    </Popover>
  );
}
