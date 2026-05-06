"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Tooltip } from "antd";
import { Logo } from "@/components/shared/Logo";
import {
  MessageOutlined,
  CustomerServiceOutlined,
  AudioOutlined,
  FontSizeOutlined,
  FormOutlined,
  ReadOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  StarOutlined,
  SyncOutlined,
  FireOutlined,
  TrophyOutlined,
  ExceptionOutlined,
  CompassOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  BarChartOutlined,
  SwapOutlined,
  DownOutlined,
  RightOutlined,
  CheckCircleOutlined,
  YoutubeOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useExamMode } from "@/components/shared/ExamModeProvider";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ style?: React.CSSProperties }> };

type NavGroup = {
  key: string;
  label: string;
  items: NavItem[];
};

const navGroups: (NavItem | NavGroup)[] = [
  {
    key: "practice",
    label: "Luyện tập",
    items: [
      { href: "/english-chatbot", label: "Trò chuyện", icon: MessageOutlined },
      { href: "/listening", label: "Luyện nghe", icon: CustomerServiceOutlined },
      { href: "/pronunciation", label: "Luyện nói", icon: AudioOutlined },
      { href: "/ipa-chart", label: "Bảng IPA", icon: FontSizeOutlined },
      { href: "/writing-practice", label: "Luyện viết", icon: FormOutlined },
      { href: "/reading", label: "Luyện đọc", icon: ReadOutlined },
      { href: "/youtube-learn", label: "Học cùng YouTube", icon: YoutubeOutlined },
    ],
  },
  {
    key: "grammar",
    label: "Ngữ pháp",
    items: [
      { href: "/grammar-lessons", label: "Bài học", icon: BookOutlined },
      { href: "/grammar-quiz", label: "Luyện đề", icon: QuestionCircleOutlined },
    ],
  },
  {
    key: "vocabulary",
    label: "Từ vựng",
    items: [
      { href: "/dictionary", label: "Từ điển", icon: SearchOutlined },
      { href: "/my-vocabulary", label: "Từ vựng của tôi", icon: StarOutlined },
      { href: "/flashcards", label: "Ôn tập", icon: SyncOutlined },
    ],
  },
  {
    key: "assess",
    label: "Kiểm tra & Ôn tập",
    items: [
      { href: "/daily-challenge", label: "Thử thách hàng ngày", icon: FireOutlined },
      { href: "/toeic-practice", label: "Luyện đề TOEIC", icon: TrophyOutlined },
      { href: "/error-notebook", label: "Sổ lỗi sai", icon: ExceptionOutlined },
    ],
  },
  {
    key: "explore",
    label: "Khám phá",
    items: [
      { href: "/study-sets", label: "Chủ đề học tập", icon: CompassOutlined },
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
    <Link
      href={href}
      prefetch={false}
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
        textDecoration: "none",
        transition: "background 0.18s, color 0.18s",
        background: active ? "var(--sidebar-active-bg)" : "transparent",
        color: active ? "var(--accent)" : "var(--sidebar-text)",
        borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
        animation: `fadeInLeft 0.25s ease-out ${animDelay}s both`,
        position: "relative",
      }}
      className="sidebar-nav-link"
    >
      <span style={{
        display: "grid",
        placeItems: "center",
        width: 18,
        height: 18,
        flexShrink: 0,
        opacity: active ? 1 : 0.75,
        transition: "opacity 0.18s",
      }}>
        <Icon style={{ fontSize: indented ? 15 : 17 }} />
      </span>
      {isExpanded && (
        <span style={{ whiteSpace: "nowrap", flex: 1, letterSpacing: "-0.01em" }}>{label}</span>
      )}
      {badge}
    </Link>
  );
}

