"use client";

import { useEffect } from "react";
import { PWAInstallBanner } from "@/components/shared/PWAInstallBanner";
import { NotificationBanner } from "@/components/shared/NotificationBanner";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed — silently ignore
      });
    }
  }, []);

  return (
    <>
      {children}
      <PWAInstallBanner />
      <NotificationBanner />
    </>
  );
}
