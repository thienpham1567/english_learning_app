"use client";

import { Button, Card, Flex, Space, Statistic, Tag, Typography } from "antd";
import { ReloadOutlined, StarOutlined, WarningOutlined } from "@ant-design/icons";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

const { Title, Text } = Typography;

type Props = {
  questions: GrammarQuestion[];
  answers: (number | null)[];
  score: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  onRetry: () => void;
  onNewQuiz: () => void;
};

export function ScoreSummary({
  questions,
  answers,
  score,
  topicBreakdown,
  onRetry,
  onNewQuiz,
}: Props) {
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = pct >= 90 ? "🎉" : pct >= 70 ? "👏" : pct >= 50 ? "👍" : "💪";
  const weakTopics = Object.entries(topicBreakdown)
    .filter(([, v]) => v.correct / v.total < 0.5)
    .map(([topic]) => topic);

  return (
    <Flex
      vertical
      align="center"
      className="anim-scale-in"
      style={{ maxWidth: 520, margin: "0 auto" }}
    >
      <span className="anim-bounce-emoji" style={{ fontSize: 60 }}>
        {emoji}
      </span>

      <Title
        level={2}
        style={{ marginTop: 16, fontFamily: "var(--font-display)", fontStyle: "italic" }}
      >
        Kết quả
      </Title>

      {/* Score */}
      <Card
        className="anim-fade-up anim-delay-2"
        style={{
          marginTop: 24,
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, var(--accent), #C3CC9B)",
          textAlign: "center",
        }}
        styles={{ body: { padding: "16px 32px" } }}
      >
        <Statistic
          value={score}
          suffix={`/ ${total}`}
          valueStyle={{ fontSize: 28, fontWeight: 700, color: "#fff" }}
        />
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{pct}%</Text>
      </Card>

      {/* Topic breakdown */}
      <Flex
        vertical
        gap={8}
        className="anim-fade-up anim-delay-3"
        style={{ marginTop: 32, width: "100%" }}
      >
        <Text
          type="secondary"
          style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}
        >
          Theo chủ đề ngữ pháp
        </Text>
        {Object.entries(topicBreakdown).map(([topic, { correct, total: t }]) => {
          const isWeak = correct / t < 0.5;
          return (
            <Card
              key={topic}
              size="small"
              style={{
                borderColor: isWeak ? "#fecaca" : undefined,
                background: isWeak ? "#fef2f2" : undefined,
              }}
            >
              <Flex justify="space-between" align="center">
                <Space>
                  {isWeak && <WarningOutlined style={{ color: "#ef4444" }} />}
                  <Text
                    style={{
                      color: isWeak ? "#b91c1c" : undefined,
                      fontWeight: isWeak ? 500 : 400,
                    }}
                  >
                    {topic}
                  </Text>
                </Space>
                <Tag color={isWeak ? "error" : "default"}>
                  {correct}/{t}
                </Tag>
              </Flex>
            </Card>
          );
        })}
      </Flex>

      {/* Weak topics callout */}
      {weakTopics.length > 0 && (
        <Text
          className="anim-fade-up anim-delay-4"
          type="danger"
          style={{ marginTop: 16, fontSize: 12 }}
        >
          ⚠️ Chủ đề cần ôn lại: {weakTopics.join(", ")}
        </Text>
      )}

      {/* Buttons */}
      <Space className="anim-fade-up anim-delay-5" style={{ marginTop: 32 }}>
        <Button icon={<ReloadOutlined />} size="large" onClick={onRetry}>
          Làm lại
        </Button>
        <Button type="primary" icon={<StarOutlined />} size="large" onClick={onNewQuiz}>
          Đề mới
        </Button>
      </Space>
    </Flex>
  );
}
