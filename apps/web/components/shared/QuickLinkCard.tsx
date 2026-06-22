import Link from "next/link";
import type { ElementType } from "react";
import { Card } from "@/components/ui/card";

export interface QuickLinkCardProps {
  href: string;
  emoji?: string;
  icon?: ElementType;
  label: string;
  desc: string;
  className?: string;
}

/**
 * Shared card for navigation shortcuts across the app.
 * Uses the Soft UI Card with interactive shadow lift.
 */
export function QuickLinkCard({
  href,
  emoji,
  icon: Icon,
  label,
  desc,
  className,
}: QuickLinkCardProps) {
  return (
    <Link href={href} className={`block no-underline ${className ?? ""}`}>
      <Card
        interactive
        shadowSize="md"
        className="flex flex-row items-center gap-3.5 rounded-2xl py-3.5 px-4 bg-surface"
      >
        {Icon ? (
          <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent-active border border-accent/20 grid place-items-center shrink-0">
            <Icon className="h-4.5 w-4.5" />
          </div>
        ) : (
          <span className="text-2xl">{emoji}</span>
        )}
        <div>
          <div className="font-extrabold text-ink text-[13.5px]">{label}</div>
          <div className="text-[11px] text-text-muted font-semibold">{desc}</div>
        </div>
      </Card>
    </Link>
  );
}
