"use client";

import { usePathname } from "next/navigation";

import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  BookOpen,
  BookOpenText,
  CircleCheckBig,
  ClipboardList,
  FileText,
  FileWarning,
  Flame,
  FlaskConical,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Mic,
  Pencil,
  RefreshCw,
  Star,
  Target,
  Timer,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";



type BreadcrumbEntry = {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
};

const BREADCRUMBS: Record<string, BreadcrumbEntry> = {
  "/dashboard":        { eyebrow: "Tổng quan",         title: "Dashboard",             icon: <LayoutDashboard /> },
  "/toeic":            { eyebrow: "TOEIC",              title: "TOEIC Hub",             icon: <Target /> },
  "/toeic/practice":   { eyebrow: "Luyện đề ETS",      title: "TOEIC Practice",        icon: <ClipboardList /> },
  "/toeic/diagnostic":  { eyebrow: "TOEIC",            title: "Diagnostic Test",       icon: <FlaskConical /> },
  "/toeic/skills":     { eyebrow: "Luyện thi TOEIC",   title: "TOEIC Skills",          icon: <Target /> },
  "/toeic/writing":    { eyebrow: "TOEIC Writing",      title: "Luyện viết",           icon: <Pencil /> },
  "/toeic/writing/runner": { eyebrow: "TOEIC Writing", title: "Bài viết",             icon: <Pencil /> },
  "/toeic/speaking":   { eyebrow: "TOEIC Speaking",     title: "Luyện nói",            icon: <Mic /> },
  "/toeic/speaking/runner": { eyebrow: "TOEIC Speaking", title: "Bài nói",            icon: <Mic /> },
  "/toeic/mock-test":  { eyebrow: "TOEIC Mock Test",    title: "Thi thử",             icon: <Trophy /> },
  "/toeic/mock-test/runner": { eyebrow: "TOEIC Mock Test", title: "Đang thi",         icon: <Trophy /> },
  "/toeic/vocab":      { eyebrow: "TOEIC",              title: "Từ vựng TOEIC",        icon: <Star /> },
  "/grammar-lessons":  { eyebrow: "Ngữ pháp",          title: "Bài học ngữ pháp",      icon: <GraduationCap /> },
  "/grammar-roadmap":  { eyebrow: "Ngữ pháp",          title: "Lộ trình ngữ pháp",     icon: <GitBranch /> },
  "/my-vocabulary":    { eyebrow: "Từ vựng",            title: "Từ vựng của tôi",       icon: <Star /> },
  "/flashcards":       { eyebrow: "Ôn tập",             title: "Flashcards",            icon: <RefreshCw /> },
  "/daily-challenge":  { eyebrow: "Hàng ngày",          title: "Thử thách hàng ngày",   icon: <Flame /> },
  "/error-notebook":   { eyebrow: "Sổ lỗi sai",        title: "Error Notebook",         icon: <FileWarning /> },
  "/reading":          { eyebrow: "TOEIC Reading",      title: "Luyện đọc",             icon: <BookOpenText /> },
  "/ipa-chart":        { eyebrow: "Phát âm",            title: "Bảng IPA",              icon: <Volume2 /> },
  "/diagnostic":       { eyebrow: "TOEIC",              title: "Diagnostic Test",        icon: <FlaskConical /> },
  "/study-sets":       { eyebrow: "Từ vựng",            title: "Study Sets",             icon: <BookOpen /> },
  "/read-aloud":       { eyebrow: "Công cụ",            title: "Đọc to — Read Aloud",   icon: <Volume2 /> },
  "/writing-tools":    { eyebrow: "Công cụ",            title: "Writing Tools",          icon: <Pencil /> },
  "/english-chatbot":  { eyebrow: "Công cụ",            title: "AI Chatbot",             icon: <MessageSquare /> },
  "/listening":        { eyebrow: "TOEIC Listening",     title: "Luyện nghe",            icon: <Mic /> },
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
        transition={{ duration: 0.15, ease: "easeOut" }} className="flex items-center gap-2.5" >
        {/* Icon */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 400 }} className="w-[30px] h-[30px] rounded-lg grid text-sm text-accent shrink-0" style={{background: "var(--accent-light)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", placeItems: "center"}} >
          {crumb.icon}
        </m.div>

        {/* Text */}
        <div className="flex flex-col justify-center" >
          <span className="text-[10px] uppercase leading-none font-bold text-text-muted" style={{letterSpacing: "0.15em"}} >
            {crumb.eyebrow}
          </span>
          <h5 className="text-[13px] font-bold text-text-primary" style={{margin: "2px 0 0", lineHeight: 1.2}} >
            {crumb.title}
          </h5>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
