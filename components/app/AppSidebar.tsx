"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, LogOut, MessageCircleMore } from "lucide-react";
import { motion } from "motion/react";

import { authClient } from "@/lib/auth-client";
import type { AuthUser } from "@/components/app/AppShell";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
];

function UserAvatar({ user }: { user: AuthUser }) {
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name}
        className="app-sidebar__user-avatar"
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

  return <div className="app-sidebar__user-initials">{initials}</div>;
}

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <motion.div
          className="app-sidebar__badge"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          CM
        </motion.div>
        <div className="app-sidebar__brand-text">
          <p className="app-sidebar__eyebrow">Học tiếng Anh</p>
          <h1 className="app-sidebar__title">Cô Minh</h1>
        </div>
      </div>

      <div className="app-sidebar__divider" />

      <nav className="app-sidebar__nav" aria-label="Các mục trong ứng dụng">
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
            >
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? "app-sidebar__link is-active" : "app-sidebar__link"}
              >
                <span className="app-sidebar__link-icon">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="app-sidebar__link-label">{label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User section — pushed to bottom */}
      <div className="app-sidebar__spacer" />
      <div className="app-sidebar__divider" />
      <div className="app-sidebar__user">
        <UserAvatar user={user} />
        <div className="app-sidebar__user-info">
          <span className="app-sidebar__user-name">{user.name}</span>
          <button
            className="app-sidebar__sign-out"
            onClick={handleSignOut}
            title="Đăng xuất"
          >
            <LogOut size={14} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
