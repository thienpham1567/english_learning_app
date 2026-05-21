"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  CheckCircleFilled,
  FireOutlined,
  StarFilled,
  RocketOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Alert, Progress } from "antd";
import * as m from "motion/react-client";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { TopicGrid } from "@/app/(app)/grammar-lessons/_components/TopicGrid";
import { LessonView } from "@/app/(app)/grammar-lessons/_components/LessonView";
import { api } from "@/lib/api-client";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import type { ExamType, GrammarTopic } from "@/lib/grammar-lessons/topics";
import { getCategoriesForExam } from "@/lib/grammar-lessons/topics";

type ProgressResponse = {
  progress: GrammarLessonProgressItem[];
  summary: {
    totalTopics: number;
    totalCompleted: number;
    completedTopicIds: string[];
    progressByTopic: Record<string, GrammarLessonProgressItem>;
  };
  recommendedTopic: GrammarTopic | null;
};

export default function GrammarLessonsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<{ id: string; title: string; level: string } | null>(null);
  const examTab: ExamType = "toeic";
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>({});
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const completedTopics = useMemo(
    () => new Set(Object.values(progressByTopic).filter((item) => item.status === "completed").map((item) => item.topicId)),
    [progressByTopic],
  );

  const inProgressTopics = useMemo(
    () => new Set(Object.values(progressByTopic).filter((item) => item.status === "in_progress").map((item) => item.topicId)),
    [progressByTopic],
  );

  const tabStats = useMemo(() => {
    const cats = getCategoriesForExam(examTab);
    const totalTopics = cats.reduce((sum, c) => sum + c.topics.length, 0);
    const completed = cats.reduce(
      (sum, c) => sum + c.topics.filter((t) => completedTopics.has(t.id)).length,
      0,
    );
    return { totalTopics, completed, categories: cats.length };
  }, [examTab, completedTopics]);

  const refreshProgress = useCallback(async () => {
    try {
      const data = await api.get<ProgressResponse>("/grammar-lessons/progress", {
        params: { examMode },
      });
      setProgressByTopic(data.summary.progressByTopic);
      setRecommendedTopic(data.recommendedTopic);
      setProgressError(null);
    } catch {
      setProgressError("Chưa tải được tiến độ học.");
    }
  }, [examMode]);

  useEffect(() => {
    let cancelled = false;

    api.get<ProgressResponse>("/grammar-lessons/progress", {
      params: { examMode },
    })
      .then((data) => {
        if (cancelled) return;
        setProgressByTopic(data.summary.progressByTopic);
        setRecommendedTopic(data.recommendedTopic);
        setProgressError(null);
      })
      .catch(() => {
        if (!cancelled) setProgressError("Chưa tải được tiến độ học.");
      });

    return () => {
      cancelled = true;
    };
  }, [examMode]);

  const progressPct = tabStats.totalTopics > 0 ? Math.round((tabStats.completed / tabStats.totalTopics) * 100) : 0;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Premium gradient header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<BookOutlined />}
          gradient="var(--gradient-grammar)"
          title={activeTopic ? activeTopic.title : "Ngữ pháp trọng tâm TOEIC"}
          subtitle={
            activeTopic
              ? `${activeTopic.level} · TOEIC · Bài học chi tiết`
              : recommendedTopic
              ? `Gợi ý tiếp theo: ${recommendedTopic.title}`
              : "Chinh phục ngữ pháp trọng tâm cho TOEIC"
          }
        />
      </div>

      {/* Content area */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px",
          zIndex: 1,
        }}
      >
        {/* Soft gradient wash */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 5%, transparent) 0%, transparent 70%)",
          }}
        />

        <div style={{ position: "relative", margin: "0 auto", maxWidth: 720, width: "100%" }}>
          {activeTopic ? (
            <LessonView
              topicId={activeTopic.id}
              topicTitle={activeTopic.title}
              level={activeTopic.level}
              examMode={examMode}
              onBack={() => setActiveTopic(null)}
              onComplete={(topicId, progress) => {
                setProgressByTopic((prev) => ({ ...prev, [topicId]: progress }));
                void refreshProgress();
              }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── Hero Stats Dashboard ── */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--border)",
                  padding: "24px",
                  boxShadow: "var(--shadow-md)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--accent), var(--secondary), var(--success))" }} />

                <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                  {/* Circle progress */}
                  <Progress
                    type="circle"
                    percent={progressPct}
                    size={88}
                    strokeWidth={8}
                    strokeColor={{ "0%": "var(--accent)", "100%": "var(--success)" }}
                    trailColor="var(--border)"
                    format={() => (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>{progressPct}%</div>
                        <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700 }}>Hoàn thành</div>
                      </div>
                    )}
                  />

                  {/* Stats grid */}
                  <div style={{ flex: 1, minWidth: 200, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    <StatCard
                      icon={<BookOutlined />}
                      iconColor="var(--accent)"
                      iconBg="var(--accent-light)"
                      label="Chủ đề"
                      value={`${tabStats.categories} nhóm`}
                      sub={`${tabStats.totalTopics} bài học`}
                    />
                    <StatCard
                      icon={<CheckCircleFilled />}
                      iconColor="var(--success)"
                      iconBg="rgba(16, 185, 129, 0.08)"
                      label="Hoàn thành"
                      value={`${tabStats.completed}`}
                      sub={`/${tabStats.totalTopics} bài`}
                    />
                    <StatCard
                      icon={progressPct === 100 ? <TrophyOutlined /> : <FireOutlined />}
                      iconColor={progressPct === 100 ? "var(--xp)" : "var(--fire)"}
                      iconBg={progressPct === 100 ? "rgba(139, 92, 246, 0.08)" : "rgba(245, 158, 11, 0.08)"}
                      label="Đang học"
                      value={`${inProgressTopics.size}`}
                      sub="chủ đề"
                    />
                  </div>
                </div>
              </m.div>

              {/* Progress error */}
              {progressError && (
                <Alert
                  type="warning"
                  showIcon
                  message={progressError}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                />
              )}

              {/* ── Recommended Topic CTA ── */}
              {recommendedTopic && (
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <m.button
                    onClick={() => setActiveTopic({ id: recommendedTopic.id, title: recommendedTopic.title, level: recommendedTopic.level })}
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      width: "100%",
                      padding: "18px 24px",
                      borderRadius: "var(--radius-xl)",
                      border: "none",
                      background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, var(--secondary)))",
                      cursor: "pointer",
                      boxShadow: "0 8px 28px var(--accent-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      position: "relative",
                      overflow: "hidden",
                      textAlign: "left",
                    }}
                  >
                    {/* Decorative glow */}
                    <div style={{ position: "absolute", top: "-50%", right: "-10%", width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "-40%", left: "-5%", width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

                    {/* Icon */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(10px)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}>
                      <RocketOutlined style={{ fontSize: 22, color: "#fff" }} />
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        <StarFilled style={{ fontSize: 9, marginRight: 4 }} />
                        Bài học gợi ý tiếp theo
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", fontFamily: "var(--font-display)", marginTop: 3 }}>
                        {recommendedTopic.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", fontWeight: 600, marginTop: 2 }}>
                        {recommendedTopic.level} · Bấm để bắt đầu học ngay
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.15)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}>
                      <ArrowRightOutlined style={{ fontSize: 14, color: "#fff" }} />
                    </div>
                  </m.button>
                </m.div>
              )}

              {/* ── Quick Actions ── */}
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
              >
                <QuickAction
                  href="/grammar-roadmap"
                  emoji="🗺️"
                  label="Lộ trình học"
                  desc="Xem bản đồ 3 giai đoạn"
                  color="var(--accent)"
                  onClick={() => {}}
                />
                <QuickAction
                  href="/grammar-quiz"
                  emoji="📝"
                  label="Quiz Part 5"
                  desc="Luyện đề thực chiến"
                  color="var(--success)"
                  onClick={() => {}}
                />
              </m.div>

              {/* Topic grid */}
              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <ThunderboltOutlined style={{ color: "var(--accent)", fontSize: 16 }} />
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)" }}>
                    Thư viện chủ đề
                  </h2>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  }}>
                    {tabStats.totalTopics} bài
                  </span>
                </div>
                <TopicGrid
                  onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
                  completedTopics={completedTopics}
                  progressByTopic={progressByTopic}
                  recommendedTopicId={recommendedTopic?.id ?? null}
                  examFilter={examTab}
                />
              </m.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "12px 8px",
      borderRadius: "var(--radius-lg)",
      background: "var(--surface-alt)",
      border: "1px solid var(--border)",
    }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: iconBg,
        display: "grid",
        placeItems: "center",
        fontSize: 16,
        color: iconColor,
        marginBottom: 8,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--ink)", fontFamily: "var(--font-display)", lineHeight: 1.1, marginTop: 2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginTop: 1 }}>
        {sub}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  emoji,
  label,
  desc,
  color,
  onClick,
}: {
  href: string;
  emoji: string;
  label: string;
  desc: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <m.a
      href={href}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: "var(--radius-xl)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{desc}</div>
      </div>
    </m.a>
  );
}
