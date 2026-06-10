"use client";

import {
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  Headphones,
  Mic,
  PenTool,
  Sparkles,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";
import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  onSuggestedPrompt: (text: string) => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 140, damping: 16 },
  },
};

const SKILL_STARTERS = [
  {
    icon: Headphones,
    label: "Listening",
    prompt: "Give me a TOEIC Part 3 listening drill with audio.",
    desc: "Parts 1–4",
  },
  {
    icon: BookOpen,
    label: "Reading",
    prompt: "Drill me on TOEIC Part 5 grammar and vocabulary.",
    desc: "Parts 5–7",
  },
  {
    icon: Mic,
    label: "Speaking",
    prompt: "Let's practice TOEIC Speaking — give me a describe-the-picture task.",
    desc: "Respond by voice",
  },
  {
    icon: PenTool,
    label: "Writing",
    prompt: "Give me a TOEIC Writing opinion-essay prompt and score my answer.",
    desc: "Email & essay",
  },
  {
    icon: Compass,
    label: "Diagnose",
    prompt: "Run a quick 5-question check to estimate my TOEIC level.",
    desc: "Find weak spots",
  },
  {
    icon: FileText,
    label: "Mini-test",
    prompt: "Give me a 10-question TOEIC mini-test across skills.",
    desc: "Mixed practice",
  },
  {
    icon: BarChart3,
    label: "Part 7",
    prompt: "Give me a TOEIC Part 7 reading passage with 4 questions.",
    desc: "Reading comp",
  },
  {
    icon: Timer,
    label: "Strategy",
    prompt: "Teach me time-management strategy for the Reading section.",
    desc: "Test tactics",
  },
];

export function EmptyState({ onSuggestedPrompt }: Props) {
  const coach = PERSONAS[0];
  const Avatar = coach.avatar;

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
        className="flex items-center gap-2 mb-4 text-accent bg-accent/5 px-3 py-1 rounded-lg border-2 border-accent/15"
      >
        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest font-mono">
          {coach.specialty}
        </span>
      </motion.div>

      {/* Coach avatar */}
      <motion.div
        variants={itemVariants}
        className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-border shadow-sm mb-3"
      >
        <Avatar size={64} />
      </motion.div>

      {/* Heading */}
      <motion.h2
        variants={itemVariants}
        className="font-display text-2xl md:text-3xl italic font-semibold text-ink tracking-wide"
      >
        Hi, I&apos;m Aria — your TOEIC coach
      </motion.h2>

      <motion.p
        variants={itemVariants}
        className="mt-2 max-w-md text-sm text-text-secondary leading-relaxed"
      >
        Tell me your target score and which skill to work on, or pick a starter below.
      </motion.p>

      {/* Suggested prompts */}
      <motion.div
        variants={itemVariants}
        className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl"
      >
        {coach.suggestedPrompts.map((prompt) => (
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

      {/* Skill grid */}
      <motion.div variants={itemVariants} className="mt-6 w-full">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted font-mono">
          Skills & Drills
        </span>
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SKILL_STARTERS.map((s) => (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              key={s.label}
              onClick={() => onSuggestedPrompt(s.prompt)}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-border bg-chat-surface p-3 text-center hover:border-accent/40 hover:bg-accent/5 transition-all cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                <s.icon className="h-5 w-5 text-accent" />
              </span>
              <span className="text-[11px] font-bold text-ink">{s.label}</span>
              <span className="text-[10px] text-text-muted leading-tight">{s.desc}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
