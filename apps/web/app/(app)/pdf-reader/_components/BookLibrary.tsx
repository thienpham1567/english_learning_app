"use client";

import { useRouter } from "next/navigation";
import {
  BookOutlined,
  DeleteOutlined,
  FileTextOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import {
  deleteBook,
  formatFileSize,
  type PdfBookMeta,
} from "@/lib/pdf-reader/pdf-storage";

interface BookLibraryProps {
  books: PdfBookMeta[];
  onRefresh: () => void;
}

export function BookLibrary({ books, onRefresh }: BookLibraryProps) {
  const router = useRouter();

  if (books.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "var(--text-muted)",
        }}
      >
        <BookOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
        <p style={{ fontSize: 15, margin: 0 }}>Thư viện trống</p>
        <p style={{ fontSize: 13, margin: "4px 0 0" }}>
          Import cuốn sách đầu tiên ở phía trên
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-secondary)",
          margin: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        📚 Thư viện ({books.length} cuốn)
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {books
          .sort((a, b) => b.addedAt - a.addedAt)
          .map((book) => {
            const progress = book.totalPages > 0
              ? Math.round((book.lastPage / book.totalPages) * 100)
              : 0;

            return (
              <div
                key={book.id}
                onClick={() => router.push(`/pdf-reader/${book.id}`)}
                style={{
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "var(--card-bg)",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 20, color: "var(--accent)" }} />
                </div>

                {/* Title */}
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={book.name}
                >
                  {book.name}
                </p>

                {/* Meta */}
                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    gap: 12,
                    fontSize: 12,
                    color: "var(--text-muted)",
                  }}
                >
                  <span>{book.totalPages} trang</span>
                  <span>{formatFileSize(book.size)}</span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    marginTop: 10,
                    height: 4,
                    borderRadius: 2,
                    background: "var(--surface)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress}%`,
                      height: "100%",
                      borderRadius: 2,
                      background: progress === 100 ? "var(--success)" : "var(--accent)",
                      transition: "width 0.3s",
                    }}
                  />
                </div>

                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Trang {book.lastPage}/{book.totalPages} · {progress}%
                  </span>
                </div>

                {/* Delete button */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm("Xóa cuốn sách này?")) {
                      await deleteBook(book.id);
                      onRefresh();
                    }
                  }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    border: "none",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 14,
                    cursor: "pointer",
                    padding: "4px 6px",
                    borderRadius: 6,
                    opacity: 0.4,
                    transition: "opacity 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.color = "var(--error)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.4";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }}
                  title="Xóa sách"
                >
                  <DeleteOutlined />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
}
