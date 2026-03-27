import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";

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

  return <AppShell user={user}>{children}</AppShell>;
}
