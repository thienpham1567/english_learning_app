"use client";

import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock,
  Headphones,
  Mic,
  PenTool,
  Star,
  Target,
} from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getPhaseForWeek,
  getWeek,
  SKILL_COLORS,
  SKILL_LABELS,
  type Skill,
} from "@/lib/curriculum/data";
import { useRoadmap } from "@/lib/curriculum/roadmap-context";

const SKILL_ICONS: Record<Skill, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  grammar: BookOpen,
  listening: Headphones,
  reading: BookOpen,
  speaking: Mic,
  writing: PenTool,
  vocabulary: Star,
  review: Target,
};

const DAY_LABELS: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

export default function WeekDetailPage() {
  const params = useParams();
  const weekNumber = Number(params.weekNumber);
  const week = getWeek(weekNumber);
  const phase = getPhaseForWeek(weekNumber);
  const { completedSet: completedUnits, toggleUnit, getWeekProgress } = useRoadmap();

  if (!week || !phase) {
    return (
      <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
        <div className="p-5 pb-16 max-w-[900px] mx-auto w-full">
          <div className="border-2 border-border rounded-2xl bg-surface shadow-sm p-6 text-center">
            <p className="text-sm font-bold text-text-secondary">Week not found</p>
            <Link href="/roadmap" className="text-xs font-black text-accent mt-2 inline-block">
              ← Back to Roadmap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const weekProg = getWeekProgress(weekNumber);
  const totalMinutes = week.dailyPlan.reduce(
    (acc, d) => acc + d.units.reduce((a, u) => a + u.estimatedMinutes, 0),
    0,
  );

  const FocusIcon = SKILL_ICONS[week.focusSkill] ?? Target;

  return (
    <div className="flex flex-col h-full min-h-0 flex-1 overflow-auto">
      <div className="p-5 pb-16 max-w-[900px] mx-auto w-full flex flex-col gap-5">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted">
          <Link href="/roadmap" className="no-underline flex items-center gap-1 text-text-muted hover:text-accent transition-colors">
            <ArrowLeft size={14} />
            Roadmap
          </Link>
          <ChevronRight size={12} />
          <span style={{ color: phase.color }}>{phase.title}</span>
          <ChevronRight size={12} />
          <span className="text-ink">Week {weekNumber}</span>
        </div>

        {/* Week header card */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-border rounded-2xl bg-surface shadow-sm p-6 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: phase.color }}
          />

          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 border-2"
              style={{
                background: `color-mix(in srgb, ${SKILL_COLORS[week.focusSkill]} 12%, var(--surface))`,
                borderColor: `color-mix(in srgb, ${SKILL_COLORS[week.focusSkill]} 30%, var(--border))`,
                color: SKILL_COLORS[week.focusSkill],
              }}
            >
              <span className="text-xl font-black font-display">{weekNumber}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-black text-ink font-display m-0">
                {week.focusTopic}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <FocusIcon
                    size={13}
                    style={{ color: SKILL_COLORS[week.focusSkill] }}
                  />
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-wider"
                    style={{ color: SKILL_COLORS[week.focusSkill] }}
                  >
                    {SKILL_LABELS[week.focusSkill]}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-bold">
                  {phase.monthRange} · {phase.title}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock size={12} className="text-text-muted" />
                  <span className="text-[11px] font-bold text-text-muted">
                    ~{totalMinutes} min total
                  </span>
                </div>
                <div className="text-[11px] font-bold text-text-muted">
                  {weekProg.completed}/{weekProg.total} units
                </div>
                <div className="flex-1" />
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-bg-deep overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${weekProg.percent}%`, background: SKILL_COLORS[week.focusSkill] }}
                    />
                  </div>
                  <span className="text-xs font-black text-text-muted tabular-nums font-mono">
                    {weekProg.percent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </m.div>

        {/* Daily breakdown */}
        {week.dailyPlan.map((day, dayIndex) => (
          <m.div
            key={day.day}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + dayIndex * 0.04 }}
            className="border-2 border-border rounded-2xl bg-surface shadow-sm overflow-hidden"
          >
            {/* Day header */}
            <div className="px-5 py-3 border-b-2 border-border bg-surface-alt flex items-center gap-3">
              <span className="text-xs font-extrabold text-text-muted uppercase tracking-wider font-mono w-10">
                {day.day.toUpperCase()}
              </span>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm font-black text-ink font-display">
                {DAY_LABELS[day.day]} — {day.label}
              </span>
              <span className="ml-auto text-[10px] font-bold text-text-muted">
                {day.units.reduce((a, u) => a + u.estimatedMinutes, 0)} min
              </span>
            </div>

            {/* Units */}
            <div className="p-4 flex flex-col gap-3">
              {day.units.map((unit) => {
                const isCompleted = completedUnits.has(unit.id);
                const UnitIcon = SKILL_ICONS[unit.skill] ?? Target;

                return (
                  <div
                    key={unit.id}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      isCompleted
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-surface-alt"
                    }`}
                  >
                    {/* Unit header */}
                    <div className="flex items-center gap-3 mb-2">
                      {/* Toggle completion */}
                      <button
                        type="button"
                        onClick={() => toggleUnit(unit.id)}
                        className="shrink-0 border-none bg-transparent p-0 cursor-pointer"
                      >
                        {isCompleted ? (
                          <Check size={18} className="text-success" />
                        ) : (
                          <Circle size={18} className="text-text-muted hover:text-accent transition-colors" />
                        )}
                      </button>

                      <UnitIcon
                        size={16}
                        style={{ color: SKILL_COLORS[unit.skill] }}
                      />
                      <span className={`text-sm font-extrabold flex-1 ${isCompleted ? "text-text-muted line-through" : "text-ink"}`}>
                        {unit.title}
                      </span>
                      <span
                        className="text-[9px] font-extrabold rounded-lg px-2 py-0.5 border uppercase tracking-wider"
                        style={{
                          background: `color-mix(in srgb, ${SKILL_COLORS[unit.skill]} 10%, transparent)`,
                          color: SKILL_COLORS[unit.skill],
                          borderColor: `color-mix(in srgb, ${SKILL_COLORS[unit.skill]} 20%, transparent)`,
                        }}
                      >
                        {SKILL_LABELS[unit.skill]}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary font-medium m-0 mb-3 leading-relaxed">
                      {unit.description}
                    </p>

                    {/* Exercise links */}
                    <div className="flex flex-wrap gap-2">
                      {unit.exercises.map((ex, exIdx) => (
                        <Link
                          key={exIdx}
                          href={ex.routePath}
                          className="no-underline group"
                        >
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-border bg-surface text-xs font-bold text-ink cursor-pointer hover:border-accent hover:text-accent hover:-translate-y-0.5 hover:shadow-sm transition-all duration-150">
                            <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-wider">
                              {ex.type}
                            </span>
                            <span className="w-px h-3 bg-border" />
                            {ex.label}
                            <ChevronRight size={12} className="text-text-muted group-hover:text-accent transition-colors" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 mt-3">
                      <Clock size={11} className="text-text-muted" />
                      <span className="text-[10px] font-bold text-text-muted">
                        ~{unit.estimatedMinutes} minutes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </m.div>
        ))}
      </div>
    </div>
  );
}
