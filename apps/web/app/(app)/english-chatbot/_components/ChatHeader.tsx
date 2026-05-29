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
    <div className="flex h-14 shrink-0 items-center justify-between border-b-2 border-border bg-chat-surface px-4 md:px-6 z-30">
      <div className="flex items-center gap-3 animate-in fade-in duration-300" key={personaId}>
        <div className="relative">
          <Avatar size={32} />
          {/* Online indicator dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-chat-bg transition-colors duration-300 ${
              isLoading ? "bg-accent animate-pulse" : "bg-success"
            }`}
          />
        </div>

        <div className="flex flex-col">
          <span className="text-xs font-semibold text-ink leading-tight tracking-wide">
            {persona.label}
          </span>
          <span
            className={`text-[10px] transition-colors duration-300 leading-none mt-0.5 ${
              isLoading ? "text-accent font-medium" : "text-text-muted"
            }`}
          >
            {isLoading ? "typing..." : persona.specialty}
          </span>
        </div>
      </div>
    </div>
  );
}
