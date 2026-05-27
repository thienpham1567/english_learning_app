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
    label: "Dashboard",
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
    label: "Exams",
    icon: <Trophy />,
    activeIcon: <Trophy />,
    action: "exam-hub",
  },
  {
    key: "review",
    label: "Review",
    icon: <RefreshCw />,
    activeIcon: <RefreshCw />,
    action: "review-hub",
  },
  {
    key: "more",
    label: "More",
    icon: <LayoutGrid />,
    activeIcon: <LayoutGrid />,
    action: "more-hub",
  },
];

const EXAM_HUB_ITEMS = [
  { label: "ETS Practice Tests", icon: <Trophy />, href: "/toeic/practice" },
  {
    label: "TOEIC Part 5",
    icon: <HelpCircle />,
    href: "/toeic/skills?tab=part5",
  },
];

const REVIEW_HUB_ITEMS = [
  { label: "Error Notebook", icon: <FileWarning />, href: "/error-notebook" },
  { label: "Flashcard Review", icon: <RefreshCw />, href: "/flashcards" },
];

const MORE_HUB_ITEMS = [
  {
    label: "Daily Challenge",
    icon: <Flame />,
    href: "/daily-challenge",
  },
  { label: "AI Chatbot", icon: <MessageSquare />, href: "/english-chatbot" },
  { label: "Read Aloud", icon: <Volume2 />, href: "/read-aloud" },
  {
    label: "Grammar Roadmap",
    icon: <GitBranch />,
    href: "/grammar-roadmap",
  },
  { label: "Grammar Lessons", icon: <GraduationCap />, href: "/grammar-lessons" },
  { label: "Vocabulary", icon: <Star />, href: "/my-vocabulary" },
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
              aria-label="Close menu"
              onClick={() => setActiveHub(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 border-none p-0 z-20 bg-black/60 backdrop-blur-sm"
            />

            {/* Hub cards */}
            <m.div
              key="hub-cards"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed grid gap-3 grid-cols-2 bottom-[72px] left-4 right-4 z-[21]"
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
                    className="rounded text-center bg-surface p-4 cursor-pointer border-2 border-border shadow-sm transition-transform duration-100 active:scale-95 w-full"
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
        className="fixed h-16 bg-surface flex items-center justify-around bottom-0 left-0 right-0 border-t border-border backdrop-blur-xl z-[22] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
              className="flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer gap-0.5 py-2"
              style={{ WebkitTapHighlightColor: "transparent" }}
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
                className={`text-[11px] leading-none mt-0.5 ${isActive ? "font-bold" : "font-medium"}`}
                style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}
              >
                {tab.label}
              </span>
              {isActive && (
                <m.div
                  layoutId="activeTab"
                  className="absolute w-1 h-1 rounded-full bottom-1.5"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </m.button>
          );
        })}
      </m.nav>
    </>
  );
}
