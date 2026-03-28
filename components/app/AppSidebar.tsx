"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, BookOpen, GraduationCap, MessageCircleMore } from "lucide-react";
import { motion } from "motion/react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển", icon: BookOpen },
  { href: "/my-vocabulary", label: "Từ vựng", icon: BookMarked },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="group/sidebar sticky top-0 z-50 flex h-screen w-[72px] flex-col gap-2 overflow-hidden border-r border-[var(--border)] bg-[var(--surface)] px-4 py-5 transition-[width] duration-300 hover:w-[264px] hover:shadow-[var(--shadow-lg)] max-[920px]:relative max-[920px]:h-auto max-[920px]:w-full max-[920px]:flex-row max-[920px]:items-center max-[920px]:gap-4 max-[920px]:border-r-0 max-[920px]:border-b max-[920px]:px-4 max-[920px]:py-3 max-[920px]:hover:w-full max-[920px]:hover:shadow-none">
      <div className="flex min-h-14 items-center gap-3 overflow-hidden px-0 pb-3 pt-1 max-[920px]:min-h-0 max-[920px]:shrink-0 max-[920px]:pb-0 max-[920px]:pt-0">
        <motion.div
          className="grid size-10 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--ink)] text-white"
          aria-hidden="true"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GraduationCap size={20} strokeWidth={2} />
        </motion.div>
        <div className="min-w-0 translate-x-[-8px] whitespace-nowrap opacity-0 transition duration-200 group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 max-[920px]:translate-x-0 max-[920px]:opacity-100">
          <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Trợ lý học tập</p>
          <h1 className="m-0 text-lg font-semibold [font-family:var(--font-display)] text-[var(--ink)]">Tiếng Anh</h1>
        </div>
      </div>

      <div className="h-px bg-[var(--border)] max-[920px]:hidden" />

      <nav aria-label="Các mục trong ứng dụng" className="flex flex-col gap-2 pt-2 max-[920px]:ml-auto max-[920px]:flex-row max-[920px]:gap-[6px] max-[920px]:p-0 max-[920px]:pt-0 max-[920px]:w-auto">
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
                  "flex items-center gap-3 overflow-hidden rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] max-[920px]:min-h-[38px] max-[920px]:px-[10px]",
                  active
                    ? "bg-[var(--accent-light)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]",
                ].join(" ")}
              >
                <span className="grid size-5 shrink-0 place-items-center max-[920px]:size-[18px]">
                  <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className="whitespace-nowrap text-[14px] opacity-0 transition duration-200 translate-x-[-6px] group-hover/sidebar:translate-x-0 group-hover/sidebar:opacity-100 max-[920px]:translate-x-0 max-[920px]:opacity-100 max-[920px]:text-[13px]">
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
