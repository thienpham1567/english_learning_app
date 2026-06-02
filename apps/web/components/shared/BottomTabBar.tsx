"use client";

import {
  BookOpenText,
  FileWarning,
  Flame,
  GraduationCap,
  HelpCircle,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Map,
  MessageSquare,
  Pencil,
  RefreshCw,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useCallback, useState } from "react";

/* ─── Types ─── */
interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  action?: "exam-hub" | "review-hub" | "more-hub";
}

interface HubItem {
  label: string;
  icon: ReactNode;
  href: string;
  accent?: string;
}

/* ─── Tab Config ─── */
const TABS: TabItem[] = [
  {
    key: "roadmap",
    label: "Roadmap",
    icon: <Map size={21} />,
    href: "/roadmap",
  },
  {
    key: "home",
    label: "Home",
    icon: <LayoutDashboard size={21} />,
    href: "/dashboard",
  },
  {
    key: "toeic",
    label: "TOEIC",
    icon: <Target size={21} />,
    href: "/toeic/skills",
  },
  {
    key: "review",
    label: "Review",
    icon: <RefreshCw size={21} />,
    action: "review-hub",
  },
  {
    key: "more",
    label: "More",
    icon: <LayoutGrid size={21} />,
    action: "more-hub",
  },
];

/* ─── Hub Items Config ─── */
const REVIEW_HUB_ITEMS: HubItem[] = [
  {
    label: "Error Notebook",
    icon: <FileWarning size={22} />,
    href: "/error-notebook",
    accent: "var(--error)",
  },
  {
    label: "Flashcard Review",
    icon: <RefreshCw size={22} />,
    href: "/flashcards",
    accent: "var(--info)",
  },
  {
    label: "Daily Challenge",
    icon: <Flame size={22} />,
    href: "/daily-challenge",
    accent: "var(--fire)",
  },
];

const MORE_HUB_ITEMS: HubItem[] = [
  {
    label: "TOEIC Vocab",
    icon: <BookOpenText size={22} />,
    href: "/toeic/vocab",
    accent: "var(--accent)",
  },
  {
    label: "Grammar",
    icon: <GraduationCap size={22} />,
    href: "/grammar-lessons",
    accent: "var(--module-grammar)",
  },
  {
    label: "Vocabulary",
    icon: <Star size={22} />,
    href: "/my-vocabulary",
    accent: "var(--accent)",
  },
  {
    label: "AI Chatbot",
    icon: <MessageSquare size={22} />,
    href: "/english-chatbot",
    accent: "var(--secondary)",
  },
  { label: "Read Aloud", icon: <Volume2 size={22} />, href: "/read-aloud", accent: "var(--info)" },
  {
    label: "IPA Chart",
    icon: <Languages size={22} />,
    href: "/ipa-chart",
    accent: "var(--tertiary, #8B5CF6)",
  },
  {
    label: "Writing Tools",
    icon: <Pencil size={22} />,
    href: "/writing-tools",
    accent: "var(--secondary)",
  },
];

const HUB_MAP: Record<string, { title: string; items: HubItem[] }> = {
  review: { title: "Review & Practice", items: REVIEW_HUB_ITEMS },
  more: { title: "More Features", items: MORE_HUB_ITEMS },
};

/* ─── Route Matching ─── */
function getActiveTab(pathname: string): string {
  if (pathname.startsWith("/roadmap")) return "roadmap";
  if (pathname.startsWith("/dashboard")) return "home";
  if (pathname.startsWith("/toeic")) return "toeic";
  if (
    pathname.startsWith("/error-notebook") ||
    pathname.startsWith("/flashcards") ||
    pathname.startsWith("/daily-challenge")
  )
    return "review";
  if (
    pathname.startsWith("/english-chatbot") ||
    pathname.startsWith("/read-aloud") ||
    pathname.startsWith("/grammar-lessons") ||
    pathname.startsWith("/my-vocabulary") ||
    pathname.startsWith("/ipa-chart") ||
    pathname.startsWith("/writing-tools") ||
    pathname.startsWith("/pdf-reader") ||
    pathname.startsWith("/reading") ||
    pathname.startsWith("/diagnostic") ||
    pathname.startsWith("/study-sets")
  )
    return "more";
  return "home";
}

