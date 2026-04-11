"use client";

import { useState } from "react";
import type { WritingFeedback } from "@/lib/writing-practice/types";
import { BandScoreRadar } from "./BandScoreRadar";
import { AnnotatedText } from "./AnnotatedText";

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
          <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Bài viết của bạn
            </h3>
            <AnnotatedText text={text} annotations={feedback.annotations} />
          </div>

          {/* Right: improved version */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Bài mẫu (Band 7+)
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
              {feedback.improvedVersion}
            </p>
          </div>
        </div>

        {/* Bottom row: radar + feedback full-width */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Điểm chi tiết
            </h3>
            <BandScoreRadar scores={feedback.scores} />
          </div>

          <div className="rounded-xl border border-(--border) bg-(--surface) p-5 shadow-(--shadow-sm)">
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
        <div
          style={{
            display: "flex",
            borderRadius: 10,
            border: "1px solid var(--border)",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "8px 4px",
                fontSize: 12,
                fontWeight: activeTab === tab.key ? 700 : 500,
                background: activeTab === tab.key ? "var(--accent)" : "var(--surface)",
                color: activeTab === tab.key ? "#fff" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "original" && (
          <div className="anim-fade-in rounded-xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
              Bài viết của bạn
            </h3>
            <AnnotatedText text={text} annotations={feedback.annotations} />
          </div>
        )}

        {activeTab === "improved" && (
          <div className="anim-fade-in rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-(--shadow-sm)">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-emerald-700">
              Bài mẫu (Band 7+)
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-900">
              {feedback.improvedVersion}
            </p>
          </div>
        )}

        {activeTab === "review" && (
          <div className="anim-fade-in space-y-4">
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow-sm)">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">
                Điểm chi tiết
              </h3>
              <BandScoreRadar scores={feedback.scores} />
            </div>
            <div className="rounded-xl border border-(--border) bg-(--surface) p-4 shadow-(--shadow-sm)">
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
          className="rounded-xl border border-(--border) bg-(--surface) px-6 py-2.5 text-sm font-medium text-(--text-secondary) shadow-(--shadow-sm) transition hover:border-(--accent)/40 hover:text-(--accent)"
        >
          ✍️ Viết bài mới
        </button>
      </div>
    </div>
  );
}
