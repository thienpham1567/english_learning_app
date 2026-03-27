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
    <aside className="group/sidebar sticky top-0 z-10 flex h-screen w-[72px] flex-col gap-2 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 transition-[width] duration-300 hover:w-[264px] hover:shadow-[var(--shadow-lg)]">
      <div className="flex min-h-14 items-center gap-3 overflow-hidden px-0 pb-3 pt-1">
        <motion.div
          className="grid size-10 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--ink)] text-white"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap size={20} strokeWidth={2} />
        </motion.div>
        <div className="min-w-0 translate-x-[-8px] whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Trợ lý học tập</p>
          <h1 className="m-0 text-lg font-semibold [font-family:var(--font-display)] text-[var(--ink)]">Tiếng Anh</h1>
        </div>
      </div>

      <div className="h-px bg-[var(--border)]" />

      <nav aria-label="Các mục trong ứng dụng" className="flex flex-col gap-2 pt-2">
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
                className={[
                  "flex items-center gap-3 overflow-hidden rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                <span className="grid size-5 shrink-0 place-items-center">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:opacity-100">
                  {label}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
