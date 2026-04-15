"use client";

import { useState } from "react";
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
} from "@ant-design/icons";

const { Text } = Typography;

interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
  href?: string;
  action?: "learn-hub";
}

const TABS: TabItem[] = [
  { key: "home", label: "Trang chủ", icon: <HomeOutlined />, activeIcon: <HomeFilled />, href: "/home" },
  { key: "chat", label: "Chat", icon: <MessageOutlined />, activeIcon: <MessageFilled />, href: "/english-chatbot" },
  { key: "learn", label: "Học", icon: <ReadOutlined />, activeIcon: <BookFilled />, action: "learn-hub" },
  { key: "profile", label: "Từ vựng", icon: <UserOutlined />, activeIcon: <UserOutlined />, href: "/my-vocabulary" },
];

const LEARN_HUB_ITEMS = [
  { label: "Ôn tập", icon: <AppstoreOutlined />, href: "/flashcards" },
  { label: "Ngữ pháp", icon: <BulbOutlined />, href: "/grammar-quiz" },
  { label: "Luyện viết", icon: <EditOutlined />, href: "/writing-practice" },
  { label: "Thử thách", icon: <FireOutlined />, href: "/daily-challenge" },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/english-chatbot")) return "chat";
  if (pathname.startsWith("/my-vocabulary") || pathname.startsWith("/dictionary")) return "profile";
  if (
    pathname.startsWith("/flashcards") ||
    pathname.startsWith("/grammar-quiz") ||
    pathname.startsWith("/writing-practice") ||
    pathname.startsWith("/daily-challenge")
  ) return "learn";
  return "home";
}

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [showLearnHub, setShowLearnHub] = useState(false);

  const handleTabClick = (tab: TabItem) => {
    if (tab.action === "learn-hub") {
      setShowLearnHub((prev) => !prev);
    } else if (tab.href) {
      setShowLearnHub(false); // Always close learn hub when navigating away (E2 fix)
      router.push(tab.href);
    }
  };

  return (
    <>
      {/* Learn Hub Overlay */}
      {showLearnHub && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowLearnHub(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 998,
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
              zIndex: 999,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-3)",
              animation: "slideInUp var(--duration-normal) ease",
            }}
          >
            {LEARN_HUB_ITEMS.map((item) => (
              <Card
                key={item.href}
                hoverable
                onClick={() => {
                  setShowLearnHub(false);
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
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          zIndex: 1000,
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
                  fontSize: 10,
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
