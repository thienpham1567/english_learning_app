"use client";

import { useEffect } from "react";
import { PWAInstallBanner } from "@/components/app/shared/PWAInstallBanner";

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
    </>
  );
}
