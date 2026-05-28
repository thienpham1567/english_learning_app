import Link from "next/link";
import { Card } from "@/components/ui/card";

export interface QuickLinkCardProps {
  href: string;
  emoji: string;
  label: string;
  desc: string;
  className?: string;
}

/**
 * Shared card for navigation shortcuts across the app.
 * Uses the Neo-Brutalist Card with interactive shadow (hard-offset).
 */
export function QuickLinkCard({ href, emoji, label, desc, className }: QuickLinkCardProps) {
  return (
    <Link href={href} className={`block no-underline ${className ?? ""}`}>
      <Card
        interactive
        shadowSize="md"
        className="flex flex-row items-center gap-3.5 rounded-2xl py-3.5 px-4 bg-surface"
      >
        <span className="text-2xl">{emoji}</span>
        <div>
          <div className="font-extrabold text-ink text-[13.5px]">{label}</div>
          <div className="text-[11px] text-text-muted font-semibold">{desc}</div>
        </div>
      </Card>
    </Link>
  );
}