export function AppSidebar({ isExpanded, onToggle }: Props) {
  const pathname = usePathname();
  const { mode, toggleTheme } = useTheme();
  const { examMode, setExamMode } = useExamMode();
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
        <span style={{ fontSize: 12, lineHeight: 1, marginLeft: "auto" }}>
          {badges.dailyChallengeCompleted
            ? <CheckCircleOutlined style={{ color: "var(--success)" }} />
            : <FireOutlined style={{ color: "var(--error)", opacity: 0.7 }} />}
        </span>
      );
    }
    return null;
  }

  return (
    <aside
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
        width: isExpanded ? 248 : 64,
        height: "100vh",
        transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Accent glow */}
      <div
        aria-hidden
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
        {isExpanded ? (
          <>
            <div style={{ flexShrink: 0 }}>
              <Logo collapsed={false} />
            </div>
            <button
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
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <MenuFoldOutlined style={{ fontSize: 15 }} />
            </button>
          </>
        ) : (
          <button
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
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-item-hover)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <MenuUnfoldOutlined style={{ fontSize: 15 }} />
          </button>
        )}
      </div>

      <div style={{ height: 1, background: "var(--sidebar-border)", position: "relative", zIndex: 1, marginBottom: 6 }} />

      {/* Nav */}
      <nav
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
                animDelay={0.05}
              />
            );
            return (
              <div key={href}>
                {!isExpanded ? <Tooltip placement="right" title={label}>{link}</Tooltip> : link}
              </div>
            );
          }

          // Group
          const group = entry as NavGroup;
          const groupHasActive = group.items.some(
            (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
          );
          const isGroupOpen = groupHasActive || !collapsedGroups.has(group.key);

          // Collapsed sidebar: flat icons
          if (!isExpanded) {
            return (
              <div key={group.key} style={{ marginTop: 2 }}>
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const link = (
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={active}
                      isExpanded={false}
                      badge={getBadge(item.href)}
                    />
                  );
                  return (
                    <Tooltip key={item.href} placement="right" title={item.label}>
                      {link}
                    </Tooltip>
                  );
                })}
              </div>
            );
          }

          // Expanded: collapsible group
          return (
            <div
              key={group.key}
              style={{
                marginTop: groupIndex > 0 ? 10 : 4,
                animation: `fadeInLeft 0.25s ease-out ${0.08 + groupIndex * 0.05}s both`,
              }}
            >
              <button
                onClick={() => toggleGroup(group.key)}
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
                <span style={{ flex: 1, textAlign: "left" }}>{group.label}</span>
                {isGroupOpen
                  ? <DownOutlined style={{ fontSize: 8 }} />
                  : <RightOutlined style={{ fontSize: 8 }} />}
              </button>

              {isGroupOpen && (
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                        animDelay={0.04 + itemIndex * 0.03}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom: Exam mode + Theme */}
      <div style={{ paddingTop: 8, position: "relative", zIndex: 1, marginTop: 4 }}>
        <div style={{ height: 1, background: "var(--sidebar-border)", marginBottom: 8 }} />

        {/* Exam Mode */}
        {(() => {
          const examBtn = (
            <button
              onClick={() => setExamMode(examMode === "toeic" ? "ielts" : "toeic")}
              className="theme-toggle-btn"
              aria-label={`Switch to ${examMode === "toeic" ? "IELTS" : "TOEIC"} mode`}
              style={{ marginBottom: 4 }}
            >
              <span style={{ fontSize: 15, display: "grid", placeItems: "center" }}>
                {examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />}
              </span>
              {isExpanded && (
                <span style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                  <span>{examMode === "toeic" ? "TOEIC" : "IELTS"}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: examMode === "toeic"
                        ? "rgba(59, 130, 246, 0.13)"
                        : "rgba(200, 75, 49, 0.12)",
                      color: examMode === "toeic" ? "var(--info)" : "var(--accent)",
                      fontWeight: 700,
                      marginLeft: "auto",
                    }}
                  >
                    <SwapOutlined style={{ fontSize: 10 }} />
                  </span>
                </span>
              )}
            </button>
          );
          return !isExpanded ? (
            <Tooltip placement="right" title={`${examMode === "toeic" ? "TOEIC" : "IELTS"} — Nhấn để đổi`}>
              {examBtn}
            </Tooltip>
          ) : examBtn;
        })()}

        {/* Theme toggle */}
        {(() => {
          const themeBtn = (
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              aria-label={mode === "light" ? "Bật chế độ tối" : "Bật chế độ sáng"}
            >
              <span style={{ fontSize: 15, display: "grid", placeItems: "center" }}>
                {mode === "light" ? <MoonOutlined /> : <SunOutlined />}
              </span>
              {isExpanded && (
                <span>{mode === "light" ? "Chế độ tối" : "Chế độ sáng"}</span>
              )}
            </button>
          );
          return !isExpanded ? (
            <Tooltip placement="right" title={mode === "light" ? "Chế độ tối" : "Chế độ sáng"}>
              {themeBtn}
            </Tooltip>
          ) : themeBtn;
        })()}
      </div>
    </aside>
  );
}
