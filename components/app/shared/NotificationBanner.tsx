"use client";

import { useState, useEffect, useCallback } from "react";
import { BellOutlined, CloseOutlined } from "@ant-design/icons";

export function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // Don't show if:
    // - Not supported
    // - Already granted or denied
    // - Already dismissed this session
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      Notification.permission !== "default" ||
      sessionStorage.getItem("notif-dismissed")
    ) {
      return;
    }

    // Show after 10 seconds delay (non-intrusive)
    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = useCallback(async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setVisible(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      setSubscribed(true);
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem("notif-dismissed", "1");
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 18px",
        borderRadius: 16,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        maxWidth: 360,
        animation: "slideDown 0.4s ease-out",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1, #7c3aed)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <BellOutlined style={{ fontSize: 18, color: "#fff" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {subscribed ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: "#52c41a" }}>
            ✅ Đã bật thông báo!
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              Bật nhắc nhở học tập
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Nhận thông báo mỗi ngày để duy trì streak
            </div>
          </>
        )}
      </div>

      {!subscribed && (
        <button
          onClick={handleEnable}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg, #6366f1, #7c3aed)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Bật
        </button>
      )}

      <button
        onClick={handleDismiss}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          cursor: "pointer",
          padding: 4,
          fontSize: 12,
          lineHeight: 1,
        }}
        aria-label="Đóng"
      >
        <CloseOutlined />
      </button>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
