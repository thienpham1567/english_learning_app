"use client";

import { findPersona } from "@/lib/chat/personas";

type Props = {
  personaId: string;
  isLoading?: boolean;
};

export function ChatHeader({ personaId, isLoading }: Props) {
  const persona = findPersona(personaId);
  const Avatar = persona.avatar;
  const name = persona.label.split(" —")[0];

  return (
    <div className="z-30 flex h-14 shrink-0 items-center justify-between border-b-2 border-border bg-chat-surface px-4 md:px-6">
      <div key={personaId} className="flex animate-in items-center gap-3 fade-in duration-300">
        {/* Square portrait frame */}
        <div className="grid h-9 w-9 place-items-center overflow-hidden border border-border bg-bg-deep shadow-sm">
          <Avatar size={34} />
        </div>

        <div className="flex flex-col">
          <span className="font-display text-sm font-bold leading-none tracking-tight text-ink">
            {name}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
            <span
              className={`inline-block h-1.5 w-1.5 ${
                isLoading ? "animate-pulse bg-accent" : "bg-success"
              }`}
            />
            <span className={isLoading ? "text-accent" : "text-text-muted"}>
              {isLoading ? "Đang soạn…" : "Online"}
            </span>
            <span className="text-text-muted/60">·</span>
            <span className="text-text-muted">{persona.specialty}</span>
          </span>
        </div>
      </div>

      {/* Session marker */}
      <div className="hidden items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted sm:flex">
        <span className="text-accent">◆</span>
        Live Session
      </div>
    </div>
  );
}
