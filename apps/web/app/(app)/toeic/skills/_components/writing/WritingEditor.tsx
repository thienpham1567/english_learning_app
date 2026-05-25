"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Lightbulb, ChevronDown, PenSquare } from "lucide-react";
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

  let textColorClass = "text-slate-400";
  let progressBgClass = "bg-slate-450";
  if (ratio >= 1.2) {
    textColorClass = "text-amber-500";
    progressBgClass = "bg-amber-500";
  } else if (ratio >= 1) {
    textColorClass = "text-emerald-500";
    progressBgClass = "bg-emerald-500";
  }

  // Check for saved draft on mount
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = loadDraft();
      setDraftOffer(
        saved && saved.prompt === prompt && saved.text.length > 0 ? saved : null,
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
          className="anim-fade-up mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-900/30 bg-amber-950/20 px-4 py-3"
        >
          <span className="text-xs text-amber-400 flex items-center gap-1.5 font-semibold">
            <PenSquare className="h-4 w-4 shrink-0" />
            <span>Bạn có bản nháp chưa hoàn thành. Khôi phục?</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-xl bg-amber-505 bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700 cursor-pointer"
            >
              Khôi phục
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="rounded-xl border border-amber-900/40 px-3.5 py-1.5 text-xs font-bold text-amber-500 hover:bg-amber-950/20 transition cursor-pointer"
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
            className="flex w-full items-center gap-2 rounded-lg border border-amber-250 border-amber-900/20 bg-amber-950/5 px-3 py-2 text-left text-sm font-medium text-amber-600 hover:text-amber-500 transition hover:bg-amber-950/10 cursor-pointer"
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-xs font-bold">Gợi ý viết bài</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-250 ${
                showHints ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {showHints && (
            <div className="mt-1.5 space-y-1.5 rounded-lg border border-amber-900/10 bg-amber-950/5 px-3 py-2.5">
              {hints.map((hint, i) => (
                <p key={i} className="flex gap-2 text-[13px] leading-relaxed text-amber-500">
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
            <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${progressBgClass}`}
                style={{
                  width: `${fillPct}%`,
                }}
              />
            </div>
            {/* Word count label */}
            <span
              className={`text-xs font-bold whitespace-nowrap ${textColorClass}`}
            >
              {wordCount}/{minWords} từ
              {wordCount < minWords && (
                <span className="text-[10px] text-slate-450 font-normal"> (tối thiểu)</span>
              )}
              {wordCount >= minWords && wordCount < minWords * 1.5 && (
                <span className="text-[10px] text-emerald-450 font-normal"> ✓ đủ</span>
              )}
              {wordCount >= minWords * 1.5 && (
                <span className="text-[10px] text-amber-450 font-normal"> (dài)</span>
              )}
            </span>
          </div>
        </div>

        {/* Submit row */}
        <div className="mt-3 flex items-center justify-between">
          {/* Autosave indicator (AC #4) */}
          <span className={`text-[11px] text-slate-455 transition-opacity duration-300 ${
            draftSaved ? "opacity-100" : "opacity-0"
          }`}>
            ✓ Bản nháp đã lưu
          </span>
          <button
            className="flex items-center gap-2 rounded-lg bg-linear-to-br from-(--accent) to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-(--shadow-sm) transition enabled:hover:opacity-90 disabled:opacity-40 cursor-pointer"
            disabled={wordCount < minWords || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              "Đang chấm bài..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Nộp bài</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
