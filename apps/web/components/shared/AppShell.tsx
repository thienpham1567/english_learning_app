"use client";

import { useState, useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/shared/AppSidebar";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { UserMenu } from "@/components/shared/UserMenu";
import { UserProvider } from "@/components/shared/UserContext";
import { ToolbarBreadcrumb } from "@/components/shared/ToolbarBreadcrumb";

export type AuthUser = {
  name: string;
  image: string | null;
};

function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(() =>
    typeof window === "undefined"
      ? null
      : window.matchMedia(`(max-width: ${breakpoint}px)`).matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-expanded") === "true";
  });
  const isMobile = useIsMobile();

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("sidebar-expanded", String(next));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
      {/* Desktop sidebar — hidden on mobile, not rendered during SSR to prevent hydration mismatch */}
      {isMobile === false && <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />}

      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        <UserProvider user={user}>
          <header
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
          </header>
          <main
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              padding: 24,
              minHeight: 0,
              // Add bottom padding on mobile to account for bottom tab bar
              paddingBottom: isMobile ? 80 : 24,
            }}
          >
            {children}
          </main>

          {/* Mobile bottom tab bar — only after hydration */}
          {isMobile === true && <BottomTabBar />}
        </UserProvider>
      </div>
    </div>
  );
}
