import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app/AppSidebar";
import { UserMenu } from "@/components/app/UserMenu";
import { UserProvider } from "@/components/app/UserContext";

export type AuthUser = {
  name: string;
  image: string | null;
};

export function AppShell({ children, user }: { children: ReactNode; user: AuthUser }) {
  return (
    <div className="app-shell grid min-h-screen grid-cols-[72px_minmax(0,1fr)] bg-[var(--bg)] transition-[grid-template-columns] duration-300 md:grid-cols-[72px_minmax(0,1fr)]">
      <AppSidebar />
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-end border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_88%,white)] px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
