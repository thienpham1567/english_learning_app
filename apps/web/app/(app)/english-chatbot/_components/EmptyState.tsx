"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
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
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 140, damping: 16 },
  },
};

const TOPIC_STARTERS = [
  { emoji: "✈️", label: "Travel", prompt: "Let's practice travel English — I'm planning a trip!", desc: "Plan trips & navigate" },
  { emoji: "💼", label: "Work", prompt: "Help me practice workplace conversations and emails", desc: "Office & meetings" },
  { emoji: "☕", label: "Daily Life", prompt: "Let's have a casual chat about daily routines", desc: "Casual conversations" },
  { emoji: "🎬", label: "Movies", prompt: "Let's discuss movies — recommend me something good!", desc: "Films & entertainment" },
  { emoji: "📝", label: "Grammar", prompt: "Quiz me on common grammar mistakes", desc: "Rules & exercises" },
  { emoji: "🌍", label: "Culture", prompt: "Tell me about cultural differences in English-speaking countries", desc: "Customs & traditions" },
  { emoji: "🍜", label: "Food", prompt: "Let's talk about cooking and favorite foods", desc: "Recipes & dining" },
  { emoji: "📰", label: "News", prompt: "Let's discuss a current event in English", desc: "Current events" },
];

export function EmptyState({ selectedPersonaId, onSelectPersona, onSuggestedPrompt }: Props) {
  const activePersona = PERSONAS.find((p) => p.id === selectedPersonaId) ?? PERSONAS[0];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="m-auto flex max-w-2xl flex-col items-center text-center px-4 py-6"
    >
      {/* Badge */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 mb-3 text-accent bg-accent/5 px-3 py-1 rounded-lg border-2 border-accent/15"
      >
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
          English Tutor
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h2
        variants={itemVariants}
        className="font-display text-2xl md:text-3xl italic font-semibold text-ink tracking-wide"
      >
        What would you like to practice?
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="mt-2 max-w-sm text-sm text-text-secondary leading-relaxed"
      >
        Pick a tutor and topic, or just start typing.
      </motion.p>

      {/* ── Persona Row (compact horizontal) ── */}
      <motion.div
        variants={itemVariants}
        className="mt-6 flex w-full flex-wrap justify-center gap-2"
      >
        {PERSONAS.map((persona) => (
          <CompactPersonaCard
            key={persona.id}
            persona={persona}
            isSelected={persona.id === selectedPersonaId}
            onSelect={() => onSelectPersona(persona.id)}
          />
        ))}
      </motion.div>

      {/* ── Persona-specific prompts ── */}
      <motion.div variants={itemVariants} className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl">
        {activePersona.suggestedPrompts.map((prompt) => (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={prompt}
            onClick={() => onSuggestedPrompt(prompt)}
            className="px-3.5 py-2 rounded-xl border-2 border-border bg-chat-surface text-xs font-semibold text-text-secondary hover:border-accent/40 hover:text-accent hover:bg-accent/5 transition-all cursor-pointer max-w-[280px] truncate"
          >
            {prompt}
          </motion.button>
        ))}
      </motion.div>

      {/* ── Topic grid ── */}
      <motion.div variants={itemVariants} className="mt-6 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono">
          Topics
        </span>
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOPIC_STARTERS.map((topic) => (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              key={topic.label}
              onClick={() => onSuggestedPrompt(topic.prompt)}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-border bg-chat-surface p-3 text-center hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{topic.emoji}</span>
              <span className="text-[11px] font-bold text-ink">{topic.label}</span>
              <span className="text-[10px] text-text-muted leading-tight">{topic.desc}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Compact Persona Card (horizontal pill) ── */
function CompactPersonaCard({
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? "border-accent bg-accent/5 ring-1 ring-accent/30 text-ink shadow-sm"
          : "border-border bg-chat-surface text-text-secondary hover:border-border-strong hover:text-text-primary"
      }`}
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border-2 border-border">
        <Avatar size={32} />
      </div>
      <div className="flex flex-col items-start text-left">
        <span className="text-xs font-bold leading-tight">{persona.label.split(" —")[0]}</span>
        <span className={`text-[9px] font-semibold mt-0.5 ${
          isSelected ? "text-accent" : "text-text-muted"
        }`}>
          {persona.specialty}
        </span>
      </div>
    </motion.button>
  );
}
