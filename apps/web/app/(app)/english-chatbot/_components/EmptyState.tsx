"use client";

import {
  BarChart3,
  BookOpen,
  Compass,
  FileText,
  Headphones,
  Mic,
  PenTool,
  Timer,
} from "lucide-react";
import { motion } from "motion/react";
import { PERSONAS } from "@/lib/chat/personas";

type Props = {
  onSuggestedPrompt: (text: string) => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 14, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 150, damping: 17 },
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
    desc: "Trả lời bằng giọng nói",
  },
  {
    icon: PenTool,
    label: "Writing",
    prompt: "Give me a TOEIC Writing opinion-essay prompt and score my answer.",
    desc: "Email & luận",
  },
  {
    icon: Compass,
    label: "Diagnose",
    prompt: "Run a quick 5-question check to estimate my TOEIC level.",
    desc: "Tìm điểm yếu",
  },
  {
    icon: FileText,
    label: "Mini-test",
    prompt: "Give me a 10-question TOEIC mini-test across skills.",
    desc: "Luyện tổng hợp",
  },
  {
    icon: BarChart3,
    label: "Part 7",
    prompt: "Give me a TOEIC Part 7 reading passage with 4 questions.",
    desc: "Đọc hiểu",
  },
  {
    icon: Timer,
    label: "Strategy",
    prompt: "Teach me time-management strategy for the Reading section.",
    desc: "Chiến thuật làm bài",
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
      className="m-auto flex w-full max-w-2xl flex-col px-4 py-8"
    >
      {/* ── Broadcast card ── */}
      <motion.div
        variants={itemVariants}
        className="relative border border-border bg-chat-surface rounded-2xl p-6 shadow-md"
      >
        {/* Corner accent dot */}
        <div className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full bg-accent shadow-sm" />

        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-bg-deep shadow-sm">
            <Avatar size={62} />
          </div>
          <div className="min-w-0 pt-1">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent inline-block" />
              {coach.specialty}
            </div>
            <h2 className="mt-1.5 font-display text-2xl font-bold uppercase leading-[0.95] tracking-tight text-ink md:text-[28px]">
              Gia sư TOEIC
              <br />
                <span className="text-accent">của bạn</span>
            </h2>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-text-secondary">
          Cho mình biết điểm mục tiêu và kỹ năng bạn muốn luyện — hoặc bấm một gợi ý bên dưới để bắt
          đầu ngay.
        </p>

        {/* Suggested starters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {coach.suggestedPrompts.map((prompt) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={prompt}
              onClick={() => onSuggestedPrompt(prompt)}
              className="max-w-[280px] truncate border border-border bg-surface rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-all hover:bg-accent/5 hover:text-accent hover:shadow"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Skill grid ── */}
      <motion.div variants={itemVariants} className="mt-6">
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-text-muted">
            Kỹ năng & Bài luyện
          </span>
          <div className="h-0.5 flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SKILL_STARTERS.map((s, i) => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={s.label}
              onClick={() => onSuggestedPrompt(s.prompt)}
              className="group relative flex flex-col gap-1.5 border border-border bg-chat-surface rounded-xl p-3 text-left shadow-sm transition-all hover:bg-accent/5 hover:shadow-md"
            >
              <span className="absolute right-2 top-2 text-[10px] font-medium text-text-muted/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <s.icon className="h-5 w-5 text-accent-active" />
              <span className="font-display text-[12.5px] font-bold text-ink">{s.label}</span>
              <span className="text-[9.5px] uppercase tracking-wide text-text-muted leading-tight">
                {s.desc}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
