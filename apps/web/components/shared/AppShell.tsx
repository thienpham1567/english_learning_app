"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { BottomTabBar } from "@/components/shared/BottomTabBar";
import { FloatingDictionaryWidget } from "@/components/shared/FloatingDictionaryWidget";
import { FloatingSmartReaderWidget } from "@/components/shared/FloatingSmartReaderWidget";
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
    <div className="flex min-h-screen max-h-screen overflow-hidden bg-[var(--bg)]">
      {/* Desktop sidebar */}
      {isMobile === false && <AppSidebar isExpanded={isExpanded} onToggle={handleToggle} />}

      <div className="flex flex-col flex-1 min-w-0">
        <UserProvider user={user}>
          <m.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between h-[52px] px-5 border-b border-border bg-surface backdrop-blur-xl z-[120] leading-normal shrink-0"
          >
            <ToolbarBreadcrumb />
            <div className="flex items-center gap-3">
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
              className={`relative flex flex-col flex-1 overflow-hidden min-h-0 ${isMobile ? "p-3 pb-20" : "p-6"}`}
            >
              {/* Dot pattern background */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(color-mix(in_srgb,var(--border)_15%,transparent)_1px,transparent_1px)] bg-[size:22px_22px] z-0" />
              <div className="relative z-[1] flex flex-col flex-1 overflow-hidden min-h-0">
                {children}
              </div>
            </m.main>
          </AnimatePresence>

          {/* Mobile bottom tab bar */}
          {isMobile === true && <BottomTabBar />}

          <FloatingDictionaryWidget />
          <FloatingSmartReaderWidget />
        </UserProvider>
      </div>
    </div>
  );
}
