"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";

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
  RightOutlined,
  SoundOutlined,
} from "@ant-design/icons";

import { useDashboard, type DashboardData } from "@/hooks/useDashboard";
import { useUser } from "@/components/app/shared/UserContext";
import { StreakFire, XPCounter, EmptyStateCard, StreakCalendar, WordOfTheDay, WeeklyLeaderboard } from "@/components/app/shared";
import { LearningStyleCard } from "@/components/app/shared/LearningStyleCard";

const { Title, Text } = Typography;

// ── Level System (Story 8.2) ──

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 800, 1200, 1700, 2400, 3200, 4200,       // 1-10
  5400, 6800, 8500, 10500, 13000, 16000, 19500, 23500, 28000, 33000, // 11-20
  38500, 44500, 51000, 58000, 65500, 73500, 82000, 91000, 100500, 110500, // 21-30
  121000, 132000, 143500, 155500, 168000, 181000, 194500, 208500, 223000, 238000, // 31-40
  253500, 269500, 286000, 303000, 320500, 338500, 357000, 376000, 395500, 415500, // 41-50
];

function getLevel(xp: number): { level: number; currentXP: number; nextXP: number; progress: number } {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold + 1000;
  const progress = Math.min((xp - currentThreshold) / (nextThreshold - currentThreshold), 1);
  return { level, currentXP: xp - currentThreshold, nextXP: nextThreshold - currentThreshold, progress };
}

// ── Smart CTA Logic (Story 8.1) ──

