"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  boxed?: boolean;
};

export function PageHeader({ title, subtitle, icon, backHref, actions, boxed = false }: Props) {
  const containerClass = boxed
    ? "w-full bg-surface border-2 border-border rounded-2xl shadow-sm p-5 md:p-6 mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0"
    : "w-full bg-surface border-b-2 border-border px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} className="no-underline">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl border-2 border-border bg-surface text-text-primary hover:bg-surface-hover hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
        )}

        {icon && (
          <div className="w-12 h-12 rounded-2xl border-2 border-border bg-accent text-text-on-accent flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
        )}

        <div className="flex flex-col">
          <h1 className="m-0 text-xl md:text-2xl font-black font-display text-ink tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="m-0 mt-1 text-xs md:text-sm text-text-muted font-medium font-sans">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
