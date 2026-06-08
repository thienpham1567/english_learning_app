"use client";

import { ArrowLeft, RefreshCw, Sparkles, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";

interface MorphemeCompleteProps {
  morpheme: string;
  correctCount: number;
  totalCount: number;
  scorePct: number;
  xpAwarded: number;
  alreadyCompleted: boolean;
  onRetry: () => void;
  onBack: () => void;
}

function scoreColor(pct: number): string {
  if (pct >= 85) return "var(--success)";
  if (pct >= 70) return "var(--info)";
  if (pct >= 50) return "var(--warning, #f59e0b)";
  return "var(--error)";
}

function medal(pct: number): string {
  if (pct >= 90) return "🥇";
  if (pct >= 70) return "🥈";
  if (pct >= 50) return "🥉";
  return "🎓";
}

/** Completion summary for a morpheme lesson: score, XP, and next actions. */
export function MorphemeComplete({
  morpheme,
  correctCount,
  totalCount,
  scorePct,
  xpAwarded,
  alreadyCompleted,
  onRetry,
  onBack,
}: MorphemeCompleteProps) {
  const color = scoreColor(scorePct);

  return (
    <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
      <Card shadowSize="lg" className="rounded-xl bg-surface text-center p-6 md:p-10">
        <div className="flex justify-center mb-3">
          <m.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <Trophy size={52} className="text-success" />
          </m.div>
        </div>

        <h2 className="mb-1 text-2xl font-black text-text-primary font-display">
          {medal(scorePct)} {morpheme} mastered!
        </h2>

        <div
          className="w-24 h-24 rounded-full grid place-items-center mx-auto my-4"
          style={{
            background: `conic-gradient(${color} ${scorePct * 3.6}deg, var(--border) 0deg)`,
          }}
        >
          <div className="w-[84px] h-[84px] rounded-full bg-surface grid place-items-center">
            <div>
              <div className="text-[26px] font-black leading-none" style={{ color }}>
                {scorePct}
              </div>
              <div className="text-[9px] font-bold text-text-muted mt-0.5">
                {correctCount}/{totalCount}
              </div>
            </div>
          </div>
        </div>

        {xpAwarded > 0 ? (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-xp/15 border-2 border-xp/30 text-xp font-black text-[13px] py-1 px-3 mb-5">
            <Sparkles size={14} /> +{xpAwarded} XP
          </div>
        ) : alreadyCompleted ? (
          <p className="text-text-muted text-xs font-semibold mb-5">
            You already earned XP for this morpheme.
          </p>
        ) : null}

        <div className="flex gap-2.5 justify-center flex-wrap">
          <m.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface text-text-primary cursor-pointer font-black text-[13.5px] py-2.5 px-5 border-2 border-border shadow-sm"
          >
            <ArrowLeft size={15} /> Back to list
          </m.button>
          <m.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg text-text-on-accent cursor-pointer font-black text-[13.5px] py-2.5 px-5 border-2 border-border bg-accent shadow-sm hover:bg-accent-hover"
          >
            <RefreshCw size={15} /> Practice Again
          </m.button>
        </div>
      </Card>
    </m.div>
  );
}
