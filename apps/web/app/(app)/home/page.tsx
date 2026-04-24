"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useDailyStudyPlan, type DailyPlanItem } from "@/hooks/useDailyStudyPlan";

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
  HistoryOutlined,
} from "@ant-design/icons";

import { useDashboard, type DashboardData } from "@/hooks/useDashboard";
import { useUser } from "@/components/shared/UserContext";
import { StreakFire, XPCounter, EmptyStateCard, StreakCalendar, WordOfTheDay, WeeklyLeaderboard } from "@/components/shared";
import { LearningStyleCard } from "@/components/shared/LearningStyleCard";

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

function getSuggestedActivity(data: DashboardData): { label: string; href: string; icon: React.ReactNode } {
  if (data.flashcardsDue > 0) {
    return { label: `Ôn ${data.flashcardsDue} flashcard đang đến hạn`, href: "/flashcards", icon: <BookOutlined /> };
  }
  if (!data.dailyChallenge.completed) {
    return { label: "Thử thách hôm nay", href: "/daily-challenge", icon: <FireOutlined /> };
  }
  return { label: "Chat với gia sư AI", href: "/english-chatbot", icon: <CommentOutlined /> };
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

  // ── Adaptive daily plan (Story 21.3) ──
  const adaptivePlan = useDailyStudyPlan({ enabled: isReady && !isNewUser });
  const hasAdaptivePlan = adaptivePlan.state.status === "ready";

  // Map adaptive plan items → todayItems format (AC: 1, 2, 3)
  const PRIORITY_MAP: Record<string, number> = { high: 0, medium: 1, low: 2 };
  const SKILL_ICON_MAP: Record<string, React.ReactNode> = {
    vocabulary: <BookOutlined />,
    grammar: <BulbOutlined />,
    listening: <SoundOutlined />,
    reading: <ReadOutlined />,
    writing: <EditOutlined />,
    speaking: <CommentOutlined />,
    pronunciation: <SoundOutlined />,
    exam_strategy: <TrophyOutlined />,
  };

  function adaptiveItemIcon(item: DailyPlanItem): React.ReactNode {
    for (const sid of item.skillIds) {
      if (SKILL_ICON_MAP[sid]) return SKILL_ICON_MAP[sid];
    }
    return <ScheduleOutlined />;
  }

  // ── Build today's plan items (Story 21.3: Adaptive plan with fallback) ──
  let todayItems: Array<{ label: string; done: boolean; href: string; icon: React.ReactNode; priority: number; reason?: string; estimatedMinutes?: number }> = [];

  if (hasAdaptivePlan) {
    // AC: 1 — adaptive plan items first
    const adaptiveState = adaptivePlan.state as Extract<typeof adaptivePlan.state, { status: "ready" }>;
    todayItems = adaptiveState.plan.items.map((item, i) => ({
      label: item.title,
      done: item.completed,
      href: item.actionUrl,
      icon: adaptiveItemIcon(item),
      priority: PRIORITY_MAP[item.priority] ?? i,
      reason: item.reason,
      estimatedMinutes: item.estimatedMinutes,
    }));
  } else {
    // AC: 4 — fallback to manual plan when adaptive plan is unavailable

    // Story 22.5 — Unified review hub entry point (AC: 1)
    // Priority -1 so it appears before legacy items. Uses separate count from /api/review/due.
    todayItems.push({ label: "Ôn tập hôm nay", done: false, href: "/review", icon: <HistoryOutlined />, priority: -1 });

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
  }

  // Sort by priority
  todayItems.sort((a, b) => a.priority - b.priority);

  // ── Weekly chart max ──
  const maxActivity = Math.max(...data.weeklyActivity.map((d) => d.count), 1);

  return (
    <div style={{ height: "100%", overflowY: "auto", position: "relative" }}>
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />
      <div style={{ padding: "var(--space-6) var(--space-8)", position: "relative", zIndex: 1, maxWidth: 840, margin: "0 auto" }}>
        <Flex vertical gap="var(--space-8)" className="anim-fade-up">

          {/* ── GreetingCard ── */}
          <Card
            style={{
              background: "var(--gradient-daily)",
              borderRadius: "var(--radius-2xl)",
              border: "none",
              boxShadow: "var(--shadow-lg)",
              position: "relative",
              overflow: "hidden"
            }}
            styles={{ body: { padding: "var(--space-8) var(--space-8)" } }}
          >
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: "60%",
              background: "radial-gradient(circle at 90% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
              pointerEvents: "none"
            }} />
            <Flex vertical style={{ position: "relative", zIndex: 1 }}>
              <Title level={2} style={{ color: "#fff", fontFamily: "var(--font-display)", margin: 0, letterSpacing: "-0.5px" }}>
                {getGreeting()}, {firstName}! <span style={{ display: "inline-block", animation: "bounceEmoji 1s ease infinite" }}>👋</span>
              </Title>
              <Space size="large" style={{ marginTop: "var(--space-5)" }} wrap>
                <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 999, padding: "6px 16px", backdropFilter: "blur(8px)" }}>
                  <StreakFire streak={data.streak.currentStreak} />
                </div>
                <div style={{ background: "rgba(0,0,0,0.15)", borderRadius: 999, padding: "6px 16px", backdropFilter: "blur(8px)" }}>
                  <XPCounter value={data.totalXP} label="XP" />
                </div>
                {/* Level Badge (Story 8.2) */}
                {(() => {
                  const lvl = getLevel(data.totalXP);
                  return (
                    <Flex align="center" gap={12} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 999, padding: "6px 16px", backdropFilter: "blur(8px)" }}>
                      <Text style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                        <BarChartOutlined style={{ marginRight: 6 }} /> Lv.{lvl.level}
                      </Text>
                      <div
                        style={{
                          width: 80,
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
            <Card style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <EmptyStateCard
                icon={<TrophyOutlined style={{ fontSize: 32, color: "var(--accent)" }} />}
                headline="Bắt đầu học ngay!"
                description="Làm thử thách đầu tiên để khởi động hành trình học tiếng Anh!"
                ctaLabel="Bắt đầu thử thách"
                onCtaClick={() => router.push("/daily-challenge")}
              />
            </Card>
          )}

          {/* ── Session Start CTA (Story 21.4) ── */}
          {!isNewUser && (() => {
            const nextItem = todayItems.find((item) => !item.done);
            const allDone = todayItems.length > 0 && !nextItem;

            if (allDone) {
              return (
                <button
                  className="btn-shimmer"
                  onClick={() => router.push("/progress")}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    padding: "20px 28px",
                    borderRadius: "var(--radius-2xl)",
                    border: "none",
                    background: "linear-gradient(135deg, var(--success), #059669)",
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
                    transition: "all var(--duration-fast) ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(16, 185, 129, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(16, 185, 129, 0.25)";
                  }}
                >
                  <span style={{ fontSize: 24 }}>🎉</span>
                  <span>Tuyệt vời! Bạn đã hoàn thành hôm nay</span>
                  <RightOutlined style={{ marginLeft: "auto", opacity: 0.8, fontSize: 16 }} />
                </button>
              );
            }

            const target = nextItem ?? getSuggestedActivity(data);
            const ctaLabel = nextItem ? `Tiếp tục: ${nextItem.label}` : target.label;
            const ctaHref = nextItem ? nextItem.href : target.href;
            const ctaIcon = nextItem ? nextItem.icon : target.icon;

            return (
              <button
                className="btn-shimmer"
                onClick={() => router.push(ctaHref)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  padding: "20px 28px",
                  borderRadius: "var(--radius-2xl)",
                  border: "none",
                  background: "var(--gradient-listening)",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(196, 168, 130, 0.3)",
                  transition: "all var(--duration-fast) ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(196, 168, 130, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(196, 168, 130, 0.3)";
                }}
              >
                <span style={{ fontSize: 24, display: "flex", alignItems: "center" }}>{ctaIcon}</span>
                <span>{ctaLabel}</span>
                <RightOutlined style={{ marginLeft: "auto", opacity: 0.8, fontSize: 16 }} />
              </button>
            );
          })()}

          {/* ── TodaysPlan ── */}
          {!isNewUser && (
            <Card
              title={<span style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", fontFamily: "var(--font-display)" }}><ScheduleOutlined style={{ marginRight: 10, color: "var(--accent)" }} /> Kế hoạch hôm nay</span>}
              style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              styles={{ header: { borderBottom: "1px solid var(--border)", padding: "20px 28px" }, body: { padding: "12px 16px" } }}
            >
              <Flex vertical gap={4}>
                {todayItems.map((item) => (
                  <div
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    style={{
                      padding: "16px",
                      borderRadius: "var(--radius-xl)",
                      cursor: "pointer",
                      transition: "all var(--duration-fast) ease",
                      background: "transparent",
                      opacity: item.done ? 0.6 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 16
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ 
                      width: 52, height: 52, borderRadius: "50%", background: item.done ? "var(--success-bg)" : "var(--bg-deep)", 
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                      color: item.done ? "var(--success)" : "var(--text-secondary)",
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
                    }}>
                      {item.icon}
                    </div>
                    <Flex vertical style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
                        {item.label}
                      </Text>
                      {"reason" in item && item.reason ? (
                        <Text type="secondary" style={{ fontSize: 14 }}>
                          {String(item.reason)}
                          {"estimatedMinutes" in item ? <span style={{ opacity: 0.7 }}> • ~{String(item.estimatedMinutes)} phút</span> : null}
                        </Text>
                      ) : null}
                    </Flex>
                    {item.done ? <CheckCircleFilled style={{ color: "var(--success)", fontSize: 24 }} /> : <RightOutlined style={{ color: "var(--text-muted)", fontSize: 16 }} />}
                  </div>
                ))}
              </Flex>
            </Card>
          )}

          {/* ── Learning Style & Quick Actions Grid ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-8)" }}>
            {/* ── Learning Style (Story 16.3) ── */}
            {!isNewUser && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <LearningStyleCard />
              </div>
            )}

            {/* ── QuickActions ── */}
            <Card
              title={<span style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", fontFamily: "var(--font-display)" }}><ThunderboltOutlined style={{ marginRight: 10, color: "var(--warning)" }} /> Luyện tập thêm</span>}
              style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", height: "100%" }}
              styles={{ header: { borderBottom: "none", padding: "20px 28px 0" }, body: { padding: "24px 28px" } }}
            >
              <Flex gap={12} wrap>
                {[
                  { label: "Chat AI", href: "/english-chatbot", icon: <CommentOutlined />, color: "var(--info)", bg: "var(--info-bg)" },
                  { label: "Từ điển", href: "/dictionary", icon: <ReadOutlined />, color: "var(--warning)", bg: "var(--warning-bg)" },
                  { label: "Ngữ pháp", href: "/grammar-quiz", icon: <BulbOutlined />, color: "var(--success)", bg: "var(--success-bg)" },
                ].map((action) => (
                  <Button
                    key={action.href}
                    size="large"
                    icon={<span style={{ color: action.color }}>{action.icon}</span>}
                    onClick={() => router.push(action.href)}
                    style={{
                      background: action.bg,
                      color: "var(--text-primary)",
                      border: "none",
                      fontWeight: 600,
                      borderRadius: "var(--radius-xl)",
                      padding: "0 20px",
                      height: 48,
                      boxShadow: "none"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Flex>
            </Card>
          </div>

          {/* ── Word of the Day (Story 14.3) ── */}
          {!isNewUser && <WordOfTheDay />}

          {/* ── RecentVocabulary ── */}
          {data.recentVocabulary.length > 0 && (
            <Card
              title={<span style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", fontFamily: "var(--font-display)" }}><BookOutlined style={{ marginRight: 10, color: "var(--tertiary)" }} /> Từ vựng gần đây</span>}
              style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
              styles={{ header: { borderBottom: "none", padding: "20px 28px 0" }, body: { padding: "20px 28px 28px" } }}
            >
              <Flex gap={16} style={{ overflowX: "auto", paddingBottom: 12, margin: "0 -8px", padding: "0 8px" }} className="scrollbar-none">
                {data.recentVocabulary.map((word) => (
                  <div
                    key={word.query}
                    onClick={() => router.push(`/dictionary?q=${encodeURIComponent(word.query)}`)}
                    style={{ 
                      flexShrink: 0, 
                      minWidth: 140, 
                      borderRadius: "var(--radius-xl)", 
                      padding: "20px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      boxShadow: "var(--shadow)",
                      transition: "all var(--duration-fast) ease"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--accent)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    <Text style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>{word.headword}</Text>
                    <Tag color="processing" style={{ margin: 0, borderRadius: "var(--radius)", border: "none", background: "var(--info-bg)", color: "var(--info)", fontWeight: 600, padding: "2px 10px" }}>{word.level}</Tag>
                  </div>
                ))}
              </Flex>
            </Card>
          )}

          {/* ── WeeklyProgress ── */}
          <Card
            title={<span style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", fontFamily: "var(--font-display)" }}><BarChartOutlined style={{ marginRight: 10, color: "var(--success)" }} /> Hoạt động trong tuần</span>}
            style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            styles={{ header: { borderBottom: "none", padding: "20px 28px 0" }, body: { padding: "24px 28px" } }}
          >
            <Flex align="flex-end" justify="space-between" gap={8} style={{ height: 140, padding: "0 12px" }}>
              {data.weeklyActivity.map((day) => (
                <Flex key={day.day} vertical align="center" gap={12} style={{ flex: 1 }}>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 40,
                      borderRadius: "8px",
                      background: day.count > 0 ? "var(--gradient-vocabulary)" : "var(--bg-deep)",
                      height: `${Math.max((day.count / maxActivity) * 100, 8)}px`,
                      transition: `height var(--duration-normal) ease`,
                      boxShadow: day.count > 0 ? "0 4px 16px rgba(196, 168, 130, 0.4)" : "none"
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 13, fontWeight: 600 }}>{getDayLabel(day.day)}</Text>
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
            title={<span style={{ fontSize: 20, fontWeight: 700, display: "flex", alignItems: "center", fontFamily: "var(--font-display)" }}><TrophyOutlined style={{ marginRight: 10, color: "var(--fire)" }} /> Thành tích</span>}
            style={{ borderRadius: "var(--radius-2xl)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
            styles={{ header: { borderBottom: "none", padding: "20px 28px 0" }, body: { padding: "24px 28px" } }}
          >
            <Flex gap="var(--space-8)" style={{ marginBottom: "var(--space-8)", padding: "24px", background: "var(--surface-alt)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", boxShadow: "inset 0 2px 8px rgba(0,0,0,0.02)" }}>
              <Flex vertical align="center" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <FireOutlined style={{ color: "var(--fire)", fontSize: 28 }} />
                  <Title level={1} style={{ margin: 0, color: "var(--fire)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{data.streak.currentStreak}</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Streak hiện tại</Text>
              </Flex>
              <div style={{ width: 1, background: "var(--border)" }} />
              <Flex vertical align="center" style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <TrophyOutlined style={{ color: "var(--xp)", fontSize: 28 }} />
                  <Title level={1} style={{ margin: 0, color: "var(--xp)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{data.streak.bestStreak}</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 14, fontWeight: 600 }}>Streak tốt nhất</Text>
              </Flex>
            </Flex>
            {data.badges.length > 0 && (
              <Flex gap={16} wrap>
                {data.badges.map((badge) => (
                  <div
                    key={badge.id}
                    style={{
                      borderRadius: "var(--radius-xl)",
                      background: badge.unlocked ? "var(--surface)" : "var(--bg-deep)",
                      opacity: badge.unlocked ? 1 : 0.6,
                      padding: "16px 20px",
                      textAlign: "center",
                      border: badge.unlocked ? "1px solid var(--accent)" : "1px solid var(--border)",
                      boxShadow: badge.unlocked ? "0 4px 16px var(--accent-muted)" : "none",
                      flex: "1 1 calc(33.333% - 16px)",
                      minWidth: 100,
                      transition: "all var(--duration-fast) ease"
                    }}
                    onMouseEnter={badge.unlocked ? (e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px var(--accent-muted)"; } : undefined}
                    onMouseLeave={badge.unlocked ? (e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px var(--accent-muted)"; } : undefined}
                  >
                    <div style={{ fontSize: 36, filter: badge.unlocked ? "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" : "grayscale(100%)", marginBottom: 8 }}>{badge.emoji}</div>
                    <Text style={{ fontSize: 14, fontWeight: 600, color: badge.unlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{badge.label}</Text>
                  </div>
                ))}
              </Flex>
            )}
          </Card>

        </Flex>
      </div>
    </div>
  );
}
