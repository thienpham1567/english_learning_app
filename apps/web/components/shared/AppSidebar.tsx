"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Tooltip } from "antd";
import { Logo } from "@/components/shared/Logo";
import {
  BookOutlined,
  QuestionCircleOutlined,
  StarOutlined,
  SyncOutlined,
  FireOutlined,
  TrophyOutlined,
  ExceptionOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  YoutubeOutlined,
  FileTextOutlined,
  AimOutlined,
  DashboardOutlined,
  NodeIndexOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

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
  { href: "/dashboard", label: "Tổng quan", icon: DashboardOutlined },
  {
    key: "toeic",
    label: "Luyện thi TOEIC",
    items: [
      { href: "/toeic-skills", label: "TOEIC 4 Skills", icon: AimOutlined },
      { href: "/toeic-practice", label: "Luyện đề ETS", icon: TrophyOutlined },
      {
        href: "/grammar-quiz",
        label: "TOEIC Part 5",
        icon: QuestionCircleOutlined,
      },
    ],
  },
  {
    key: "foundation",
    label: "Nền tảng",
    items: [
      {
        href: "/grammar-roadmap",
        label: "Lộ trình ngữ pháp",
        icon: NodeIndexOutlined,
      },
      { href: "/grammar-lessons", label: "Bài học ngữ pháp", icon: SolutionOutlined },
      { href: "/grammar-library", label: "Thư viện ngữ pháp", icon: BookOutlined },
      { href: "/my-vocabulary", label: "Từ vựng", icon: StarOutlined },
      { href: "/flashcards", label: "Ôn tập Flashcard", icon: SyncOutlined },
    ],
  },
  {
    key: "daily",
    label: "Hàng ngày",
    items: [
      {
        href: "/daily-challenge",
        label: "Thử thách hàng ngày",
        icon: FireOutlined,
      },
      { href: "/review-quiz", label: "Ôn tập SRS", icon: SyncOutlined },
      { href: "/error-notebook", label: "Sổ lỗi sai", icon: ExceptionOutlined },
    ],
  },
  {
    key: "tools",
    label: "Công cụ",
    items: [
      { href: "/pdf-reader", label: "Đọc sách TOEIC", icon: FileTextOutlined },
      { href: "/youtube-learn", label: "YouTube TOEIC", icon: YoutubeOutlined },
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
      <m.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: animDelay, duration: 0.3 }}
        whileHover={{ x: 4, background: "var(--sidebar-item-hover)" }}
        whileTap={{ scale: 0.98 }}
        aria-current={active ? "page" : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          overflow: "hidden",
          borderRadius: 10,
          padding: indented ? "7px 10px 7px 14px" : "9px 10px",
          fontSize: indented ? 13 : 14,
          fontWeight: active ? 600 : 500,
          background: active ? "var(--sidebar-active-bg)" : "transparent",
          color: active ? "var(--accent)" : "var(--sidebar-text)",
          borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
          transition: "background 0.2s, color 0.2s, border-color 0.2s",
          position: "relative",
          cursor: "pointer",
        }}
        className="sidebar-nav-link"
      >
        <m.span
          animate={{ scale: active ? 1.1 : 1, opacity: active ? 1 : 0.7 }}
          style={{
            display: "grid",
            placeItems: "center",
            width: 18,
            height: 18,
            flexShrink: 0,
          }}
        >
          <Icon style={{ fontSize: indented ? 15 : 17 }} />
        </m.span>
        
        <AnimatePresence>
          {isExpanded && (
            <m.span
              key="label"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              style={{ whiteSpace: "nowrap", flex: 1, letterSpacing: "-0.01em" }}
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
        <Badge
          count={badges.flashcardsDue}
          size="small"
          style={{ backgroundColor: "var(--accent)" }}
        />
      );
    }
    if (href === "/review-quiz" && badges.vocabDue > 0) {
      return (
        <Badge
          count={badges.vocabDue}
          size="small"
          style={{ backgroundColor: "var(--info)" }}
        />
      );
    }
    if (href === "/daily-challenge") {
      return (
        <m.span
          initial={{ scale: 0.8 }}
          animate={{ scale: [0.8, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          style={{ fontSize: 12, lineHeight: 1, marginLeft: "auto" }}
        >
          {badges.dailyChallengeCompleted ? (
            <CheckCircleOutlined style={{ color: "var(--success)" }} />
          ) : (
            <FireOutlined style={{ color: "var(--error)", opacity: 0.7 }} />
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
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: "1px solid var(--sidebar-border)",
        background: "var(--sidebar-gradient)",
        padding: "16px 10px",
        height: "100vh",
      }}
    >
      {/* Accent glow */}
      <m.div
        aria-hidden
        animate={{ opacity: isExpanded ? 1 : 0.6 }}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: "var(--sidebar-glow)",
          zIndex: 0,
        }}
      />

      {/* Logo / toggle */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          minHeight: 52,
          paddingBottom: 12,
          paddingTop: 2,
        }}
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <m.div
              key="expanded"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              style={{ display: "flex", alignItems: "center", width: "100%" }}
            >
              <div style={{ flexShrink: 0 }}>
                <Logo collapsed={false} />
              </div>
              <m.button
                whileHover={{ background: "var(--sidebar-item-hover)" }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                aria-label="Collapse sidebar"
                style={{
                  marginLeft: "auto",
                  display: "grid",
                  placeItems: "center",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: 8,
                  color: "var(--sidebar-text)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <MenuFoldOutlined style={{ fontSize: 15 }} />
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
              style={{
                margin: "0 auto",
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 10,
                color: "var(--sidebar-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <MenuUnfoldOutlined style={{ fontSize: 15 }} />
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--sidebar-border)",
          position: "relative",
          zIndex: 1,
          marginBottom: 6,
        }}
      />

      {/* Nav */}
      <m.nav
        aria-label="Các mục trong ứng dụng"
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          paddingTop: 4,
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
        }}
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
                  <Tooltip placement="right" title={label}>
                    {link}
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
                    <Tooltip
                      key={item.href}
                      placement="right"
                      title={item.label}
                    >
                      {link}
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
                whileHover={{ x: 2, opacity: 0.8 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  padding: "4px 12px 4px 10px",
                  border: "none",
                  background: "none",
                  color: "var(--sidebar-text)",
                  opacity: 0.55,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  cursor: "pointer",
                  marginBottom: 2,
                }}
              >
                <span style={{ flex: 1, textAlign: "left" }}>
                  {group.label}
                </span>
                <m.span animate={{ rotate: isGroupOpen ? 0 : -90 }}>
                  <DownOutlined style={{ fontSize: 8 }} />
                </m.span>
              </m.button>

              <AnimatePresence initial={false}>
                {isGroupOpen && (
                  <m.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      overflow: "hidden",
                    }}
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
        style={{ paddingTop: 8, position: "relative", zIndex: 1, marginTop: 4 }}
      >
        <div
          style={{
            height: 1,
            background: "var(--sidebar-border)",
            marginBottom: 8,
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
              aria-label={
                mode === "light" ? "Bật chế độ tối" : "Bật chế độ sáng"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 10px",
                borderRadius: 10,
                border: "none",
                background: "transparent",
                color: "var(--sidebar-text)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "color 0.18s",
              }}
            >
              <m.span
                animate={{ rotate: mode === "light" ? 0 : 180 }}
                style={{ fontSize: 15, display: "grid", placeItems: "center" }}
              >
                {mode === "light" ? <MoonOutlined /> : <SunOutlined />}
              </m.span>
              {isExpanded && (
                <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {mode === "light" ? "Chế độ tối" : "Chế độ sáng"}
                </m.span>
              )}
            </m.button>
          );
          return !isExpanded ? (
            <Tooltip
              placement="right"
              title={mode === "light" ? "Chế độ tối" : "Chế độ sáng"}
            >
              {themeBtn}
            </Tooltip>
          ) : (
            themeBtn
          );
        })()}
      </m.div>
    </m.aside>
  );
}
