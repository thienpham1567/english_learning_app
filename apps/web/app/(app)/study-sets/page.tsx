"use client";

import { useState } from "react";
import { AppstoreOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

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
      }}
    >
      {/* Header */}
      <ModuleHeader
        icon={<AppstoreOutlined />}
        gradient="linear-gradient(135deg, #f59e0b, #ef4444)"
        title={activeTopic ? activeTopic.title : "Học theo chủ đề"}
        subtitle={
          activeTopic
            ? `${activeTopic.level} · ${activeTopic.time} · 4 phần`
            : `${completedTopics.size} chủ đề đã hoàn thành`
        }
      />

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
