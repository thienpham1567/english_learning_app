"use client";

import { ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import type { WritingSubmission } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS, type WritingCategory } from "@/lib/writing-practice/types";

type Props = {
  submissions: WritingSubmission[];
  onView: (submission: WritingSubmission) => void;
};

export function SubmissionHistoryOutlined({ submissions, onView }: Props) {
  if (submissions.length === 0) return null;

  return (
    <div className="mx-auto mt-8 w-full max-w-lg">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
        <ClockCircleOutlined style={{ fontSize: 12 }} />
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
              <FileTextOutlined style={{ fontSize: 14, color: "var(--text-muted)" }} />
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
    </div>
  );
}
