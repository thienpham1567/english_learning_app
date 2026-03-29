"use client";

import { AnimatePresence, motion } from "motion/react";

import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  personaId: string;
};

export function ChatHeader({ personaId }: Props) {
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const Avatar = persona.avatar;

  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-(--border) bg-(--surface)/80 px-4 backdrop-blur-md md:px-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={personaId}
          className="flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <Avatar size={28} />
          <span className="text-sm font-medium text-(--ink)">{persona.label}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
