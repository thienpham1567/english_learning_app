"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getBook, updateBookmark } from "@/lib/pdf-reader/pdf-storage";

// Configure pdf.js worker
if (typeof window !== "undefined") {
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export type PdfReaderState = {
  pdfDoc: PDFDocumentProxy | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  isLoading: boolean;
  error: string | null;
  bookName: string;
};

export type PdfReaderActions = {
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setZoom: (zoom: number) => void;
};

export function usePdfReader(bookId: string): PdfReaderState & PdfReaderActions {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoomState] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookName, setBookName] = useState("");

  // Track bookId for bookmark saves
  const bookIdRef = useRef(bookId);
  bookIdRef.current = bookId;

  // Load PDF from IndexedDB
  useEffect(() => {
    if (!bookId) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setPdfDoc(null);

      try {
        const book = await getBook(bookId);
        if (!book) {
          setError("Không tìm thấy sách. Có thể đã bị xóa.");
          setIsLoading(false);
          return;
        }

        if (cancelled) return;

        setBookName(book.name);

        const data = new Uint8Array(book.data);
        const doc = await getDocument({ data }).promise;

        if (cancelled) {
          doc.destroy();
          return;
        }

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(book.lastPage || 1);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể mở file PDF");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pdfDoc?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save bookmark when page changes (debounced)
  useEffect(() => {
    if (!bookIdRef.current || !currentPage || !totalPages) return;

    const timer = setTimeout(() => {
      updateBookmark(bookIdRef.current, currentPage).catch(() => {});
    }, 500);

    return () => clearTimeout(timer);
  }, [currentPage, totalPages]);

  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const setZoom = useCallback((z: number) => {
    setZoomState(Math.max(0.5, Math.min(3.0, z)));
  }, []);

  return {
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
  };
}
