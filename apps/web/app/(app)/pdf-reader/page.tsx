"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ReadOutlined } from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { getAllBooks, type PdfBookMeta } from "@/lib/pdf-reader/pdf-storage";
import { ContinueReadingHero } from "./_components/ContinueReadingHero";
import { ReadingStatsBar } from "./_components/ReadingStatsBar";
import { PresetBookShelf } from "./_components/PresetBookShelf";
import { PdfUploader } from "./_components/PdfUploader";
import { BookLibrary } from "./_components/BookLibrary";

export default function PdfReaderPage() {
  const [books, setBooks] = useState<PdfBookMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleRefresh = useCallback(() => {
    loadBooks();
    setRefreshKey((k) => k + 1);
  }, [loadBooks]);

  // Track which preset books are already downloaded
  const savedBookIds = useMemo(() => new Set(books.map((b) => b.id)), [books]);

  // Separate user-uploaded books from preset books
  const userBooks = useMemo(
    () => books.filter((b) => !b.id.startsWith("preset_")),
    [books],
  );

  const hasAnyBooks = books.length > 0;

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
        gradient="var(--gradient-reading)"
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
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* ── Continue Reading Hero ── */}
          <ContinueReadingHero refreshKey={refreshKey} />

          {/* ── Reading Stats ── */}
          {!loading && hasAnyBooks && (
            <>
              <ReadingStatsBar books={books} />
              <div style={{ height: 1, background: "var(--border)", margin: "-8px 0" }} />
            </>
          )}

          {/* ── Preset grammar books ── */}
          <PresetBookShelf savedBookIds={savedBookIds} onBookSaved={handleRefresh} />

          {/* ── Upload area ── */}
          <PdfUploader onUploaded={handleRefresh} compact={hasAnyBooks} />

          {/* ── User's uploaded books ── */}
          {loading ? (
            <div
              className="anim-fade-up anim-delay-4"
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "var(--text-muted)",
                fontSize: 14,
              }}
            >
              Đang tải thư viện...
            </div>
          ) : userBooks.length > 0 ? (
            <div className="anim-fade-up anim-delay-4">
              <BookLibrary books={userBooks} onRefresh={handleRefresh} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
