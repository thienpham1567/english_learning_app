"use client";

import { useState } from "react";
import { SendOutlined, BulbOutlined, DownOutlined } from "@ant-design/icons";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { MIN_WORDS, CATEGORY_LABELS } from "@/lib/writing-practice/types";

type Props = {
  prompt: string;
  category: WritingCategory;
  hints: string[];
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
};

export function WritingEditor({ prompt, category, hints, onSubmit, isSubmitting }: Props) {
  const [text, setText] = useState("");
  const [showHints, setShowHints] = useState(false);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = MIN_WORDS[category];
  const ratio = minWords > 0 ? wordCount / minWords : 1;

  let countColor = "text-(--text-muted)";
  if (ratio >= 1.2) countColor = "text-amber-600";
  else if (ratio >= 1) countColor = "text-emerald-600";

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Prompt display */}
      <div className="rounded-xl border border-(--border) bg-(--bg-deep) p-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-(--accent)">
          {CATEGORY_LABELS[category]} · Đề bài
        </span>
        <p className="mt-2 text-sm leading-relaxed text-(--ink)">{prompt}</p>
      </div>

      {/* Hints toggle */}
      {hints.length > 0 && (
        <div className="mt-3">
          <button
            className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 text-left text-sm font-medium text-amber-700 transition hover:bg-amber-50"
            onClick={() => setShowHints(!showHints)}
          >
            <BulbOutlined style={{ fontSize: 15, flexShrink: 0 }} />
            <span className="flex-1">Gợi ý viết bài</span>
            <DownOutlined
              style={{
                fontSize: 14,
                flexShrink: 0,
                transition: "transform 0.2s",
                transform: showHints ? "rotate(180deg)" : "rotate(0)",
              }}
            />
          </button>

          {showHints && (
            <div className="mt-1.5 space-y-1.5 rounded-lg border border-amber-100 bg-amber-50/40 px-3 py-2.5">
              {hints.map((hint, i) => (
                <p key={i} className="flex gap-2 text-[13px] leading-relaxed text-amber-800">
                  <span className="shrink-0 font-semibold text-amber-600">{i + 1}.</span>
                  {hint}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

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
          <button
            className="flex items-center gap-2 rounded-lg bg-linear-to-br from-(--accent) to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-sm) transition enabled:hover:opacity-90 disabled:opacity-40"
            disabled={wordCount < minWords || isSubmitting}
            onClick={() => onSubmit(text)}
          >
            {isSubmitting ? (
              "Đang chấm bài..."
            ) : (
              <>
                <SendOutlinedOutlined style={{ fontSize: 14 }} />
                Nộp bài
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
