"use client";

import { usePathname } from "next/navigation";

const BREADCRUMBS: Record<string, { eyebrow: string; title: string }> = {
  "/english-chatbot": { eyebrow: "Trợ lý học tập", title: "Trò chuyện" },
  "/co-lanh-dictionary": { eyebrow: "Từ điển", title: "Cô Lãnh" },
  "/my-vocabulary": { eyebrow: "Từ vựng của tôi", title: "Từ vựng" },
};

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? null;
  if (!crumb) return null;

  return (
    <div className="flex flex-col justify-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] leading-none">
        {crumb.eyebrow}
      </p>
      <h2 className="mt-0.5 text-sm font-semibold leading-snug text-[var(--ink)]">
        {crumb.title}
      </h2>
    </div>
  );
}
