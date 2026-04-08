"use client";

import { motion } from "motion/react";
import { Mail, PenLine, Image, Sparkles } from "lucide-react";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS } from "@/lib/writing-practice/types";

const CATEGORIES: { id: WritingCategory; icon: typeof Mail; desc: string }[] = [
  { id: "email-response", icon: Mail, desc: "Trả lời email yêu cầu (TOEIC Q6-7)" },
  { id: "opinion-essay", icon: PenLine, desc: "Viết luận trình bày quan điểm (TOEIC Q8)" },
  { id: "describe-picture", icon: Image, desc: "Mô tả hình ảnh bằng câu (TOEIC Q1-5)" },
  { id: "free", icon: Sparkles, desc: "Tự do sáng tạo, chủ đề bất kỳ" },
];

type Props = {
  onSelect: (category: WritingCategory) => void;
  isLoading: boolean;
  loadingCategory: string | null;
};

export function PromptGallery({ onSelect, isLoading, loadingCategory }: Props) {
  return (
    <motion.div
      className="mx-auto w-full max-w-lg"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-center [font-family:var(--font-display)] text-2xl italic text-(--ink)">
        Chọn loại bài viết
      </h2>
      <p className="mt-2 text-center text-sm text-(--text-muted)">
        Luyện viết theo format TOEIC Speaking & Writing
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          const isBusy = isLoading && loadingCategory === cat.id;
          return (
            <motion.button
              key={cat.id}
              className="flex flex-col items-start gap-2 rounded-xl border border-(--border) bg-(--surface) p-4 text-left shadow-(--shadow-sm) transition hover:border-(--accent)/40 hover:shadow-(--shadow-md) disabled:opacity-50"
              onClick={() => onSelect(cat.id)}
              disabled={isLoading}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="grid size-9 place-items-center rounded-lg bg-(--accent)/10 text-(--accent)">
                <Icon size={18} />
              </div>
              <span className="text-sm font-semibold text-(--ink)">
                {CATEGORY_LABELS[cat.id]}
              </span>
              <span className="text-xs text-(--text-muted)">{cat.desc}</span>
              {isBusy && (
                <span className="text-[11px] text-(--accent)">Đang tạo đề...</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
