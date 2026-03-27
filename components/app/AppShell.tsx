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
    <div className="grid min-h-dvh grid-cols-1 bg-[var(--bg)] transition-[grid-template-columns] duration-300 md:min-h-screen md:grid-cols-[72px_minmax(0,1fr)]">
      <AppSidebar />
      <div className="flex min-w-0 min-h-0 flex-col">
        <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-end border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--bg)_88%,white)] px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6 md:px-8 md:py-8">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