function getSuggestedActivity(data: DashboardData): { label: string; href: string; emoji: string } {
  if (data.flashcardsDue > 0) {
    return { label: `Ôn ${data.flashcardsDue} flashcard đang đến hạn`, href: "/flashcards", emoji: "📚" };
  }
  if (!data.dailyChallenge.completed) {
    return { label: "Thử thách hôm nay", href: "/daily-challenge", emoji: "🔥" };
  }
  return { label: "Chat với gia sư AI", href: "/english-chatbot", emoji: "💬" };
}

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

  // F3 fix: All hooks must be called before any early returns (Rules of Hooks)
  const [weakSkill, setWeakSkill] = useState<{ module: string; cefr: string } | null>(null);
  const [dailyActivity, setDailyActivity] = useState<Array<{ date: string; count: number }> | null>(null);

  const isReady = state.status === "ready";
  const data = isReady ? state.data : null;
  const isNewUser = data
    ? data.flashcardsDue === 0 &&
      data.recentVocabulary.length === 0 &&
      data.streak.currentStreak === 0 &&
      !data.dailyChallenge.completed
    : true;

  // Weak skill recommendations (lazy-loaded)
  useEffect(() => {
    if (!isReady || isNewUser) return;
    Promise.all(
      ["grammar", "listening", "reading"].map((m) =>
        api.get<{ module: string; currentLevel: number; cefr: string }>("/skill-profile", { params: { module: m } })
          .catch(() => null),
      ),
    ).then((profiles) => {
      const valid = profiles.filter(Boolean) as Array<{ module: string; currentLevel: number; cefr: string }>;
      if (valid.length === 0) return;
      const weakest = valid.reduce((a, b) => a.currentLevel < b.currentLevel ? a : b);
      setWeakSkill({ module: weakest.module, cefr: weakest.cefr });
    });
  }, [isReady, isNewUser]);

  // Streak Calendar data (lazy fetch from analytics)
  useEffect(() => {
    if (!isReady || isNewUser) return;
    api.get<{ dailyActivity?: Array<{ date: string; count: number }> }>("/analytics")
      .then((d) => { if (d?.dailyActivity) setDailyActivity(d.dailyActivity); })
      .catch(() => {});
  }, [isReady, isNewUser]);

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

  if (!data) return null;

  const firstName = user?.name?.split(" ").pop() ?? "bạn";

  // ── Build today's plan items (Story 14.4: Enhanced) ──
  const todayItems: Array<{ label: string; done: boolean; href: string; icon: React.ReactNode; priority: number }> = [];

  // Highest priority: Vocabulary SRS review (if due)
  if ((data.vocabDue ?? 0) > 0) {
    todayItems.push({ label: `Ôn ${data.vocabDue} từ vựng SRS`, done: false, href: "/review-quiz", icon: <BookOutlined />, priority: 0 });
  }

  // Second: Flashcard review
  if (data.flashcardsDue > 0) {
    todayItems.push({ label: `Ôn ${data.flashcardsDue} thẻ flashcard`, done: false, href: "/flashcards", icon: <AppstoreOutlined />, priority: 1 });
  }

  // Core daily tasks
  todayItems.push({ label: "Thử thách mỗi ngày", done: data.dailyChallenge.completed, href: "/daily-challenge", icon: <FireOutlined />, priority: 2 });
  todayItems.push({ label: "Luyện viết", done: false, href: "/writing-practice", icon: <EditOutlined />, priority: 4 });

  // Add weak skill recommendation
  if (weakSkill) {
    const SKILL_LABELS: Record<string, { label: string; href: string; icon: React.ReactNode }> = {
      grammar: { label: "Luyện ngữ pháp", href: "/grammar-quiz", icon: <BulbOutlined /> },
      listening: { label: "Luyện nghe", href: "/listening", icon: <SoundOutlined /> },
      reading: { label: "Luyện đọc", href: "/reading", icon: <ReadOutlined /> },
    };
    const skill = SKILL_LABELS[weakSkill.module];
    if (skill) {
      todayItems.push({
        label: `${skill.label} (${weakSkill.cefr} — kỹ năng yếu nhất)`,
        done: false,
        href: skill.href,
        icon: skill.icon,
        priority: 3,
      });
    }
  }

  // Sort by priority
  todayItems.sort((a, b) => a.priority - b.priority);

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
            <Space size="middle" style={{ marginTop: "var(--space-2)" }} wrap>
              <StreakFire streak={data.streak.currentStreak} />
              <XPCounter value={data.totalXP} label="XP" />
              {/* Level Badge (Story 8.2) */}
              {(() => {
                const lvl = getLevel(data.totalXP);
                return (
                  <Flex align="center" gap={6}>
                    <Tag
                      style={{
                        margin: 0,
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                        borderRadius: 999,
                        padding: "2px 10px",
                      }}
                    >
                      📊 Lv.{lvl.level}
                    </Tag>
                    <div
                      style={{
                        width: 60,
                        height: 6,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.2)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${lvl.progress * 100}%`,
                          height: "100%",
                          borderRadius: 3,
                          background: "#fff",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </Flex>
                );
              })()}
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

        {/* ── Smart CTA (Story 8.1) ── */}
        {!isNewUser && (() => {
          const suggested = getSuggestedActivity(data);
          return (
            <button
              className="cta-shimmer"
              onClick={() => router.push(suggested.href)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "18px 24px",
                borderRadius: "var(--radius-xl)",
                border: "none",
                background: "linear-gradient(135deg, var(--accent), var(--secondary))",
                color: "#fff",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "var(--font-body)",
                cursor: "pointer",
                boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.01)";
                e.currentTarget.style.boxShadow = "0 6px 24px color-mix(in srgb, var(--accent) 40%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)";
              }}
              aria-label={`${suggested.emoji} ${suggested.label}`}
            >
              <span style={{ fontSize: 22 }}>{suggested.emoji}</span>
              <span>▶ {suggested.label}</span>
              <RightOutlined style={{ marginLeft: "auto", opacity: 0.7, fontSize: 14 }} />
            </button>
          );
        })()}

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

        {/* ── Learning Style (Story 16.3) ── */}
        {!isNewUser && <LearningStyleCard />}

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

        {/* ── Word of the Day (Story 14.3) ── */}
        {!isNewUser && <WordOfTheDay />}

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

        {/* ── Streak Calendar Heatmap (Story 14.1) ── */}
        {!isNewUser && dailyActivity && (
          <StreakCalendar
            dailyActivity={dailyActivity}
            currentStreak={data.streak.currentStreak}
          />
        )}

        {/* ── Weekly Leaderboard (Story 15.4) ── */}
        {!isNewUser && <WeeklyLeaderboard />}

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
