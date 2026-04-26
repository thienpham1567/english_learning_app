"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useDailyStudyPlan, type DailyPlanItem } from "@/hooks/useDailyStudyPlan";

import { useRouter } from "next/navigation";
import { Card, Flex, Typography, Button, Tag, Spin, Result } from "antd";
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
  SmileOutlined,
} from "@ant-design/icons";

import { useDashboard, type DashboardData } from "@/hooks/useDashboard";
import { useUser } from "@/components/shared/UserContext";
import { EmptyStateCard, StreakCalendar, WordOfTheDay, WeeklyLeaderboard } from "@/components/shared";
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
  const [mounted, setMounted] = useState(false);
  // Greeting must be state-driven to avoid hydration mismatch (server vs client time)
  const [greeting, setGreeting] = useState("Xin chào");

  useEffect(() => {
    setMounted(true);
    setGreeting(getGreeting());
  }, []);

  // ── Adaptive daily plan (Story 21.3) — must be called before early returns ──
  const isReady = state.status === "ready";
  const data = isReady ? state.data : null;
  const isNewUser = data
    ? data.flashcardsDue === 0 &&
      data.recentVocabulary.length === 0 &&
      data.streak.currentStreak === 0 &&
      !data.dailyChallenge.completed
    : true;
  const adaptivePlan = useDailyStudyPlan({ enabled: isReady && !isNewUser });

  // (isReady, data, isNewUser moved above to satisfy hook ordering)

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
  if (!mounted || state.status === "loading") {
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

          {/* ── Hero Greeting ── */}
          <div
            className="hero-gradient-mesh anim-fade-up"
            style={{
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-10) var(--space-8)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "var(--shadow-xl)",
            }}
          >
            <div className="grain-overlay" style={{ opacity: 0.04, borderRadius: "inherit" }} />
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0, width: "50%",
              background: "radial-gradient(circle at 80% 40%, rgba(255,255,255,0.12) 0%, transparent 60%)",
              pointerEvents: "none"
            }} />
            <Flex vertical style={{ position: "relative", zIndex: 1 }}>
              <Text className="section-label" style={{ color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Dashboard</Text>
              <Title level={2} style={{ color: "#fff", fontFamily: "var(--font-display)", margin: 0, letterSpacing: "-0.5px", fontSize: 32 }}>
                {greeting}, {firstName}! <SmileOutlined style={{ marginLeft: 8, fontSize: 28, animation: "bounceEmoji 1s ease infinite" }} />
              </Title>

              <Flex gap={12} style={{ marginTop: "var(--space-6)" }} wrap>
                <div className="stat-pill">
                  <FireOutlined style={{ color: "#fff", fontSize: 18 }} />
                  <Text style={{ color: "#fff", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{data.streak.currentStreak}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>Streak</Text>
                </div>
                <div className="stat-pill">
                  <TrophyOutlined style={{ color: "#fff", fontSize: 18 }} />
                  <Text style={{ color: "#fff", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{data.totalXP}</Text>
                  <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>XP</Text>
                </div>
                {(() => {
                  const lvl = getLevel(data.totalXP);
                  return (
                    <div className="stat-pill" style={{ minWidth: 120 }}>
                      <BarChartOutlined style={{ color: "#fff", fontSize: 18 }} />
                      <Flex align="center" gap={8} style={{ width: "100%" }}>
                        <Text style={{ color: "#fff", fontWeight: 800, fontSize: 20, lineHeight: 1 }}>Lv.{lvl.level}</Text>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                          <div style={{ width: `${lvl.progress * 100}%`, height: "100%", borderRadius: 2, background: "#fff", transition: "width 0.5s ease" }} />
                        </div>
                      </Flex>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600 }}>{lvl.currentXP}/{lvl.nextXP}</Text>
                    </div>
                  );
                })()}
              </Flex>
            </Flex>
          </div>

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
                  <CheckCircleFilled style={{ fontSize: 24 }} />
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
            <div className="glass-card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "20px 28px", borderBottom: "1px solid var(--border)" }}>
                <Flex align="center" gap={10}>
                  <ScheduleOutlined style={{ color: "var(--accent)", fontSize: 18 }} />
                  <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>Kế hoạch hôm nay</Text>
                  <Tag style={{ marginLeft: "auto", borderRadius: 999, background: "var(--accent-muted)", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: 11 }}>
                    {todayItems.filter(i => i.done).length}/{todayItems.length}
                  </Tag>
                </Flex>
              </div>
              <div style={{ padding: "8px 12px" }}>
                {todayItems.map((item) => (
                  <div
                    key={item.href}
                    className="plan-item"
                    data-done={item.done}
                    onClick={() => router.push(item.href)}
                    style={{ opacity: item.done ? 0.6 : 1 }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--radius)",
                      background: item.done ? "var(--success-bg)" : "var(--bg-deep)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                      color: item.done ? "var(--success)" : "var(--accent)",
                    }}>
                      {item.icon}
                    </div>
                    <Flex vertical style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", textDecoration: item.done ? "line-through" : "none" }}>
                        {item.label}
                      </Text>
                      {"reason" in item && item.reason ? (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {String(item.reason)}
                          {"estimatedMinutes" in item ? <span style={{ opacity: 0.7 }}> • ~{String(item.estimatedMinutes)} phút</span> : null}
                        </Text>
                      ) : null}
                    </Flex>
                    {item.done ? <CheckCircleFilled style={{ color: "var(--success)", fontSize: 20 }} /> : <RightOutlined style={{ color: "var(--text-muted)", fontSize: 14 }} />}
                  </div>
                ))}
              </div>
            </div>
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
            <div className="glass-card" style={{ padding: "24px 28px", height: "100%" }}>
              <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                <ThunderboltOutlined style={{ color: "var(--warning)", fontSize: 18 }} />
                <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>Luyện tập thêm</Text>
              </Flex>
              <Flex gap={12}>
                {[
                  { label: "Chat AI", href: "/english-chatbot", icon: <CommentOutlined />, color: "var(--info)", bg: "var(--info-bg)" },
                  { label: "Từ điển", href: "/dictionary", icon: <ReadOutlined />, color: "var(--warning)", bg: "var(--warning-bg)" },
                  { label: "Ngữ pháp", href: "/grammar-quiz", icon: <BulbOutlined />, color: "var(--success)", bg: "var(--success-bg)" },
                ].map((action) => (
                  <div
                    key={action.href}
                    className="quick-action-card"
                    onClick={() => router.push(action.href)}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: "var(--radius)",
                      background: action.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 20, color: action.color,
                    }}>
                      {action.icon}
                    </div>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{action.label}</Text>
                  </div>
                ))}
              </Flex>
            </div>
          </div>

          {/* ── Word of the Day (Story 14.3) ── */}
          {!isNewUser && <WordOfTheDay />}

          {/* ── RecentVocabulary ── */}
          {data.recentVocabulary.length > 0 && (
            <div className="glass-card" style={{ padding: "24px 28px" }}>
              <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                <BookOutlined style={{ color: "var(--tertiary)", fontSize: 18 }} />
                <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>Từ vựng gần đây</Text>
              </Flex>
              <Flex gap={14} style={{ overflowX: "auto", paddingBottom: 8 }} className="scrollbar-none">
                {data.recentVocabulary.map((word) => (
                  <div
                    key={word.query}
                    className="vocab-scroll-card"
                    onClick={() => router.push(`/dictionary?q=${encodeURIComponent(word.query)}`)}
                  >
                    <Text style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>{word.headword}</Text>
                    <Tag style={{ margin: 0, borderRadius: 999, border: "none", background: "var(--info-bg)", color: "var(--info)", fontWeight: 700, fontSize: 11, padding: "2px 10px" }}>{word.level}</Tag>
                  </div>
                ))}
              </Flex>
            </div>
          )}

          {/* ── WeeklyProgress ── */}
          <div className="glass-card" style={{ padding: "24px 28px" }}>
            <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
              <BarChartOutlined style={{ color: "var(--success)", fontSize: 18 }} />
              <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>Hoạt động trong tuần</Text>
            </Flex>
            <div style={{ position: "relative", height: 140, padding: "0 8px" }}>
              {/* Subtle grid lines */}
              {[0.25, 0.5, 0.75].map((pct) => (
                <div key={pct} style={{ position: "absolute", left: 0, right: 0, bottom: `${pct * 100 + 28}px`, height: 1, background: "var(--border)", opacity: 0.4 }} />
              ))}
              <Flex align="flex-end" justify="space-between" gap={8} style={{ height: "100%" }}>
                {data.weeklyActivity.map((day) => (
                  <Flex key={day.day} vertical align="center" gap={10} style={{ flex: 1 }}>
                    {day.count > 0 && <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>{day.count}</Text>}
                    <div
                      className={day.count > 0 ? "premium-bar" : ""}
                      style={{
                        width: "100%",
                        maxWidth: 36,
                        background: day.count > 0 ? undefined : "var(--bg-deep)",
                        height: `${Math.max((day.count / maxActivity) * 100, 6)}px`,
                        borderRadius: 8,
                        transition: "height var(--duration-normal) ease",
                        boxShadow: day.count > 0 ? "0 4px 16px rgba(196, 168, 130, 0.3)" : "none"
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 700 }}>{getDayLabel(day.day)}</Text>
                  </Flex>
                ))}
              </Flex>
            </div>
          </div>

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
          <div className="glass-card" style={{ padding: "24px 28px" }}>
            <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
              <TrophyOutlined style={{ color: "var(--fire)", fontSize: 18 }} />
              <Text style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>Thành tích</Text>
            </Flex>

            {/* Streak Stats */}
            <Flex gap={16} style={{ marginBottom: 24 }}>
              <div style={{ flex: 1, padding: 20, borderRadius: "var(--radius-lg)", background: "var(--bg-deep)", textAlign: "center" }}>
                <FireOutlined style={{ color: "var(--fire)", fontSize: 24, marginBottom: 8, display: "block" }} />
                <Title level={2} style={{ margin: 0, color: "var(--fire)", fontFamily: "var(--font-display)" }}>{data.streak.currentStreak}</Title>
                <Text className="section-label" style={{ marginTop: 4, display: "block" }}>Hiện tại</Text>
              </div>
              <div style={{ flex: 1, padding: 20, borderRadius: "var(--radius-lg)", background: "var(--bg-deep)", textAlign: "center" }}>
                <TrophyOutlined style={{ color: "var(--xp)", fontSize: 24, marginBottom: 8, display: "block" }} />
                <Title level={2} style={{ margin: 0, color: "var(--xp)", fontFamily: "var(--font-display)" }}>{data.streak.bestStreak}</Title>
                <Text className="section-label" style={{ marginTop: 4, display: "block" }}>Tốt nhất</Text>
              </div>
            </Flex>

            {/* Badges */}
            {data.badges.length > 0 && (
              <Flex gap={12} wrap>
                {data.badges.map((badge) => (
                  <div key={badge.id} className="badge-glass" data-unlocked={badge.unlocked}>
                    <div style={{ fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {badge.icon === "TrophyOutlined" ? <TrophyOutlined /> : <FireOutlined />}
                    </div>
                    <Text style={{ fontSize: 13, fontWeight: 700, color: badge.unlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{badge.label}</Text>
                  </div>
                ))}
              </Flex>
            )}
          </div>

        </Flex>
      </div>
    </div>
  );
}
