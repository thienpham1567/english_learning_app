"use client";

import { useState } from "react";
import { CheckCircleOutlined, SwapOutlined, ToolOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { GrammarChecker } from "@/app/(app)/writing-tools/_components/GrammarChecker";
import { Paraphraser } from "@/app/(app)/writing-tools/_components/Paraphraser";

type Tab = "grammar" | "paraphrase";

const TABS: { key: Tab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    key: "grammar",
    label: "Kiểm tra ngữ pháp",
    icon: <CheckCircleOutlined />,
    description: "Phát hiện và sửa lỗi ngữ pháp, chính tả, phong cách",
  },
  {
    key: "paraphrase",
    label: "Viết lại văn bản",
    icon: <SwapOutlined />,
    description: "Viết lại câu với nhiều phong cách khác nhau",
  },
];

export default function WritingToolsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("grammar");

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
      {/* Header */}
      <ModuleHeader
        icon={<ToolOutlined />}
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        title="Công cụ viết"
        subtitle="Grammar Check & Paraphraser · Kiểm tra và cải thiện văn bản"
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "0 16px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 900 }}>
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              gap: 0,
              marginTop: 16,
              marginBottom: 20,
              borderRadius: 14,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    padding: "14px 20px",
                    border: "none",
                    background: active
                      ? "var(--card-bg)"
                      : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    transition: "all 0.2s",
                    borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: active ? "var(--text-secondary)" : "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active tab content */}
          {activeTab === "grammar" && <GrammarChecker />}
          {activeTab === "paraphrase" && <Paraphraser />}
        </div>
      </div>
    </div>
  );
}
