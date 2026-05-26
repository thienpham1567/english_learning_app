"use client";

import { PenTool } from "lucide-react";
import { useState } from "react";
import type { WritingFeedback } from "@/lib/writing-practice/types";
import { AnnotatedText } from "./AnnotatedText";
import { BandScoreRadar } from "./BandScoreRadar";

type Props = {
  text: string;
  feedback: WritingFeedback;
  onNewWriting: () => void;
};

const TABS = [
  { key: "original", label: "Bài của bạn" },
  { key: "improved", label: "Bản cải thiện" },
  { key: "review", label: "Đánh giá" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function FeedbackPanel({ text, feedback, onNewWriting }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("original");

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

      {/* ── Desktop split-view (≥769px) ── */}
      <div className="hidden md:block">
        {/* Top row: side-by-side */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: user's annotated text */}
          <div className="rounded-xl border-2 border-border bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Bài viết của bạn
            </h3>
            <AnnotatedText text={text} annotations={feedback.annotations} />
          </div>

          {/* Right: improved version */}
          <div className="rounded-xl border-2 border-success/30 bg-success-bg p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-success">
              Bài mẫu (Band 7+)
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {feedback.improvedVersion}
            </p>
          </div>
        </div>

        {/* Bottom row: radar + feedback full-width */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border-2 border-border bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Điểm chi tiết
            </h3>
            <BandScoreRadar scores={feedback.scores} />
          </div>

          <div className="rounded-xl border-2 border-border bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Nhận xét
            </h3>
            <p className="text-sm leading-relaxed text-(--ink)">{feedback.generalFeedback}</p>
            <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">
              {feedback.generalFeedbackVi}
            </p>
          </div>
        </div>
      </div>

      {/* ── Mobile tabs (≤768px) ── */}
      <div className="md:hidden">
        {/* Tab bar */}
        <div className="flex rounded-xl border-2 border-border overflow-hidden mb-4 bg-surface">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-xs font-semibold border-none cursor-pointer transition-all duration-150 ${
                activeTab === tab.key
                  ? "bg-accent text-text-on-accent font-bold"
                  : "bg-surface text-text-muted hover:text-text-primary hover:bg-surface-hover"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "original" && (
          <div className="anim-fade-in rounded-xl border-2 border-border bg-(--surface) p-4 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Bài viết của bạn
            </h3>
            <AnnotatedText text={text} annotations={feedback.annotations} />
          </div>
        )}

        {activeTab === "improved" && (
          <div className="anim-fade-in rounded-xl border-2 border-success/30 bg-success-bg p-4 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-success">
              Bài mẫu (Band 7+)
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
              {feedback.improvedVersion}
            </p>
          </div>
        )}

        {activeTab === "review" && (
          <div className="anim-fade-in space-y-4">
            <div className="rounded-xl border-2 border-border bg-(--surface) p-4 shadow-(--shadow-sm)">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
                Điểm chi tiết
              </h3>
              <BandScoreRadar scores={feedback.scores} />
            </div>
            <div className="rounded-xl border-2 border-border bg-(--surface) p-4 shadow-(--shadow-sm)">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
                Nhận xét
              </h3>
              <p className="text-sm leading-relaxed text-(--ink)">{feedback.generalFeedback}</p>
              <p className="mt-3 text-sm leading-relaxed text-(--text-secondary)">
                {feedback.generalFeedbackVi}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New writing button */}
      <div className="mt-8 text-center">
        <button
          onClick={onNewWriting}
          className="rounded-xl border-2 border-border bg-(--surface) px-6 py-2.5 text-xs font-bold text-(--text-secondary) shadow-(--shadow-sm) transition hover:border-(--accent)/45 hover:text-(--accent) cursor-pointer flex items-center gap-1.5 mx-auto"
        >
          <PenTool className="h-4 w-4" />
          <span>Viết bài mới</span>
        </button>
      </div>
    </div>
  );
}
