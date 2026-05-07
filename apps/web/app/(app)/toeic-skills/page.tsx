"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  CustomerServiceOutlined,
  ReadOutlined,
  AudioOutlined,
  FormOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

/* ── Lazy-load each tab ── */
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

const SKILL_TABS: { value: Skill; label: string; parts: string; icon: React.ReactNode }[] = [
  { value: "listening", label: "Listening", parts: "Part 1–4", icon: <CustomerServiceOutlined /> },
  { value: "reading",   label: "Reading",   parts: "Part 5–7", icon: <ReadOutlined /> },
  { value: "speaking",  label: "Speaking",   parts: "Part 1–6", icon: <AudioOutlined /> },
  { value: "writing",   label: "Writing",    parts: "Part 1–3", icon: <FormOutlined /> },
];

const SUBTITLES: Record<Skill, string> = {
  listening: "TOEIC Listening · Part 1–4 · Nghe hiểu",
  reading:   "TOEIC Reading · Part 5–7 · Luyện đề ETS",
  speaking:  "TOEIC Speaking · Part 1 · Mô tả hình ảnh",
  writing:   "TOEIC Writing · Part 1–3 · Viết & chấm bài",
};

export default function ToeicSkillsPage() {
  const [activeSkill, setActiveSkill] = useState<Skill>("listening");

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", minHeight: 0, flex: 1, overflow: "hidden",
      position: "relative",
    }}>
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      <ModuleHeader
        icon={
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: "-0.5px", fontFamily: "var(--font-display)" }}>
            TOEIC
          </span>
        }
        gradient="var(--gradient-toeic-skills)"
        title="TOEIC 4 Skills"
        subtitle={SUBTITLES[activeSkill]}
        action={
          <div style={{
            display: "inline-flex",
            borderRadius: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: 3,
            gap: 2,
          }}>
            {SKILL_TABS.map((t) => {
              const isActive = activeSkill === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setActiveSkill(t.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {isActive && (
                    <span style={{
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.7)",
                      fontWeight: 600,
                    }}>
                      {t.parts}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
