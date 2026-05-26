"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { PERSONAS, type Persona } from "@/lib/chat/personas";

type Props = {
  selectedPersonaId: string;
  onSelectPersona: (id: string) => void;
  onSuggestedPrompt: (text: string) => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 14 }
  },
};

export function EmptyState({ selectedPersonaId, onSelectPersona, onSuggestedPrompt }: Props) {
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="m-auto flex max-w-2xl flex-col items-center text-center px-4 py-8"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-2 mb-2 text-accent bg-accent/5 px-3 py-1 rounded-full border border-accent/10">
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-[10px] font-semibold uppercase tracking-widest font-mono">English Chatbot</span>
      </motion.div>

      <motion.h2
        variants={itemVariants}
        className="font-display text-3xl md:text-4xl italic font-semibold text-(--ink) tracking-wide"
      >
        Chọn gia sư để bắt đầu
      </motion.h2>
      
      <motion.p
        variants={itemVariants}
        className="mt-3 max-w-md text-sm text-(--text-secondary) leading-relaxed"
      >
        Mỗi gia sư có chuyên môn và phong cách phản hồi riêng. Hãy chọn người phù hợp nhất để đồng hành cùng bạn.
      </motion.p>

      {/* Persona cards grid */}
      <motion.div
        variants={itemVariants}
        className="mt-8 grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      >
        {PERSONAS.map((persona) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            isSelected={persona.id === selectedPersonaId}
            onSelect={() => onSelectPersona(persona.id)}
          />
        ))}
      </motion.div>

      {/* Suggested prompts */}
      <motion.div
        variants={itemVariants}
        className="mt-10 flex w-full flex-col items-center gap-3"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) font-mono">
          Gợi ý hội thoại
        </span>
        <div className="flex flex-wrap justify-center gap-2 max-w-xl">
          {activePersona.suggestedPrompts.map((prompt) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={prompt}
              onClick={() => onSuggestedPrompt(prompt)}
              className="px-4 py-2 rounded-full border border-(--border) bg-(--chat-surface-hover) text-xs font-semibold text-(--text-secondary) hover:border-(--border-strong) hover:text-(--ink) transition-all cursor-pointer max-w-[280px] truncate shadow-sm"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function PersonaCard({
  persona,
  isSelected,
  onSelect,
}: {
  persona: Persona;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Avatar = persona.avatar;

  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onSelect}
      className={`flex flex-col items-center gap-3.5 rounded-2xl border p-5 text-center transition-all duration-300 cursor-pointer shadow-sm relative ${
        isSelected
          ? "border-accent bg-accent/5 ring-1 ring-accent text-(--ink)"
          : "border-(--border) bg-(--chat-bubble-ai) text-(--text-secondary) hover:border-(--border-strong) hover:bg-(--chat-surface-hover)"
      }`}
    >
      {isSelected && (
        <span className="absolute top-3 right-3 flex h-2 w-2 rounded-full bg-accent" />
      )}
      
      <div className="p-1 rounded-full bg-(--chat-bg)/40">
        <Avatar size={48} />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <span className="text-sm font-semibold text-(--ink) leading-none">
          {persona.label}
        </span>
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide transition-colors ${
            isSelected
              ? "bg-accent text-white"
              : "bg-(--bg-deep) text-(--text-secondary)"
          }`}
        >
          {persona.specialty}
        </span>
      </div>

      <p className="text-xs text-(--text-muted) leading-relaxed mt-1">
        {persona.description}
      </p>
    </motion.button>
  );
}
