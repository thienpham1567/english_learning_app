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
  if (pathname?.startsWith("/toeic/diagnostic")) return null;

  return (
    <m.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 6,
        padding: "12px 24px 4px",
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: "4px",
          boxShadow: "var(--shadow-sm)",
          width: "fit-content",
        }}
      >
        {TABS.map((t) => {
          const active =
            pathname === t.href || (t.href !== "/toeic" && pathname?.startsWith(t.href));
          return (
            <m.div key={t.href} whileTap={{ scale: 0.97 }}>
              <Link
                href={t.href}
                style={{
                  display: "block",
                  padding: "6px 16px",
                  borderRadius: "var(--radius-lg)",
                  color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent)" : "transparent",
                  fontWeight: 800,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  fontSize: 13,
                  transition: "color 0.2s, background 0.2s",
                }}
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
