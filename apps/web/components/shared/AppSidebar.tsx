"use client";

import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  FileText,
  FileWarning,
  Flame,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  RefreshCw,
  Star,
  Sun,
  Target,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/toeic/skills", label: "TOEIC Practice", icon: Target },
  {
    key: "foundation",
    label: "Foundation",
    items: [
      {
        href: "/grammar-roadmap",
        label: "Grammar Roadmap",
        icon: GitBranch,
      },
      {
        href: "/grammar-lessons",
        label: "Grammar Lessons",
        icon: GraduationCap,
      },
      { href: "/my-vocabulary", label: "Vocabulary", icon: Star },
      { href: "/flashcards", label: "Flashcard Review", icon: RefreshCw },
    ],
  },
  {
    key: "daily",
    label: "Daily",
    items: [
      {
        href: "/daily-challenge",
        label: "Daily Challenge",
        icon: Flame,
      },

      { href: "/error-notebook", label: "Error Notebook", icon: FileWarning },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    items: [
      { href: "/english-chatbot", label: "AI Chatbot", icon: MessageSquare },
      { href: "/read-aloud", label: "Read Aloud", icon: Volume2 },
      { href: "/ipa-chart", label: "IPA Chart", icon: Volume2 },
      { href: "/writing-tools", label: "Writing Tools", icon: Pencil },
    ],
  },
];

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

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
  return (
    <Link href={href} prefetch={false} className="no-underline">
      <m.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animDelay, duration: 0.3 }}
        whileHover={{ x: 4, background: "var(--sidebar-item-hover)" }}
        whileTap={{ scale: 0.98 }}
        aria-current={active ? "page" : undefined}
        className={`sidebar-nav-link flex items-center gap-2.5 overflow-hidden relative cursor-pointer rounded-[10px] transition-[background,color,border-color] duration-200 border-l-[3px] ${
          indented
            ? "py-[7px] px-2.5 pl-3.5 text-[13px]"
            : "py-[9px] px-2.5 text-sm"
        } ${
          active
            ? "font-semibold bg-(--sidebar-active-bg) text-accent border-accent"
            : "font-medium bg-transparent text-(--sidebar-text) border-transparent"
        }`}
      >
        <m.span
          animate={{ scale: active ? 1.1 : 1, opacity: active ? 1 : 0.7 }}
          className="grid place-items-center w-[18px] h-[18px] shrink-0"
        >
          <Icon size={indented ? 15 : 17} />
        </m.span>

        <AnimatePresence>
          {isExpanded && (
            <m.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex-1 whitespace-nowrap tracking-tight"
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
    if (href === "/flashcards" && badges.flashcardsDue > 0) {
      return (
        <Badge className="ml-auto px-1.5 py-0 text-[10px] bg-accent text-white border-0">
          {badges.flashcardsDue}
        </Badge>
      );
    }

    if (href === "/daily-challenge") {
      return (
        <m.span
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-xs leading-none ml-auto"
        >
          {badges.dailyChallengeCompleted ? (
            <CircleCheckBig className="text-emerald-500" />
          ) : (
            <Flame className="text-destructive opacity-70" />
          )}
        </m.span>
      );
    }
    return null;
  }

  return (
    <m.aside
      initial={false}
      animate={{ width: isExpanded ? 248 : 64 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="flex flex-col overflow-hidden sticky top-0 z-50 h-screen py-4 px-2.5 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
    >
      {/* Accent glow */}
      <m.div
        aria-hidden
        animate={{ opacity: isExpanded ? 1 : 0.6 }}
        className="absolute inset-0 pointer-events-none z-0 bg-[var(--sidebar-glow)]"
      />

      {/* Logo / toggle */}
      <div className="relative z-[1] flex items-center h-[52px] pb-3 pt-0.5">
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
                whileHover={{ background: "var(--sidebar-item-hover)" }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="grid place-items-center w-7 h-7 shrink-0 rounded-lg bg-none border-none cursor-pointer ml-auto text-[var(--sidebar-text)]"
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
              whileHover={{ background: "var(--sidebar-item-hover)" }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="mx-auto grid place-items-center w-9 h-9 shrink-0 bg-none border-none cursor-pointer rounded-[10px] text-[var(--sidebar-text)]"
            >
              <PanelLeftOpen size={15} />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <div className="h-px relative z-[1] mb-1.5 bg-[var(--sidebar-border)]" />

      {/* Nav */}
      <m.nav
        aria-label="App navigation"
        className="relative z-[1] flex flex-col pt-1 flex-1 overflow-y-auto overflow-x-hidden gap-px scrollbar-none"
      >
        {navGroups.map((entry, groupIndex) => {
          // Standalone (Home)
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
                animDelay={0.05 + groupIndex * 0.05}
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

          // Group
          const group = entry as NavGroup;
          const groupHasActive = group.items.some(
            (item) =>
              pathname === item.href || pathname.startsWith(`${item.href}/`),
          );
          const isGroupOpen = groupHasActive || !collapsedGroups.has(group.key);

          // Collapsed sidebar: flat icons
          if (!isExpanded) {
            return (
              <div key={group.key} className="mt-0.5">
                {group.items.map((item, itemIndex) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const link = (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      isExpanded={false}
                      badge={getBadge(item.href)}
                      animDelay={0.05 + groupIndex * 0.05 + itemIndex * 0.02}
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

          // Expanded: collapsible group
          return (
            <m.div
              key={group.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + groupIndex * 0.05 }}
              className={groupIndex > 0 ? "mt-2.5" : "mt-1"}
            >
              <m.button
                onClick={() => toggleGroup(group.key)}
                whileHover={{ x: 2, opacity: 0.8 }}
                className="flex items-center w-full border-none bg-none text-[10px] font-bold uppercase cursor-pointer py-1 px-2.5 pl-2.5 mb-0.5 tracking-[0.07em] opacity-55 text-[var(--sidebar-text)]"
              >
                <span className="flex-1 text-left">{group.label}</span>
                <m.span animate={{ rotate: isGroupOpen ? 0 : -90 }}>
                  <ChevronDown size={8} />
                </m.span>
              </m.button>

              <AnimatePresence initial={false}>
                {isGroupOpen && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="flex flex-col overflow-hidden gap-px"
                  >
                    {group.items.map((item, itemIndex) => {
                      const active =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
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

      {/* Bottom: Theme */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="pt-2 relative z-[1] mt-1"
      >
        <div className="h-px mb-2 bg-[var(--sidebar-border)]" />

        {/* Theme toggle */}
        {(() => {
          const themeBtn = (
            <m.button
              whileHover={{ background: "var(--sidebar-item-hover)", x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="theme-toggle-btn flex items-center gap-2.5 w-full border-none bg-transparent text-sm font-medium cursor-pointer py-[9px] px-2.5 rounded-[10px] transition-colors duration-150 text-[var(--sidebar-text)]"
              aria-label={
                mode === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              <m.span
                animate={{ rotate: mode === "light" ? 0 : 180 }}
                className="text-[15px] grid place-items-center"
              >
                {mode === "light" ? <Moon /> : <Sun />}
              </m.span>
              {isExpanded && (
                <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {mode === "light" ? "Dark Mode" : "Light Mode"}
                </m.span>
              )}
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
