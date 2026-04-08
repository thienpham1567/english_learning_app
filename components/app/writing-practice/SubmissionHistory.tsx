"use client";

import { motion } from "motion/react";
import { Clock, FileText } from "lucide-react";
import type { WritingSubmission } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS, type WritingCategory } from "@/lib/writing-practice/types";

type Props = {
  submissions: WritingSubmission[];
  onView: (submission: WritingSubmission) => void;
};

export function SubmissionHistory({ submissions, onView }: Props) {
  if (submissions.length === 0) return null;

  return (
    <motion.div
      className="mx-auto mt-8 w-full max-w-lg"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
        <Clock size={12} />
        Bài viết gần đây
      </h3>
      <div className="space-y-2">
        {submissions.map((s) => (
          <button
            key={s.id}
            className="flex w-full items-center justify-between rounded-lg border border-(--border) bg-(--surface) px-3.5 py-2.5 text-left transition hover:border-(--accent)/40 hover:shadow-(--shadow-sm)"
            onClick={() => onView(s)}
          >
            <div className="flex items-center gap-3">
              <FileText size={14} className="text-(--text-muted)" />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  {CATEGORY_LABELS[s.category as WritingCategory] ?? s.category}
                </span>
                <span className="ml-2 text-xs text-(--text-muted)">
                  {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-(--text-muted)">{s.wordCount} từ</span>
              <span className="rounded-full bg-(--accent)/10 px-2 py-0.5 text-xs font-bold text-(--accent)">
                {s.overallBand.toFixed(1)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
