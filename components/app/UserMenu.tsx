"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/app/AppShell";

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="user-menu__avatar"
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

  return <div className="user-menu__initials">{initials}</div>;
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
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <UserAvatar user={user} />
        <span className="user-menu__name">{user.name}</span>
        <ChevronDown
          size={14}
          className={`user-menu__chevron ${open ? "is-open" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-menu__dropdown"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <button
              className="user-menu__item"
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
