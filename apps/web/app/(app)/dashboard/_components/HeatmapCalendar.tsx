"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-client";
import { Tooltip, Skeleton } from "antd";
import { api } from "@/lib/api-client";

type DayData = { date: string; count: number; xp: number };

/**
 * GitHub-style contribution heatmap showing 90 days of learning activity.
 * Each cell represents one day; intensity reflects activity count.
 */
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
      <div style={{ padding: "16px 0" }}>
        <Skeleton.Button active style={{ width: "100%", height: 100 }} block />
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

  function getIntensity(count: number): string {
    if (count === 0) return "var(--border)";
    const pct = count / maxCount;
    if (pct <= 0.25) return "color-mix(in srgb, var(--accent) 25%, var(--surface))";
    if (pct <= 0.5) return "color-mix(in srgb, var(--accent) 45%, var(--surface))";
    if (pct <= 0.75) return "color-mix(in srgb, var(--accent) 65%, var(--surface))";
    return "var(--accent)";
  }

  const dayLabels = ["", "T2", "", "T4", "", "T6", ""];

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
            {activeDays}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginLeft: 4 }}>
            ngày hoạt động
          </span>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--xp, #eab308)", fontFamily: "var(--font-display)" }}>
            {totalXP.toLocaleString()}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, marginLeft: 4 }}>
            XP (90 ngày)
          </span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
        {/* Day labels */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 0, flexShrink: 0 }}>
          {dayLabels.map((label, i) => (
            <div key={i} style={{ height: 12, width: 20, fontSize: 9, color: "var(--text-muted)", display: "flex", alignItems: "center", fontWeight: 600 }}>
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {week.map((day, di) => {
              if (!day) {
                return <div key={`empty-${di}`} style={{ width: 12, height: 12 }} />;
              }
              const dateObj = new Date(day.date);
              const label = dateObj.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
              return (
                <Tooltip
                  key={day.date}
                  title={
                    <div style={{ fontSize: 11 }}>
                      <div style={{ fontWeight: 700 }}>{label}</div>
                      <div>{day.count} hoạt động · {day.xp} XP</div>
                    </div>
                  }
                  placement="top"
                >
                  <m.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: wi * 0.02 }}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: getIntensity(day.count),
                      border: day.date === today.toISOString().slice(0, 10)
                        ? "1.5px solid var(--accent)"
                        : "1px solid transparent",
                      cursor: "default",
                      transition: "background 0.2s",
                    }}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginRight: 4 }}>Ít</span>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: pct === 0 ? "var(--border)" :
                pct <= 0.25 ? "color-mix(in srgb, var(--accent) 25%, var(--surface))" :
                pct <= 0.5 ? "color-mix(in srgb, var(--accent) 45%, var(--surface))" :
                pct <= 0.75 ? "color-mix(in srgb, var(--accent) 65%, var(--surface))" :
                "var(--accent)",
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 4 }}>Nhiều</span>
      </div>
    </m.div>
  );
}
