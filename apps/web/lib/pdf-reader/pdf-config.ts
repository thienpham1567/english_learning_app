/**
 * Shared pdf.js configuration.
 * Import this BEFORE any getDocument() call to ensure the worker is set.
 */
import { GlobalWorkerOptions } from "pdfjs-dist";

if (typeof window !== "undefined" && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}
