"use client";

import { useRouter } from "next/navigation";
import { Card, Flex, Typography, Button, Space, Tag, Spin, Result } from "antd";
import {
  CommentOutlined,
  ReadOutlined,
  BulbOutlined,
  AppstoreOutlined,
  FireOutlined,
  EditOutlined,
  TrophyOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  ScheduleOutlined,
  ThunderboltOutlined,
  BookOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

import { useDashboard } from "@/hooks/useDashboard";
import { useUser } from "@/components/app/shared/UserContext";
import { StreakFire, XPCounter, EmptyStateCard } from "@/components/app/shared";

const { Title, Text } = Typography;

// ── Helpers ──

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("vi-VN", { weekday: "short" });
}

// ── Dashboard Page ──

export default function HomePage() {
  const router = useRouter();
  const user = useUser();
  const { state, refetch } = useDashboard();

  // ── Loading state ──
  if (state.status === "loading") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: "var(--space-4)" }}>
        <Spin size="large" />
        <Text type="secondary">Đang tải...</Text>
      </Flex>
    );
  }

  // ── Error state ──
  if (state.status === "error") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", padding: "var(--space-8)" }}>
        <Result
          status="error"
          title="Không thể tải dashboard"
          subTitle={state.error}
          extra={<Button type="primary" icon={<ReloadOutlined />} onClick={refetch}>Thử lại</Button>}
        />
      </Flex>
    );
  }

  const { data } = state;
  const firstName = user?.name?.split(" ").pop() ?? "bạn";
  const isNewUser =
    data.flashcardsDue === 0 &&
    data.recentVocabulary.length === 0 &&
    data.streak.currentStreak === 0 &&
    !data.dailyChallenge.completed; // B5 fix: active user who just did the challenge isn't "new"

  // ── Build today's plan items ──
  const todayItems: Array<{ label: string; done: boolean; href: string; icon: React.ReactNode }> = [];

  if (data.flashcardsDue > 0) {
    todayItems.push({ label: `Ôn ${data.flashcardsDue} thẻ flashcard`, done: false, href: "/flashcards", icon: <AppstoreOutlined /> });
  }
  todayItems.push({ label: "Thử thách mỗi ngày", done: data.dailyChallenge.completed, href: "/daily-challenge", icon: <FireOutlined /> });
  todayItems.push({ label: "Luyện viết", done: false, href: "/writing-practice", icon: <EditOutlined /> });

  // ── Weekly chart max ──
  const maxActivity = Math.max(...data.weeklyActivity.map((d) => d.count), 1);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
      <Flex vertical gap="var(--space-6)">

        {/* ── GreetingCard ── */}
        <Card
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            borderRadius: "var(--radius-xl)",
            border: "none",
          }}
          styles={{ body: { padding: "var(--space-6)" } }}
        >
          <Flex vertical>
            <Title level={4} style={{ color: "#fff", fontFamily: "var(--font-display)", margin: 0 }}>
              {getGreeting()}, {firstName}! 👋
            </Title>
            <Space size="middle" style={{ marginTop: "var(--space-2)" }}>
              <StreakFire streak={data.streak.currentStreak} />
              <XPCounter value={data.totalXP} label="XP" />
            </Space>
          </Flex>
        </Card>

        {/* ── New User Empty State ── */}
        {isNewUser && (
          <Card style={{ borderRadius: "var(--radius-xl)" }}>
            <EmptyStateCard
              icon={<span>🎓</span>}
              headline="Bắt đầu học ngay!"
              description="Làm thử thách đầu tiên để khởi động hành trình học tiếng Anh!"
              ctaLabel="Bắt đầu thử thách"
              onCtaClick={() => router.push("/daily-challenge")}
            />
          </Card>
        )}

        {/* ── TodaysPlan ── */}
        {!isNewUser && (
          <Card
            title={<span><ScheduleOutlined style={{ marginRight: 6 }} /> Kế hoạch hôm nay</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <Flex vertical gap={8}>
              {todayItems.map((item) => (
                <Card
                  key={item.href}
                  hoverable
                  onClick={() => router.push(item.href)}
                  style={{
                    borderRadius: "var(--radius)",
                    opacity: item.done ? 0.6 : 1,
                  }}
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <Flex align="center" gap={12}>
                    <Text style={{ fontSize: 16, color: item.done ? "var(--success)" : "var(--accent)" }}>
                      {item.icon}
                    </Text>
                    <Text
                      style={{
                        flex: 1,
                        fontWeight: 500,
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.label}
                    </Text>
                    {item.done && <CheckCircleFilled style={{ color: "var(--success)" }} />}
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Card>
        )}

        {/* ── QuickActions ── */}
        <Card
          title={<span><ThunderboltOutlined style={{ marginRight: 6 }} /> Truy cập nhanh</span>}
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <Space wrap>
            {[
              { label: "Chat", href: "/english-chatbot", icon: <CommentOutlined /> },
              { label: "Từ điển", href: "/dictionary", icon: <ReadOutlined /> },
              { label: "Quiz", href: "/grammar-quiz", icon: <BulbOutlined /> },
            ].map((action) => (
              <Button
                key={action.href}
                icon={action.icon}
                shape="round"
                onClick={() => router.push(action.href)}
                style={{
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  border: "none",
                  fontWeight: 600,
                }}
              >
                {action.label}
              </Button>
            ))}
          </Space>
        </Card>

        {/* ── RecentVocabulary ── */}
        {data.recentVocabulary.length > 0 && (
          <Card
            title={<span><BookOutlined style={{ marginRight: 6 }} /> Từ vựng gần đây</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <Flex gap={8} style={{ overflowX: "auto", paddingBottom: "var(--space-2)" }}>
              {data.recentVocabulary.map((word) => (
                <Card
                  key={word.query}
                  hoverable
                  onClick={() => router.push(`/dictionary?q=${encodeURIComponent(word.query)}`)}
                  style={{ flexShrink: 0, minWidth: 100, borderRadius: "var(--radius)" }}
                  styles={{ body: { padding: "12px 16px" } }}
                >
                  <Text strong>{word.headword}</Text>
                  <br />
                  <Tag color="default" style={{ marginTop: 4 }}>{word.level}</Tag>
                </Card>
              ))}
            </Flex>
          </Card>
        )}

        {/* ── WeeklyProgress ── */}
        <Card
          title={<span><BarChartOutlined style={{ marginRight: 6 }} /> Hoạt động trong tuần</span>}
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <Flex align="flex-end" gap={8} style={{ height: 80 }}>
            {data.weeklyActivity.map((day) => (
              <Flex key={day.day} vertical align="center" gap={4} style={{ flex: 1 }}>
                <div
                  style={{
                    width: "100%",
                    borderRadius: 4,
                    background: day.count > 0 ? "var(--accent)" : "var(--border)",
                    height: `${Math.max((day.count / maxActivity) * 60, 4)}px`,
                    transition: `height var(--duration-normal) ease`,
                  }}
                />
                <Text type="secondary" style={{ fontSize: 10 }}>{getDayLabel(day.day)}</Text>
              </Flex>
            ))}
          </Flex>
        </Card>

        {/* ── StreakBadges ── */}
        <Card
          title={<span><TrophyOutlined style={{ marginRight: 6 }} /> Thành tích</span>}
          style={{ borderRadius: "var(--radius-xl)" }}
          styles={{ header: { borderBottom: "1px solid var(--border)" } }}
        >
          <Flex gap="var(--space-6)" style={{ marginBottom: "var(--space-3)" }}>
            <Flex vertical align="center">
              <Title level={3} style={{ margin: 0, color: "var(--fire)" }}>{data.streak.currentStreak}</Title>
              <Text type="secondary" style={{ fontSize: "var(--text-xs)" }}>Streak hiện tại</Text>
            </Flex>
            <Flex vertical align="center">
              <Title level={3} style={{ margin: 0, color: "var(--xp)" }}>{data.streak.bestStreak}</Title>
              <Text type="secondary" style={{ fontSize: "var(--text-xs)" }}>Streak tốt nhất</Text>
            </Flex>
          </Flex>
          {data.badges.length > 0 && (
            <Flex gap={8} wrap>
              {data.badges.map((badge) => (
                <Card
                  key={badge.id}
                  size="small"
                  style={{
                    borderRadius: "var(--radius)",
                    background: badge.unlocked ? "var(--accent-muted)" : "var(--bg-deep)",
                    opacity: badge.unlocked ? 1 : 0.4,
                    minWidth: 56,
                    textAlign: "center",
                    border: "none",
                  }}
                  styles={{ body: { padding: "8px 12px" } }}
                >
                  <div style={{ fontSize: 20 }}>{badge.emoji}</div>
                  <Text type="secondary" style={{ fontSize: "var(--text-xs)" }}>{badge.label}</Text>
                </Card>
              ))}
            </Flex>
          )}
        </Card>

      </Flex>
    </div>
  );
}
