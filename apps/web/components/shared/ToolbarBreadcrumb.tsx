"use client";

import { usePathname } from "next/navigation";
import { Typography } from "antd";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  DashboardOutlined,
  AimOutlined,
  NodeIndexOutlined,
  SolutionOutlined,
  StarOutlined,
  SyncOutlined,
  FireOutlined,
  ExceptionOutlined,
  MessageOutlined,
  SoundOutlined,
  EditOutlined,
  ReadOutlined,
  BookOutlined,
  FileTextOutlined,
  AudioOutlined,
  TrophyOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  FieldTimeOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

type BreadcrumbEntry = {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
};

const BREADCRUMBS: Record<string, BreadcrumbEntry> = {
  "/dashboard":        { eyebrow: "Tổng quan",         title: "Dashboard",             icon: <DashboardOutlined /> },
  "/toeic":            { eyebrow: "TOEIC",              title: "TOEIC Hub",             icon: <AimOutlined /> },
  "/toeic/practice":   { eyebrow: "Luyện đề ETS",      title: "TOEIC Practice",        icon: <FormOutlined /> },
  "/toeic/diagnostic":  { eyebrow: "TOEIC",            title: "Diagnostic Test",       icon: <ExperimentOutlined /> },
  "/toeic/skills":     { eyebrow: "Luyện thi TOEIC",   title: "TOEIC Skills",          icon: <AimOutlined /> },
  "/toeic/writing":    { eyebrow: "TOEIC Writing",      title: "Luyện viết",           icon: <EditOutlined /> },
  "/toeic/writing/runner": { eyebrow: "TOEIC Writing", title: "Bài viết",             icon: <EditOutlined /> },
  "/toeic/speaking":   { eyebrow: "TOEIC Speaking",     title: "Luyện nói",            icon: <AudioOutlined /> },
  "/toeic/speaking/runner": { eyebrow: "TOEIC Speaking", title: "Bài nói",            icon: <AudioOutlined /> },
  "/toeic/mock-test":  { eyebrow: "TOEIC Mock Test",    title: "Thi thử",             icon: <TrophyOutlined /> },
  "/toeic/mock-test/runner": { eyebrow: "TOEIC Mock Test", title: "Đang thi",         icon: <TrophyOutlined /> },
  "/toeic/vocab":      { eyebrow: "TOEIC",              title: "Từ vựng TOEIC",        icon: <StarOutlined /> },
  "/grammar-lessons":  { eyebrow: "Ngữ pháp",          title: "Bài học ngữ pháp",      icon: <SolutionOutlined /> },
  "/grammar-roadmap":  { eyebrow: "Ngữ pháp",          title: "Lộ trình ngữ pháp",     icon: <NodeIndexOutlined /> },
  "/my-vocabulary":    { eyebrow: "Từ vựng",            title: "Từ vựng của tôi",       icon: <StarOutlined /> },
  "/flashcards":       { eyebrow: "Ôn tập",             title: "Flashcards",            icon: <SyncOutlined /> },
  "/daily-challenge":  { eyebrow: "Hàng ngày",          title: "Thử thách hàng ngày",   icon: <FireOutlined /> },
  "/error-notebook":   { eyebrow: "Sổ lỗi sai",        title: "Error Notebook",         icon: <ExceptionOutlined /> },
  "/reading":          { eyebrow: "TOEIC Reading",      title: "Luyện đọc",             icon: <ReadOutlined /> },
  "/ipa-chart":        { eyebrow: "Phát âm",            title: "Bảng IPA",              icon: <SoundOutlined /> },
  "/diagnostic":       { eyebrow: "TOEIC",              title: "Diagnostic Test",        icon: <ExperimentOutlined /> },
  "/study-sets":       { eyebrow: "Từ vựng",            title: "Study Sets",             icon: <BookOutlined /> },
  "/read-aloud":       { eyebrow: "Công cụ",            title: "Đọc to — Read Aloud",   icon: <SoundOutlined /> },
  "/writing-tools":    { eyebrow: "Công cụ",            title: "Writing Tools",          icon: <EditOutlined /> },
  "/english-chatbot":  { eyebrow: "Công cụ",            title: "AI Chatbot",             icon: <MessageOutlined /> },
  "/listening":        { eyebrow: "TOEIC Listening",     title: "Luyện nghe",            icon: <AudioOutlined /> },
};

/**
 * Match pathname to breadcrumb, supporting dynamic routes like
 * /toeic/writing/123/result → tries "/toeic/writing/123/result",
 * then "/toeic/writing" etc.
 */
function findBreadcrumb(pathname: string): BreadcrumbEntry | null {
  // Exact match first
  if (BREADCRUMBS[pathname]) return BREADCRUMBS[pathname];

  // Try progressively shorter paths (handles dynamic [id] segments)
  const segments = pathname.split("/").filter(Boolean);
  for (let i = segments.length - 1; i >= 1; i--) {
    const partial = "/" + segments.slice(0, i).join("/");
    if (BREADCRUMBS[partial]) return BREADCRUMBS[partial];
  }
  return null;
}

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = findBreadcrumb(pathname);
  if (!crumb) return null;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ display: "flex", alignItems: "center", gap: 10 }}
      >
        {/* Icon */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 400 }}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--accent-light)",
            border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            color: "var(--accent)",
            flexShrink: 0,
          }}
        >
          {crumb.icon}
        </m.div>

        {/* Text */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Text
            type="secondary"
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              lineHeight: 1,
              fontWeight: 700,
            }}
          >
            {crumb.eyebrow}
          </Text>
          <Title level={5} style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
            {crumb.title}
          </Title>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
