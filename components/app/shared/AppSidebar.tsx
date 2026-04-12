"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge, Tooltip } from "antd";
import {
  HomeOutlined,
  CommentOutlined,
  ReadOutlined,
  BookOutlined,
  AppstoreOutlined,
  BulbOutlined,
  EditOutlined,
  FireOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
  BarChartOutlined,
  SoundOutlined,
  FileTextOutlined,
  TrophyOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/components/app/shared/ThemeProvider";
import { useExamMode } from "@/components/app/shared/ExamModeProvider";
import { useSidebarBadges } from "@/hooks/useSidebarBadges";

const navItems = [
  { href: "/home", label: "Trang chủ", icon: HomeOutlined },
  { href: "/english-chatbot", label: "Trò chuyện", icon: CommentOutlined },
  { href: "/dictionary", label: "Từ điển", icon: ReadOutlined },
  { href: "/my-vocabulary", label: "Từ vựng", icon: BookOutlined },
  { href: "/flashcards", label: "Ôn tập", icon: AppstoreOutlined },
  { href: "/grammar-quiz", label: "Ngữ pháp", icon: BulbOutlined },
  { href: "/writing-practice", label: "Luyện viết", icon: EditOutlined },
  { href: "/daily-challenge", label: "Thử thách", icon: FireOutlined },
  { href: "/listening", label: "Luyện nghe", icon: SoundOutlined },
  { href: "/reading", label: "Luyện đọc", icon: FileTextOutlined },
  { href: "/progress", label: "Tiến độ", icon: BarChartOutlined },
];

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function AppSidebar({ isExpanded, onToggle }: Props) {
  const pathname = usePathname();
  const { mode, toggleTheme } = useTheme();
  const { examMode, setExamMode } = useExamMode();
  const badges = useSidebarBadges();

  // Compute badge for each nav item
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
    if (href === "/daily-challenge") {
      return (
        <span style={{ fontSize: 12, lineHeight: 1 }}>
          {badges.dailyChallengeCompleted ? "✅" : "🔥"}
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
        gap: 8,
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.1)",
        background: "var(--sidebar-bg)",
        padding: "20px 16px",
        width: isExpanded ? 264 : 72,
        height: "100vh",
        transition: "width 0.3s ease",
      }}
    >
      {/* Logo / toggle header */}
      <div
        style={{
          display: "flex",
          minHeight: 56,
          alignItems: "center",
          paddingBottom: 12,
          paddingTop: 4,
        }}
      >
        {isExpanded ? (
          <>
            <div style={{ flexShrink: 0 }}>
              <Image
                src="/english-logo-app.svg"
                alt="Thien English"
                width={250}
                height={150}
                style={{ height: 40, width: "auto", borderRadius: 8 }}
                priority
              />
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
                borderRadius: 6,
                color: "var(--sidebar-text)",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              <MenuFoldOutlined style={{ fontSize: 16 }} />
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
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: 6,
              color: "var(--sidebar-text)",
              background: "none",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            <MenuUnfoldOutlined style={{ fontSize: 16 }} />
          </button>
        )}
      </div>

      <div style={{ height: 1, background: "var(--sidebar-border)" }} />

      <nav
        aria-label="Các mục trong ứng dụng"
        style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 8, flex: 1 }}
      >
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          const linkContent = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                overflow: "hidden",
                borderRadius: "var(--radius)",
                padding: "10px 12px",
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s",
                background: active ? "var(--accent-muted)" : "transparent",
                color: active ? "var(--accent)" : "var(--sidebar-text)",
                animation: `fadeInLeft 0.3s ease-out ${0.1 + index * 0.05}s both`,
              }}
            >
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                }}
              >
                <Icon style={{ fontSize: 18 }} />
              </span>
              {isExpanded && <span style={{ whiteSpace: "nowrap", fontSize: 14, flex: 1 }}>{label}</span>}
              {getBadge(href)}
            </Link>
          );

          return (
            <div key={href}>
              {!isExpanded ? (
                <Tooltip placement="right" title={label}>
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              )}
            </div>
          );
        })}
      </nav>

      {/* Exam Mode + Theme toggle at bottom */}
      <div style={{ marginTop: "auto", paddingTop: 8 }}>
        <div style={{ height: 1, background: "var(--sidebar-border)", marginBottom: 12 }} />

        {/* Exam Mode Switcher */}
        {(() => {
          const examBtn = (
            <button
              onClick={() => setExamMode(examMode === "toeic" ? "ielts" : "toeic")}
              className="theme-toggle-btn"
              aria-label={`Switch to ${examMode === "toeic" ? "IELTS" : "TOEIC"} mode`}
              style={{ marginBottom: 4 }}
            >
              <span style={{ fontSize: 16 }}>{examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />}</span>
              {isExpanded && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <span>{examMode === "toeic" ? "TOEIC" : "IELTS"}</span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: examMode === "toeic" ? "#1890ff22" : "#722ed122",
                      color: examMode === "toeic" ? "#1890ff" : "#722ed1",
                      fontWeight: 600,
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
            <Tooltip placement="right" title={`${examMode === "toeic" ? "TOEIC" : "IELTS"} → Nhấn để đổi`}>
              {examBtn}
            </Tooltip>
          ) : (
            examBtn
          );
        })()}

        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={mode === "light" ? "Bật chế độ tối" : "Bật chế độ sáng"}
        >
          {mode === "light" ? (
            <MoonOutlined style={{ fontSize: 16 }} />
          ) : (
            <SunOutlined style={{ fontSize: 16 }} />
          )}
          {isExpanded && <span>{mode === "light" ? "Chế độ tối" : "Chế độ sáng"}</span>}
        </button>
      </div>
    </aside>
  );
}
