"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { PRESET_BOOKS, type PresetBook } from "@/lib/pdf-reader/preset-books";
import { getPdfPageCount } from "@/lib/pdf-reader/pdf-config";
import { pdfLogger } from "@/lib/pdf-reader/pdf-logger";
import {
  saveBook,
  getBook,
  type PdfBookMeta,
} from "@/lib/pdf-reader/pdf-storage";

interface PresetBookShelfProps {
  /** IDs of books already saved to IndexedDB */
  savedBookIds: Set<string>;
  onBookSaved: () => void;
}

export function PresetBookShelf({ savedBookIds, onBookSaved }: PresetBookShelfProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleBookClick = useCallback(
    async (preset: PresetBook) => {
      // Already saved → navigate directly
      if (savedBookIds.has(preset.id)) {
        router.push(`/pdf-reader/${preset.id}`);
        return;
      }

      // Download and save to IndexedDB
      setLoadingId(preset.id);
      try {
        pdfLogger.info("Downloading preset book", { id: preset.id, name: preset.name });

        const res = await fetch(preset.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();

        // Clone for analysis (pdf.js detaches the buffer)
        const analyzeBuffer = arrayBuffer.slice(0);
        const totalPages = await getPdfPageCount(new Uint8Array(analyzeBuffer));

        await saveBook({
          id: preset.id,
          name: preset.name,
          size: arrayBuffer.byteLength,
          totalPages,
          lastPage: 1,
          addedAt: Date.now(),
          data: arrayBuffer,
        });

        pdfLogger.info("Preset book saved", { id: preset.id, pages: totalPages });
        onBookSaved();
        router.push(`/pdf-reader/${preset.id}`);
      } catch (err) {
        pdfLogger.error("Failed to download preset book", {
          id: preset.id,
          err: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setLoadingId(null);
      }
    },
    [savedBookIds, onBookSaved, router],
  );

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
        📘 Sách ngữ pháp có sẵn
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-muted)",
            background: "var(--surface)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          Mastering English Grammar
        </span>
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
        }}
      >
        {PRESET_BOOKS.map((book) => {
          const isSaved = savedBookIds.has(book.id);
          const isLoading = loadingId === book.id;

          return (
            <div
              key={book.id}
              onClick={() => !isLoading && handleBookClick(book)}
              style={{
                borderRadius: 12,
                border: `1px solid ${isSaved ? "color-mix(in srgb, var(--success) 30%, var(--border))" : "var(--border)"}`,
                background: isSaved
                  ? "color-mix(in srgb, var(--success) 3%, var(--card-bg))"
                  : "var(--card-bg)",
                padding: "14px 16px",
                cursor: isLoading ? "wait" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isSaved
                  ? "color-mix(in srgb, var(--success) 30%, var(--border))"
                  : "var(--border)";
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: isSaved
                    ? "color-mix(in srgb, var(--success) 10%, var(--surface))"
                    : "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isLoading ? (
                  <LoadingOutlined style={{ fontSize: 16, color: "var(--accent)" }} />
                ) : isSaved ? (
                  <CheckCircleOutlined style={{ fontSize: 16, color: "var(--success)" }} />
                ) : (
                  <BookOutlined style={{ fontSize: 16, color: "var(--accent)" }} />
                )}
              </div>

              {/* Text */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {book.name}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 11,
                    color: isSaved ? "var(--success)" : "var(--text-muted)",
                  }}
                >
                  {isLoading ? "Đang tải..." : isSaved ? "Đã tải · nhấn để đọc" : "Nhấn để tải và đọc"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
