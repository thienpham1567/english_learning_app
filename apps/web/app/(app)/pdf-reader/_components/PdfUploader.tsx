"use client";

import { useState, useCallback, useRef } from "react";
import { getPdfPageCount } from "@/lib/pdf-reader/pdf-config";
import { pdfLogger } from "@/lib/pdf-reader/pdf-logger";
import {
  CloudUploadOutlined,
  FileTextOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  saveBook,
  generateBookId,
  formatFileSize,
} from "@/lib/pdf-reader/pdf-storage";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

interface PdfUploaderProps {
  onUploaded: () => void;
}

export function PdfUploader({ onUploaded }: PdfUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.type !== "application/pdf") {
        setError("Chỉ hỗ trợ file PDF.");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`File quá lớn. Tối đa ${formatFileSize(MAX_SIZE)}.`);
        return;
      }

      setUploading(true);
      setProgress("Đang đọc file...");

      try {
        const arrayBuffer = await file.arrayBuffer();
        setProgress("Đang phân tích PDF...");

        // Get page count (lazy-loads pdf.js in browser only)
        const data = new Uint8Array(arrayBuffer);
        const totalPages = await getPdfPageCount(data);
        pdfLogger.info("Upload", { name: file.name, pages: totalPages, size: formatFileSize(file.size) });

        setProgress("Đang lưu vào thư viện...");

        const id = generateBookId();
        await saveBook({
          id,
          name: file.name.replace(/\.pdf$/i, ""),
          size: file.size,
          totalPages,
          lastPage: 1,
          addedAt: Date.now(),
          data: arrayBuffer,
        });

        setProgress("");
        onUploaded();
      } catch (err) {
        setError(
          err instanceof Error
            ? `Không thể đọc file PDF: ${err.message}`
            : "Không thể đọc file PDF.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onUploaded],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [processFile],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 16,
          padding: "40px 24px",
          textAlign: "center",
          cursor: uploading ? "wait" : "pointer",
          background: dragOver
            ? "color-mix(in srgb, var(--accent) 5%, var(--card-bg))"
            : "var(--card-bg)",
          transition: "all 0.2s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <LoadingOutlined style={{ fontSize: 36, color: "var(--accent)" }} />
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              {progress}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CloudUploadOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                Kéo thả file PDF vào đây
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                hoặc nhấn để chọn file · Tối đa {formatFileSize(MAX_SIZE)}
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--error-bg)",
            color: "var(--error)",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
