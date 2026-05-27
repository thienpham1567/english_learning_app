"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Volume2,
  XCircle,
} from "lucide-react";
import { useState } from "react";

type WordAnalysis = {
  word: string;
  spoken: string;
  correct: boolean;
  issue?: string;
};

export type PronFeedbackData = {
  status: "loading" | "done" | "error";
  score?: number;
  accuracy?: number;
  fluency?: number;
  wordAnalysis?: WordAnalysis[];
  tips?: string[];
  feedback?: string;
};

interface Props {
  data: PronFeedbackData;
  onListenCorrect?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-450 border-emerald-950/80 bg-emerald-950/20";
  if (score >= 50) return "text-amber-450 border-amber-950/80 bg-amber-950/20";
  return "text-red-405 border-red-950/80 bg-red-950/20";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 60) return "Good";
  if (score >= 40) return "Acceptable";
  return "Needs Practice";
}

export function PronunciationFeedback({ data, onListenCorrect }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Loading state
  if (data.status === "loading") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-chat-surface border-2 border-border text-text-secondary mt-1 animate-pulse">
        <Loader2 className="h-3 w-3 animate-text-accent" />
        <span>Analyzing pronunciation...</span>
      </div>
    );
  }

  // Error state
  if (data.status === "error") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-red-950/20 border border-red-900/30 text-red-400 mt-1">
        <AlertCircle className="h-3 w-3" />
        <span>Could not analyze pronunciation</span>
      </div>
    );
  }

  // Done state
  const score = data.score ?? 0;
  const badgeStyle = getScoreColor(score);

  return (
    <div className="mt-1.5 flex flex-col items-end">
      {/* Collapsed: Score badge */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-98 shadow-sm ${badgeStyle}`}
      >
        <Volume2 className="h-3.5 w-3.5" />
        <span>
          {score}/100 · {getScoreLabel(score)}
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Expanded view */}
      {expanded && (
        <div className="mt-2 w-full max-w-sm rounded-2xl border-2 border-border bg-chat-surface/60 p-4 text-xs text-text-secondary shadow-md animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Detailed Scores Grid */}
          <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b-2 border-border/60">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Accuracy
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {data.accuracy ?? 0}%
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                Fluency
              </span>
              <span className="text-sm font-semibold text-text-primary">
                {data.fluency ?? 0}%
              </span>
            </div>
          </div>

          {/* Word Analysis Tags */}
          {data.wordAnalysis && data.wordAnalysis.length > 0 && (
            <div className="mb-3.5">
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1.5">
                Word Analysis
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.wordAnalysis.map((w, i) => (
                  <div
                    key={i}
                    className={`relative group inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-help ${
                      w.correct
                        ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-450"
                        : "bg-red-950/20 border-red-900/40 text-red-455"
                    }`}
                  >
                    {w.correct ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    <span>{w.word}</span>

                    {/* Custom CSS Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-chat-bg border-2 border-border text-text-primary text-[10px] font-semibold px-2 py-1 rounded-lg shadow-lg z-50 whitespace-nowrap">
                      {w.issue || (w.correct ? "Correct!" : "Incorrect pronunciation")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips / Feedback */}
          {data.tips && data.tips.length > 0 && (
            <div className="mb-3.5 space-y-1 bg-chat-bg/40 p-2.5 rounded-xl border-2 border-border">
              {data.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex gap-1.5 text-text-secondary leading-relaxed items-start"
                >
                  <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Listen Button */}
          {onListenCorrect && (
            <button
              onClick={onListenCorrect}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-chat-surface hover:brightness-110 hover:text-ink transition-all py-2 text-xs font-semibold text-text-secondary cursor-pointer shadow-sm active:scale-98"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Listen to standard pronunciation</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
