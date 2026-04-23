"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOutlined } from "@ant-design/icons";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { TopicGrid } from "@/app/(app)/grammar-lessons/_components/TopicGrid";
import { LessonView } from "@/app/(app)/grammar-lessons/_components/LessonView";
import { api } from "@/lib/api-client";
import type { GrammarLessonProgressItem } from "@/lib/grammar-lessons/schema";
import type { GrammarTopic } from "@/lib/grammar-lessons/topics";

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
  const [progressByTopic, setProgressByTopic] = useState<Record<string, GrammarLessonProgressItem>>({});
  const [recommendedTopic, setRecommendedTopic] = useState<GrammarTopic | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const completedTopics = useMemo(
    () => new Set(Object.values(progressByTopic).filter((item) => item.status === "completed").map((item) => item.topicId)),
    [progressByTopic],
  );

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
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexShrink: 0,
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            display: "grid",
            width: 40,
            height: 40,
            placeItems: "center",
            borderRadius: "var(--radius)",
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <BookOutlined style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            {activeTopic ? activeTopic.title : "Bài học ngữ pháp"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {activeTopic
              ? `${activeTopic.level} · Bài học chi tiết`
              : `${completedTopics.size} bài đã học${recommendedTopic ? ` · Gợi ý: ${recommendedTopic.title}` : " · Chọn chủ đề để bắt đầu"}`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
        }}
      >
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 6%, transparent) 0%, transparent 70%)",
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
              <TopicGrid
                onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
                completedTopics={completedTopics}
                progressByTopic={progressByTopic}
                recommendedTopicId={recommendedTopic?.id ?? null}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
