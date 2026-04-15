"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SendOutlined, BulbOutlined, DownOutlined } from "@ant-design/icons";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { MIN_WORDS, CATEGORY_LABELS } from "@/lib/writing-practice/types";

const DRAFT_KEY = "writing-practice-draft";
const AUTOSAVE_INTERVAL = 30_000;

type WritingDraft = {
  text: string;
  prompt: string;
  category: string;
  savedAt: string;
};

type Props = {
  prompt: string;
  category: WritingCategory;
  hints: string[];
  onSubmit: (text: string) => void;
  isSubmitting: boolean;
};

function saveDraft(draft: WritingDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // AC #5: fail silently
  }
}

function loadDraft(): WritingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearWritingDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // silent
  }
}

export function WritingEditor({ prompt, category, hints, onSubmit, isSubmitting }: Props) {
  const [text, setText] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftOffer, setDraftOffer] = useState<WritingDraft | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minWords = MIN_WORDS[category];
  const ratio = minWords > 0 ? wordCount / minWords : 1;
  const fillPct = Math.min(ratio * 100, 100);

  let barColor = "var(--text-muted)";
  if (ratio >= 1.2) barColor = "#d97706"; // amber
  else if (ratio >= 1) barColor = "#059669"; // green

  // Check for saved draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved && saved.prompt === prompt && saved.text.length > 0) {
      setDraftOffer(saved);
    }
  }, [prompt]);

  // Autosave every 30s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (text.trim().length > 0) {
        saveDraft({ text, prompt, category, savedAt: new Date().toISOString() });
        setDraftSaved(true);
        if (fadeRef.current) clearTimeout(fadeRef.current);
        fadeRef.current = setTimeout(() => setDraftSaved(false), 3000);
      }
    }, AUTOSAVE_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (fadeRef.current) clearTimeout(fadeRef.current);
    };
  }, [text, prompt, category]);

  const restoreDraft = useCallback(() => {
    if (draftOffer) {
      setText(draftOffer.text);
      setDraftOffer(null);
    }
  }, [draftOffer]);

  const dismissDraft = useCallback(() => {
    setDraftOffer(null);
    clearWritingDraft();
  }, []);

  const handleSubmit = useCallback(() => {
    clearWritingDraft();
    onSubmit(text);
  }, [onSubmit, text]);

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Draft restore offer (AC #6) */}
      {draftOffer && (
        <div
          className="anim-fade-up mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3"
        >
          <span className="text-sm text-amber-800">
            📝 Bạn có bản nháp chưa hoàn thành. Khôi phục?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-amber-600"
            >
              Khôi phục
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}

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

        {/* Word count progress bar (AC #3) */}
        <div className="mt-2">
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: "var(--bg-deep)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${fillPct}%`,
                  height: "100%",
                  borderRadius: 3,
                  background: barColor,
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            </div>
            {/* Word count label */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: barColor,
                whiteSpace: "nowrap",
              }}
            >
              {wordCount}/{minWords} từ
            </span>
          </div>
        </div>

        {/* Submit row */}
        <div className="mt-3 flex items-center justify-between">
          {/* Autosave indicator (AC #4) */}
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              opacity: draftSaved ? 1 : 0,
              transition: "opacity 0.3s",
            }}
          >
            ✓ Bản nháp đã lưu
          </span>
          <button
            className="flex items-center gap-2 rounded-lg bg-linear-to-br from-(--accent) to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-sm) transition enabled:hover:opacity-90 disabled:opacity-40"
            disabled={wordCount < minWords || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              "Đang chấm bài..."
            ) : (
              <>
                <SendOutlined style={{ fontSize: 14 }} />
                Nộp bài
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

