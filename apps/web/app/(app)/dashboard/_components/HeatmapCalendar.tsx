"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { api } from "@/lib/api-client";
import { Flame, Star, Calendar } from "lucide-react";

type DayData = { date: string; count: number; xp: number };

export function HeatmapCalendar() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get<{ days: DayData[] }>("/dashboard/heatmap")
      .then((d) => { if (!cancelled) setDays(d.days); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="py-4">
        <div className="w-full h-32 rounded-2xl bg-slate-900 border border-slate-850 animate-pulse" />
      </div>
    );
  }

  // Build a 90-day grid
  const today = new Date();
  const grid: Array<{ date: string; count: number; xp: number }> = [];
  const dayMap = new Map(days.map((d) => [d.date, d]));

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const entry = dayMap.get(key);
    grid.push({ date: key, count: entry?.count ?? 0, xp: entry?.xp ?? 0 });
  }

  const maxCount = Math.max(...grid.map((d) => d.count), 1);
  const weeks: Array<typeof grid> = [];
  // Pad start so first cell aligns to correct day of week
  const firstDow = new Date(grid[0].date).getDay(); // 0=Sun
  const padded = [...Array(firstDow).fill(null), ...grid];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  const totalXP = grid.reduce((s, d) => s + d.xp, 0);
  const activeDays = grid.filter((d) => d.count > 0).length;

  // Custom premium contribution colors
  function getIntensity(count: number): string {
    if (count === 0) return "bg-slate-900/30";
    const pct = count / maxCount;
    if (pct <= 0.25) return "bg-accent/30";
    if (pct <= 0.5) return "bg-accent/55";
    if (pct <= 0.75) return "bg-accent/80";
    return "bg-accent";
  }

  const dayLabels = ["", "T2", "", "T4", "", "T6", ""];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col gap-4"
    >
      {/* Header section with icon & stats */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-accent" />
          </div>
          <span className="text-xs font-extrabold text-slate-100 font-display tracking-wide">
            Tần suất học tập
          </span>
        </div>

        {/* Mini stats capsules */}
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-850 px-3 py-1 rounded-full">
            <Flame className="text-accent h-3 w-3" />
            <span className="text-xs font-bold text-slate-200 font-mono">
              {activeDays}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              ngày hoạt động
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-850 px-3 py-1 rounded-full">
            <Star className="text-amber-400 h-3 w-3 fill-current" />
            <span className="text-xs font-bold text-slate-200 font-mono">
              {totalXP.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              XP
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap grid scroll wrapper */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 pt-0.5 shrink-0">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-3 w-6 text-[10px] text-slate-500 flex items-center font-bold font-mono"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid Weeks */}
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 shrink-0">
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${di}`}
                      className="w-3 h-3"
                    />
                  );
                }
                const dateObj = new Date(day.date);
                const label = dateObj.toLocaleDateString("vi-VN", {
                  day: "numeric",
                  month: "short",
                });
                const isToday = day.date === today.toISOString().slice(0, 10);

                return (
                  <div key={day.date} className="relative group">
                    <motion.div
                      whileHover={{ scale: 1.25, zIndex: 10 }}
                      className={`w-3 h-3 rounded-[3px] cursor-pointer transition-all duration-200 ${getIntensity(
                        day.count,
                      )} ${isToday ? "border-[1.5px] border-accent shadow-[0_0_6px_var(--accent)]" : "border border-transparent"}`}
                    />
                    
                    {/* Custom HTML Hover Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-950 border border-slate-800 text-slate-200 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap">
                      <div className="font-bold mb-0.5 text-slate-100">{label}</div>
                      <div className="text-slate-400">
                        {day.count} hoạt động · <span className="text-accent font-bold">{day.xp} XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend bar */}
      <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-slate-500 font-mono">
        <span className="mr-1">Ít hoạt động</span>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-[2px] ${
              pct === 0
                ? "bg-slate-900/30 border border-slate-850"
                : pct <= 0.25
                ? "bg-accent/30"
                : pct <= 0.5
                ? "bg-accent/55"
                : pct <= 0.75
                ? "bg-accent/80"
                : "bg-accent"
            }`}
          />
        ))}
        <span className="ml-1">Nhiều</span>
      </div>
    </motion.div>
  );
}
