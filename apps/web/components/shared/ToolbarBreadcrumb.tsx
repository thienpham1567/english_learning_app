"use client";

import { usePathname } from "next/navigation";
import { Typography } from "antd";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

const { Text, Title } = Typography;

const BREADCRUMBS: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "Tổng quan", title: "Dashboard" },
  "/toeic-skills": { eyebrow: "TOEIC 4 Skills", title: "Luyện thi TOEIC" },
  "/toeic-practice": { eyebrow: "Luyện đề ETS", title: "TOEIC Practice" },
  "/toeic": { eyebrow: "TOEIC", title: "TOEIC Hub" },
  "/toeic/practice": { eyebrow: "Luyện đề ETS", title: "TOEIC Practice" },
  "/toeic/diagnostic": { eyebrow: "TOEIC", title: "Diagnostic Test" },
  "/toeic/skills": { eyebrow: "TOEIC", title: "4 Skills Practice" },
  "/grammar-quiz": { eyebrow: "TOEIC Part 5", title: "Incomplete Sentences" },
  "/grammar-lessons": { eyebrow: "Ngữ pháp TOEIC", title: "Bài học ngữ pháp" },
  "/grammar-roadmap": { eyebrow: "Ngữ pháp TOEIC", title: "Lộ trình ngữ pháp" },
  "/my-vocabulary": { eyebrow: "Từ vựng TOEIC", title: "Từ vựng của tôi" },
  "/flashcards": { eyebrow: "Ôn tập từ vựng", title: "Flashcards" },
  "/daily-challenge": { eyebrow: "Thử thách mỗi ngày", title: "Daily Challenge" },
  "/error-notebook": { eyebrow: "Sổ lỗi sai", title: "Error Notebook" },
  "/pdf-reader": { eyebrow: "Công cụ", title: "Đọc sách TOEIC" },
  "/reading": { eyebrow: "TOEIC Reading", title: "Luyện đọc" },
  "/ipa-chart": { eyebrow: "Phát âm", title: "Bảng IPA" },
  "/diagnostic": { eyebrow: "TOEIC", title: "Diagnostic Test" },
  "/study-sets": { eyebrow: "Từ vựng", title: "Study Sets" },
};

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? null;
  if (!crumb) return null;

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={pathname}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 8 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
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
      </m.div>
    </AnimatePresence>
  );
}
