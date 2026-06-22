"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Card } from "@/components/ui/card";

type Props = {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  boxed?: boolean;
};

export function PageHeader({ title, subtitle, icon, backHref, actions, boxed = false }: Props) {
  if (boxed) {
    return (
      <Card
        shadowSize="sm"
        className="w-full mb-5 flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 shrink-0 bg-surface"
      >
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref} className="no-underline">
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-hover hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
          )}

          {icon && (
            <div className="w-12 h-12 rounded-2xl border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}

          <div className="flex flex-col">
            <h1 className="m-0 text-xl md:text-2xl font-bold font-display text-ink tracking-tight">
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
      </Card>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref} className="no-underline">
            <button
              type="button"
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-surface text-text-primary hover:bg-surface-hover hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
        )}

        {icon && (
          <div className="w-12 h-12 rounded-2xl border border-border bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}

        <div className="flex flex-col">
          <h1 className="m-0 text-xl md:text-2xl font-bold font-display text-ink tracking-tight">
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
