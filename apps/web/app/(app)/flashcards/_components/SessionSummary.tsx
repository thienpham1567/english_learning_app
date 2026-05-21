"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Space, Typography, Button } from "antd";
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
  TrophyOutlined,
  RightOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";

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
      <CelebrationOverlay
        tier="medium"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      >
        <Title level={3} style={{ color: "var(--text-on-accent)", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
          <TrophyOutlined /> Bạn đã ôn xong!
        </Title>
      </CelebrationOverlay>

      <Flex vertical align="stretch" gap={20} className="anim-scale-in" style={{ maxWidth: 500, margin: "0 auto", width: "100%" }}>
        
        {/* Streak & Hero banner */}
        <div
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "32px 24px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Ambient glow behind streak */}
          <div style={{ position: "absolute", left: "50%", top: "40%", transform: "translate(-50%, -50%)", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 12%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <StreakFire streak={streak} />
          </div>

          <Title level={3} style={{ margin: "12px 0 4px", fontWeight: 900, color: "var(--text-primary)" }}>
            Hoàn thành phiên ôn tập!
          </Title>
          <Text style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
            Bạn đã xuất sắc ghi nhớ <span style={{ color: "var(--accent)", fontWeight: 700 }}>{totalReviewed}</span> từ vựng hôm nay.
          </Text>
        </div>

        {/* Stats Grid cards */}
        <Flex gap={12} style={{ width: "100%" }}>
          {[
            { label: "Đã ôn tập", value: totalReviewed, color: "var(--accent)" },
            { label: "Chất lượng TB", value: `${averageQuality.toFixed(1)}/5`, color: "var(--xp)" },
            { label: "Số từ quên", value: forgottenCount, color: forgottenCount > 0 ? "var(--error)" : "var(--success)" },
          ].map((stat, idx) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              style={{
                flex: 1,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "16px 12px",
                textAlign: "center",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, fontFamily: "var(--font-display)", lineHeight: 1.1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, marginTop: 4 }}>
                {stat.label}
              </div>
            </m.div>
          ))}
        </Flex>

        {/* Distribution card */}
        {totalReviewed > 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "18px 20px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <BarChartOutlined style={{ color: "var(--accent)" }} />
              Phân bố mức độ ghi nhớ
            </span>
            <Flex gap={12}>
              {DISTRIBUTION_ITEMS.map((item) => {
                const count = counts[item.key] ?? 0;
                const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
                return (
                  <Flex key={item.key} vertical align="center" gap={6} style={{ flex: 1 }}>
                    {/* Custom vertical bar graph */}
                    <div
                      style={{
                        width: 8,
                        height: 52,
                        borderRadius: 99,
                        background: "var(--border)",
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                      }}
                    >
                      <m.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{
                          width: "100%",
                          borderRadius: 99,
                          background: item.color,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                      {count}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                      {item.label}
                    </span>
                  </Flex>
                );
              })}
            </Flex>
          </m.div>
        )}

        {/* Daily challenge prompt */}
        {!dailyChallengeCompleted && (
          <m.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/daily-challenge")}
            style={{
              textAlign: "left",
              background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 6%, var(--surface)), var(--surface))",
              border: "1px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
              borderRadius: "var(--radius-xl)",
              padding: "16px 20px",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(245, 158, 11, 0.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <FireOutlined style={{ fontSize: 22, color: "var(--xp)" }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                Thử thách hàng ngày
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
                Luyện tập ngay để duy trì chuỗi Streak!
              </p>
            </div>
            <RightOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
          </m.button>
        )}

        {/* Actions button */}
        {onRestart && (
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            style={{
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 14px var(--accent-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 10,
            }}
          >
            <ReloadOutlined style={{ fontSize: 13 }} />
            Bắt đầu lượt ôn tập mới
          </m.button>
        )}
      </Flex>
    </>
  );
}
