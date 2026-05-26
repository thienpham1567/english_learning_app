"use client";

import {
  FileText,
  FileWarning,
  Flame,
  GitBranch,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  RefreshCw,
  Star,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";

import * as m from "motion/react-client";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

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
    icon: <LayoutDashboard />,
    activeIcon: <LayoutDashboard />,
    href: "/dashboard",
  },
  {
    key: "toeic",
    label: "TOEIC",
    icon: <Target />,
    activeIcon: <Target />,
    href: "/toeic/skills",
  },
  {
    key: "exam",
    label: "Đề thi",
    icon: <Trophy />,
    activeIcon: <Trophy />,
    action: "exam-hub",
  },
  {
    key: "review",
    label: "Ôn tập",
    icon: <RefreshCw />,
    activeIcon: <RefreshCw />,
    action: "review-hub",
  },
  {
    key: "more",
    label: "Thêm",
    icon: <LayoutGrid />,
    activeIcon: <LayoutGrid />,
    action: "more-hub",
  },
];

const EXAM_HUB_ITEMS = [
  { label: "Luyện đề ETS", icon: <Trophy />, href: "/toeic/practice" },
  {
    label: "TOEIC Part 5",
    icon: <HelpCircle />,
    href: "/toeic/skills?tab=part5",
  },
];

const REVIEW_HUB_ITEMS = [
  { label: "Sổ lỗi sai", icon: <FileWarning />, href: "/error-notebook" },
  { label: "Ôn tập Flashcard", icon: <RefreshCw />, href: "/flashcards" },
];

const MORE_HUB_ITEMS = [
  {
    label: "Thử thách hàng ngày",
    icon: <Flame />,
    href: "/daily-challenge",
  },
  { label: "AI Chatbot", icon: <MessageSquare />, href: "/english-chatbot" },
  { label: "Đọc to", icon: <Volume2 />, href: "/read-aloud" },
  {
    label: "Lộ trình ngữ pháp",
    icon: <GitBranch />,
    href: "/grammar-roadmap",
  },
  { label: "Bài học ngữ pháp", icon: <GraduationCap />, href: "/grammar-lessons" },
  { label: "Từ vựng", icon: <Star />, href: "/my-vocabulary" },
];

function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/toeic")) return "toeic";
  if (pathname.startsWith("/grammar-quiz")) return "exam";
  if (pathname.startsWith("/daily-challenge")) return "more";
  if (pathname.startsWith("/error-notebook") || pathname.startsWith("/flashcards")) return "review";
  if (
    pathname.startsWith("/english-chatbot") ||
    pathname.startsWith("/read-aloud") ||
    pathname.startsWith("/grammar-roadmap") ||
    pathname.startsWith("/grammar-lessons") ||
    pathname.startsWith("/my-vocabulary") ||
    pathname.startsWith("/pdf-reader") ||
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
              className="fixed border-none"
              style={{
                inset: 0,
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
              className="fixed grid gap-3"
              style={{
                bottom: 72,
                left: 16,
                right: 16,
                zIndex: 21,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              {hubItems.map((item, idx) => (
                <m.div
                  key={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveHub(null);
                      router.push(item.href);
                    }}
                    className="rounded text-center bg-(--surface) p-4 cursor-pointer"
                    style={{
                      border: "var(--brutal-border)",
                      boxShadow: "var(--shadow-sm)",
                      transition: "transform 0.1s, box-shadow 0.1s",
                    }}
                  >
                    <span className="text-3xl text-accent">{item.icon}</span>
                    <br />
                    <span className="text-[13px] font-bold text-ink">{item.label}</span>
                  </button>
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
        className="fixed h-[64px] bg-(--surface) flex items-center justify-around"
        style={{
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
          zIndex: 22,
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
              className="flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer"
              style={{ gap: 2, padding: "8px 0", WebkitTapHighlightColor: "transparent" }}
            >
              <m.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -2 : 0,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="text-xl flex"
              >
                {isActive ? tab.activeIcon : tab.icon}
              </m.div>
              <span
                className="text-[11px] leading-none"
                style={{
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--accent)" : "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <m.div
                  layoutId="activeTab"
                  className="absolute w-[4px] h-[4px] rounded-full"
                  style={{ bottom: 6, background: "var(--accent)" }}
                />
              )}
            </m.button>
          );
        })}
      </m.nav>
    </>
  );
}
