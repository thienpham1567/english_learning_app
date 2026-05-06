"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  MinusOutlined,
  PlusOutlined,
  FullscreenOutlined,
  LeftOutlined,
  RightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { usePdfReader } from "@/lib/pdf-reader/use-pdf-reader";
import { PdfViewer } from "../_components/PdfViewer";
import { TextSelectionPopup } from "../_components/TextSelectionPopup";
import { DictionaryModal, type DictResult } from "../_components/DictionaryModal";

export default function PdfReaderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookId = params.id;

  const {
    pdfDoc,
    currentPage,
    totalPages,
    zoom,
    isLoading,
    error,
    bookName,
    goToPage,
    nextPage,
    prevPage,
    setZoom,
  } = usePdfReader(bookId);

  // Text selection popup
  const [selection, setSelection] = useState<{
    text: string;
    rect: DOMRect;
  } | null>(null);

  // Dictionary modal
  const [dictData, setDictData] = useState<DictResult | null>(null);

  // Page input
  const [pageInput, setPageInput] = useState("");

  const handleTextSelect = useCallback((text: string, rect: DOMRect) => {
    setSelection({ text, rect });
  }, []);

  const handleCloseSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleDictionaryResult = useCallback((data: unknown) => {
    setDictData(data as DictResult);
    setSelection(null);
  }, []);

  const handlePageSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const page = parseInt(pageInput, 10);
      if (!isNaN(page)) {
        goToPage(page);
        setPageInput("");
      }
    },
    [pageInput, goToPage],
  );

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 10,
          color: "var(--text-muted)",
        }}
      >
        <LoadingOutlined style={{ fontSize: 24 }} />
        <span>Đang mở sách...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
          color: "var(--text-muted)",
        }}
      >
        <span style={{ fontSize: 40 }}>📖</span>
        <p style={{ margin: 0, fontSize: 15 }}>{error}</p>
        <button
          onClick={() => router.push("/pdf-reader")}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--card-bg)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <ArrowLeftOutlined /> Quay lại thư viện
        </button>
      </div>
    );
  }

  if (!pdfDoc) return null;

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--card-bg)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {/* Back button */}
        <button
          onClick={() => router.push("/pdf-reader")}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <ArrowLeftOutlined />
          <span className="hide-mobile">Thư viện</span>
        </button>

        {/* Book name */}
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
          title={bookName}
        >
          {bookName}
        </span>

        {/* Page navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            borderRadius: 8,
            background: "var(--surface)",
          }}
        >
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            style={{
              border: "none",
              background: "transparent",
              color: currentPage <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <LeftOutlined />
          </button>

          <form onSubmit={handlePageSubmit} style={{ display: "inline" }}>
            <input
              type="text"
              value={pageInput || String(currentPage)}
              onChange={(e) => setPageInput(e.target.value)}
              onFocus={() => setPageInput(String(currentPage))}
              onBlur={() => setPageInput("")}
              style={{
                width: 36,
                textAlign: "center",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "2px 4px",
                fontSize: 12,
                background: "var(--card-bg)",
                color: "var(--text-primary)",
              }}
            />
          </form>

          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            / {totalPages}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            style={{
              border: "none",
              background: "transparent",
              color: currentPage >= totalPages ? "var(--text-muted)" : "var(--text-secondary)",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <RightOutlined />
          </button>
        </div>

        {/* Zoom controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 6px",
            borderRadius: 8,
            background: "var(--surface)",
          }}
        >
          <button
            onClick={() => setZoom(zoom - 0.15)}
            disabled={zoom <= 0.5}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: zoom <= 0.5 ? "not-allowed" : "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <MinusOutlined />
          </button>
          <span style={{ fontSize: 12, color: "var(--text-primary)", minWidth: 36, textAlign: "center" }}>
            {zoomPercent}%
          </span>
          <button
            onClick={() => setZoom(zoom + 0.15)}
            disabled={zoom >= 3}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: zoom >= 3 ? "not-allowed" : "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <PlusOutlined />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 4,
              fontSize: 12,
            }}
            title="Reset zoom"
          >
            <FullscreenOutlined />
          </button>
        </div>
      </div>

      {/* PDF Viewer area */}
      <PdfViewer
        pdfDoc={pdfDoc}
        currentPage={currentPage}
        zoom={zoom}
        onTextSelect={handleTextSelect}
      />

      {/* Keyboard shortcuts */}
      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Text selection popup */}
      {selection && (
        <TextSelectionPopup
          text={selection.text}
          rect={selection.rect}
          onClose={handleCloseSelection}
          onDictionaryResult={handleDictionaryResult}
        />
      )}

      {/* Dictionary modal */}
      {dictData && (
        <DictionaryModal
          data={dictData}
          onClose={() => setDictData(null)}
        />
      )}
    </div>
  );
}
