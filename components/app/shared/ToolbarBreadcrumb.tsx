"use client";

import { usePathname } from "next/navigation";

const BREADCRUMBS: Record<string, { eyebrow: string; title: string }> = {
  "/english-chatbot": { eyebrow: "Trợ lý học tập", title: "Trò chuyện" },
  "/dictionary": { eyebrow: "Từ điển", title: "Christine Ho" },
  "/my-vocabulary": { eyebrow: "Từ vựng của tôi", title: "Từ vựng" },
  "/fuel-prices": { eyebrow: "Giá xăng dầu", title: "Cây xăng cô Kiều" },
};

export function ToolbarBreadcrumb() {
  const pathname = usePathname();
  const crumb = BREADCRUMBS[pathname] ?? null;
  if (!crumb) return null;

  return (
    <div className="flex flex-col justify-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-(--text-muted) leading-none">
        {crumb.eyebrow}
      </p>
      <h2 className="mt-0.5 text-sm font-semibold leading-snug text-(--ink)">
        {crumb.title}
      </h2>
    </div>
  );
}
