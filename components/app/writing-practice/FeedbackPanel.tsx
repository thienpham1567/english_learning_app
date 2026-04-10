"use client";

import type { WritingFeedback } from "@/lib/writing-practice/types";
import { BandScoreRadar } from "./BandScoreRadar";
import { AnnotatedText } from "./AnnotatedText";

type Props = {
  text: string;
  feedback: WritingFeedback;
  onNewWriting: () => void;
};

export function FeedbackPanel({ text, feedback, onNewWriting }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Overall band */}
      <div className="mb-6 text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
          Điểm tổng
        </span>
        <div className="mt-1 inline-flex items-baseline gap-1">
          <span className="[font-family:var(--font-display)] text-5xl italic text-(--accent)">
            {feedback.overallBand.toFixed(1)}
          </span>
          <span className="text-sm text-(--text-muted)">/ 9.0</span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: annotated text */}
        <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
            Bài viết của bạn
          </h3>
          <AnnotatedText text={text} annotations={feedback.annotations} />
        </div>

        {/* Right: radar + feedback */}
        <div className="space-y-5">
          {/* Radar */}
          <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Điểm chi tiết
            </h3>
            <BandScoreRadar scores={feedback.scores} />
          </div>

          {/* General feedback */}
          <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Nhận xét
            </h3>
            <p className="text-sm leading-relaxed text-(--ink)">{feedback.generalFeedback}</p>
            <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">
              {feedback.generalFeedbackVi}
            </p>
          </div>

          {/* Improved version */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-(--shadow-sm)">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Bài mẫu (Band 7+)
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
              {feedback.improvedVersion}
            </p>
          </div>
        </div>
      </div>

      {/* New writing button */}
      <div className="mt-8 text-center">
        <button
          onClick={onNewWriting}
          className="rounded-xl border border-(--border) bg-(--surface) px-6 py-2.5 text-sm font-medium text-(--text-secondary) shadow-(--shadow-sm) transition hover:border-(--accent)/40 hover:text-(--accent)"
        >
          ✍️ Viết bài mới
        </button>
      </div>
    </div>
  );
}
