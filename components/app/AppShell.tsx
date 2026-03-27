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
    <div className="grid min-h-screen grid-cols-[72px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] bg-[var(--bg)] transition-[grid-template-columns] duration-300 max-[920px]:min-h-dvh max-[920px]:grid-cols-1 max-[920px]:grid-rows-[auto_minmax(0,1fr)]">
      <AppSidebar />
      <div className="flex min-w-0 min-h-0 flex-col">
        <header className="flex h-[52px] shrink-0 items-center justify-end border-b border-[var(--border)] bg-[var(--surface)] px-5 max-[920px]:px-4">
          <div className="flex items-center gap-3">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
