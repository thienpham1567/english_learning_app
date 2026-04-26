"use client";
import { api } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { Card, Typography, Flex, Progress } from "antd";
import { RightOutlined, ExperimentOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Text } = Typography;

type LearningStyleData = {
  hasEnoughData: boolean;
  activitiesCount: number;
  remaining?: number;
  style?: {
    primary: string;
    confidence: number;
    icon: string;
    name: string;
    description: string;
  };
  engagement?: Record<string, number>;
  suggestions?: Array<{ label: string; href: string; reason: string }>;
};

const MODULE_DISPLAY: Record<string, { label: string; color: string }> = {
  grammar_quiz: { label: "Quiz", color: "var(--module-grammar)" },
  chatbot_session: { label: "Chat", color: "var(--module-speaking)" },
  flashcard_review: { label: "Flash", color: "var(--module-review)" },
  writing_practice: { label: "Viết", color: "var(--module-writing)" },
  grammar_lesson: { label: "Học", color: "var(--module-grammar)" },
  study_set: { label: "Chủ đề", color: "var(--module-vocabulary)" },
  voice_practice: { label: "Nói", color: "var(--module-speaking)" },
  listening_practice: { label: "Nghe", color: "var(--module-listening)" },
  daily_challenge: { label: "Thách", color: "var(--fire)" },
};

export function LearningStyleCard() {
  const router = useRouter();
  const [data, setData] = useState<LearningStyleData | null>(null);

  useEffect(() => {
    api.get<LearningStyleData>("/learning-style")
      .then((d) => { if (d) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  // Not enough data
  if (!data.hasEnoughData) {
    const progress = Math.round((data.activitiesCount / 10) * 100);
    return (
      <Card
        style={{ borderRadius: "var(--radius-xl)" }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Flex align="center" gap={12}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "var(--accent-muted)",
            display: "grid", placeItems: "center",
          }}>
            <ExperimentOutlined style={{ fontSize: 18, color: "var(--accent)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 13 }}>Phong cách học tập</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Hãy học thêm {data.remaining} buổi nữa để phát hiện
            </Text>
          </div>
        </Flex>
        <Progress
          percent={progress}
          size="small"
          strokeColor="var(--accent)"
          style={{ marginTop: 12 }}
          format={() => `${data.activitiesCount}/10`}
        />
      </Card>
    );
  }

  const { style, engagement, suggestions } = data;
  if (!style || !engagement || !suggestions) return null;

  // Top modules for bar chart (sorted, max 5)
  const topModules = Object.entries(engagement)
    .filter(([k]) => MODULE_DISPLAY[k])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxEngagement = topModules[0]?.[1] ?? 1;

  return (
    <Card
      style={{ borderRadius: "var(--radius-xl)", overflow: "hidden" }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Header with style */}
      <div style={{
        padding: "20px 24px 16px",
        background: "var(--accent-muted)",
      }}>
        <Flex align="center" gap={12}>
          <span style={{ fontSize: 28 }}>{style.icon}</span>
          <div style={{ flex: 1 }}>
            <Text strong style={{ fontSize: 15 }}>{style.name}</Text>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {style.description}
            </Text>
          </div>
          <div style={{
            padding: "4px 10px", borderRadius: 99,
            background: "var(--accent)", color: "var(--text-on-accent)",
            fontSize: 11, fontWeight: 600,
          }}>
            {Math.round(style.confidence * 100)}%
          </div>
        </Flex>

        {/* Mini bar chart */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {topModules.map(([key, value]) => {
            const display = MODULE_DISPLAY[key];
            if (!display) return null;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", width: 42, textAlign: "right" }}>
                  {display.label}
                </span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    background: display.color,
                    width: `${(value / maxEngagement) * 100}%`,
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--text-muted)", width: 28 }}>
                  {Math.round(value * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggestions */}
      <div style={{ padding: "12px 16px" }}>
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, padding: "0 8px", display: "block", marginBottom: 6 }}>
          💡 Gợi ý cho bạn
        </Text>
        {suggestions.map((s) => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            style={{
              display: "flex", width: "100%", alignItems: "center", gap: 8,
              padding: "8px 10px", borderRadius: 8, border: "none",
              background: "transparent", cursor: "pointer", textAlign: "left",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: 500, display: "block" }}>{s.label}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{s.reason}</Text>
            </div>
            <RightOutlined style={{ fontSize: 10, color: "var(--text-muted)" }} />
          </button>
        ))}
      </div>
    </Card>
  );
}
