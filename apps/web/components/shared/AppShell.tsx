"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { FloatingDictionaryWidget } from "@/components/shared/FloatingDictionaryWidget";
import { ToolbarBreadcrumb } from "@/components/shared/ToolbarBreadcrumb";
import { UserProvider } from "@/components/shared/UserContext";
import { UserMenu } from "@/components/shared/UserMenu";

export type AuthUser = {
  name: string;
  image: string | null;
};

function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved === "true") setIsExpanded(true);
  }, []);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("sidebar-expanded", String(next));
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
      }}
    >
      {/* Desktop sidebar */}
      {isMobile === false && <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
        }}
      >
        <UserProvider user={user}>
          <m.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 52,
              padding: "0 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface)",
              backdropFilter: "blur(12px)",
              zIndex: 120,
              lineHeight: "normal",
              flexShrink: 0,
            }}
          >
            <ToolbarBreadcrumb />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <UserMenu user={user} />
            </div>
          </m.header>

          <AnimatePresence mode="wait">
            <m.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
                padding: isMobile ? 12 : 24,
                minHeight: 0,
                paddingBottom: isMobile ? 80 : 24,
              }}
            >
              {children}
            </m.main>
          </AnimatePresence>

          {/* Mobile bottom tab bar */}
          {isMobile === true && <BottomTabBar />}

          <FloatingDictionaryWidget />
        </UserProvider>
      </div>
    </div>
  );
}
