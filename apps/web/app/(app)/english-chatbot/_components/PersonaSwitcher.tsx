"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  value: string;
  onChange: (personaId: string) => void;
  disabled?: boolean;
};

export function PersonaSwitcher({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePersona = PERSONAS.find((p) => p.id === value) ?? PERSONAS[0];
  const ActiveAvatar = activePersona.avatar;

  function handleSelect(personaId: string) {
    onChange(personaId);
    setOpen(false);
  }

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Switch persona"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-(--chat-surface-hover) border border-transparent hover:border-(--border) transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
          open ? "bg-(--chat-surface-hover) border-(--border) scale-95" : ""
        }`}
      >
        <ActiveAvatar size={28} />
      </button>

      {open && (
        <div className="absolute bottom-11 left-0 z-50 min-w-[210px] rounded-2xl border-2 border-border bg-(--chat-bg) p-1.5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="text-[10px] font-bold text-(--text-muted) uppercase tracking-wider px-3 py-1.5 font-mono">
            Chọn gia sư
          </div>
          <div className="h-px bg-(--border) mx-2 mb-1" />
          
          <div className="space-y-0.5">
            {PERSONAS.map((persona) => {
              const Avatar = persona.avatar;
              const isActive = persona.id === value;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handleSelect(persona.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-accent/10 text-(--ink) font-bold"
                      : "text-(--text-secondary) hover:bg-(--chat-surface-hover) hover:text-(--text-primary)"
                  }`}
                >
                  <div className="p-0.5 rounded-full bg-(--chat-surface)/50 shrink-0">
                    <Avatar size={24} />
                  </div>
                  <span className="flex-1 truncate">{persona.label}</span>
                  {isActive && <Check className="h-3.5 w-3.5 text-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
