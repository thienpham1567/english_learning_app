"use client";

import { useEffect, useState } from "react";
import { LoadingOutlined, CrownOutlined } from "@ant-design/icons";

type LeaderboardEntry = {
  rank: number;
  badge: string | null;
  name: string;
  xp: number;
  isCurrentUser: boolean;
};

type LeaderboardData = {
  entries: LeaderboardEntry[];
  currentUser: { rank: number; xp: number };
  weekStart: string;
};

/**
 * Weekly Leaderboard widget for the Home page (Story 15.4).
 */
export function WeeklyLeaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: 24,
        borderRadius: "var(--radius-lg, 16px)",
        border: "1px solid var(--border)",
        background: "var(--card-bg, var(--surface))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 100,
      }}>
        <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
      </div>
    );
  }

  if (!data || data.entries.length === 0) return null;

  const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"]; // gold, silver, bronze

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
          <CrownOutlined style={{ fontSize: 18, color: "#FFD700" }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Bảng xếp hạng tuần</span>
        </div>
        <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          #{data.currentUser.rank} · {data.currentUser.xp} XP
        </span>
      </div>

      {/* Entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.entries.map((entry) => (
          <div
            key={entry.rank}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 10,
              background: entry.isCurrentUser
                ? "var(--accent-muted, rgba(99,102,241,0.08))"
                : "transparent",
              border: entry.isCurrentUser
                ? "1px solid var(--accent)"
                : "1px solid transparent",
              transition: "all 0.15s ease",
            }}
          >
            {/* Rank */}
            <div style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: entry.badge ? 16 : 12,
              fontWeight: 700,
              background: entry.rank <= 3
                ? `${RANK_COLORS[entry.rank - 1]}22`
                : "var(--border)",
              color: entry.rank <= 3
                ? RANK_COLORS[entry.rank - 1]
                : "var(--text-secondary)",
              flexShrink: 0,
            }}>
              {entry.badge ?? entry.rank}
            </div>

            {/* Name */}
            <span style={{
              flex: 1,
              fontSize: 13,
              fontWeight: entry.isCurrentUser ? 700 : 500,
              color: entry.isCurrentUser ? "var(--accent)" : "var(--text)",
            }}>
              {entry.name}
            </span>

            {/* XP */}
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "var(--text-secondary)",
            }}>
              {entry.xp.toLocaleString()} XP
            </span>

            {/* XP bar */}
            <div style={{
              width: 60,
              height: 6,
              borderRadius: 3,
              background: "var(--border)",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              <div style={{
                width: `${Math.min((entry.xp / (data.entries[0]?.xp || 1)) * 100, 100)}%`,
                height: "100%",
                borderRadius: 3,
                background: entry.rank <= 3
                  ? RANK_COLORS[entry.rank - 1]
                  : "var(--accent)",
                transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 12,
        fontSize: 10,
        color: "var(--text-secondary)",
        textAlign: "center",
        opacity: 0.6,
      }}>
        Hàng tuần reset lúc 00:00 Thứ Hai
      </div>
    </div>
  );
}
