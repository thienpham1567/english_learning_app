"use client";

import { Calendar, Flame, Star } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api-client";

type DayData = { date: string; count: number; xp: number };

export function HeatmapCalendar() {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ days: DayData[] }>("/dashboard/heatmap")
      .then((d) => {
        if (!cancelled) setDays(d.days);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-4">
        <Card className="w-full h-32 bg-bg-deep animate-pulse shadow-none" />
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
    if (count === 0) return "bg-heatmap-0";
    const pct = count / maxCount;
    if (pct <= 0.25) return "bg-heatmap-1";
    if (pct <= 0.5) return "bg-heatmap-2";
    if (pct <= 0.75) return "bg-heatmap-3";
    return "bg-heatmap-4";
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card shadowSize="sm" className="rounded-2xl bg-surface p-5 flex flex-col gap-4">
        {/* Header section with icon & stats */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            <span className="text-xs font-extrabold text-text-primary font-display tracking-wide">
              Learning Frequency
            </span>
          </div>

          {/* Mini stats capsules */}
          <div className="flex gap-2">
            <div className="flex items-center gap-1.5 bg-surface-alt border-2 border-border px-3 py-1 rounded-xl shadow-sm">
              <Flame className="text-accent h-3 w-3" />
              <span className="text-xs font-extrabold text-text-primary font-mono">
                {activeDays}
              </span>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider font-display">
                active days
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-surface-alt border-2 border-border px-3 py-1 rounded-xl shadow-sm">
              <Star className="text-warning h-3 w-3 fill-current" />
              <span className="text-xs font-extrabold text-text-primary font-mono">
                {totalXP.toLocaleString()}
              </span>
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider font-display">
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
                className="h-3 w-6 text-[10px] text-text-secondary flex items-center font-bold font-mono"
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
                    return <div key={`empty-${di}`} className="w-3 h-3" />;
                  }
                  const dateObj = new Date(day.date);
                  const label = dateObj.toLocaleDateString("en-US", {
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
                        )} ${isToday ? "border-2 border-accent" : "border border-transparent"}`}
                      />

                      {/* Custom HTML Hover Tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-foreground border-2 border-border text-background text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap">
                        <div className="font-extrabold mb-0.5 text-background">{label}</div>
                        <div className="text-background/80 font-bold">
                          {day.count} activities ·{" "}
                          <span className="text-accent font-extrabold">{day.xp} XP</span>
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
        <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-text-muted font-mono">
          <span className="mr-1">Less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-[2px] ${
                pct === 0
                  ? "bg-heatmap-0 border-2 border-border/20"
                  : pct <= 0.25
                    ? "bg-heatmap-1"
                    : pct <= 0.5
                      ? "bg-heatmap-2"
                      : pct <= 0.75
                        ? "bg-heatmap-3"
                        : "bg-heatmap-4"
              }`}
            />
          ))}
          <span className="ml-1">More</span>
        </div>
      </Card>
    </motion.div>
  );
}
