"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/app/shared/AppShell";

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="size-7 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return <div className="grid size-7 place-items-center rounded-full bg-(--ink) text-[10px] font-semibold text-white">{initials}</div>;
}

export function UserMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center gap-2 rounded-full border border-(--border) bg-(--surface) pl-[5px] pr-[10px] py-[5px] text-left shadow-(--shadow-sm) transition hover:border-(--border-strong) hover:bg-(--surface-hover) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <UserAvatar user={user} />
        <span className="text-sm font-medium text-(--ink) max-[920px]:hidden">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-(--text-muted) transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[200] min-w-40 overflow-hidden rounded-(--radius-lg) border border-(--border) bg-(--surface-raised) p-1 shadow-(--shadow-lg)"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="flex w-full items-center gap-2 rounded-(--radius) px-3 py-2 text-sm text-(--text-secondary) transition hover:bg-(--surface-hover) hover:text-(--ink) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent)"
              onClick={handleSignOut}
            >
              <LogOut size={15} />
              <span>Đăng xuất</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
