"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

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

  useEffect(() => {
    if (!open) return;
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  function handleSelect(personaId: string) {
    onChange(personaId);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Switch persona"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full transition hover:ring-2 hover:ring-(--accent-muted) disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ActiveAvatar size={32} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-[calc(100%+8px)] left-0 z-50 min-w-[220px] overflow-hidden rounded-xl border border-(--border) bg-(--surface) shadow-(--shadow-lg)"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {PERSONAS.map((persona) => {
              const Avatar = persona.avatar;
              const isActive = persona.id === value;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handleSelect(persona.id)}
                  className={[
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-(--surface-hover)",
                    isActive ? "bg-(--accent-light)" : "",
                  ].join(" ")}
                >
                  <Avatar size={28} />
                  <span className="text-(--text-primary)">{persona.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
