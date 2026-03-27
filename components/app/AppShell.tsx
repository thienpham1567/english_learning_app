import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";

export type AuthUser = {
  name: string;
  image: string | null;
};

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  return (
    <div className="app-shell">
      <AppSidebar user={user} />
      <main className="app-shell__content">{children}</main>
    </div>
  );
}
