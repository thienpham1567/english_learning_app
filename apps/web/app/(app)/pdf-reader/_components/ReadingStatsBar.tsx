"use client";

import type { PdfBookMeta } from "@/lib/pdf-reader/pdf-storage";

interface ReadingStatsBarProps {
  books: PdfBookMeta[];
}

export function ReadingStatsBar({ books }: ReadingStatsBarProps) {
  if (books.length === 0) return null;

  const totalBooks = books.length;
  const totalPagesRead = books.reduce((sum, b) => sum + Math.max(0, b.lastPage - 1), 0);
  const completedBooks = books.filter(
    (b) => b.totalPages > 0 && b.lastPage >= b.totalPages,
  ).length;

  return (
    <div
      className="anim-fade-up anim-delay-1"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px 28px",
        padding: "18px 0",
      }}
    >
      {/* Total books */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--ink)",
          }}
        >
          {totalBooks}
        </span>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          cuốn sách
        </span>
      </div>

      <div style={{ height: 32, width: 1, background: "var(--border)" }} />

      {/* Pages read */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1,
            color: "var(--accent)",
          }}
        >
          {totalPagesRead}
        </span>
        <span
          style={{
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: "var(--text-muted)",
          }}
        >
          trang đã đọc
        </span>
      </div>

      {completedBooks > 0 && (
        <>
          <div style={{ height: 32, width: 1, background: "var(--border)" }} />

          {/* Completed */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1,
                color: "var(--success)",
              }}
            >
              {completedBooks}
            </span>
            <span
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "var(--text-muted)",
              }}
            >
              hoàn thành
            </span>
          </div>
        </>
      )}
    </div>
  );
}
