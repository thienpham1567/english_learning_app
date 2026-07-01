"use client";

import {
  BookOpen,
  BookOpenCheck,
  BookOpenText,
  CircleCheckBig,
  FileText,
  FileWarning,
  Flame,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Pencil,

  Star,
  Target,
  Timer,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { usePathname } from "next/navigation";

type BreadcrumbEntry = {
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
};

const BREADCRUMBS: Record<string, BreadcrumbEntry> = {

  "/toeic": { eyebrow: "TOEIC", title: "TOEIC Skills", icon: <Target /> },
  "/grammar-lessons": { eyebrow: "Grammar", title: "Grammar", icon: <GraduationCap /> },


  "/error-notebook": { eyebrow: "Review", title: "Error Notebook", icon: <FileWarning /> },
  "/reading": { eyebrow: "TOEIC Reading", title: "Reading Practice", icon: <BookOpenText /> },
  "/ipa-chart": { eyebrow: "Pronunciation", title: "IPA Chart", icon: <Volume2 /> },
  "/read-aloud": { eyebrow: "Tools", title: "Read Aloud", icon: <Volume2 /> },
  "/writing-tools": { eyebrow: "Tools", title: "Writing Tools", icon: <Pencil /> },
  "/english-chatbot": { eyebrow: "Tools", title: "AI Chatbot", icon: <MessageSquare /> },
  "/smart-reader": { eyebrow: "Tools", title: "Smart Reader", icon: <BookOpenCheck /> },

};

/**
 * Match pathname to breadcrumb, supporting dynamic routes like
 * /grammar-lessons/123 → tries "/grammar-lessons/123",
 * then "/grammar-lessons" etc.
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
        className="flex items-center gap-2.5"
      >
        {/* Icon */}
        <m.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 400 }}
          className="w-[30px] h-[30px] rounded-lg grid text-sm text-accent shrink-0 bg-accent-light border border-border shadow-sm place-items-center"
        >
          {crumb.icon}
        </m.div>

        {/* Text */}
        <div className="flex flex-col justify-center">
          <span className="text-[10px] uppercase leading-none font-bold text-accent tracking-widest">
            {crumb.eyebrow}
          </span>
          <h5
            className="text-[13px] font-bold font-display text-ink mt-0.5 leading-tight"
            style={{ margin: "2px 0 0" }}
          >
            {crumb.title}
          </h5>
        </div>
      </m.div>
    </AnimatePresence>
  );
}
