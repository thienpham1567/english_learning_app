import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
