"use client";

import * as m from "motion/react-client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/toeic", label: "Overview" },
  { href: "/toeic/practice", label: "Practice" },
  { href: "/toeic/skills", label: "Skills" },
];

export function SubNav() {
  const pathname = usePathname();

  return (
    <m.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-center gap-1.5 pt-3 px-6 pb-1 overflow-x-auto shrink-0"
    >
      <div className="flex gap-1 bg-surface border-2 border-border rounded-xl p-1 shadow-sm w-fit">
        {TABS.map((t) => {
          const active =
            pathname === t.href || (t.href !== "/toeic" && pathname?.startsWith(t.href));
          return (
            <m.div key={t.href} whileTap={{ scale: 0.97 }}>
              <Link
                href={t.href}
                className={`block px-4 py-1.5 rounded-lg font-extrabold no-underline whitespace-nowrap text-xs transition-all duration-200 ${
                  active
                    ? "bg-accent text-[var(--text-on-accent)]"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {t.label}
              </Link>
            </m.div>
          );
        })}
      </div>
    </m.nav>
  );
}
