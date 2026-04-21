"use client";

import { useEffect, useState, useRef } from "react";
import { Card, Flex, Typography, message } from "antd";
import {
  ReadOutlined,
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { api } from "@/lib/api-client";

const { Text } = Typography;

type ReadingStats = {
  todayWords: number;
  weekWords: number;
  monthWords: number;
  totalWords: number;
  streak: number;
  heatmap: Array<{ date: string; count: number }>;
};

// ── Milestones (AC4) ──
const MILESTONES = [
  { threshold: 10_000, label: "10K từ", emoji: "📗" },
  { threshold: 50_000, label: "50K từ", emoji: "📘" },
  { threshold: 100_000, label: "100K từ", emoji: "📙" },
  { threshold: 500_000, label: "500K từ", emoji: "📕" },
  { threshold: 1_000_000, label: "1M từ", emoji: "🏆" },
];

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Heatmap (reusing the same pattern as progress page) ──
function ReadingHeatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  function getIntensity(count: number) {
    if (count === 0) return "var(--border)";
    const ratio = count / max;
    if (ratio > 0.75) return "#52c41a";
    if (ratio > 0.5) return "#95de64";
    if (ratio > 0.25) return "#b7eb8f";
    return "#d9f7be";
  }

  const weeks: typeof data[] = [];
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <Flex gap={3}>
        {weeks.map((week, wi) => (
          <Flex key={wi} vertical gap={3}>
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${formatNum(day.count)} từ`}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  background: getIntensity(day.count),
                  transition: "background 0.2s",
                }}
              />
            ))}
          </Flex>
        ))}
      </Flex>
      <Flex justify="space-between" style={{ marginTop: 8 }}>
        <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>90 ngày trước</Text>
        <Flex align="center" gap={4}>
          <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>Ít</Text>
          {["var(--border)", "#d9f7be", "#b7eb8f", "#95de64", "#52c41a"].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
          ))}
          <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>Nhiều</Text>
        </Flex>
      </Flex>
    </div>
  );
}

/**
 * ReadingStatsBlock (Story 19.4.3, AC3 + AC4)
 *
 * Renders reading progress: today/week/month word counts, streak,
 * 90-day heatmap, and milestone badges.
 */
export function ReadingStatsBlock() {
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgApi, contextHolder] = message.useMessage();
  const shownMilestonesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    api.get<ReadingStats>("/reading/session/stats")
      .then((data) => {
        setStats(data);

        // Milestone detection (AC4)
        for (const m of MILESTONES) {
          if (data.totalWords >= m.threshold && !shownMilestonesRef.current.has(m.threshold)) {
            shownMilestonesRef.current.add(m.threshold);
            msgApi.success(`${m.emoji} Milestone: Bạn đã đọc ${m.label}!`, 5);
          }
        }
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [msgApi]);

  if (loading || !stats) return null;

  const nextMilestone = MILESTONES.find((m) => stats.totalWords < m.threshold);

  return (
    <>
      {contextHolder}
      <Card
        title={
          <span>
            <ReadOutlined style={{ marginRight: 6 }} /> Đọc hiểu
          </span>
        }
        style={{ borderRadius: "var(--radius-xl)" }}
        styles={{ header: { borderBottom: "1px solid var(--border)" } }}
      >
        <Flex vertical gap={16}>
          {/* Word count stats row */}
          <Flex gap={12} wrap style={{ width: "100%" }}>
            {[
              { label: "Hôm nay", value: stats.todayWords, icon: <CalendarOutlined />, color: "#52c41a" },
              { label: "Tuần này", value: stats.weekWords, icon: <ReadOutlined />, color: "#1890ff" },
              { label: "Tháng này", value: stats.monthWords, icon: <ReadOutlined />, color: "#722ed1" },
              { label: "Streak", value: `${stats.streak} ngày`, icon: <FireOutlined />, color: "var(--fire, #ff4d4f)" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 100,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                }}
              >
                <Flex vertical gap={2}>
                  <span style={{ fontSize: 14, color: s.color }}>{s.icon}</span>
                  <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                    {typeof s.value === "number" ? formatNum(s.value) : s.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.label}</Text>
                </Flex>
              </div>
            ))}
          </Flex>

          {/* Total + milestone progress */}
          <Flex align="center" justify="space-between" style={{ padding: "0 4px" }}>
            <Text style={{ fontSize: 13 }}>
              Tổng: <strong>{formatNum(stats.totalWords)}</strong> từ đã đọc
            </Text>
            {nextMilestone && (
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <TrophyOutlined style={{ marginRight: 4 }} />
                Tiếp theo: {nextMilestone.emoji} {nextMilestone.label}
                {" "}({Math.round((stats.totalWords / nextMilestone.threshold) * 100)}%)
              </Text>
            )}
          </Flex>

          {/* Milestone badges */}
          <Flex gap={8} wrap>
            {MILESTONES.map((m) => {
              const unlocked = stats.totalWords >= m.threshold;
              return (
                <div
                  key={m.threshold}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 20,
                    border: `1px solid ${unlocked ? "#52c41a" : "var(--border)"}`,
                    background: unlocked ? "#52c41a10" : "var(--surface)",
                    fontSize: 12,
                    color: unlocked ? "#52c41a" : "var(--text-muted)",
                    opacity: unlocked ? 1 : 0.5,
                  }}
                >
                  {m.emoji} {m.label}
                </div>
              );
            })}
          </Flex>

          {/* 90-day heatmap */}
          <div>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, display: "block" }}>
              Lịch đọc 90 ngày
            </Text>
            <ReadingHeatmap data={stats.heatmap} />
          </div>
        </Flex>
      </Card>
    </>
  );
}
