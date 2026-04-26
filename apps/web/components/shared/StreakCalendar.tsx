"use client";

import { useMemo } from "react";
import { Tooltip } from "antd";

type DayData = { date: string; count: number };

type Props = {
  dailyActivity: DayData[];
  currentStreak: number;
};

/**
 * GitHub-style streak calendar heatmap (12 weeks = ~84 days).
 * Uses the last 84 entries from dailyActivity data.
 */
export function StreakCalendar({ dailyActivity, currentStreak }: Props) {
  // Build the 12-week grid (Sunday-start columns)
  const { weeks, activityMap: _activityMap, maxCount } = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of dailyActivity) {
      map.set(d.date, d.count);
    }

    const today = new Date();
    const cells: { date: string; count: number; dayOfWeek: number }[] = [];

    // Go back 83 days from today
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      cells.push({
        date: dateStr,
        count: map.get(dateStr) ?? 0,
        dayOfWeek: d.getDay(), // 0=Sun, 6=Sat
      });
    }

    // Group into weeks (columns)
    const weekCols: typeof cells[] = [];
    let currentWeek: typeof cells = [];

    for (const cell of cells) {
      // Start a new week on Sunday
      if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
        weekCols.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    }
    if (currentWeek.length > 0) weekCols.push(currentWeek);

    const peak = Math.max(1, ...cells.map((c) => c.count));

    return { weeks: weekCols, activityMap: map, maxCount: peak };
  }, [dailyActivity]);

  // Color mapping based on intensity
  function getCellColor(count: number): string {
    if (count === 0) return "var(--heatmap-0)";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "var(--heatmap-1)";
    if (ratio <= 0.5) return "var(--heatmap-2)";
    if (ratio <= 0.75) return "var(--heatmap-3)";
    return "var(--heatmap-4)";
  }

  // Format date for tooltip
  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  const DAY_LABELS = ["", "T2", "", "T4", "", "T6", ""];
  const CELL_SIZE = 13;
  const GAP = 3;

  return (
    <div
      style={{
        padding: "20px 24px",
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Lịch hoạt động</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: "var(--fire)" }}>{currentStreak}</span>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>ngày streak</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", gap: GAP, overflowX: "auto", paddingBottom: 4 }}>
        {/* Day labels column */}
        <div style={{ display: "flex", flexDirection: "column", gap: GAP, paddingTop: 0, flexShrink: 0 }}>
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: CELL_SIZE,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                fontSize: 9,
                color: "var(--text-secondary)",
                fontWeight: 500,
                paddingRight: 2,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
            {/* Pad empty cells at top for partial first week */}
            {wi === 0 && Array.from({ length: week[0]?.dayOfWeek ?? 0 }).map((_, pi) => (
              <div key={`pad-${pi}`} style={{ width: CELL_SIZE, height: CELL_SIZE }} />
            ))}
            {week.map((cell) => {
              const isToday = cell.date === new Date().toISOString().slice(0, 10);
              return (
                <Tooltip
                  key={cell.date}
                  title={`${formatDate(cell.date)}: ${cell.count} hoạt động`}
                  placement="top"
                >
                  <div
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: 3,
                      background: getCellColor(cell.count),
                      border: isToday ? "2px solid var(--accent)" : "1px solid transparent",
                      cursor: "default",
                      transition: "transform 0.15s ease",
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.transform = "scale(1.3)"; }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.transform = "scale(1)"; }}
                  />
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10 }}>
        <span style={{ fontSize: 10, color: "var(--text-secondary)", marginRight: 4 }}>Ít</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: level === 0
                ? "var(--heatmap-0)"
                : level === 1
                  ? "var(--heatmap-1)"
                  : level === 2
                    ? "var(--heatmap-2)"
                    : level === 3
                      ? "var(--heatmap-3)"
                      : "var(--heatmap-4)",
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "var(--text-secondary)", marginLeft: 4 }}>Nhiều</span>
      </div>
    </div>
  );
}
