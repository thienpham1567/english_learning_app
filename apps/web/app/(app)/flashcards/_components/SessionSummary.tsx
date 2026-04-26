"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Space, Statistic, Typography, Button } from "antd";
import {
  CheckCircleFilled,
  WarningOutlined,
  ReloadOutlined,
  FireOutlined,
  SmileOutlined,
  BarChartOutlined,
  LikeOutlined,
  MehOutlined,
  FrownOutlined,
} from "@ant-design/icons";

import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { useDashboard } from "@/hooks/useDashboard";

const { Title, Text } = Typography;

type Props = {
  totalReviewed: number;
  averageQuality: number;
  forgottenCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  onRestart?: () => void;
};

const DISTRIBUTION_ITEMS = [
  { key: "easy", label: "Dễ", icon: <LikeOutlined />, color: "var(--success)" },
  { key: "good", label: "Ổn", icon: <SmileOutlined />, color: "var(--accent)" },
  { key: "hard", label: "Khó", icon: <MehOutlined />, color: "var(--warning)" },
  { key: "again", label: "Quên", icon: <FrownOutlined />, color: "var(--error)" },
];

// Derive streak + daily challenge from shared dashboard context
function useSummaryContext() {
  const { state } = useDashboard();
  if (state.status !== "ready") return { streak: 0, dailyChallengeCompleted: false };
  return {
    streak: state.data.streak?.currentStreak ?? 0,
    dailyChallengeCompleted: state.data.dailyChallenge?.completed ?? false,
  };
}

export function SessionSummary({
  totalReviewed,
  averageQuality,
  forgottenCount,
  againCount,
  hardCount,
  goodCount,
  easyCount,
  onRestart,
}: Props) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);
  const { streak, dailyChallengeCompleted } = useSummaryContext();

  const counts: Record<string, number> = { easy: easyCount, good: goodCount, hard: hardCount, again: againCount };

  return (
    <>
      {/* Celebration Overlay */}
      <CelebrationOverlay
        tier="medium"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      >
        <Title level={3} style={{ color: "#fff", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          🎉 Bạn đã ôn xong!
        </Title>
      </CelebrationOverlay>

      <Flex vertical align="center" className="anim-scale-in" style={{ maxWidth: 480, margin: "0 auto" }}>
        {/* Streak display — shows actual current streak (B1 fix) */}
        <StreakFire streak={streak} />

        <Title level={2} style={{ marginTop: 16, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
          Hoàn thành!
        </Title>
        <Text type="secondary">Bạn đã ôn xong {totalReviewed} thẻ trong phiên này.</Text>

        {/* Summary stats */}
        <Space size={16} style={{ marginTop: 24, width: "100%" }}>
          {[
            { icon: <CheckCircleFilled />, label: "Đã ôn", value: totalReviewed, delay: 1 },
            { icon: <SmileOutlined />, label: "Điểm TB", value: averageQuality.toFixed(1), delay: 2 },
            { icon: <WarningOutlined />, label: "Quên", value: forgottenCount, delay: 3 },
          ].map((stat) => (
            <Card
              key={stat.label}
              size="small"
              className={`anim-fade-up anim-delay-${stat.delay}`}
              style={{ flex: 1, textAlign: "center" }}
            >
              <Statistic
                title={stat.label}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: "var(--accent)", fontSize: 20 }}
              />
            </Card>
          ))}
        </Space>

        {/* Difficulty distribution (B3 fix: BarChartOutlined instead of FrownOutlined) */}
        {totalReviewed > 0 && (
          <Card
            className="anim-fade-up anim-delay-4"
            style={{ marginTop: 16, width: "100%", borderRadius: "var(--radius-xl)" }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Text strong style={{ fontSize: 13, marginBottom: 12, display: "block" }}>
              <BarChartOutlined style={{ marginRight: 6 }} />
              Phân bố độ khó
            </Text>
            <Flex gap={8}>
              {DISTRIBUTION_ITEMS.map((item) => {
                const count = counts[item.key] ?? 0;
                const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
                return (
                  <Flex key={item.key} vertical align="center" gap={4} style={{ flex: 1 }}>
                    <div
                      style={{
                        width: "100%",
                        height: 6,
                        borderRadius: 3,
                        background: "var(--border)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: item.color, transition: "width 0.5s ease" }} />
                    </div>
                    <Text style={{ fontSize: 11 }}><span style={{ color: item.color }}>{item.icon}</span> {count}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>{item.label}</Text>
                  </Flex>
                );
              })}
            </Flex>
          </Card>
        )}

        {/* Daily challenge prompt — only if not yet completed (B2 fix) */}
        {!dailyChallengeCompleted && (
          <Card
            hoverable
            className="anim-fade-up anim-delay-5"
            onClick={() => router.push("/daily-challenge")}
            style={{
              marginTop: 16,
              width: "100%",
              borderRadius: "var(--radius-xl)",
              background: "linear-gradient(135deg, var(--accent-muted), var(--bg))",
              cursor: "pointer",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Flex align="center" gap={12}>
              <FireOutlined style={{ fontSize: 24, color: "var(--fire)" }} />
              <Flex vertical style={{ flex: 1 }}>
                <Text strong>Thử thách mỗi ngày?</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Tiếp tục chuỗi streak của bạn!</Text>
              </Flex>
              <Text style={{ color: "var(--accent)", fontWeight: 600 }}>Bắt đầu →</Text>
            </Flex>
          </Card>
        )}

        {/* Restart button */}
        {onRestart && (
          <Button
            className="anim-fade-up anim-delay-5"
            icon={<ReloadOutlined />}
            onClick={onRestart}
            size="large"
            style={{ marginTop: 24 }}
          >
            Ôn lại
          </Button>
        )}
      </Flex>
    </>
  );
}
