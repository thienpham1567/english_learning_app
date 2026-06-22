import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Override the accent bar color (CSS class) */
  barClassName?: string;
}

/**
 * Soft UI section header with accent bar + uppercase label + divider line.
 * Replaces the copy-pasted `sectionLabelClass` + `accentBarClass` pattern.
 */
export function SectionHeader({ children, className, barClassName }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-widest text-accent mb-4.5 font-display",
        className,
      )}
    >
      <div className={cn("w-[3.5px] h-4 rounded-sm bg-accent shrink-0", barClassName)} />
      <span>{children}</span>
      <div className="flex-1 h-px bg-border ml-2" />
    </div>
  );
}
