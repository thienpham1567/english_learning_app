"use client";

import { DownloadOutlined, CloseOutlined } from "@ant-design/icons";
import { usePWAInstall } from "@/hooks/usePWAInstall";

export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        borderRadius: 16,
        background: "linear-gradient(135deg, #6366f1, #7c3aed)",
        color: "#fff",
        boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
        maxWidth: "calc(100vw - 32px)",
        width: "auto",
        animation: "slideUp 0.4s ease-out",
      }}
    >
      <DownloadOutlined style={{ fontSize: 20, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Cài đặt ThienGlish</div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>Truy cập nhanh hơn</div>
      </div>
      <button
        onClick={install}
        style={{
          padding: "8px 16px",
          borderRadius: 10,
          border: "none",
          background: "rgba(255,255,255,0.2)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Cài đặt
      </button>
      <button
        onClick={dismiss}
        style={{
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.7)",
          cursor: "pointer",
          padding: 4,
          fontSize: 14,
          lineHeight: 1,
        }}
        aria-label="Đóng"
      >
        <CloseOutlined />
      </button>

      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
