"use client";

import { useEffect, useState } from "react";
import * as m from "motion/react-client";
import { Tooltip, Skeleton } from "antd";
import { api } from "@/lib/api-client";
import { FireOutlined, StarOutlined, CalendarOutlined } from "@ant-design/icons";

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
        <Skeleton.Button active style={{ width: "100%", height: 120, borderRadius: 16 }} block />
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
    if (count === 0) return "var(--surface-alt)";
    const pct = count / maxCount;
    if (pct <= 0.25) return "color-mix(in srgb, var(--accent) 30%, var(--surface))";
    if (pct <= 0.5) return "color-mix(in srgb, var(--accent) 55%, var(--surface))";
    if (pct <= 0.75) return "color-mix(in srgb, var(--accent) 80%, var(--surface))";
    return "var(--accent)";
  }

  const dayLabels = ["", "T2", "", "T4", "", "T6", ""];

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "20px",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header section with icon & stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent-light)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <CalendarOutlined style={{ fontSize: 14, color: "var(--accent)" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Tần suất học tập
          </span>
        </div>

        {/* Mini stats capsules */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              padding: "4px 12px",
              borderRadius: 99,
            }}
          >
            <FireOutlined style={{ color: "var(--accent)", fontSize: 12 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {activeDays}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
              ngày hoạt động
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              padding: "4px 12px",
              borderRadius: 99,
            }}
          >
            <StarOutlined style={{ color: "var(--xp)", fontSize: 12 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              {totalXP.toLocaleString()}
            </span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>
              XP
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap grid scroll wrapper */}
      <div
        style={{
          display: "flex",
          gap: 4,
          overflowX: "auto",
          paddingBottom: 6,
          scrollbarWidth: "thin",
        }}
        className="custom-scrollbar"
      >
        {/* Day labels column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 2, flexShrink: 0 }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              style={{
                height: 12,
                width: 24,
                fontSize: 10,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                fontWeight: 700,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid Weeks */}
        <div style={{ display: "flex", gap: 4 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
              {week.map((day, di) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${di}`}
                      style={{ width: 12, height: 12 }}
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
                  <Tooltip
                    key={day.date}
                    title={
                      <div style={{ fontSize: 11, padding: "2px 4px" }}>
                        <div style={{ fontWeight: 800, marginBottom: 2 }}>{label}</div>
                        <div style={{ opacity: 0.9 }}>
                          {day.count} hoạt động · <span style={{ color: "var(--xp)", fontWeight: 700 }}>{day.xp} XP</span>
                        </div>
                      </div>
                    }
                    placement="top"
                    arrow
                  >
                    <m.div
                      whileHover={{ scale: 1.25, zIndex: 10 }}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: getIntensity(day.count),
                        border: isToday
                          ? "1.5px solid var(--accent)"
                          : "1px solid transparent",
                        boxShadow: isToday ? "0 0 6px var(--accent)" : "none",
                        cursor: "pointer",
                        transition: "background 0.2s, border-color 0.2s",
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          justifyContent: "flex-end",
          fontSize: 10,
          fontWeight: 600,
          color: "var(--text-muted)",
        }}
      >
        <span style={{ marginRight: 4 }}>Ít hoạt động</span>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background:
                pct === 0
                  ? "var(--surface-alt)"
                  : pct <= 0.25
                  ? "color-mix(in srgb, var(--accent) 30%, var(--surface))"
                  : pct <= 0.5
                  ? "color-mix(in srgb, var(--accent) 55%, var(--surface))"
                  : pct <= 0.75
                  ? "color-mix(in srgb, var(--accent) 80%, var(--surface))"
                  : "var(--accent)",
              border: pct === 0 ? "1px solid var(--border)" : "none",
            }}
          />
        ))}
        <span style={{ marginLeft: 4 }}>Nhiều</span>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </m.div>
  );
}
