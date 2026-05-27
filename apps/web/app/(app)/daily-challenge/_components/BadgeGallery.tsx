"use client";

import { Flame, Lock, Trophy } from "lucide-react";
import * as m from "motion/react-client";
import type { Badge } from "@/lib/daily-challenge/types";

function BadgeIcon({ name, unlocked }: { name: string; unlocked: boolean }) {
  const iconStyle = {
    color: unlocked ? "var(--xp)" : "var(--text-muted)",
  };
  if (name === "Trophy") return <Trophy className="h-5 w-5" style={iconStyle} />;
  return <Flame className="h-5 w-5" style={iconStyle} />;
}

type Props = { badges: Badge[] };

export function BadgeGallery({ badges }: Props) {
  return (
    <div className="rounded-2xl border-2 border-border bg-surface p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-1.5 mb-2 shrink-0">
        <Trophy className="h-4 w-4 text-accent" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent font-display">
          Achievement Badges
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {badges.map((b) => {
          const unlocked = b.unlocked;
          return (
            <m.div
              key={b.id}
              whileHover={unlocked ? { scale: 1.05, rotate: [0, -1.5, 1.5, -1.5, 0] } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden transition-all duration-100 ${
                unlocked
                  ? "border-accent/30 bg-gradient-to-r from-accent/5 to-surface cursor-default"
                  : "border-border/30 bg-surface-alt opacity-55 cursor-not-allowed"
              }`}
            >
              {/* Badge Icon Container */}
              <div
                className={`w-11 h-11 rounded-full border-2 grid shrink-0 place-items-center shadow-sm mb-2.5 ${
                  unlocked
                    ? "bg-accent/10 border-accent/20"
                    : "bg-border/5 border-border/10"
                }`}
              >
                <BadgeIcon name={b.icon} unlocked={unlocked} />
              </div>

              {/* Text info */}
              <div className="min-w-0 w-full">
                <div
                  className={`text-[11px] font-black leading-tight font-display truncate max-w-full px-1 ${
                    unlocked ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {b.label}
                </div>
                <div className="text-[8px] text-text-muted font-bold tracking-wider mt-1.5 uppercase font-mono leading-none">
                  {b.requiredStreak}-day streak
                </div>
              </div>

              {/* Locked Indicator overlay */}
              {!unlocked && (
                <div className="absolute text-text-muted opacity-45 top-2.5 right-2.5">
                  <Lock className="h-3.5 w-3.5" />
                </div>
              )}
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
