"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/shared/Logo";

import { useTheme } from "@/components/shared/ThemeProvider";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
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

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
};

type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

const navGroups: (NavItem | NavGroup)[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/toeic/skills", label: "Luyện thi TOEIC", icon: Target },
  {
    key: "foundation",
    label: "Nền tảng",
    items: [
      {
        href: "/grammar-roadmap",
        label: "Lộ trình ngữ pháp",
        icon: GitBranch,
      },
      { href: "/grammar-lessons", label: "Bài học ngữ pháp", icon: GraduationCap },
      { href: "/my-vocabulary", label: "Từ vựng", icon: Star },
      { href: "/flashcards", label: "Ôn tập Flashcard", icon: RefreshCw },
    ],
  },
  {
    key: "daily",
    label: "Hàng ngày",
    items: [
      {
        href: "/daily-challenge",
        label: "Thử thách hàng ngày",
        icon: Flame,
      },

      { href: "/error-notebook", label: "Sổ lỗi sai", icon: FileWarning },
    ],
  },
  {
    key: "tools",
    label: "Công cụ",
    items: [
      { href: "/english-chatbot", label: "AI Chatbot", icon: MessageSquare },
      { href: "/read-aloud", label: "Đọc to", icon: Volume2 },
      { href: "/ipa-chart", label: "Bảng IPA", icon: Volume2 },
      { href: "/writing-tools", label: "Công cụ viết", icon: Pencil },
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
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  active: boolean;
  isExpanded: boolean;
  badge?: React.ReactNode;
  indented?: boolean;
  animDelay?: number;
}) {
  return (
    <Link href={href} prefetch={false} style={{ textDecoration: "none" }}>
      <m.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: animDelay, duration: 0.3 }} whileHover={{ x: 4, background: "var(--sidebar-item-hover)" }} whileTap={{ scale: 0.98 }} aria-current={active ? "page" : undefined} className="sidebar-nav-link flex items-center gap-2.5 overflow-hidden relative cursor-pointer" style={{borderRadius: 10, padding: indented ? "7px 10px 7px 14px" : "9px 10px", fontSize: indented ? 13 : 14, fontWeight: active ? 600 : 500, background: active ? "var(--sidebar-active-bg)" : "transparent", color: active ? "var(--accent)" : "var(--sidebar-text)", borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent", transition: "background 0.2s, color 0.2s, border-color 0.2s"}} >
        <m.span
          animate={{ scale: active ? 1.1 : 1, opacity: active ? 1 : 0.7 }} className="grid w-[18px] h-[18px] shrink-0" style={{placeItems: "center"}} >
          <Icon style={{ fontSize: indented ? 15 : 17 }} />
        </m.span>
        
        <AnimatePresence>
          {isExpanded && (
            <m.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }} className="flex-1" style={{whiteSpace: "nowrap", letterSpacing: "-0.01em"}} >
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
        <Badge
          className="ml-auto px-1.5 py-0 text-[10px] bg-accent text-white border-0"
        >
          {badges.flashcardsDue}
        </Badge>
      );
    }

    if (href === "/daily-challenge") {
      return (
        <m.span
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3 }} className="text-xs leading-none" style={{marginLeft: "auto"}} >
          {badges.dailyChallengeCompleted ? (
            <CircleCheckBig className="text-emerald-500" />
          ) : (
            <Flame className="text-destructive" style={{opacity: 0.7}} />
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
      transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col overflow-hidden" style={{position: "sticky", top: 0, zIndex: 50, borderRight: "1px solid var(--sidebar-border)", background: "var(--sidebar-gradient)", padding: "16px 10px", height: "100vh"}} >
      {/* Accent glow */}
      <m.div
        aria-hidden
        animate={{ opacity: isExpanded ? 1 : 0.6 }} className="absolute" style={{inset: 0, pointerEvents: "none", background: "var(--sidebar-glow)", zIndex: 0}} />

      {/* Logo / toggle */}
      <div className="relative z-[1] flex items-center h-[52px] pb-3" style={{paddingTop: 2}} >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <m.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} className="flex items-center w-full" >
              <div className="shrink-0" >
                <Logo collapsed={false} />
              </div>
              <m.button
                whileHover={{ background: "var(--sidebar-item-hover)" }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                aria-label="Collapse sidebar" className="grid w-[28px] h-[28px] shrink-0 rounded-lg bg-none border-none cursor-pointer" style={{marginLeft: "auto", placeItems: "center", color: "var(--sidebar-text)"}} >
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
              aria-label="Expand sidebar" className="mx-auto grid w-[36px] h-[36px] shrink-0 bg-none border-none cursor-pointer" style={{placeItems: "center", borderRadius: 10, color: "var(--sidebar-text)"}} >
              <PanelLeftOpen size={15} />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <div className="h-[1px] relative z-[1] mb-1.5" style={{background: "var(--sidebar-border)"}} />

      {/* Nav */}
      <m.nav
        aria-label="Các mục trong ứng dụng" className="relative z-[1] flex flex-col pt-1 flex-1 overflow-y-auto" style={{gap: 1, overflowX: "hidden", scrollbarWidth: "none"}} >
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
              <div key={group.key} style={{ marginTop: 2 }}>
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
              style={{ marginTop: groupIndex > 0 ? 10 : 4 }}
            >
              <m.button
                onClick={() => toggleGroup(group.key)}
                whileHover={{ x: 2, opacity: 0.8 }} className="flex items-center w-full border-none bg-none text-[10px] font-bold uppercase cursor-pointer" style={{padding: "4px 12px 4px 10px", color: "var(--sidebar-text)", opacity: 0.55, letterSpacing: "0.07em", marginBottom: 2}} >
                <span className="flex-1 text-left" >
                  {group.label}
                </span>
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
                    transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex flex-col overflow-hidden" style={{gap: 1}} >
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
        transition={{ delay: 0.5 }} className="pt-2 relative z-[1] mt-1" >
        <div className="h-[1px] mb-2" style={{background: "var(--sidebar-border)"}} />

        {/* Theme toggle */}
        {(() => {
          const themeBtn = (
            <m.button whileHover={{ background: "var(--sidebar-item-hover)", x: 2 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme} className="theme-toggle-btn flex items-center gap-2.5 w-full border-none bg-transparent text-sm font-medium cursor-pointer" aria-label={ mode === "light" ? "Bật chế độ tối" : "Bật chế độ sáng" } style={{padding: "9px 10px", borderRadius: 10, color: "var(--sidebar-text)", transition: "color 0.18s"}} >
              <m.span
                animate={{ rotate: mode === "light" ? 0 : 180 }} className="text-[15px] grid" style={{placeItems: "center"}} >
                {mode === "light" ? <Moon /> : <Sun />}
              </m.span>
              {isExpanded && (
                <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {mode === "light" ? "Chế độ tối" : "Chế độ sáng"}
                </m.span>
              )}
            </m.button>
          );
          return !isExpanded ? (
            <Tooltip>
              <TooltipTrigger asChild>{themeBtn}</TooltipTrigger>
              <TooltipContent side="right">{mode === "light" ? "Chế độ tối" : "Chế độ sáng"}</TooltipContent>
            </Tooltip>
          ) : (
            themeBtn
          );
        })()}
      </m.div>
    </m.aside>
  );
}
