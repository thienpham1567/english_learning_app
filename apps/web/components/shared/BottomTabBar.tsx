"use client";

import { type ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Flex, Typography, Card } from "antd";
import {
  HomeOutlined,
  HomeFilled,
  MessageOutlined,
  MessageFilled,
  ReadOutlined,
  BookFilled,
  UserOutlined,
  AppstoreOutlined,
  BulbOutlined,
  EditOutlined,
  FireOutlined,
  SoundOutlined,
  AudioOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  href?: string;
  action?: "learn-hub" | "review-hub";
}

const TABS: TabItem[] = [
  { key: "home", label: "Trang chủ", icon: <HomeOutlined />, activeIcon: <HomeFilled />, href: "/home" },
  { key: "chat", label: "Chat", icon: <MessageOutlined />, activeIcon: <MessageFilled />, href: "/english-chatbot" },
  { key: "learn", label: "Học", icon: <ReadOutlined />, activeIcon: <BookFilled />, action: "learn-hub" },
  { key: "review", label: "Ôn", icon: <BulbOutlined />, activeIcon: <BulbOutlined />, action: "review-hub" },
  { key: "profile", label: "Từ vựng", icon: <UserOutlined />, activeIcon: <UserOutlined />, href: "/my-vocabulary" },
];

const LEARN_HUB_ITEMS = [
  { label: "Luyện nghe", icon: <SoundOutlined />, href: "/listening" },
  { label: "Luyện đọc", icon: <ReadOutlined />, href: "/reading" },
  { label: "Luyện nói", icon: <AudioOutlined />, href: "/pronunciation" },
  { label: "Luyện viết", icon: <EditOutlined />, href: "/writing-practice" },
  { label: "Ngữ pháp", icon: <BulbOutlined />, href: "/grammar-quiz" },
  { label: "Chủ đề", icon: <AppstoreOutlined />, href: "/study-sets" },
];

const REVIEW_HUB_ITEMS = [
  { label: "Ôn tập", icon: <AppstoreOutlined />, href: "/review-quiz" },
  { label: "Sổ lỗi sai", icon: <BookFilled />, href: "/error-notebook" },
  { label: "Tiến độ", icon: <BulbOutlined />, href: "/progress" },
  { label: "Thi thử", icon: <FireOutlined />, href: "/mock-test" },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/english-chatbot")) return "chat";
  if (pathname.startsWith("/my-vocabulary") || pathname.startsWith("/dictionary")) return "profile";
  if (
    pathname.startsWith("/review-quiz") ||
    pathname.startsWith("/error-notebook") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/mock-test") ||
    pathname.startsWith("/daily-challenge")
  ) return "review";
  if (
    pathname.startsWith("/flashcards") ||
    pathname.startsWith("/grammar-quiz") ||
    pathname.startsWith("/grammar-lessons") ||
    pathname.startsWith("/writing-practice") ||
    pathname.startsWith("/listening") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/pronunciation") ||
    pathname.startsWith("/speaking-practice") ||
    pathname.startsWith("/study-sets") ||
    pathname.startsWith("/scenarios")
  ) return "learn";
  return "home";
}

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [activeHub, setActiveHub] = useState<"learn" | "review" | null>(null);

  const handleTabClick = (tab: TabItem) => {
    if (tab.action === "learn-hub") {
      setActiveHub((prev) => (prev === "learn" ? null : "learn"));
    } else if (tab.action === "review-hub") {
      setActiveHub((prev) => (prev === "review" ? null : "review"));
    } else if (tab.href) {
      setActiveHub(null);
      router.push(tab.href);
    }
  };

  const hubItems = activeHub === "learn" ? LEARN_HUB_ITEMS : activeHub === "review" ? REVIEW_HUB_ITEMS : [];

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
