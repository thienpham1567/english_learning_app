"use client";

import { Star, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import { Card } from "@/components/ui/card";

const LEVEL_COLORS: Record<string, string> = {
  A1: "text-emerald-700 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  A2: "text-blue-700 dark:text-blue-400 border-blue-500/30 bg-blue-500/5",
  B1: "text-amber-700 dark:text-amber-400 border-amber-500/30 bg-amber-500/5",
  B2: "text-orange-700 dark:text-orange-400 border-orange-500/30 bg-orange-500/5",
  C1: "text-purple-700 dark:text-purple-400 border-purple-500/30 bg-purple-500/5",
  C2: "text-red-700 dark:text-red-400 border-red-500/30 bg-red-500/5",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type StatsEntry = { level: string | null; saved: boolean };
type Props = { entries: StatsEntry[] };

export function VocabularyStatsBar({ entries }: Props) {
  const total = entries.length;
  const savedCount = entries.filter((e) => e.saved).length;

  const levelCounts = CEFR_LEVELS.reduce<Record<string, number>>((acc, level) => {
    const count = entries.filter((e) => e.level === level).length;
    if (count > 0) acc[level] = count;
    return acc;
  }, {});

  const hasLevels = Object.keys(levelCounts).length > 0;

  return (
    <div className="flex flex-col gap-4 py-3 w-full">
      <div className="grid grid-cols-2 gap-3.5 w-full">
        {/* Total stats card */}
        <m.div
          whileHover={{ y: -3, x: -1, rotate: -0.5, boxShadow: "var(--shadow)" }}
          className="bg-surface border-2 border-border rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm transition-all duration-100"
        >
          <span className="font-display text-3xl font-black text-text-primary leading-none">
            {total}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-muted font-display mt-0.5">
            Words Looked Up
          </span>
        </m.div>

        {/* Saved stats card */}
        <m.div
          whileHover={{ y: -3, x: 1, rotate: 0.5, boxShadow: "var(--shadow)" }}
          className="bg-surface border-2 border-border rounded-2xl p-5 flex flex-col gap-1.5 shadow-sm transition-all duration-100"
        >
          <span className="font-display text-3xl font-black text-text-primary leading-none font-mono">
            {savedCount}
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-secondary font-display mt-0.5 flex items-center gap-1">
            <span>Saved Words</span>
            <Star size={10} className="fill-current text-accent-hover" />
          </span>
        </m.div>
      </div>

      {/* CEFR Level stats */}
      {hasLevels && (
        <Card shadowSize="sm" bgType="alt" className="flex-col sm:flex-row sm:items-center gap-3.5 p-4.5 w-full">
          <div className="flex items-center gap-1.5 shrink-0">
            <Trophy className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-extrabold text-text-muted uppercase tracking-widest font-display">
              Level Distribution
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {CEFR_LEVELS.filter((l) => levelCounts[l]).map((level) => {
              const colorClass = LEVEL_COLORS[level] ?? "text-text-secondary border-border/10 bg-bg-deep";
              return (
                <span
                  key={level}
                  className={`text-[10px] font-black border-2 px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-sm ${colorClass}`}
                >
                  <span>{level}</span>
                  <span className="opacity-60 text-[9px] font-mono">({levelCounts[level]})</span>
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
