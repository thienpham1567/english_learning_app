"use client";

import { useState, useEffect, type ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import { UserMenu } from "@/components/app/UserMenu";
import { UserProvider } from "@/components/app/UserContext";
import { ToolbarBreadcrumb } from "@/components/app/ToolbarBreadcrumb";

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
    <>
    {/* suppressHydrationWarning: sidebar width is stored in localStorage and rehydrated client-side.
        The server renders collapsed (default) while the client may expand after mount — accepted trade-off. */}
    <div
      suppressHydrationWarning
      className={`grid h-screen max-h-screen min-h-screen overflow-y-auto grid-rows-[minmax(0,1fr)] bg-(--bg) transition-[grid-template-columns] duration-300 ${isExpanded ? "grid-cols-[264px_minmax(0,1fr)]" : "grid-cols-[72px_minmax(0,1fr)]"} max-[920px]:h-dvh max-[920px]:max-h-dvh max-[920px]:min-h-dvh max-[920px]:grid-cols-1 max-[920px]:grid-rows-[auto_minmax(0,1fr)]`}
    >
      <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />
      <UserProvider user={user}>
        <div className="flex min-w-0 min-h-0 flex-col">
          <header className="relative z-120 flex h-13 shrink-0 items-center justify-between overflow-visible border-b border-white/30 bg-white/70 px-5 backdrop-blur-xl max-[920px]:h-12 max-[920px]:px-4">
            <ToolbarBreadcrumb />
            <div className="flex items-center gap-3">
              <UserMenu user={user} />
            </div>
          </header>
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 max-[920px]:p-4">
            {children}
          </main>
        </div>
      </UserProvider>
    </div>
    </>
  );
}
