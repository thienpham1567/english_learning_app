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
    <div className="app-shell">
      <AppSidebar />
      <div className="app-shell__main">
        <header className="app-toolbar">
          <div className="app-toolbar__right">
            <UserMenu user={user} />
          </div>
        </header>
        <main className="app-shell__content">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
