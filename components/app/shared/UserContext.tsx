"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { AuthUser } from "@/components/app/shared/AppShell";

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({ user, children }: { user: AuthUser; children: ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within UserProvider");
  return user;
}
