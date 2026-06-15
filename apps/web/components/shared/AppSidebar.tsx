"use client";

import {
  Blocks,
  BookOpen,
  BookOpenCheck,
  BookOpenText,
  Brain,
  ChevronDown,
  CircleCheckBig,
  ClipboardList,
  FileWarning,
  GraduationCap,
  Headphones,
  Languages,
  MessageSquare,
  Mic,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Star,
  Sun,
  Target,
  Trophy,
  Volume2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { useTheme } from "@/components/shared/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

const navGroups: (NavItem | NavGroup)[] = [
  {
    key: "toeic",
    label: "TOEIC",
    items: [
      { href: "/toeic/practice", label: "ETS Practice", icon: ClipboardList },
      { href: "/toeic/mock-test", label: "Mock Test", icon: Trophy },
      { href: "/toeic/listening", label: "Listening", icon: Headphones },
      { href: "/toeic/writing", label: "Writing", icon: Pencil },
      { href: "/toeic/speaking", label: "Speaking", icon: Mic },
      { href: "/toeic/dictation", label: "Dictation", icon: Volume2 },
      { href: "/toeic/progress", label: "Progress", icon: Target },
    ],
  },
  {
    key: "foundation",
    label: "Foundation",
    items: [
      { href: "/grammar-lessons", label: "Grammar", icon: GraduationCap },
      { href: "/toeic/vocab", label: "TOEIC Vocab", icon: BookOpenText },
      { href: "/morphology", label: "Word Formation", icon: Blocks },
      { href: "/reading", label: "Reading", icon: BookOpen },
    ],
  },
  {
    key: "review",
    label: "Review & Insights",
    items: [
      { href: "/error-notebook", label: "Error Notebook", icon: FileWarning },
      { href: "/toeic/review", label: "TOEIC Review", icon: CircleCheckBig },
      { href: "/insights", label: "Insights", icon: Brain },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { href: "/english-chatbot", label: "AI Chatbot", icon: MessageSquare },
      { href: "/smart-reader", label: "Smart Reader", icon: BookOpenCheck },
      { href: "/read-aloud", label: "Read Aloud", icon: Volume2 },
      { href: "/ipa-chart", label: "IPA Chart", icon: Languages },
      { href: "/writing-tools", label: "Writing Tools", icon: Pencil },
    ],
  },
];

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

/* ─── Individual Nav Link ─── */
function NavLink({
  href,
  label,
  icon: Icon,
  active,
  isExpanded,
  badge,
  indented = false,
  animDelay = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    size?: number;
    style?: React.CSSProperties;
  }>;
  active: boolean;
  isExpanded: boolean;
  badge?: React.ReactNode;
  indented?: boolean;
  animDelay?: number;
}) {
  const iconSize = indented ? 16 : 18;

  return (
    <Link href={href} prefetch={false} className="no-underline">
      <m.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animDelay, duration: 0.25 }}
        whileHover={active ? {} : { x: 3, background: "var(--sidebar-item-hover)" }}
        whileTap={{ scale: 0.97 }}
        aria-current={active ? "page" : undefined}
        className={`sidebar-nav-link flex items-center gap-3 overflow-hidden relative cursor-pointer transition-all duration-200 ${
          indented
            ? "py-[8px] px-3 text-[13px] rounded-lg"
            : "py-[9px] px-3 text-[13.5px] rounded-lg"
        } ${
          active
            ? "font-bold bg-[var(--sidebar-active-bg)] text-[var(--accent)]"
            : "font-medium bg-transparent text-[var(--sidebar-text)]"
        }`}
      >
        {/* Active indicator dot */}
        {active && (
          <m.div
            layoutId="sidebar-active-indicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-sm bg-[var(--accent)]"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        <m.span
          animate={{
            scale: active ? 1.12 : 1,
            opacity: active ? 1 : 0.65,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="grid place-items-center shrink-0"
          style={{ width: iconSize, height: iconSize }}
        >
          <Icon size={iconSize} />
        </m.span>

        <AnimatePresence>
          {isExpanded && (
            <m.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 whitespace-nowrap tracking-[-0.01em] leading-none"
            >
              {label}
            </m.span>
          )}
        </AnimatePresence>

        {badge}
      </m.div>
    </Link>
  );
}

/* ─── Main Sidebar ─── */
export function AppSidebar({ isExpanded, onToggle }: Props) {
  const pathname = usePathname();
  const { mode, toggleTheme } = useTheme();
  const badges = useSidebarBadges();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const collapsed = new Set<string>();
    if (typeof window !== "undefined") {
      navGroups.forEach((entry) => {
        if ("key" in entry) {
          const stored = localStorage.getItem(`sidebar-group-${entry.key}`);
          if (stored === "closed") collapsed.add(entry.key);
        }
      });
    }
    return collapsed;
  });

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        localStorage.setItem(`sidebar-group-${key}`, "open");
      } else {
        next.add(key);
        localStorage.setItem(`sidebar-group-${key}`, "closed");
      }
      return next;
    });
  }, []);

  function getBadge(href: string): React.ReactNode {
    if (!badges) return null;
    return null;
  }

  return (
    <m.aside
      initial={false}
      animate={{ width: isExpanded ? 252 : 66 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col overflow-hidden sticky top-0 z-50 h-screen py-3.5 px-2 border-r-2 border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] relative"
    >
      {/* Subtle accent glow at top */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-0"
        style={{ background: "var(--sidebar-glow)" }}
      />

      {/* Grain texture overlay for depth */}
      <div className="grain-overlay" style={{ opacity: 0.02 }} />

      {/* ─── Logo / toggle ─── */}
      <div className="relative z-[1] flex items-center h-[52px] pb-2 pt-0.5 px-1">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <m.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center w-full"
            >
              <div className="shrink-0">
                <Logo collapsed={false} />
              </div>
              <m.button
                whileHover={{ background: "var(--sidebar-item-hover)", scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="grid place-items-center w-7 h-7 shrink-0 rounded-lg bg-none border-none cursor-pointer ml-auto text-[var(--sidebar-text)] transition-colors"
              >
                <PanelLeftClose size={15} />
              </m.button>
            </m.div>
          ) : (
            <m.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ background: "var(--sidebar-item-hover)", scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="mx-auto grid place-items-center w-10 h-10 shrink-0 bg-none border-none cursor-pointer rounded-lg text-[var(--sidebar-text)] transition-colors"
            >
              <PanelLeftOpen size={16} />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      <div className="relative z-[1] mx-2 mb-2 h-px bg-[var(--sidebar-border)]" />

      {/* ─── Navigation ─── */}
      <m.nav
        aria-label="App navigation"
        className="relative z-[1] flex flex-col pt-0.5 flex-1 overflow-y-auto overflow-x-hidden gap-0.5 scrollbar-none"
      >
        {navGroups.map((entry, groupIndex) => {
          // ─── Standalone items ───
          if ("href" in entry) {
            const { href, label, icon: Icon } = entry;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const link = (
              <NavLink
                href={href}
                label={label}
                icon={Icon}
                active={active}
                isExpanded={isExpanded}
                badge={getBadge(href)}
                animDelay={0.05 + groupIndex * 0.04}
              />
            );
            return (
              <div key={href}>
                {!isExpanded ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                )}
              </div>
            );
          }

          // ─── Groups ───
          const group = entry as NavGroup;
          const groupHasActive = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
          );
          const isGroupOpen = groupHasActive || !collapsedGroups.has(group.key);

          // Collapsed sidebar: flat icons only
          if (!isExpanded) {
            return (
              <div key={group.key} className="mt-1">
                {/* Thin separator line */}
                <div className="mx-3 mb-1.5 h-px bg-[var(--sidebar-border)]" />
                {group.items.map((item, itemIndex) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const link = (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      isExpanded={false}
                      badge={getBadge(item.href)}
                      animDelay={0.05 + groupIndex * 0.04 + itemIndex * 0.02}
                    />
                  );
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            );
          }

          // Expanded: collapsible group with header
          return (
            <m.div
              key={group.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + groupIndex * 0.04 }}
              className="mt-3"
            >
              {/* Group header with decorative line */}
              <m.button
                onClick={() => toggleGroup(group.key)}
                whileHover={{ opacity: 0.9 }}
                className="sidebar-group-label flex items-center w-full border-none bg-none text-[10px] font-extrabold uppercase cursor-pointer py-0.5 tracking-[0.1em] text-[var(--sidebar-text-muted)]"
              >
                <span className="shrink-0 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-sm bg-[var(--accent)] opacity-50" aria-hidden />
                  {group.label}
                </span>
                <m.span
                  animate={{ rotate: isGroupOpen ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 ml-auto"
                >
                  <ChevronDown size={10} />
                </m.span>
              </m.button>

              <AnimatePresence initial={false}>
                {isGroupOpen && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex flex-col overflow-hidden gap-0.5 mt-0.5"
                  >
                    {group.items.map((item, itemIndex) => {
                      const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          icon={item.icon}
                          active={active}
                          isExpanded={true}
                          badge={getBadge(item.href)}
                          indented
                          animDelay={itemIndex * 0.02}
                        />
                      );
                    })}
                  </m.div>
                )}
              </AnimatePresence>
            </m.div>
          );
        })}
      </m.nav>

      {/* ─── Bottom: Theme Toggle ─── */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-[1] pt-2 mt-auto"
      >
        {/* Gradient separator */}
        <div
          className="mx-2 mb-2.5 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, var(--sidebar-border), transparent)",
          }}
        />

        {/* Theme toggle */}
        {(() => {
          const themeBtn = (
            <m.button
              whileHover={{ background: "var(--sidebar-item-hover)", x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
            >
              <m.span
                animate={{ rotate: mode === "light" ? 0 : 180 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="grid place-items-center shrink-0"
                style={{ width: 16, height: 16 }}
              >
                {mode === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </m.span>
              <AnimatePresence>
                {isExpanded && (
                  <m.span
                    key="theme-label"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap text-[13px] font-semibold"
                  >
                    {mode === "light" ? "Dark Mode" : "Light Mode"}
                  </m.span>
                )}
              </AnimatePresence>
            </m.button>
          );
          return !isExpanded ? (
            <Tooltip>
              <TooltipTrigger asChild>{themeBtn}</TooltipTrigger>
              <TooltipContent side="right">
                {mode === "light" ? "Dark Mode" : "Light Mode"}
              </TooltipContent>
            </Tooltip>
          ) : (
            themeBtn
          );
        })()}
      </m.div>
    </m.aside>
  );
}
