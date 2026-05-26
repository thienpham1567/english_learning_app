import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

import { AppShell } from "@/components/shared/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ExamModeProvider } from "@/components/shared/ExamModeProvider";
import { PWAProvider } from "@/components/shared/PWAProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { DashboardProvider } from "@/hooks/useDashboard";
import { auth } from "@/lib/auth";

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
              <AppShell user={user}>
                <ErrorBoundary>{children}</ErrorBoundary>
              </AppShell>
            </DashboardProvider>
          </ExamModeProvider>
        </PWAProvider>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
