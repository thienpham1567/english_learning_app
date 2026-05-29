"use client";

import { Check, CheckCircle, ChevronDown, Lightbulb, PenSquare, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS, MIN_WORDS } from "@/lib/writing-practice/types";

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

  let textColorClass = "text-text-muted";
  let progressBgClass = "bg-border/30";
  if (ratio >= 1.2) {
    textColorClass = "text-warning";
    progressBgClass = "bg-warning";
  } else if (ratio >= 1) {
    textColorClass = "text-success";
    progressBgClass = "bg-success";
  }

  // Check for saved draft on mount
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const saved = loadDraft();
      setDraftOffer(saved && saved.prompt === prompt && saved.text.length > 0 ? saved : null);
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
        <div className="anim-fade-up mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-warning-bg px-4 py-3 shadow-sm">
          <span className="text-xs text-text-primary flex items-center gap-1.5 font-semibold">
            <PenSquare className="h-4 w-4 shrink-0 text-warning" />
            <span>You have an unfinished draft. Restore?</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-xl bg-warning px-3.5 py-1.5 text-xs font-bold text-black border-2 border-border shadow-sm hover:translate-y-[-1px] transition-all cursor-pointer"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={dismissDraft}
              className="rounded-xl border-2 border-border bg-surface px-3.5 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-hover transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Prompt display */}
      <div className="rounded-xl border-2 border-border bg-bg-deep p-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-accent">
          {CATEGORY_LABELS[category]} · Prompt
        </span>
        <p className="mt-2 text-sm leading-relaxed text-ink">{prompt}</p>
      </div>

      {/* Hints toggle */}
      {hints.length > 0 && (
        <div className="mt-3">
          <button
            className="flex w-full items-center gap-2 rounded-lg border-2 border-border bg-warning-bg px-3 py-2 text-left text-sm font-medium text-text-primary hover:bg-warning-bg/60 transition cursor-pointer"
            onClick={() => setShowHints(!showHints)}
          >
            <Lightbulb className="h-4 w-4 shrink-0 text-warning" />
            <span className="flex-1 text-xs font-bold">Writing Hints</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-250 ${
                showHints ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {showHints && (
            <div className="mt-1.5 space-y-1.5 rounded-lg border-2 border-border bg-warning-bg px-3 py-2.5">
              {hints.map((hint, i) => (
                <p key={i} className="flex gap-2 text-[13px] leading-relaxed text-text-secondary">
                  <span className="shrink-0 font-semibold text-warning">{i + 1}.</span>
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
          className="min-h-[280px] w-full resize-y rounded-xl border-2 border-border bg-surface p-4 text-sm leading-relaxed text-ink placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 max-[720px]:min-h-[200px]"
          placeholder="Write your response here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Word count progress bar (AC #3) */}
        <div className="mt-2">
          <div className="flex items-center gap-3">
            {/* Progress bar */}
            <div className="flex-1 h-1.5 rounded-full bg-bg-deep border-2 border-border/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${progressBgClass}`}
                style={{
                  width: `${fillPct}%`,
                }}
              />
            </div>
            {/* Word count label */}
            <span
              className={`text-xs font-bold whitespace-nowrap flex items-center gap-1 ${textColorClass}`}
            >
              <span>
                {wordCount}/{minWords} words
              </span>
              {wordCount < minWords && (
                <span className="text-[10px] text-text-muted font-normal"> (minimum)</span>
              )}
              {wordCount >= minWords && wordCount < minWords * 1.5 && (
                <span className="text-[10px] text-success font-normal flex items-center gap-0.5">
                  <Check className="h-3 w-3 shrink-0" />
                  <span>sufficient</span>
                </span>
              )}
              {wordCount >= minWords * 1.5 && (
                <span className="text-[10px] text-warning font-normal"> (long)</span>
              )}
            </span>
          </div>
        </div>

        {/* Submit row */}
        <div className="mt-3 flex items-center justify-between">
          {/* Autosave indicator (AC #4) */}
          <span
            className={`text-[11px] text-text-muted transition-opacity duration-300 flex items-center gap-1 ${
              draftSaved ? "opacity-100" : "opacity-0"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5 text-success shrink-0 animate-pulse" />
            <span>Draft saved</span>
          </span>
          <button
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-text-on-accent border-2 border-border shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 cursor-pointer"
            disabled={wordCount < minWords || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              "Scoring..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
