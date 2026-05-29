"use client";

import {
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Headphones,
  Languages,
  Mic,
  PenTool,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useState } from "react";
import {
  CURRICULUM,
  getPhaseForWeek,
  getWeek,
  SKILL_COLORS,
  SKILL_LABELS,
  type Phase,
  type Skill,
  type Week,
} from "@/lib/curriculum/data";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";
import { Card } from "@/components/ui/card";

const SKILL_ICONS: Record<
  Skill,
  React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
> = {
  grammar: BookOpen,
  listening: Headphones,
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  vocabulary: Star,
  review: Target,
};

export default function RoadmapPage() {
  const [expandedPhase, setExpandedPhase] = useState<string>("phase-1");
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const {
    completedSet: completedUnits,
    getCurrentWeek,
    getWeekProgress: getWeekProg,
    getPhaseProgress: getPhaseProg,
    getOverallProgress,
    toggleUnit,
  } = useRoadmap();

  const currentWeek = getCurrentWeek();
  const overall = getOverallProgress();

  const getWeekProgressPercent = (week: Week): number => getWeekProg(week.weekNumber).percent;
  const getPhaseProgressPercent = (phase: Phase): number => getPhaseProg(phase.id).percent;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-6xl mx-auto w-full flex flex-col lg:grid lg:grid-cols-[320px_1fr] lg:items-start gap-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-0">
        <Card shadowSize="md" className="relative overflow-hidden">
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{
              background: "linear-gradient(90deg, #22c55e, #3b82f6, #f59e0b)",
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 bg-accent/10 border-2 border-accent/20">
              <Trophy className="text-accent" size={24} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black text-ink font-display m-0">{CURRICULUM.title}</h1>
              <p className="text-xs text-text-secondary font-semibold mt-1">
                {CURRICULUM.duration} · Target: {CURRICULUM.targetScore.lr} L&R ·{" "}
                {CURRICULUM.targetScore.sw} S&W
              </p>
            </div>

            {/* Overall progress */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative w-[56px] h-[56px]">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.round((overall.percent / 100) * 264)} 264`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-ink font-display">
                    {overall.percent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Today's Focus ─── */}
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card shadowSize="sm" className="border-accent/30 bg-accent/5">
            <div className="flex items-center gap-2.5 mb-2">
              <Zap className="text-accent" size={18} />
              <span className="text-sm font-black text-ink font-display">Today&apos;s Focus</span>
              <span className="text-[10px] font-extrabold rounded-lg bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 ml-auto">
                Week {currentWeek}
              </span>
            </div>
            <p className="text-xs text-text-secondary font-semibold m-0">
              {getWeek(currentWeek)?.focusTopic ?? "Start your learning journey!"}
            </p>
            <Link
              href={`/roadmap/week/${currentWeek}`}
              className="no-underline inline-flex items-center gap-1.5 mt-3 text-xs font-black text-accent hover:underline"
            >
              Continue Learning <ChevronRight size={14} />
            </Link>
          </Card>
        </m.div>
        </div>{/* end sidebar */}

        {/* ─── Phase Timeline ─── */}
        <div className="flex flex-col gap-4">
          {CURRICULUM.phases.map((phase, phaseIndex) => {
            const isExpanded = expandedPhase === phase.id;
            const phaseProgress = getPhaseProgressPercent(phase);
            const isCurrent = phase.weeks.some((w) => w.weekNumber === currentWeek);

            return (
              <m.div
                key={phase.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + phaseIndex * 0.08 }}
              >
                <Card shadowSize="sm" className="overflow-hidden p-0">
                  {/* Phase header */}
                  <button
                    type="button"
                    onClick={() => setExpandedPhase(isExpanded ? "" : phase.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 cursor-pointer border-none bg-transparent text-left transition-colors hover:bg-surface-hover"
                  >
                    {/* Phase dot + connector */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div
                        className="w-10 h-10 rounded-xl grid place-items-center border-2 shadow-sm"
                        style={{
                          background: `color-mix(in srgb, ${phase.color} 12%, var(--surface))`,
                          borderColor: `color-mix(in srgb, ${phase.color} 30%, var(--border))`,
                          color: phase.color,
                        }}
                      >
                        {phaseIndex === 0 ? (
                          <BookOpen size={18} />
                        ) : phaseIndex === 1 ? (
                          <Target size={18} />
                        ) : (
                          <Trophy size={18} />
                        )}
                      </div>
                    </div>

                    {/* Phase info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-ink font-display">
                          {phase.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-extrabold rounded-full bg-accent text-ink px-2 py-0.5 shadow-sm animate-pulse">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted font-semibold mt-0.5">
                        {phase.subtitle} · {phase.monthRange}
                      </div>
                    </div>

                    {/* Progress + chevron */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-text-muted tabular-nums font-mono">
                        {phaseProgress}%
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-text-muted transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                      />
                    </div>
                  </button>

                  {/* Phase progress bar */}
                  <div className="h-1 bg-bg-deep">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${phaseProgress}%`, background: phase.color }}
                    />
                  </div>

                  {/* Expanded: Week list */}
                  {isExpanded && (
                    <div className="p-4 flex flex-col gap-2">
                      {phase.weeks.map((week) => {
                        const weekProgress = getWeekProgressPercent(week);
                        const isCurrentWeek = week.weekNumber === currentWeek;
                        const isWeekExpanded = expandedWeek === week.weekNumber;
                        const FocusIcon = SKILL_ICONS[week.focusSkill] ?? Target;

                        return (
                          <div
                            key={week.weekNumber}
                            className={`border-2 rounded-xl overflow-hidden transition-all ${
                              isCurrentWeek
                                ? "border-accent/40 bg-accent/3"
                                : "border-border bg-surface-alt"
                            }`}
                          >
                            {/* Week header */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedWeek(isWeekExpanded ? null : week.weekNumber)
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer border-none bg-transparent text-left"
                            >
                              {/* Week number circle */}
                              <div
                                className="w-8 h-8 rounded-lg grid place-items-center text-xs font-black shrink-0 border-2"
                                style={{
                                  background: `color-mix(in srgb, ${SKILL_COLORS[week.focusSkill]} 10%, var(--surface))`,
                                  borderColor: `color-mix(in srgb, ${SKILL_COLORS[week.focusSkill]} 25%, var(--border))`,
                                  color: SKILL_COLORS[week.focusSkill],
                                }}
                              >
                                {week.weekNumber}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-extrabold text-ink truncate">
                                    {week.focusTopic}
                                  </span>
                                  {isCurrentWeek && (
                                    <span className="text-[8px] font-black rounded-full bg-accent text-ink px-1.5 py-px shrink-0">
                                      📍
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <FocusIcon
                                    size={12}
                                    className="shrink-0"
                                    style={{ color: SKILL_COLORS[week.focusSkill] }}
                                  />
                                  <span
                                    className="text-[10px] font-extrabold uppercase tracking-wider"
                                    style={{ color: SKILL_COLORS[week.focusSkill] }}
                                  >
                                    {SKILL_LABELS[week.focusSkill]}
                                  </span>
                                  <span className="text-[10px] text-text-muted font-bold ml-1">
                                    · {week.dailyPlan.length} days
                                  </span>
                                </div>
                              </div>

                              {/* Mini progress */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="w-16 h-1.5 rounded-full bg-bg-deep overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${weekProgress}%`,
                                      background: SKILL_COLORS[week.focusSkill],
                                    }}
                                  />
                                </div>
                                <ChevronDown
                                  size={14}
                                  className={`text-text-muted transition-transform duration-200 ${isWeekExpanded ? "" : "-rotate-90"}`}
                                />
                              </div>
                            </button>

                            {/* Expanded: Daily plan */}
                            {isWeekExpanded && (
                              <div className="px-4 pb-4 pt-1 flex flex-col gap-1.5 border-t-2 border-dashed border-border/40">
                                {week.dailyPlan.map((day) => (
                                  <div key={day.day} className="flex items-start gap-3">
                                    {/* Day label */}
                                    <div className="w-10 shrink-0 text-center">
                                      <span className="text-[10px] font-extrabold text-text-muted uppercase font-mono">
                                        {day.day}
                                      </span>
                                    </div>

                                    {/* Units */}
                                    <div className="flex-1 flex flex-col gap-1.5">
                                      {day.units.map((unit) => {
                                        const isCompleted = completedUnits.has(unit.id);
                                        const UnitIcon = SKILL_ICONS[unit.skill] ?? Target;

                                        return (
                                          <div
                                            key={unit.id}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all duration-150 ${
                                              isCompleted
                                                ? "border-success/30 bg-success/5"
                                                : "border-border bg-surface"
                                            }`}
                                          >
                                            {/* Toggle completion */}
                                            <button
                                              type="button"
                                              onClick={() => toggleUnit(unit.id)}
                                              className="shrink-0 border-none bg-transparent p-0 cursor-pointer"
                                            >
                                              {isCompleted ? (
                                                <Check size={16} className="text-success" />
                                              ) : (
                                                <Circle
                                                  size={16}
                                                  className="text-text-muted hover:text-accent transition-colors"
                                                />
                                              )}
                                            </button>

                                            <Link
                                              href={unit.exercises[0]?.routePath ?? "#"}
                                              className="no-underline flex-1 min-w-0 flex items-center gap-3 group"
                                            >
                                              <UnitIcon
                                                size={14}
                                                className="shrink-0"
                                                style={{ color: SKILL_COLORS[unit.skill] }}
                                              />
                                              <div className="flex-1 min-w-0">
                                                <div
                                                  className={`text-xs font-bold truncate ${isCompleted ? "text-text-muted line-through" : "text-ink group-hover:text-accent"} transition-colors`}
                                                >
                                                  {unit.title}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1.5 shrink-0">
                                                <Clock size={10} className="text-text-muted" />
                                                <span className="text-[10px] font-bold text-text-muted">
                                                  {unit.estimatedMinutes}m
                                                </span>
                                              </div>
                                            </Link>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}

                                {/* Go to week detail */}
                                <Link
                                  href={`/roadmap/week/${week.weekNumber}`}
                                  className="no-underline"
                                >
                                  <div className="flex items-center justify-center gap-1.5 px-4 py-2 mt-2 rounded-xl border-2 border-dashed border-border text-xs font-black text-text-secondary hover:border-accent hover:text-accent transition-colors cursor-pointer">
                                    View Full Week Details
                                    <ChevronRight size={14} />
                                  </div>
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Phase checkpoint */}
                      <div
                        className="mt-2 border-2 border-dashed rounded-xl p-4 flex items-center gap-3"
                        style={{
                          borderColor: `color-mix(in srgb, ${phase.color} 40%, var(--border))`,
                        }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${phase.color} 12%, var(--surface))`,
                            color: phase.color,
                          }}
                        >
                          <Trophy size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-ink font-display">
                            {phase.checkpoint.label}
                          </div>
                          <div className="text-[11px] text-text-muted font-semibold mt-0.5">
                            {phase.checkpoint.description}
                          </div>
                        </div>
                        <Link href={phase.checkpoint.routePath} className="no-underline shrink-0">
                          <div className="rounded-xl border-2 border-border px-3.5 py-2 text-xs font-black text-ink cursor-pointer hover:border-accent hover:text-accent transition-colors">
                            Take Test
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </Card>
              </m.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
