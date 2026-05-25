"use client";

import { Bot } from "lucide-react";

type Props = {
  personaName?: string;
};

export function TypingIndicator({ personaName = "Gia sư" }: Props) {
  return (
    <div
      className="flex items-end gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2 duration-200"
      role="status"
      aria-live="polite"
      aria-label={`${personaName} đang phản hồi`}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        <Bot className="h-4 w-4 text-accent animate-pulse" />
      </div>
      
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-850 bg-slate-900/40 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
