"use client";

import * as m from "motion/react-client";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Mic,
  Music,
  Gauge,
  Target,
  FileText,
  Lightbulb,
} from "lucide-react";

export interface WordScore {
  word: string;
  score: "good" | "fair" | "poor";
  tip?: string;
}

export interface EvalResult {
  overall: number;
  pronunciation: number;
  intonation: number;
  fluency: number;
  stress: number;
  transcript: string;
  wordScores: WordScore[];
  summary: string;
}

interface ShadowResultProps {
  result: EvalResult;
  referenceText: string;
}

const SCORE_COLORS: Record<string, string> = {
  good: "var(--success)",
  fair: "var(--warning, #f59e0b)",
  poor: "var(--error)",
};

const SCORE_ICONS: Record<string, React.ComponentType<any>> = {
  good: CheckCircle2,
  fair: AlertTriangle,
  poor: XCircle,
};

function getGrade(score: number): { label: string; color: string } {
  if (score >= 85) return { label: "Excellent", color: "var(--success)" };
  if (score >= 70) return { label: "Good", color: "var(--info)" };
  if (score >= 50) return { label: "Needs Improvement", color: "var(--warning, #f59e0b)" };
  return { label: "Needs Practice", color: "var(--error)" };
}

const WORD_SCORE_STYLES: Record<string, string> = {
  good: "text-success bg-success/10 border-success/20",
  fair: "text-warning bg-warning/10 border-warning/20",
  poor: "text-error bg-error/10 border-error/20",
};

export function ShadowResult({ result, referenceText }: ShadowResultProps) {
  const grade = getGrade(result.overall);

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-xl border border-border p-5 flex flex-col gap-5"
    >
      {/* Overall Score Ring */}
      <div className="flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-full grid place-items-center shrink-0"
          style={{
            background: `conic-gradient(${grade.color} ${result.overall * 3.6}deg, var(--border) 0deg)`,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-surface grid place-items-center">
            <div className="text-center">
              <div className="text-[22px] font-black" style={{ color: grade.color }}>
                {result.overall}
              </div>
              <div className="text-[9px] font-bold text-text-muted">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div
            className="text-base font-extrabold mb-1 flex items-center gap-1.5"
            style={{ color: grade.color }}
          >
            <Award size={18} />
            {grade.label}
          </div>
          <span className="text-[13px] text-text-secondary leading-relaxed">{result.summary}</span>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Pronunciation", Icon: Mic, value: result.pronunciation },
          { label: "Intonation", Icon: Music, value: result.intonation },
          { label: "Fluency", Icon: Gauge, value: result.fluency },
          { label: "Stress", Icon: Target, value: result.stress },
        ].map((s) => {
          const g = getGrade(s.value);
          return (
            <div
              key={s.label}
              className="py-2.5 px-3.5 rounded-xl bg-surface-alt border border-border"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                  <s.Icon size={12} className="text-text-muted" />
                  {s.label}
                </span>
                <span className="text-base font-black" style={{ color: g.color }}>
                  {s.value}
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="h-1 rounded-sm bg-border mt-1.5 overflow-hidden">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.value}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="h-full rounded-sm"
                  style={{ background: g.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Word-level feedback */}
      {result.wordScores.length > 0 && (
        <div>
          <span className="text-xs font-bold text-text-muted uppercase tracking-[0.05em] mb-2.5 flex items-center gap-1">
            <FileText size={13} />
            Word-by-word Details
          </span>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {result.wordScores.map((w, i) => {
              const IconComp = SCORE_ICONS[w.score];
              return (
                <span
                  key={i}
                  title={w.tip || undefined}
                  className={`py-1 px-2.5 rounded-lg text-sm font-bold inline-flex items-center gap-1 transition-transform duration-100 border ${
                    WORD_SCORE_STYLES[w.score] ?? "text-text-secondary bg-surface-alt border-border"
                  } ${w.tip ? "cursor-help" : "cursor-default"}`}
                >
                  {IconComp && <IconComp size={13} />}
                  {w.word}
                </span>
              );
            })}
          </div>

          {/* Tips for poor/fair words */}
          {result.wordScores.filter((w) => w.tip).length > 0 && (
            <div className="flex flex-col gap-1.5">
              {result.wordScores
                .filter((w) => w.tip)
                .map((w, i) => (
                  <div
                    key={i}
                    className="py-2 px-3 rounded-[10px] bg-surface-alt border border-border text-[12.5px] text-text-secondary leading-normal flex gap-2 items-start"
                  >
                    <span
                      className={`font-extrabold shrink-0 ${
                        w.score === "good"
                          ? "text-success"
                          : w.score === "fair"
                            ? "text-warning"
                            : "text-error"
                      }`}
                    >
                      {w.word}:
                    </span>
                    <span className="flex items-center gap-1">
                      <Lightbulb size={13} className="text-accent shrink-0" />
                      {w.tip}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Transcript comparison */}
      <div className="py-3 px-3.5 rounded-xl bg-surface-alt border border-border">
        <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1 mb-1.5">
          <Target size={12} />
          Reference Sentence
        </span>
        <span className="text-[13px] text-text-primary block mb-2.5 leading-normal">
          {referenceText}
        </span>
        <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1 mb-1.5">
          <Mic size={12} />
          Your Speech
        </span>
        <span className="text-[13px] text-text-secondary block leading-normal italic">
          {result.transcript || "Speech not recognized"}
        </span>
      </div>
    </m.div>
  );
}
