"use client";

import { Button, Card, Flex, Space, Statistic, Tag, Typography } from "antd";
import { ReloadOutlined, StarOutlined, WarningOutlined, TrophyOutlined, SmileOutlined, LikeOutlined, FireOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

const { Title, Text } = Typography;

type Props = {
  questions: GrammarQuestion[];
  answers: (number | null)[];
  score: number;
  maxCombo: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  onRetry: () => void;
  onNewQuiz: () => void;
};

export function ScoreSummary({
  questions,
  answers,
  score,
  maxCombo,
  topicBreakdown,
  onRetry,
  onNewQuiz,
}: Props) {
  const router = useRouter();
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const icon = pct >= 90 ? <TrophyOutlined style={{ color: "var(--success)" }} /> : pct >= 70 ? <SmileOutlined style={{ color: "var(--accent)" }} /> : pct >= 50 ? <LikeOutlined style={{ color: "var(--warning)" }} /> : <ThunderboltOutlined style={{ color: "var(--error)" }} />;
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
      <span className="anim-bounce-emoji" style={{ fontSize: 52 }}>
        {icon}
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
          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          textAlign: "center",
        }}
        styles={{ body: { padding: "16px 32px" } }}
      >
        <Statistic
          value={score}
          suffix={`/ ${total}`}
          styles={{ content: { fontSize: 28, fontWeight: 700, color: "var(--text-on-accent)" } }}
        />
        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{pct}%</Text>
      </Card>

      {/* Combo stat (AC: #4) */}
      {maxCombo >= 2 && (
        <div
          className="anim-fade-up anim-delay-2"
          style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 999,
            background: "linear-gradient(135deg, var(--xp), var(--error))",
            padding: "5px 16px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-on-accent)",
            boxShadow: "0 2px 8px color-mix(in srgb, var(--xp) 25%, transparent)",
          }}
        >
          <FireOutlined /> Combo cao nhất: x{maxCombo}
        </div>
      )}

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
                borderColor: isWeak ? "color-mix(in srgb, var(--error) 30%, transparent)" : undefined,
                background: isWeak ? "var(--error-bg)" : undefined,
              }}
            >
              <Flex justify="space-between" align="center">
                <Space>
                  {isWeak && <WarningOutlined style={{ color: "var(--error)" }} />}
                  <Text
                    style={{
                      color: isWeak ? "var(--error)" : undefined,
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
        <Flex
          vertical
          gap={6}
          className="anim-fade-up anim-delay-4"
          style={{ marginTop: 16, width: "100%", alignItems: "center" }}
        >
          <Text type="danger" style={{ fontSize: 12 }}>
            <WarningOutlined style={{ marginRight: 4 }} /> Chủ đề cần ôn lại: {weakTopics.join(", ")}
          </Text>
          <Button
            type="link"
            size="small"
            style={{ fontSize: 12, padding: 0 }}
            onClick={() => router.push("/english-chatbot?persona=christine")}
          >
            Luyện thêm với Christine (IELTS) →
          </Button>
        </Flex>
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
