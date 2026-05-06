"use client";

import { useState, useEffect, useCallback } from "react";
import { ReadOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { getAllBooks, type PdfBookMeta } from "@/lib/pdf-reader/pdf-storage";
import { PdfUploader } from "./_components/PdfUploader";
import { BookLibrary } from "./_components/BookLibrary";

export default function PdfReaderPage() {
  const [books, setBooks] = useState<PdfBookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBooks = useCallback(async () => {
    try {
      const all = await getAllBooks();
      setBooks(all);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      <ModuleHeader
        icon={<ReadOutlined />}
        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        title="Đọc sách PDF"
        subtitle="Import sách tiếng Anh · Tra từ và học từ vựng trong lúc đọc"
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          padding: "16px 16px 32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: 900 }}>
          {/* Upload area */}
          <div style={{ marginTop: 16, marginBottom: 24 }}>
            <PdfUploader onUploaded={loadBooks} />
          </div>

          {/* Book library */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              Đang tải thư viện...
            </div>
          ) : (
            <BookLibrary books={books} onRefresh={loadBooks} />
          )}
        </div>
      </div>
    </div>
  );
}
