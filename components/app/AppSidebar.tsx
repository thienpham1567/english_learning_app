"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, MessageCircleMore } from "lucide-react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện tiếng Anh", icon: MessageCircleMore },
  { href: "/co-lanh-dictionary", label: "Từ điển Cô Lành", icon: BookOpen },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <div className="app-sidebar__badge" aria-hidden="true">
          CM
        </div>
        <div className="app-sidebar__brand-text">
          <p className="app-sidebar__eyebrow">Ứng dụng học tiếng Anh</p>
          <h1 className="app-sidebar__title">Cô Minh Studio</h1>
        </div>
      </div>

      <nav className="app-sidebar__nav" aria-label="Các mục trong ứng dụng">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={active ? "app-sidebar__link is-active" : "app-sidebar__link"}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
