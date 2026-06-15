"use client";

import {
  BookOpen,
  BookOpenText,
  Headphones,
  MessageSquare,
  Pencil,
  PenTool,
  Repeat,
  Target,
  Timer,
  TrendingUp,
  Type,
} from "lucide-react";
import * as m from "motion/react-client";
import Link from "next/link";
import type { ComponentType } from "react";
import { Card } from "@/components/ui/card";

const ACTIONS: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  available: boolean;
}> = [
  { href: "/toeic/practice", label: "Practice Tests", icon: BookOpenText, available: true },
  { href: "/toeic/mock-test", label: "Mock Test", icon: Timer, available: true },
  { href: "/toeic/review", label: "Review Errors", icon: Repeat, available: true },
  { href: "/toeic/progress", label: "Progress", icon: TrendingUp, available: true },
  { href: "/toeic/listening", label: "Listening Hub", icon: Headphones, available: true },
  { href: "/toeic/dictation", label: "Dictation", icon: PenTool, available: true },
  { href: "/toeic/grammar", label: "Grammar Drills", icon: BookOpen, available: true },
  { href: "/toeic/vocab", label: "Vocabulary", icon: Type, available: true },
  { href: "/toeic/speaking", label: "Speaking 1-1", icon: MessageSquare, available: true },
  { href: "/toeic/writing", label: "Writing 1-1", icon: Pencil, available: true },
];

export function QuickActions() {
  return (
    <Card shadowSize="sm" className="p-4">
      <div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return a.available ? (
            <m.div key={a.href} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={a.href}
                className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-surface-hover border-2 border-border text-ink no-underline text-center cursor-pointer transition-all duration-200 hover:border-accent"
              >
                <Icon size={20} className="text-accent" />
                <div className="text-[13px] font-bold">{a.label}</div>
              </Link>
            </m.div>
          ) : (
            <div
              key={a.href}
              className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl bg-surface border-2 border-border text-text-muted text-center cursor-not-allowed"
              title="Coming Soon"
            >
              <Icon size={20} />
              <div className="text-[13px] font-bold">{a.label}</div>
              <div className="text-xs opacity-60">Coming Soon</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