/* ─── Hub Card ─── */
function HubCard({
  item,
  index,
  onNavigate,
}: {
  item: HubItem;
  index: number;
  onNavigate: (href: string) => void;
}) {
  return (
    <m.button
      type="button"
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 400, damping: 28 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onNavigate(item.href)}
      className="flex flex-col items-center justify-center gap-2.5 rounded-2xl bg-surface border-2 border-border p-4 cursor-pointer shadow-sm active:shadow-none transition-shadow duration-100"
    >
      <div
        className="w-11 h-11 rounded-xl border-2 border-border grid place-items-center shadow-sm"
        style={{
          background: `color-mix(in srgb, ${item.accent ?? "var(--accent)"} 10%, var(--surface))`,
          borderColor: `color-mix(in srgb, ${item.accent ?? "var(--accent)"} 25%, var(--border))`,
          color: item.accent ?? "var(--accent)",
        }}
      >
        {item.icon}
      </div>
      <span className="text-[12px] font-black text-ink leading-tight text-center">
        {item.label}
      </span>
    </m.button>
  );
}

/* ─── Bottom Tab Bar ─── */
export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);
  const [activeHub, setActiveHub] = useState<"review" | "more" | null>(null);

  const handleTabClick = useCallback(
    (tab: TabItem) => {
      if (tab.action === "review-hub") {
        setActiveHub((prev) => (prev === "review" ? null : "review"));
      } else if (tab.action === "more-hub") {
        setActiveHub((prev) => (prev === "more" ? null : "more"));
      } else if (tab.href) {
        setActiveHub(null);
        router.push(tab.href);
      }
    },
    [router],
  );

  const handleHubNavigate = useCallback(
    (href: string) => {
      setActiveHub(null);
      router.push(href);
    },
    [router],
  );

  const hubData = activeHub ? HUB_MAP[activeHub] : null;

  return (
    <>
      {/* ─── Hub Overlay ─── */}
      <AnimatePresence>
        {activeHub !== null && hubData && (
          <>
            {/* Backdrop */}
            <m.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveHub(null)}
              className="fixed inset-0 z-20 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Hub Panel */}
            <m.div
              key="hub-panel"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed bottom-[72px] left-3 right-3 z-[21] bg-bg rounded-2xl border-2 border-border shadow-lg overflow-hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              {/* Hub header */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-text-muted font-display">
                  {hubData.title}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveHub(null)}
                  className="w-7 h-7 rounded-lg border-2 border-border bg-surface text-text-muted grid place-items-center cursor-pointer hover:bg-surface-hover hover:text-ink transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Hub grid */}
              <div
                className={`grid gap-2.5 px-3.5 pb-4 ${hubData.items.length <= 2 ? "grid-cols-2" : "grid-cols-3"}`}
              >
                {hubData.items.map((item, idx) => (
                  <HubCard key={item.href} item={item} index={idx} onNavigate={handleHubNavigate} />
                ))}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Tab Bar ─── */}
      <m.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
        className="fixed h-[62px] bg-surface/95 backdrop-blur-xl flex items-center justify-around bottom-0 left-0 right-0 border-t-2 border-border z-[22]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const isHubOpen = activeHub !== null && tab.action?.replace("-hub", "") === activeHub;

          return (
            <m.button
              key={tab.key}
              type="button"
              aria-label={tab.label}
              onClick={() => handleTabClick(tab)}
              whileTap={{ scale: 0.88 }}
              className="relative flex-1 flex flex-col items-center justify-center border-none bg-transparent cursor-pointer gap-[3px] py-2"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              {/* Active indicator line */}
              {isActive && (
                <m.div
                  layoutId="mobile-active-tab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-b-full bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <m.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -1 : 0,
                  color: isActive
                    ? "var(--accent-active)"
                    : isHubOpen
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex"
              >
                {tab.icon}
              </m.div>

              <m.span
                animate={{
                  color: isActive
                    ? "var(--accent-active)"
                    : isHubOpen
                      ? "var(--text-primary)"
                      : "var(--text-muted)",
                }}
                className={`text-[10px] leading-none ${isActive ? "font-extrabold" : "font-semibold"}`}
              >
                {tab.label}
              </m.span>
            </m.button>
          );
        })}
      </m.nav>
    </>
  );
}
