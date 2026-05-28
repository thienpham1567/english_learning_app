"use client";

import { CheckCircle, ChevronRight, Radar, RefreshCw } from "lucide-react";
import * as m from "motion/react-client";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import type { TestResult } from "./types";
import { Card } from "@/components/ui/card";

const SKILL_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
};

type Props = {
  result: TestResult;
  onGoHome: () => void;
  onViewProgress: () => void;
};

export function ResultsScreen({ result, onGoHome, onViewProgress }: Props) {
  const cefrColor = CEFR_COLORS[result.overallCefr] ?? "var(--accent)";

  return (
    <div className="h-full overflow-y-auto bg-bg-deep py-6 px-5 pb-12">
      <div className="w-full max-w-[600px] mx-auto flex flex-col gap-5">
        {/* Hero result card */}
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
        >
          <Card
            shadowSize="sm"
            className="text-center relative overflow-hidden py-10 px-6 rounded-xl border-2"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
            }}
          >
            {/* Radial ambient glow matching the CEFR level color */}
            <div
              className="absolute w-[280px] h-[280px] rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${cefrColor}12 0%, transparent 70%)`,
              }}
            />

            <CheckCircle
              className="anim-scale-in mb-4 mx-auto"
              size={44}
              style={{ color: cefrColor }}
            />
            <h4 className="mb-2.5 text-text-primary font-extrabold text-lg">
              Assessment Completed!
            </h4>

            <m.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
              className="font-black font-display text-[68px] tracking-tight leading-none my-3"
              style={{
                color: cefrColor,
                textShadow: `0 8px 24px ${cefrColor}33`,
              }}
            >
              {result.overallCefr}
            </m.div>

            <div className="flex justify-center gap-3 mt-4">
              <span className="rounded-full text-xs font-extrabold text-accent py-1 px-3.5 border border-accent bg-accent-light shadow-sm">
                Confidence: {Math.round(result.confidence * 100)}%
              </span>
              <span className="rounded-full text-xs font-extrabold text-[var(--xp)] py-1 px-3.5 border border-[var(--xp)] bg-[rgba(245,158,11,0.08)] shadow-sm">
                +{result.xpAwarded} XP earned
              </span>
            </div>
          </Card>
        </m.div>

        {/* Skill breakdown card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card shadowSize="default" className="bg-surface p-5 rounded-xl gap-4">
            <div className="flex items-center gap-2">
              <Radar className="text-sm text-accent" />
              <span className="text-[13px] font-extrabold text-text-primary font-display">
                Skill Breakdown
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {Object.entries(result.skills).map(([skill, skillResult], idx) => {
                const pct = Math.round(
                  (skillResult.correct / Math.max(skillResult.total, 1)) * 100,
                );
                const skillColor = CEFR_COLORS[skillResult.cefr] ?? "var(--accent)";

                return (
                  <div key={skill} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-text-primary text-[13.5px]">
                        {SKILL_LABELS[skill] ?? skill}
                      </span>
                      <div className="flex gap-2 items-center">
                        <span
                          className="text-[11px] font-extrabold bg-surface-alt rounded-full py-0.5 px-2"
                          style={{
                            color: skillColor,
                            border: `1px solid ${skillColor}`,
                          }}
                        >
                          {skillResult.cefr}
                        </span>
                        <span className="text-text-muted font-semibold text-[11.5px]">
                          {skillResult.correct}/{skillResult.total} ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Custom Progress bar */}
                    <div className="h-2 rounded-full relative overflow-hidden bg-border">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.6, ease: "easeOut" }}
                        className="absolute left-0 top-0 bottom-0 rounded-full"
                        style={{
                          background: skillColor,
                          boxShadow: `0 0 6px ${skillColor}33`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </m.div>

        {/* Action button row */}
        <div className="flex gap-3">
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGoHome}
            className="flex-1 h-12 rounded-lg border-none text-[15px] font-extrabold cursor-pointer flex items-center justify-center gap-1.5 text-[var(--text-on-accent)] shadow-[0_4px_14px_var(--accent-muted)]"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            }}
          >
            Go to Dashboard
            <ChevronRight size={11} />
          </m.button>

          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onViewProgress}
            className="h-12 rounded-lg bg-surface-alt border-2 border-border text-text-secondary text-[15px] font-bold cursor-pointer flex items-center gap-1.5 px-5 shadow-sm hover:bg-surface-hover transition-colors"
          >
            <RefreshCw size={13} />
            View Progress
          </m.button>
        </div>
      </div>
    </div>
  );
}
