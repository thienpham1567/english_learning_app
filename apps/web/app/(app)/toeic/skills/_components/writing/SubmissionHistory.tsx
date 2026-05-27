"use client";

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
    <div className="mx-auto mt-8 w-full max-w-lg animate-in fade-in duration-200">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
        <Clock className="h-3.5 w-3.5" />
        Recent Submissions
      </h3>
      <div className="space-y-2">
        {submissions.map((s) => (
          <button
            key={s.id}
            className="flex w-full items-center justify-between rounded-lg border-2 border-border bg-(--surface) px-3.5 py-2.5 text-left transition hover:border-(--accent)/40 hover:shadow-(--shadow-sm) cursor-pointer"
            onClick={() => onView(s)}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-(--text-muted) shrink-0" />
              <div>
                <span className="text-sm font-medium text-(--ink)">
                  {CATEGORY_LABELS[s.category as WritingCategory] ?? s.category}
                </span>
                <span className="ml-2 text-xs text-(--text-muted)">
                  {new Date(s.createdAt).toLocaleDateString("en-US")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-(--text-muted)">{s.wordCount} words</span>
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
