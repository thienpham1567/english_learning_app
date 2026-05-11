"use client";

import { type ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Typography, Card } from "antd";
import {
  BookFilled,
  AppstoreOutlined,
  BulbOutlined,
  FireOutlined,
  SyncOutlined,
  TrophyOutlined,
  FileTextOutlined,
  YoutubeOutlined,
  StarOutlined,
  ExceptionOutlined,
  QuestionCircleOutlined,
  AimOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  href?: string;
  action?: "exam-hub" | "review-hub" | "more-hub";
}

const TABS: TabItem[] = [
  { key: "toeic", label: "TOEIC", icon: <AimOutlined />, activeIcon: <AimOutlined />, href: "/toeic-skills" },
  { key: "exam", label: "Đề thi", icon: <TrophyOutlined />, activeIcon: <TrophyOutlined />, action: "exam-hub" },
  { key: "challenge", label: "Thử thách", icon: <FireOutlined />, activeIcon: <FireOutlined />, href: "/daily-challenge" },
  { key: "review", label: "Ôn tập", icon: <SyncOutlined />, activeIcon: <SyncOutlined />, action: "review-hub" },
  { key: "more", label: "Thêm", icon: <AppstoreOutlined />, activeIcon: <AppstoreOutlined />, action: "more-hub" },
];

const EXAM_HUB_ITEMS = [
  { label: "Luyện đề ETS", icon: <TrophyOutlined />, href: "/toeic-practice" },
  { label: "TOEIC Part 5", icon: <QuestionCircleOutlined />, href: "/grammar-quiz" },
];

const REVIEW_HUB_ITEMS = [
  { label: "Ôn tập SRS", icon: <SyncOutlined />, href: "/review-quiz" },
  { label: "Sổ lỗi sai", icon: <ExceptionOutlined />, href: "/error-notebook" },
  { label: "Ôn tập Flashcard", icon: <BookFilled />, href: "/flashcards" },
];

const MORE_HUB_ITEMS = [
  { label: "Đọc sách TOEIC", icon: <FileTextOutlined />, href: "/pdf-reader" },
  { label: "YouTube TOEIC", icon: <YoutubeOutlined />, href: "/youtube-learn" },
  { label: "Ngữ pháp TOEIC", icon: <BulbOutlined />, href: "/grammar-lessons" },
  { label: "Từ vựng", icon: <StarOutlined />, href: "/my-vocabulary" },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/toeic-skills")) return "toeic";
  if (pathname.startsWith("/toeic-practice") || pathname.startsWith("/grammar-quiz")) return "exam";
  if (pathname.startsWith("/daily-challenge")) return "challenge";
  if (
    pathname.startsWith("/review-quiz") ||
    pathname.startsWith("/error-notebook") ||
    pathname.startsWith("/flashcards")
  ) return "review";
  // Everything else falls into "more"
  if (
    pathname.startsWith("/grammar-lessons") ||
    pathname.startsWith("/my-vocabulary") ||
    pathname.startsWith("/pdf-reader") ||
    pathname.startsWith("/youtube-learn") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/writing-practice") ||
    pathname.startsWith("/writing-tools") ||
    pathname.startsWith("/pronunciation") ||
    pathname.startsWith("/speaking-practice") ||
    pathname.startsWith("/dictionary") ||
    pathname.startsWith("/ipa-chart")
  ) return "more";
  return "toeic";
}

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [activeHub, setActiveHub] = useState<"exam" | "review" | "more" | null>(null);

  const handleTabClick = (tab: TabItem) => {
    if (tab.action === "exam-hub") {
      setActiveHub((prev) => (prev === "exam" ? null : "exam"));
    } else if (tab.action === "review-hub") {
      setActiveHub((prev) => (prev === "review" ? null : "review"));
    } else if (tab.action === "more-hub") {
      setActiveHub((prev) => (prev === "more" ? null : "more"));
    } else if (tab.href) {
      setActiveHub(null);
      router.push(tab.href);
    }
  };

  const hubItems = activeHub === "exam" ? EXAM_HUB_ITEMS : activeHub === "review" ? REVIEW_HUB_ITEMS : activeHub === "more" ? MORE_HUB_ITEMS : [];

  return (
    <>
      {/* Learn Hub Overlay */}
      {activeHub !== null && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setActiveHub(null)}
            style={{
              position: "fixed",
              inset: 0,
              border: "none",
              background: "rgba(0,0,0,0.4)",
              padding: 0,
              zIndex: 20,
              animation: "fadeIn var(--duration-fast) ease",
            }}
          />

          {/* Hub cards */}
          <div
            style={{
              position: "fixed",
              bottom: 64,
              left: "var(--space-4)",
              right: "var(--space-4)",
              zIndex: 21,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
              animation: "slideInUp var(--duration-normal) ease",
            }}
          >
            {hubItems.map((item) => (
              <Card
                key={item.href}
                hoverable
                onClick={() => {
                  setActiveHub(null);
                  router.push(item.href);
                }}
                style={{
                  borderRadius: "var(--radius-xl)",
                  textAlign: "center",
                }}
                styles={{ body: { padding: "var(--space-4)" } }}
              >
                <Text style={{ fontSize: 24, color: "var(--accent)" }}>{item.icon}</Text>
                <br />
                <Text strong style={{ fontSize: "var(--text-sm)" }}>{item.label}</Text>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Tab Bar */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => handleTabClick(tab)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                padding: "6px 0",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Flex justify="center" align="center" style={{ fontSize: 20, color: isActive ? "var(--accent)" : "var(--text-muted)", transition: `color var(--duration-fast) ease` }}>
                {isActive ? tab.activeIcon : tab.icon}
              </Flex>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  lineHeight: 1,
                  transition: `color var(--duration-fast) ease`,
                }}
              >
                {tab.label}
              </Text>
            </button>
          );
        })}
      </nav>
    </>
  );
}
