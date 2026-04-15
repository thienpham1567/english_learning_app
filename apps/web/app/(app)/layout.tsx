import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/shared/AppShell";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { PWAProvider } from "@/components/shared/PWAProvider";
import { ExamModeProvider } from "@/components/shared/ExamModeProvider";
import { DashboardProvider } from "@/hooks/useDashboard";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const user = {
    name: session.user.name,
    image: session.user.image ?? null,
  };

  return (
    <ThemeProvider>
      <NuqsAdapter>
        <PWAProvider>
          <ExamModeProvider>
            <DashboardProvider>
              <AppShell user={user}>{children}</AppShell>
            </DashboardProvider>
          </ExamModeProvider>
        </PWAProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
