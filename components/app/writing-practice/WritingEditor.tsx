"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { MIN_WORDS, CATEGORY_LABELS } from "@/lib/writing-practice/types";

type Props = {
  prompt: string;
  category: WritingCategory;
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
};

export function WritingEditor({ prompt, category, onSubmit, isSubmitting }: Props) {
  const [text, setText] = useState("");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = MIN_WORDS[category];
  const ratio = minWords > 0 ? wordCount / minWords : 1;

  let countColor = "text-(--text-muted)";
  if (ratio >= 1.2) countColor = "text-amber-600";
  else if (ratio >= 1) countColor = "text-emerald-600";

  return (
    <motion.div
      className="mx-auto w-full max-w-2xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Prompt display */}
      <div className="rounded-xl border border-(--border) bg-(--bg-deep) p-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-(--accent)">
          {CATEGORY_LABELS[category]} · Đề bài
        </span>
        <p className="mt-2 text-sm leading-relaxed text-(--ink)">{prompt}</p>
      </div>

      {/* Editor */}
      <div className="relative mt-4">
        <textarea
          className="min-h-[280px] w-full resize-y rounded-xl border border-(--border) bg-(--surface) p-4 text-sm leading-relaxed text-(--ink) placeholder:text-(--text-muted) focus:border-(--accent) focus:outline-none focus:ring-1 focus:ring-(--accent)/30 max-[720px]:min-h-[200px]"
          placeholder="Viết bài của bạn ở đây..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs font-medium ${countColor}`}>
            {wordCount} / {minWords} từ
          </span>
          <motion.button
            className="flex items-center gap-2 rounded-lg bg-linear-to-br from-(--accent) to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-sm) transition enabled:hover:opacity-90 disabled:opacity-40"
            disabled={wordCount < minWords || isSubmitting}
            onClick={() => onSubmit(text)}
            whileTap={{ scale: 0.97 }}
          >
            {isSubmitting ? (
              "Đang chấm bài..."
            ) : (
              <>
                <Send size={14} />
                Nộp bài
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
