"use client";
import { Bell, CheckCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api-client";

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
      await api.post("/push/subscribe", {
        endpoint: json.endpoint,
        keys: json.keys,
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
      className="fixed top-4 right-4 z-[1000] flex items-center gap-3 rounded-2xl bg-surface border-2 border-border w-[360px] py-3.5 px-4.5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] animate-[slideDown_0.4s_ease-out]"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
        }}
      >
        <Bell className="text-lg text-[var(--text-on-accent)]" />
      </div>

      <div className="flex-1 min-w-0">
        {subscribed ? (
          <div className="text-sm font-semibold text-emerald-500">
            <CheckCircle className="mr-1 inline" size={14} /> Notifications enabled!
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold text-ink">
              Enable study reminders
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              Get daily reminders to keep your streak
            </div>
          </>
        )}
      </div>

      {!subscribed && (
        <button
          onClick={handleEnable}
          className="border-none text-[13px] font-bold cursor-pointer py-2 px-3.5 rounded-[10px] whitespace-nowrap text-[var(--text-on-accent)]"
          style={{
            background:
              "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))",
          }}
        >
          Enable
        </button>
      )}

      <button
        onClick={handleDismiss}
        aria-label="Close"
        className="bg-none border-none text-text-muted cursor-pointer p-1 text-xs leading-none"
      >
        <X />
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
