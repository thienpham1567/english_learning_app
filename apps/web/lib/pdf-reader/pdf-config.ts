/**
 * Lazy-loaded pdf.js helpers.
 * pdfjs-dist uses DOMMatrix/canvas which don't exist in Node.js SSR,
 * so we MUST load it dynamically (only in browser).
 */

import { pdfLogger } from "@/lib/pdf-reader/pdf-logger";

let _configured = false;

async function ensurePdfJs() {
  const pdfjs = await import("pdfjs-dist");

  if (!_configured) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    _configured = true;
    pdfLogger.info("pdf.js worker configured");
  }

  return pdfjs;
}

/** Lazy getDocument — safe for SSR */
export async function loadPdfDocument(data: Uint8Array) {
  const pdfjs = await ensurePdfJs();
  return pdfjs.getDocument({ data }).promise;
}

/** Lazy TextLayer — safe for SSR */
export async function getTextLayerClass() {
  const pdfjs = await ensurePdfJs();
  return pdfjs.TextLayer;
}

/** Get page count without keeping document open */
export async function getPdfPageCount(data: Uint8Array): Promise<number> {
  const doc = await loadPdfDocument(data);
  const count = doc.numPages;
  doc.destroy();
  pdfLogger.info("PDF analyzed", { pages: count });
  return count;
}
