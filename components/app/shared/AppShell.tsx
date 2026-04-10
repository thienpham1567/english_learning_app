"use client";

import { useState, useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/app/shared/AppSidebar";
import { UserMenu } from "@/components/app/shared/UserMenu";
import { UserProvider } from "@/components/app/shared/UserContext";
import { ToolbarBreadcrumb } from "@/components/app/shared/ToolbarBreadcrumb";

export type AuthUser = {
  name: string;
  image: string | null;
};

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    }
  }, []);

  const handleToggle = () => {
    const next = !isExpanded;
    setIsExpanded(next);
    localStorage.setItem("sidebar-expanded", String(next));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
      <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />
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
            }}
          >
            {children}
          </main>
        </UserProvider>
      </div>
    </div>
  );
}
