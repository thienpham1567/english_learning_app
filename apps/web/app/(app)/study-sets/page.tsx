"use client";

import { useState } from "react";
import { AppstoreOutlined } from "@ant-design/icons";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { TopicSetGrid } from "@/app/(app)/study-sets/_components/TopicSetGrid";
import { StudySetView } from "@/app/(app)/study-sets/_components/StudySetView";
import type { StudyTopic } from "@/app/(app)/study-sets/_components/TopicSetGrid";

export default function StudySetsPage() {
  const { examMode } = useExamMode();
  const [activeTopic, setActiveTopic] = useState<StudyTopic | null>(null);
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
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            color: "#fff",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <AppstoreOutlined style={{ fontSize: 20 }} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
            {activeTopic ? activeTopic.title : "Học theo chủ đề"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
            {activeTopic
              ? `${activeTopic.level} · ${activeTopic.time} · 4 phần`
              : `${completedTopics.size} chủ đề đã hoàn thành`}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", minHeight: 0, flex: 1, overflowY: "auto", padding: "20px 16px" }}>
        <div style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "relative", margin: "0 auto", maxWidth: 700, width: "100%" }}>
          {activeTopic ? (
            <StudySetView
              topicId={activeTopic.id}
              topicTitle={activeTopic.title}
              level={activeTopic.level}
              examMode={examMode}
              onBack={() => setActiveTopic(null)}
              onComplete={(id) => setCompletedTopics((prev) => new Set(prev).add(id))}
            />
          ) : (
            <TopicSetGrid
              onSelect={setActiveTopic}
              completedTopics={completedTopics}
            />
          )}
        </div>
      </div>
    </div>
  );
}
