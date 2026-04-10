import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app/shared/AppShell";
import { ThemeProvider } from "@/components/app/shared/ThemeProvider";

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
        <AppShell user={user}>{children}</AppShell>
      </NuqsAdapter>
    </ThemeProvider>
  );
}
