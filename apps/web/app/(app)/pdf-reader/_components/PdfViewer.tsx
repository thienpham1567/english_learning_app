"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { getTextLayerClass } from "@/lib/pdf-reader/pdf-config";
import { pdfLogger } from "@/lib/pdf-reader/pdf-logger";

interface PdfViewerProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  onTextSelect?: (text: string, rect: DOMRect) => void;
}

export function PdfViewer({ pdfDoc, currentPage, zoom, onTextSelect }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);

  // Render page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;

    let cancelled = false;
    setRendering(true);

    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: zoom * 1.5 }); // 1.5x for retina
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / 1.5}px`;
        canvas.style.height = `${viewport.height / 1.5}px`;

        const renderTask = page.render({ canvasContext: ctx, viewport } as never);
        await renderTask.promise;
        if (cancelled) return;

        // Render text layer for selection
        const textLayerDiv = textLayerRef.current!;
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.width = `${viewport.width / 1.5}px`;
        textLayerDiv.style.height = `${viewport.height / 1.5}px`;

        const textContent = await page.getTextContent();
        if (cancelled) return;

        // Dynamic import to avoid SSR DOMMatrix error
        const TextLayer = await getTextLayerClass();
        const textLayer = new TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport: page.getViewport({ scale: zoom }),
        });

        await textLayer.render();
        pdfLogger.info("Rendered page", { page: currentPage, zoom: Math.round(zoom * 100) });
      } catch (err) {
        if (!cancelled) {
          pdfLogger.error("Render error", { err });
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, zoom]);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    if (!onTextSelect) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const text = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    pdfLogger.info("Text selected", { text: text.slice(0, 50) });
    onTextSelect(text, rect);
  }, [onTextSelect]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        overflow: "auto",
        flex: 1,
        minHeight: 0,
        background: "var(--surface)",
        padding: 16,
      }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            borderRadius: 4,
            boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
          }}
        />
        <div
          ref={textLayerRef}
          onMouseUp={handleMouseUp}
          className="pdf-text-layer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 0.25,
            lineHeight: 1,
            overflow: "hidden",
          }}
        />
        <style>{`
          .pdf-text-layer span {
            position: absolute;
            white-space: pre;
            color: transparent;
            pointer-events: all;
            cursor: text;
          }
          .pdf-text-layer span::selection {
            background: rgba(100, 130, 255, 0.35);
          }
          .pdf-text-layer br {
            display: none;
          }
        `}</style>
      </div>
    </div>
  );
}
