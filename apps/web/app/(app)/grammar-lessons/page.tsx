"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOutlined,
  BankOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FireOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { Segmented } from "antd";

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
  const [examTab, setExamTab] = useState<ExamType>(examMode === "ielts" ? "ielts" : "toeic");
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
      {/* Premium gradient header */}
      <ModuleHeader
        icon={<BookOutlined />}
        gradient={
          examTab === "ielts"
            ? "var(--gradient-grammar-ielts)"
            : "var(--gradient-grammar)"
        }
        title={activeTopic ? activeTopic.title : "Ngữ pháp trọng tâm"}
        subtitle={
          activeTopic
            ? `${activeTopic.level} · ${examTab === "ielts" ? "IELTS" : "TOEIC"} · Bài học chi tiết`
            : recommendedTopic
            ? `Gợi ý tiếp: ${recommendedTopic.title}`
            : "Chinh phục ngữ pháp theo từng kỳ thi"
        }
        action={
          !activeTopic ? (
            <Segmented
              value={examTab}
              onChange={(val) => setExamTab(val as ExamType)}
              options={[
                {
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "1px 6px", fontSize: 13, fontWeight: 600 }}>
                      <BankOutlined /> TOEIC
                    </span>
                  ),
                  value: "toeic",
                },
                {
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "1px 6px", fontSize: 13, fontWeight: 600 }}>
                      <TrophyOutlined /> IELTS
                    </span>
                  ),
                  value: "ielts",
                },
              ]}
              size="small"
            />
          ) : undefined
        }
      />

      {/* Content area */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
        }}
      >
        {/* Soft gradient wash */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: examTab === "ielts"
              ? "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, #c07a70 6%, transparent) 0%, transparent 70%)"
              : "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
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
            <>
              {/* Stats strip */}
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    icon: <BookOutlined style={{ color: "var(--accent)" }} />,
                    label: "Chủ đề",
                    value: `${tabStats.categories} nhóm · ${tabStats.totalTopics} bài`,
                  },
                  {
                    icon: <CheckCircleOutlined style={{ color: "var(--success)" }} />,
                    label: "Đã hoàn thành",
                    value: `${tabStats.completed}/${tabStats.totalTopics}`,
                  },
                  {
                    icon: tabStats.completed === tabStats.totalTopics && tabStats.totalTopics > 0
                      ? <StarOutlined style={{ color: "var(--xp)" }} />
                      : <FireOutlined style={{ color: "var(--fire)" }} />,
                    label: "Tiến độ",
                    value: tabStats.totalTopics > 0
                      ? `${Math.round((tabStats.completed / tabStats.totalTopics) * 100)}%`
                      : "0%",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{stat.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress error */}
              {progressError && (
                <div
                  style={{
                    marginBottom: 12,
                    border: "1px solid color-mix(in srgb, var(--warning) 28%, transparent)",
                    borderRadius: 10,
                    background: "color-mix(in srgb, var(--warning) 7%, var(--surface))",
                    color: "var(--text-secondary)",
                    fontSize: 12,
                    padding: "9px 12px",
                  }}
                >
                  {progressError}
                </div>
              )}

              {/* Topic grid */}
              <TopicGrid
                onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
                completedTopics={completedTopics}
                progressByTopic={progressByTopic}
                recommendedTopicId={recommendedTopic?.id ?? null}
                examFilter={examTab}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
