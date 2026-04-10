"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Layout } from "antd";

import { AppSidebar } from "@/components/app/shared/AppSidebar";
import { UserMenu } from "@/components/app/shared/UserMenu";
import { UserProvider } from "@/components/app/shared/UserContext";
import { ToolbarBreadcrumb } from "@/components/app/shared/ToolbarBreadcrumb";

const { Header, Content } = Layout;

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
    <Layout style={{ minHeight: "100vh", maxHeight: "100vh", overflow: "hidden" }}>
      <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />
      <Layout>
        <UserProvider user={user}>
          <Header
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
            }}
          >
            <ToolbarBreadcrumb />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <UserMenu user={user} />
            </div>
          </Header>
          <Content
            style={{
              flex: 1,
              overflow: "auto",
              padding: 24,
              minHeight: 0,
            }}
          >
            {children}
          </Content>
        </UserProvider>
      </Layout>
    </Layout>
  );
}
