"use client";

import { Award, Loader2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import * as m from "motion/react-client";
import type { ShadowingCompletion } from "../../_hooks/useShadowing";
import type { EvalResult } from "./ShadowResult";

interface ShadowingSummaryProps {
  avgScore: number;
  sentenceResults: (EvalResult | null)[];
  completion: ShadowingCompletion | null;
  isSubmitting: boolean;
  onRestart: () => void;
}

function scoreColor(score: number): string {
  if (score >= 85) return "var(--success)";
  if (score >= 70) return "var(--info)";
  if (score >= 50) return "var(--warning, #f59e0b)";
  return "var(--error)";
}

/** Celebratory completion card: average score, XP, CEFR update, per-sentence chips. */
export function ShadowingSummary({
  avgScore,
  sentenceResults,
  completion,
  isSubmitting,
  onRestart,
}: ShadowingSummaryProps) {
  const color = scoreColor(avgScore);
  const skill = completion?.skillUpdate ?? null;

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center border-2 border-border p-6 shadow-[5px_5px_0_var(--shadow-color)] bg-accent-light"
    >
      <div className="flex justify-center mb-3">
        <m.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="grid h-14 w-14 place-items-center border-2 border-border bg-surface shadow-[3px_3px_0_var(--shadow-color)]"
        >
          <Award size={28} className="text-accent-active" />
        </m.div>
      </div>

      <h3 className="mb-1 text-ink font-display font-black uppercase tracking-tight text-lg">
        Hoàn thành Shadowing!
      </h3>

      {/* Average score ring */}
      <div
        className="w-24 h-24 rounded-full grid place-items-center mx-auto my-4"
        style={{ background: `conic-gradient(${color} ${avgScore * 3.6}deg, var(--border) 0deg)` }}
      >
        <div className="w-[84px] h-[84px] rounded-full bg-surface grid place-items-center">
          <div>
            <div className="text-[26px] font-black leading-none" style={{ color }}>
              {avgScore}
            </div>
            <div className="text-[9px] font-bold text-text-muted mt-0.5">/ 100</div>
          </div>
        </div>
      </div>

      {/* XP + skill rewards */}
      {isSubmitting ? (
        <div className="flex items-center justify-center gap-2 text-text-muted text-[13px] mb-4">
          <Loader2 size={14} className="animate-spin" /> Đang lưu tiến độ…
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {completion && completion.xpAwarded > 0 && (
            <span className="inline-flex items-center gap-1 bg-xp/15 border-2 border-border text-xp font-black font-mono text-[12px] py-1 px-3 shadow-[2px_2px_0_var(--shadow-color)]">
              <Sparkles size={13} /> +{completion.xpAwarded} XP
            </span>
          )}
          {skill && (
            <span
              className={`inline-flex items-center gap-1 border-2 border-border font-black font-mono text-[12px] py-1 px-3 shadow-[2px_2px_0_var(--shadow-color)] ${
                skill.levelUp ? "bg-success/15 text-success" : "bg-surface text-text-secondary"
              }`}
            >
              <TrendingUp size={13} />
              {skill.levelUp ? `Level Up: ${skill.cefr}!` : `Listening: ${skill.cefr}`}
            </span>
          )}
        </div>
      )}

      {/* Per-sentence score chips */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-5">
        {sentenceResults.map((r, i) => {
          const s = r?.overall ?? 0;
          return (
            <span
              key={i}
              className="text-[11px] font-black font-mono py-1 px-2.5 border-2"
              style={{ color: scoreColor(s), borderColor: scoreColor(s) }}
            >
              #{i + 1}: {s}
            </span>
          );
        })}
      </div>

      <m.button
        whileHover={{ x: -1, y: -1 }}
        whileTap={{ x: 0, y: 0 }}
        onClick={onRestart}
        className="inline-flex items-center gap-2 text-text-on-accent text-[13px] font-black uppercase tracking-tight cursor-pointer font-display py-2.5 px-6 border-2 border-border bg-accent shadow-[3px_3px_0_var(--shadow-color)] hover:shadow-[4px_4px_0_var(--shadow-color)] active:shadow-none transition-shadow"
      >
        <RefreshCw size={14} /> Luyện lại
      </m.button>
    </m.div>
  );
}
