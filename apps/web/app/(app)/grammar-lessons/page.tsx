"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  CheckCircleOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Alert } from "antd";
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

  // Stats for the active exam tab
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

        <div style={{ position: "relative", margin: "0 auto", maxWidth: 700, width: "100%" }}>
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
              {/* Stats strip */}
              <div
                className="anim-fade-up"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                {[
                  {
                    icon: <BookOutlined style={{ color: "var(--accent)" }} />,
                    bgIcon: "var(--accent-light)",
                    label: "Chủ đề cấu trúc",
                    value: `${tabStats.categories} nhóm · ${tabStats.totalTopics} bài`,
                  },
                  {
                    icon: <CheckCircleOutlined style={{ color: "var(--success)" }} />,
                    bgIcon: "rgba(16, 185, 129, 0.08)",
                    label: "Đã hoàn thành",
                    value: `${tabStats.completed} / ${tabStats.totalTopics} bài học`,
                  },
                  {
                    icon: progressPct === 100 && tabStats.totalTopics > 0
                      ? <StarOutlined style={{ color: "var(--xp)" }} />
                      : <FireOutlined style={{ color: "var(--fire)" }} />,
                    bgIcon: progressPct === 100 ? "rgba(139, 92, 246, 0.08)" : "rgba(245, 158, 11, 0.08)",
                    label: "Tiến độ học tập",
                    value: `${progressPct}%`,
                  },
                ].map((stat, idx) => (
                  <m.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "16px 20px",
                      borderRadius: "var(--radius-xl)",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: stat.bgIcon,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {stat.icon}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {stat.label}
                      </span>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--text-primary)", marginTop: 2, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {stat.value}
                      </span>
                    </div>
                  </m.div>
                ))}
              </div>

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

              {/* Recommended Topic Quick Action */}
              {recommendedTopic && (
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 }}
                  whileHover={{ scale: 1.005, y: -1 }}
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), var(--surface))",
                    border: "1.5px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
                    borderRadius: "var(--radius-xl)",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(139, 92, 246, 0.08)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <StarOutlined style={{ fontSize: 18, color: "var(--accent)" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Bài học gợi ý tiếp theo
                    </span>
                    <h4 style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
                      {recommendedTopic.title}
                    </h4>
                  </div>
                  <m.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTopic({ id: recommendedTopic.id, title: recommendedTopic.title, level: recommendedTopic.level })}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 99,
                      background: "var(--accent)",
                      color: "var(--text-on-accent)",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px var(--accent-muted)",
                    }}
                  >
                    Học ngay
                  </m.button>
                </m.div>
              )}

              {/* Topic grid */}
              <div className="anim-fade-up anim-delay-2">
                <TopicGrid
                  onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
                  completedTopics={completedTopics}
                  progressByTopic={progressByTopic}
                  recommendedTopicId={recommendedTopic?.id ?? null}
                  examFilter={examTab}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
