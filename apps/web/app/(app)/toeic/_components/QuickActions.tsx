"use client";

import { Card } from "antd";
import Link from "next/link";
import * as m from "motion/react-client";
import {
  BookOpenText,
  Target,
  Timer,
  Repeat,
  TrendingUp,
  Headphones,
  PenTool,
  BookOpen,
  Type,
  MessageSquare,
  Pencil,
} from "lucide-react";
import type { ComponentType } from "react";

const ACTIONS: Array<{
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  available: boolean;
}> = [
  { href: "/toeic/practice", label: "Practice Tests", icon: BookOpenText, available: true },
  { href: "/toeic/skills", label: "4 Skills", icon: Target, available: true },
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
    <Card title="Quick Actions" size="small">
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        }}
      >
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return a.available ? (
            <m.div key={a.href} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={a.href}
                className="cursor-pointer"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 14,
                  borderRadius: 10,
                  background: "var(--surface-hover)",
                  border: "1px solid var(--border)",
                  color: "var(--ink)",
                  textDecoration: "none",
                  textAlign: "center",
                  transition: "background 0.2s, border-color 0.2s",
                }}
              >
                <Icon size={20} className="text-accent" />
                <div style={{ fontSize: 13, fontWeight: 700 }}>{a.label}</div>
              </Link>
            </m.div>
          ) : (
            <div
              key={a.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: 14,
                borderRadius: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                textAlign: "center",
                cursor: "not-allowed",
              }}
              title="Coming Soon"
            >
              <Icon size={20} />
              <div style={{ fontSize: 13, fontWeight: 700 }}>{a.label}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>Coming Soon</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
