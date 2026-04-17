"use client";

import { useState } from "react";
import { Spin } from "antd";
import { MailOutlined, EditOutlined, PictureOutlined, StarOutlined } from "@ant-design/icons";
import type { WritingCategory } from "@/lib/writing-practice/types";
import { CATEGORY_LABELS } from "@/lib/writing-practice/types";

const CATEGORIES: {
  id: WritingCategory;
  icon: typeof MailOutlined;
  desc: string;
  color: string;
  bg: string;
}[] = [
  {
    id: "email-response",
    icon: MailOutlined,
    desc: "Trả lời email yêu cầu (TOEIC Q6-7)",
    color: "#3b82f6",
    bg: "linear-gradient(135deg, #3b82f6, #60a5fa)",
  },
  {
    id: "opinion-essay",
    icon: EditOutlined,
    desc: "Viết luận trình bày quan điểm (TOEIC Q8)",
    color: "#8b5cf6",
    bg: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
  },
  {
    id: "describe-picture",
    icon: PictureOutlined,
    desc: "Mô tả hình ảnh bằng câu (TOEIC Q1-5)",
    color: "#f59e0b",
    bg: "linear-gradient(135deg, #f59e0b, #fbbf24)",
  },
  {
    id: "free",
    icon: StarOutlined,
    desc: "Tự do sáng tạo, chủ đề bất kỳ",
    color: "#10b981",
    bg: "linear-gradient(135deg, #10b981, #34d399)",
  },
];

type Props = {
  onSelect: (category: WritingCategory) => void;
  isLoading: boolean;
  loadingCategory: string | null;
};

export function PromptGallery({ onSelect, isLoading, loadingCategory }: Props) {
  const [hoveredId, setHoveredId] = useState<WritingCategory | null>(null);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: 520,
        margin: "0 auto",
        padding: "24px 20px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 60,
            height: 60,
            borderRadius: 18,
            background: "linear-gradient(135deg, var(--accent), #7a9660)",
            fontSize: 28,
            marginBottom: 12,
            boxShadow: "0 4px 16px rgba(154,177,122,0.35)",
          }}
        >
          ✍️
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
          }}
        >
          Chọn loại bài viết
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
          Luyện viết theo format TOEIC Speaking &amp; Writing
        </p>
      </div>

      {/* Category cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          width: "100%",
        }}
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isBusy = isLoading && loadingCategory === cat.id;
          const isHov = hoveredId === cat.id && !isLoading;

          return (
            <button
              key={cat.id}
              onClick={() => !isLoading && onSelect(cat.id)}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: 18,
                borderRadius: 14,
                border: "1px solid var(--border)",
                borderTop: `4px solid ${cat.color}`,
                background: isHov
                  ? `${cat.color}08`
                  : "var(--card-bg)",
                cursor: isLoading ? "not-allowed" : "pointer",
                textAlign: "left",
                transition: "all 0.18s ease",
                opacity: isLoading && !isBusy ? 0.55 : 1,
                transform: isHov ? "translateY(-3px)" : "none",
                boxShadow: isHov
                  ? `0 6px 18px ${cat.color}25`
                  : "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              {/* Icon */}
              <span
                style={{
                  display: "grid",
                  width: 44,
                  height: 44,
                  placeItems: "center",
                  borderRadius: 12,
                  background: isBusy ? "var(--border)" : cat.bg,
                  boxShadow: `0 2px 8px ${cat.color}40`,
                  transition: "all 0.18s",
                  flexShrink: 0,
                }}
              >
                {isBusy ? (
                  <Spin size="small" />
                ) : (
                  <Icon style={{ fontSize: 20, color: "#fff" }} />
                )}
              </span>

              {/* Label */}
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text)",
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {CATEGORY_LABELS[cat.id]}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {cat.desc}
                </div>
              </div>

              {isBusy && (
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: cat.color,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  Đang tạo đề...
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
