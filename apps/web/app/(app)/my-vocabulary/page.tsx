"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  BookOutlined,
  SearchOutlined,
  StarFilled,
  LoadingOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";

const ToeicVocabTab = dynamic(
  () =>
    import("@/app/(app)/my-vocabulary/_components/ToeicVocabTab").then(
      (m) => m.ToeicVocabTab,
    ),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--text-muted)", gap: 10 }}>
        <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Đang tải...</span>
      </div>
    ),
  },
);

const DictionaryTab = dynamic(
  () =>
    import("@/app/(app)/my-vocabulary/_components/DictionaryTab").then(
      (m) => m.DictionaryTab,
    ),
  {
    ssr: false,
    loading: () => (
      <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "var(--text-muted)", gap: 10 }}>
        <LoadingOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Đang tải...</span>
      </div>
    ),
  },
);

type TabKey = "toeic" | "dictionary";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "toeic", label: "TOEIC 600", icon: <BookOutlined /> },
  { key: "dictionary", label: "Tra từ điển", icon: <SearchOutlined /> },
];

const SUBTITLES: Record<TabKey, string> = {
  toeic: "600 từ thiết yếu · 10 chủ đề · SRS",
  dictionary: "Tra cứu · Lịch sử · Từ đã lưu",
};

const GRADIENTS: Record<TabKey, string> = {
  toeic: "var(--gradient-vocab)",
  dictionary: "var(--gradient-vocab)",
};

const TAB_COLORS: Record<TabKey, string> = {
  toeic: "var(--accent)",
  dictionary: "var(--secondary, var(--accent))",
};

export default function MyVocabularyPage() {
  const [active, setActive] = useState<TabKey>("toeic");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      <ModuleHeader
        icon={TABS.find((t) => t.key === active)?.icon ?? <BookOutlined />}
        gradient={GRADIENTS[active]}
        title="Từ vựng TOEIC"
        subtitle={SUBTITLES[active]}
      />

      {/* Tab switcher */}
      <div style={{
        padding: "12px 16px 6px",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          gap: 4,
          background: "var(--surface-alt)",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: 4,
        }}>
          {TABS.map((t) => {
            const isActive = active === t.key;
            return (
              <m.button
                type="button"
                key={t.key}
                onClick={() => setActive(t.key)}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: isActive ? TAB_COLORS[t.key] : "transparent",
                  color: isActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13.5,
                  fontWeight: 800,
                  transition: "color 0.2s, background 0.2s",
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </m.button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: "auto", padding: "16px 16px 40px" }}>
        {active === "toeic" && <ToeicVocabTab />}
        {active === "dictionary" && <DictionaryTab />}
      </div>
    </div>
  );
}
