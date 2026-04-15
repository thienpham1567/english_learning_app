"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, Flex, Typography, Spin, Result, Button } from "antd";
import {
  ReloadOutlined,
  TrophyOutlined,
  BookOutlined,
  FireOutlined,
  ThunderboltOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";
import { PredictedScore } from "@/components/app/shared";

const { Title, Text } = Typography;

// ── Types ──

interface AnalyticsData {
  weeklyXP: Array<{ week: string; xp: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
  vocabularyGrowth: Array<{ week: string; total_words: number }>;
  accuracyTrends: Array<{ week: string; accuracy: number }>;
  skillRadar: Array<{ axis: string; icon: string; score: number; sessions: number; avgXp: number }>;
  totalStats: {
    totalXP: number;
    totalWords: number;
    totalQuizzes: number;
    totalActivities: number;
    currentStreak: number;
    bestStreak: number;
  };
}

// ── Level utility (shared with dashboard) ──

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2400, 3200, 4200,
  5400, 6800, 8500, 10500, 13000, 16000, 19500, 23500, 28000, 33000,
  38500, 44500, 51000, 58000, 65500, 73500, 82000, 91000, 100500, 110500,
  121000, 132000, 143500, 155500, 168000, 181000, 194500, 208500, 223000, 238000,
  253500, 269500, 286000, 303000, 320500, 338500, 357000, 376000, 395500, 415500,
];

function getLevel(xp: number) {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

// ── Stat Card ──

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card style={{ borderRadius: "var(--radius-xl)", flex: 1, minWidth: 140 }} styles={{ body: { padding: "16px 20px" } }}>
      <Flex vertical gap={4}>
        <span style={{ fontSize: 20, color }}>{icon}</span>
        <Text style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          {value}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
      </Flex>
    </Card>
  );
}

// ── Bar Chart (CSS) ──

function BarChart({ data, labelKey, valueKey, color }: {
  data: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
  color: string;
}) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);

  return (
    <Flex align="flex-end" gap={4} style={{ height: 120, width: "100%" }}>
      {data.map((d, i) => {
        const val = values[i];
        const height = Math.max((val / max) * 100, 2);
        const label = String(d[labelKey]).slice(5, 10); // MM-DD
        return (
          <Flex key={i} vertical align="center" gap={4} style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>{val > 0 ? val : ""}</Text>
            <div
              style={{
                width: "100%",
                maxWidth: 28,
                height: `${height}%`,
                borderRadius: 4,
                background: val > 0 ? color : "var(--border)",
                transition: "height 0.3s ease",
              }}
            />
            <Text style={{ fontSize: 9, color: "var(--text-muted)" }}>{label}</Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

// ── Skill Radar Chart (SVG) ──

function SkillRadar({ data }: { data: AnalyticsData["skillRadar"] }) {
  const cx = 150;
  const cy = 150;
  const maxR = 110;
  const levels = [20, 40, 60, 80, 100];
  const n = data.length;

  function polarToXY(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  const angleStep = 360 / n;

  // Grid lines (pentagons/hexagons)
  const gridPaths = levels.map((lv) => {
    const r = (lv / 100) * maxR;
    const points = Array.from({ length: n }, (_, i) => {
      const { x, y } = polarToXY(i * angleStep, r);
      return `${x},${y}`;
    });
    return points.join(" ");
  });

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.score / 100) * maxR;
    return polarToXY(i * angleStep, r);
  });
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Axis lines
  const axes = data.map((_, i) => polarToXY(i * angleStep, maxR));

  // Labels
  const labels = data.map((d, i) => {
    const pos = polarToXY(i * angleStep, maxR + 22);
    return { ...d, x: pos.x, y: pos.y };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: 320 }}>
        {/* Grid */}
        {gridPaths.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--border)"
            strokeWidth={0.5}
            opacity={0.6}
          />
        ))}

        {/* Axes */}
        {axes.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border)" strokeWidth={0.5} />
        ))}

        {/* Data fill */}
        <polygon
          points={dataPath}
          fill="var(--accent)"
          fillOpacity={0.2}
          stroke="var(--accent)"
          strokeWidth={2}
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="var(--accent)" />
        ))}

        {/* Labels */}
        {labels.map((l, i) => (
          <text
            key={i}
            x={l.x}
            y={l.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fontWeight={600}
            fill="var(--text-secondary)"
          >
            {l.axis}
          </text>
        ))}
      </svg>

      {/* Score list */}
      <Flex gap={8} wrap style={{ justifyContent: "center" }}>
        {data.map((d) => (
          <div
            key={d.axis}
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              fontSize: 12,
            }}
          >
            <strong style={{ color: "var(--accent)" }}>{d.score}</strong>
            <span style={{ color: "var(--text-secondary)", marginLeft: 4 }}>{d.axis}</span>
            <span style={{ color: "var(--text-muted)", marginLeft: 4, fontSize: 10 }}>({d.sessions}x)</span>
          </div>
        ))}
      </Flex>
    </div>
  );
}

// ── Contribution Heatmap (CSS grid) ──

