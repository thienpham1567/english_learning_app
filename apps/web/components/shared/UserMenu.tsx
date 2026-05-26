"use client";

import { ChevronDown, LogOut } from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/components/shared/AppShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

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
          className="flex items-center gap-2.5 rounded h-[40px] bg-(--surface) cursor-pointer"
          style={{
            paddingLeft: 6,
            paddingRight: 14,
            border: "var(--brutal-border)",
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
                className="w-[28px] h-[28px] rounded-sm"
                style={{ objectFit: "cover", border: "2px solid var(--border)" }}
              />
            ) : (
              <div
                className="w-[28px] h-[28px] rounded-sm flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "2px solid var(--border)",
                }}
              >
                {initials}
              </div>
            )}
          </m.div>
          <span className="text-[13px] font-bold text-ink">{user.name}</span>
          <ChevronDown className="text-[10px] text-text-muted" style={{ marginLeft: 2 }} />
        </m.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-2 border-(--border) shadow-(--shadow)">
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
