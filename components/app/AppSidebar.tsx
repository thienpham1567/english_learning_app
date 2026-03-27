"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, MessageCircleMore } from "lucide-react";
import { motion } from "motion/react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <motion.div
          className="app-sidebar__badge"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap size={20} strokeWidth={2} />
        </motion.div>
        <div className="app-sidebar__brand-text">
          <p className="app-sidebar__eyebrow">Trợ lý học tập</p>
          <h1 className="app-sidebar__title">Tiếng Anh</h1>
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
    </aside>
  );
}