function ActivityHeatmap({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  function getIntensity(count: number) {
    if (count === 0) return "var(--border)";
    const ratio = count / max;
    if (ratio > 0.75) return "var(--accent)";
    if (ratio > 0.5) return "color-mix(in srgb, var(--accent) 70%, var(--surface))";
    if (ratio > 0.25) return "color-mix(in srgb, var(--accent) 40%, var(--surface))";
    return "color-mix(in srgb, var(--accent) 20%, var(--surface))";
  }

  // Group into weeks (columns of 7)
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
                title={`${day.date}: ${day.count} hoạt động`}
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
          {[0, 0.25, 0.5, 0.75, 1].map((r) => (
            <div
              key={r}
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: r === 0 ? "var(--border)" : `color-mix(in srgb, var(--accent) ${r * 100}%, var(--surface))`,
              }}
            />
          ))}
          <Text style={{ fontSize: 10, color: "var(--text-muted)" }}>Nhiều</Text>
        </Flex>
      </Flex>
    </div>
  );
}

// ── SVG Line Chart ──

function LineChart({ data, labelKey, valueKey, color, suffix = "" }: {
  data: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
  color: string;
  suffix?: string;
}) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const width = 400;
  const height = 100;
  const padding = 20;

  const points = values.map((v, i) => ({
    x: padding + (i / Math.max(values.length - 1, 1)) * (width - 2 * padding),
    y: height - padding - (v / max) * (height - 2 * padding),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1]?.x ?? width} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: 120 }}>
      {/* Area fill */}
      <path d={areaD} fill={color} opacity={0.1} />
      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3} fill={color} />
          {values[i] > 0 && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
              {values[i]}{suffix}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Page ──

export default function ProgressPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await api.get<AnalyticsData>("/analytics");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang phân tích dữ liệu...</Text>
      </Flex>
    );
  }

  if (error || !data) {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", padding: 32 }}>
        <Result
          status="error"
          title="Không thể tải dữ liệu"
          subTitle={error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={fetchAnalytics}>Thử lại</Button>}
        />
      </Flex>
    );
  }

  const { totalStats } = data;
  const level = getLevel(totalStats.totalXP);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <Flex vertical gap="var(--space-6)">

        {/* Section 1: Stat Cards */}
        <Flex gap={12} wrap style={{ width: "100%" }}>
          <StatCard icon={<ThunderboltOutlined />} label="Tổng XP" value={totalStats.totalXP.toLocaleString()} color="var(--xp)" />
          <StatCard icon={<BookOutlined />} label="Từ đã lưu" value={totalStats.totalWords} color="var(--accent)" />
          <StatCard icon={<FireOutlined />} label="Streak hiện tại" value={`${totalStats.currentStreak} ngày`} color="var(--fire)" />
          <StatCard icon={<TrophyOutlined />} label="Level" value={`Lv.${level}`} color="var(--secondary)" />
        </Flex>

        {/* Section 1.5: Predicted TOEIC Score (Story 14.2) */}
        <PredictedScore />

        {/* Section 2: Skill Radar */}
        {data.skillRadar && data.skillRadar.length > 0 && (
          <Card
            title={<span><RadarChartOutlined style={{ marginRight: 6 }} /> Biểu đồ kỹ năng</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <SkillRadar data={data.skillRadar} />
          </Card>
        )}

        {/* Section 3: Weekly XP Bar Chart */}
        <Card
          title={<span><ThunderboltOutlined style={{ marginRight: 6 }} /> XP theo tuần (12 tuần)</span>}
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <BarChart data={data.weeklyXP} labelKey="week" valueKey="xp" color="var(--accent)" />
        </Card>

        {/* Section 3: Activity Heatmap */}
        <Card
          title={<span><FireOutlined style={{ marginRight: 6 }} /> Hoạt động 90 ngày</span>}
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <ActivityHeatmap data={data.dailyActivity} />
        </Card>

        {/* Section 4 + 5: Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {/* Accuracy Trends */}
          <Card
            title={<span><TrophyOutlined style={{ marginRight: 6 }} /> Điểm thử thách (12 tuần)</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <LineChart data={data.accuracyTrends} labelKey="week" valueKey="accuracy" color="#9ab17a" suffix="%" />
          </Card>

          {/* Vocabulary Growth */}
          <Card
            title={<span><BookOutlined style={{ marginRight: 6 }} /> Tăng trưởng từ vựng</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <LineChart data={data.vocabularyGrowth} labelKey="week" valueKey="total_words" color="#c3cc9b" />
          </Card>
        </div>

        {/* Summary footer */}
        <Card style={{ borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, var(--accent), var(--secondary))" }}>
          <Flex align="center" justify="center" gap={16} style={{ color: "#fff", padding: "8px 0" }}>
            <Text style={{ color: "#fff", fontSize: 14 }}>
              🎯 Tổng <strong>{totalStats.totalActivities}</strong> hoạt động · 
              Streak tốt nhất <strong>{totalStats.bestStreak}</strong> ngày · 
              <strong>{totalStats.totalQuizzes}</strong> thử thách hoàn thành
            </Text>
          </Flex>
        </Card>

      </Flex>
    </div>
  );
}
