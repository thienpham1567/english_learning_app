"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/shared/AppShell";
import * as m from "motion/react-client";
import { ChevronDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <m.button
          whileHover={{ background: "var(--bg-deep)" }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 4,
            height: 40,
            paddingLeft: 6,
            paddingRight: 14,
            background: "var(--surface)",
            border: "var(--brutal-border)",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm)",
            transition: "background 0.2s",
          }}
        >
          <m.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  objectFit: "cover",
                  border: "2px solid var(--border)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 2,
                  background: "var(--accent)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  border: "2px solid var(--border)",
                }}
              >
                {initials}
              </div>
            )}
          </m.div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            {user.name}
          </span>
          <ChevronDown style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 2 }} />
        </m.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-2 border-[var(--border)] shadow-[var(--shadow)]">
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
