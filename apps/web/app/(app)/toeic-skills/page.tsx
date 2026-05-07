"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  AimOutlined,
  CustomerServiceOutlined,
  ReadOutlined,
  AudioOutlined,
  FormOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Segmented } from "antd";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

/* ── Lazy-load each tab to keep initial bundle small ── */
const ListeningTab = dynamic(
  () => import("@/app/(app)/toeic-skills/_components/ListeningTab").then((m) => m.ListeningTab),
  { ssr: false, loading: () => <TabLoader /> },
);
const ReadingTab = dynamic(
  () => import("@/app/(app)/toeic-skills/_components/ReadingTab").then((m) => m.ReadingTab),
  { ssr: false, loading: () => <TabLoader /> },
);
const SpeakingTab = dynamic(
  () => import("@/app/(app)/toeic-skills/_components/SpeakingTab").then((m) => m.SpeakingTab),
  { ssr: false, loading: () => <TabLoader /> },
);
const WritingTab = dynamic(
  () => import("@/app/(app)/toeic-skills/_components/WritingTab").then((m) => m.WritingTab),
  { ssr: false, loading: () => <TabLoader /> },
);

function TabLoader() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 64, color: "var(--text-muted)" }}>
      <LoadingOutlined style={{ fontSize: 24, marginRight: 8 }} /> Đang tải...
    </div>
  );
}

type Skill = "listening" | "reading" | "speaking" | "writing";

const SKILL_TABS: { value: Skill; label: string; icon: React.ReactNode }[] = [
  { value: "listening", label: "Listening", icon: <CustomerServiceOutlined /> },
  { value: "reading", label: "Reading", icon: <ReadOutlined /> },
  { value: "speaking", label: "Speaking", icon: <AudioOutlined /> },
  { value: "writing", label: "Writing", icon: <FormOutlined /> },
];

const SUBTITLES: Record<Skill, string> = {
  listening: "Nghe hiểu · AI tạo bài · CEFR",
  reading: "Luyện đề ETS · Part 3–7 · 1,320 câu",
  speaking: "Part 1 · Mô tả hình ảnh · 45 giây",
  writing: "Viết & chấm · Cải thiện câu · Viết có hướng dẫn",
};

export default function ToeicSkillsPage() {
  const [activeSkill, setActiveSkill] = useState<Skill>("listening");

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, flex: 1, overflow: "hidden",
      position: "relative",
    }}>
      {/* Grain texture */}
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      <ModuleHeader
        icon={<AimOutlined />}
        gradient="var(--gradient-toeic-skills)"
        title="TOEIC 4 Kỹ Năng"
        subtitle={SUBTITLES[activeSkill]}
        action={
          <Segmented
            value={activeSkill}
            onChange={(val) => setActiveSkill(val as Skill)}
            options={SKILL_TABS.map((t) => ({
              value: t.value,
              label: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {t.icon} {t.label}
                </span>
              ),
            }))}
            size="small"
          />
        }
      />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px 40px", position: "relative", zIndex: 1 }}>
        {activeSkill === "listening" && <ListeningTab />}
        {activeSkill === "reading" && <ReadingTab />}
        {activeSkill === "speaking" && <SpeakingTab />}
        {activeSkill === "writing" && <WritingTab />}
      </div>
    </div>
  );
}
