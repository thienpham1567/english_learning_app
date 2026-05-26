"use client";
import { api } from "@/lib/api-client";
import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle, X } from "lucide-react";

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
    <div className="fixed flex items-center gap-3 rounded-2xl bg-(--surface) border-2 border-border w-[360px]" style={{top: 16, right: 16, zIndex: 1000, padding: "14px 18px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", animation: "slideDown 0.4s ease-out"}} >
      <div className="w-[40px] h-[40px] rounded-xl flex items-center justify-center shrink-0" style={{background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))"}} >
        <Bell className="text-lg" style={{color: "var(--text-on-accent)"}} />
      </div>

      <div className="flex-1 w-[0px]" >
        {subscribed ? (
          <div className="text-sm font-semibold text-emerald-500" >
            <CheckCircle className="mr-1" /> Đã bật thông báo!
          </div>
        ) : (
          <>
            <div className="text-sm font-semibold" style={{color: "var(--text)"}} >
              Bật nhắc nhở học tập
            </div>
            <div className="text-xs text-text-muted" style={{marginTop: 2}} >
              Nhận thông báo mỗi ngày để duy trì streak
            </div>
          </>
        )}
      </div>

      {!subscribed && (
        <button
          onClick={handleEnable} className="border-none text-[13px] font-bold cursor-pointer" style={{padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg, var(--accent), var(--accent-hover, var(--accent)))", color: "var(--text-on-accent)", whiteSpace: "nowrap"}} >
          Bật
        </button>
      )}

      <button
        onClick={handleDismiss}
        
        aria-label="Đóng" className="bg-none border-none text-text-muted cursor-pointer p-1 text-xs leading-none" >
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
