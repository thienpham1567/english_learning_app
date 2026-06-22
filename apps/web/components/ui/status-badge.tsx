import * as React from "react";
import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  accent: "bg-accent-light text-accent-active border-accent/20",
  success: "bg-success-bg text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  muted: "bg-bg-deep text-text-muted border-border",
  info: "bg-info/10 text-info border-info/20",
} as const;

type BadgeVariant = keyof typeof VARIANT_CLASSES;

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

/**
 * Soft UI status badge.
 * Replaces the 25+ copy-pasted `text-[10px] font-extrabold uppercase tracking-widest` patterns.
 */
export function StatusBadge({ variant = "accent", children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
