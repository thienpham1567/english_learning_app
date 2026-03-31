"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookMarked, BookOpen, Fuel, MessageCircleMore, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip } from "antd";
import { motion } from "motion/react";

const navItems = [
  { href: "/english-chatbot", label: "Trò chuyện", icon: MessageCircleMore },
  { href: "/dictionary", label: "Từ điển", icon: BookOpen },
  { href: "/my-vocabulary", label: "Từ vựng", icon: BookMarked },
  { href: "/fuel-prices", label: "Giá Xăng", icon: Fuel },
];

const navItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.05, duration: 0.3 },
  }),
};

type Props = {
  isExpanded: boolean;
  onToggle: () => void;
};

export function AppSidebar({ isExpanded, onToggle }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={`sticky top-0 z-50 flex h-screen flex-col gap-2 overflow-hidden border-r border-white/40 bg-white/80 backdrop-blur-md shadow-[1px_0_20px_rgba(28,25,23,0.06)] px-4 py-5 transition-[width] duration-300 ${isExpanded ? "w-[264px]" : "w-[72px]"} max-[920px]:relative max-[920px]:h-auto max-[920px]:w-full max-[920px]:flex-row max-[920px]:items-center max-[920px]:gap-4 max-[920px]:border-r-0 max-[920px]:border-b max-[920px]:px-4 max-[920px]:py-3`}
    >
      {/* Logo / toggle header */}
      <div className="flex min-h-14 items-center px-0 pb-3 pt-1 max-[920px]:min-h-0 max-[920px]:shrink-0 max-[920px]:pb-0 max-[920px]:pt-0">
        {isExpanded ? (
          <>
            <motion.div
              aria-hidden="true"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0"
            >
              <Image
                src="/english-logo-app.svg"
                alt="Thien English"
                width={250}
                height={150}
                className="h-10 w-auto rounded-lg"
                priority
              />
            </motion.div>
            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="ml-auto grid size-7 shrink-0 place-items-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--ink)] max-[920px]:hidden"
            >
              <PanelLeftClose size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="mx-auto grid size-7 shrink-0 place-items-center rounded text-[var(--text-muted)] transition-colors hover:text-[var(--ink)] max-[920px]:hidden"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      <div className="h-px bg-[var(--border)] max-[920px]:hidden" />

      <nav
        aria-label="Các mục trong ứng dụng"
        className="flex flex-col gap-2 pt-2 max-[920px]:ml-auto max-[920px]:flex-row max-[920px]:gap-[6px] max-[920px]:p-0 max-[920px]:pt-0 max-[920px]:w-auto"
      >
        {navItems.map(({ href, label, icon: Icon }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          const linkContent = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 overflow-hidden rounded-[var(--radius)] px-3 py-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] max-[920px]:min-h-[38px] max-[920px]:px-[10px]",
                active
                  ? "bg-[rgba(196,109,46,0.12)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-white/50 hover:text-[var(--ink)]",
              ].join(" ")}
            >
              <span className="grid size-5 shrink-0 place-items-center max-[920px]:size-[18px]">
                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              </span>
              <span
                className={[
                  "whitespace-nowrap text-[14px] max-[920px]:text-[13px]",
                  !isExpanded && "hidden max-[920px]:inline",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {label}
              </span>
            </Link>
          );

          return (
            <motion.div
              key={href}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={navItemVariants}
            >
              {!isExpanded ? (
                <Tooltip placement="right" title={label}>
                  {linkContent}
                </Tooltip>
              ) : (
                linkContent
              )}
            </motion.div>
          );
        })}
      </nav>
    </aside>
  );
}
