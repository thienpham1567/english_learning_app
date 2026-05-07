"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ReadOutlined, RightOutlined } from "@ant-design/icons";
import {
  getMostRecentBook,
  formatFileSize,
  type PdfBookMeta,
} from "@/lib/pdf-reader/pdf-storage";

interface ContinueReadingHeroProps {
  /** Refresh trigger — increment to re-fetch */
  refreshKey?: number;
}

export function ContinueReadingHero({ refreshKey }: ContinueReadingHeroProps) {
  const router = useRouter();
  const [book, setBook] = useState<PdfBookMeta | null>(null);

  useEffect(() => {
    getMostRecentBook().then(setBook).catch(() => setBook(null));
  }, [refreshKey]);

  if (!book || book.lastPage <= 1) return null;

  const progress = book.totalPages > 0
    ? Math.round((book.lastPage / book.totalPages) * 100)
    : 0;

  const isComplete = progress >= 100;

  // Time since last read
  const lastReadAt = book.lastReadAt ?? book.addedAt;
  const diffMs = Date.now() - lastReadAt;
  const mins = Math.floor(diffMs / 60_000);
  let timeAgo = "Vừa xong";
  if (mins >= 60 * 24) timeAgo = `${Math.floor(mins / (60 * 24))} ngày trước`;
  else if (mins >= 60) timeAgo = `${Math.floor(mins / 60)} giờ trước`;
  else if (mins >= 1) timeAgo = `${mins} phút trước`;

  return (
    <div
      className="anim-fade-up"
      onClick={() => router.push(`/pdf-reader/${book.id}`)}
      style={{
        borderRadius: 18,
        background: "var(--card-bg)",
        border: "1px solid var(--border)",
        padding: "20px 24px",
        cursor: "pointer",
        transition: "all 0.25s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Accent strip — left edge */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: isComplete ? "var(--success)" : "var(--accent)",
          borderRadius: "18px 0 0 18px",
        }}
      />

      {/* Grain texture */}
      <div
        className="grain-overlay"
        style={{ opacity: 0.02, borderRadius: "inherit" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Icon seal */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ReadOutlined
            style={{ fontSize: 24, color: "var(--accent)" }}
          />
        </div>

        {/* Text content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "var(--accent)",
              }}
            >
              {isComplete ? "Đã hoàn thành" : "Tiếp tục đọc"}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              · {timeAgo}
            </span>
          </div>

          {/* Book title */}
          <p
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              color: "var(--text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {book.name}
          </p>

          {/* Meta info */}
          <div
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
              color: "var(--text-muted)",
            }}
          >
            <span>Trang {book.lastPage}/{book.totalPages}</span>
            <span>{formatFileSize(book.size)}</span>
          </div>

          {/* Progress bar */}
          <div
            style={{
              marginTop: 10,
              height: 5,
              borderRadius: 3,
              background: "var(--surface)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 3,
                background: isComplete
                  ? "var(--success)"
                  : "linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 70%, var(--warning)))",
                transition: "width 0.4s ease",
              }}
            />
          </div>

          {/* Progress text */}
          <div
            style={{
              marginTop: 4,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: isComplete ? "var(--success)" : "var(--accent)",
              }}
            >
              {progress}% hoàn thành
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {book.totalPages - book.lastPage} trang còn lại
            </span>
          </div>
        </div>

        {/* Arrow */}
        <RightOutlined
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}
