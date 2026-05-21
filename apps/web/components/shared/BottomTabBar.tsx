"use client";

import { type ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Typography, Card } from "antd";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
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
  DashboardOutlined,
  NodeIndexOutlined,
  MessageOutlined,
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
  {
    key: "home",
    label: "Tổng quan",
    icon: <DashboardOutlined />,
    activeIcon: <DashboardOutlined />,
    href: "/dashboard",
  },
  {
    key: "toeic",
    label: "TOEIC",
    icon: <AimOutlined />,
    activeIcon: <AimOutlined />,
    href: "/toeic-skills",
  },
  {
    key: "exam",
    label: "Đề thi",
    icon: <TrophyOutlined />,
    activeIcon: <TrophyOutlined />,
    action: "exam-hub",
  },
  {
    key: "review",
    label: "Ôn tập",
    icon: <SyncOutlined />,
    activeIcon: <SyncOutlined />,
    action: "review-hub",
  },
  {
    key: "more",
    label: "Thêm",
    icon: <AppstoreOutlined />,
    activeIcon: <AppstoreOutlined />,
    action: "more-hub",
  },
];

const EXAM_HUB_ITEMS = [
  { label: "Luyện đề ETS", icon: <TrophyOutlined />, href: "/toeic-practice" },
  {
    label: "TOEIC Part 5",
    icon: <QuestionCircleOutlined />,
    href: "/grammar-quiz",
  },
];

const REVIEW_HUB_ITEMS = [
  { label: "Ôn tập SRS", icon: <SyncOutlined />, href: "/review-quiz" },
  { label: "Sổ lỗi sai", icon: <ExceptionOutlined />, href: "/error-notebook" },
  { label: "Ôn tập Flashcard", icon: <BookFilled />, href: "/flashcards" },
];

const MORE_HUB_ITEMS = [
  {
    label: "Thử thách hàng ngày",
    icon: <FireOutlined />,
    href: "/daily-challenge",
  },
  { label: "AI Chatbot", icon: <MessageOutlined />, href: "/english-chatbot" },
  { label: "Đọc sách TOEIC", icon: <FileTextOutlined />, href: "/pdf-reader" },
  { label: "YouTube TOEIC", icon: <YoutubeOutlined />, href: "/youtube-learn" },
  {
    label: "Lộ trình ngữ pháp",
    icon: <NodeIndexOutlined />,
    href: "/grammar-roadmap",
  },
  { label: "Ngữ pháp TOEIC", icon: <BulbOutlined />, href: "/grammar-lessons" },
  { label: "Từ vựng", icon: <StarOutlined />, href: "/my-vocabulary" },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/toeic-skills")) return "toeic";
  if (
    pathname.startsWith("/toeic-practice") ||
    pathname.startsWith("/grammar-quiz")
  )
    return "exam";
  if (pathname.startsWith("/daily-challenge")) return "more";
  if (
    pathname.startsWith("/review-quiz") ||
    pathname.startsWith("/error-notebook") ||
    pathname.startsWith("/flashcards")
  )
    return "review";
  if (
    pathname.startsWith("/english-chatbot") ||
    pathname.startsWith("/grammar-roadmap") ||
    pathname.startsWith("/grammar-lessons") ||
    pathname.startsWith("/my-vocabulary") ||
    pathname.startsWith("/pdf-reader") ||
    pathname.startsWith("/youtube-learn") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/ipa-chart") ||
    pathname.startsWith("/diagnostic") ||
    pathname.startsWith("/study-sets")
  )
    return "more";
  return "home";
}

/* ── Tab Bar ── */
export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [activeHub, setActiveHub] = useState<"exam" | "review" | "more" | null>(
    null,
  );

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

  const hubItems =
    activeHub === "exam"
      ? EXAM_HUB_ITEMS
      : activeHub === "review"
        ? REVIEW_HUB_ITEMS
        : activeHub === "more"
          ? MORE_HUB_ITEMS
          : [];

  return (
    <>
      {/* Learn Hub Overlay */}
      <AnimatePresence>
        {activeHub !== null && (
          <>
            {/* Backdrop */}
            <m.button
              type="button"
              key="backdrop"
              aria-label="Đóng menu"
              onClick={() => setActiveHub(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                inset: 0,
                border: "none",
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(4px)",
                padding: 0,
                zIndex: 20,
              }}
            />

            {/* Hub cards */}
            <m.div
              key="hub-cards"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                position: "fixed",
                bottom: 72,
                left: 16,
                right: 16,
                zIndex: 21,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {hubItems.map((item, idx) => (
                <m.div
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card
                    hoverable
                    onClick={() => {
                      setActiveHub(null);
                      router.push(item.href);
                    }}
                    style={{
                      borderRadius: 20,
                      textAlign: "center",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Text style={{ fontSize: 24, color: "var(--accent)" }}>
                      {item.icon}
                    </Text>
                    <br />
                    <Text strong style={{ fontSize: 13, color: "var(--ink)" }}>
                      {item.label}
                    </Text>
                  </Card>
                </m.div>
              ))}
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <m.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          zIndex: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <m.button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => handleTabClick(tab)}
              whileTap={{ scale: 0.9 }}
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
                padding: "8px 0",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <m.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{ fontSize: 20, display: "flex" }}
              >
                {isActive ? tab.activeIcon : tab.icon}
              </m.div>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </Text>
              {isActive && (
                <m.div
                  layoutId="activeTab"
                  style={{
                    position: "absolute",
                    bottom: 6,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: "var(--accent)",
                  }}
                />
              )}
            </m.button>
          );
        })}
      </m.nav>
    </>
  );
}
