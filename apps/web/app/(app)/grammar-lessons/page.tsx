"use client";

import { useState } from "react";
import { BookOutlined } from "@ant-design/icons";

import { useExamMode } from "@/components/app/shared/ExamModeProvider";
import { TopicGrid } from "@/components/app/grammar-lessons/TopicGrid";
import { LessonView } from "@/components/app/grammar-lessons/LessonView";

export default function GrammarLessonsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<{ id: string; title: string; level: string } | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());

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
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        background: "linear-gradient(180deg, var(--surface), var(--bg))",
        boxShadow: "var(--shadow-md)",
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
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
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
              : `${completedTopics.size} bài đã học · Chọn chủ đề để bắt đầu`}
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
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 70%)",
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
              onComplete={(topicId) => setCompletedTopics((prev) => new Set(prev).add(topicId))}
            />
          ) : (
            <TopicGrid
              onSelectTopic={(id, title, level) => setActiveTopic({ id, title, level })}
              completedTopics={completedTopics}
            />
          )}
        </div>
      </div>
    </div>
  );
}
