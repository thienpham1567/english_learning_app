"use client";

import {
  BarChart3,
  ChevronRight,
  Flame,
  Frown,
  Meh,
  RefreshCw,
  Smile,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CelebrationOverlay, StreakFire } from "@/components/shared";
import { useDashboard } from "@/hooks/useDashboard";
import { Card } from "@/components/ui/card";

type Props = {
  totalReviewed: number;
  averageQuality: number;
  forgottenCount: number;
  againCount: number;
  hardCount: number;
  goodCount: number;
  easyCount: number;
  onRestart?: () => void;
};

const DISTRIBUTION_ITEMS = [
  { key: "easy", label: "Easy", icon: <ThumbsUp />, color: "var(--success)" },
  { key: "good", label: "Good", icon: <Smile />, color: "var(--accent)" },
  { key: "hard", label: "Hard", icon: <Meh />, color: "var(--warning)" },
  { key: "again", label: "Forgot", icon: <Frown />, color: "var(--error)" },
];

function useSummaryContext() {
  const { state } = useDashboard();
  if (state.status !== "ready") return { streak: 0, dailyChallengeCompleted: false };
  return {
    streak: state.data.streak?.currentStreak ?? 0,
    dailyChallengeCompleted: state.data.dailyChallenge?.completed ?? false,
  };
}

export function SessionSummary({
  totalReviewed,
  averageQuality,
  forgottenCount,
  againCount,
  hardCount,
  goodCount,
  easyCount,
  onRestart,
}: Props) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(true);
  const { streak, dailyChallengeCompleted } = useSummaryContext();

  const counts: Record<string, number> = {
    easy: easyCount,
    good: goodCount,
    hard: hardCount,
    again: againCount,
  };

  return (
    <>
      <CelebrationOverlay
        tier="medium"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      >
        <h3
          className="m-0 text-xl font-extrabold flex items-center gap-2"
          style={{ color: "var(--text-on-accent)", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
        >
          <Trophy /> Session Completed!
        </h3>
      </CelebrationOverlay>

      <div className="anim-scale-in w-full max-w-[500px] mx-auto flex flex-col gap-5">
        {/* Streak & Hero banner */}
        <Card
          shadowSize="sm"
          className="text-center relative overflow-hidden flex flex-col items-center gap-3 py-8 px-6 rounded-xl"
          style={{
            background:
              "color-mix(in srgb, var(--accent) 8%, var(--surface))",
          }}
        >
          {/* Ambient glow behind streak */}
          <div
            className="absolute w-[220px] h-[220px] left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--accent) 12%, transparent 70%)",
            }}
          />

          <div className="relative z-[1]">
            <StreakFire streak={streak} />
          </div>

          <h3 className="mt-3 mb-1 font-black text-text-primary text-xl z-[1]">
            Session Completed!
          </h3>
          <p className="text-sm text-text-secondary font-medium m-0 z-[1]">
            You successfully reviewed{" "}
            <span className="text-accent-active font-bold">{totalReviewed}</span> vocabulary cards
            today.
          </p>
        </Card>

        {/* Stats Grid cards */}
        <div className="flex gap-3 w-full">
          {[
            { label: "Reviewed", value: totalReviewed, color: "var(--accent-active)" },
            {
              label: "Average Quality",
              value: `${averageQuality.toFixed(1)}/5`,
              color: "var(--xp)",
            },
            {
              label: "Forgot",
              value: forgottenCount,
              color: forgottenCount > 0 ? "var(--error)" : "var(--success)",
            },
          ].map((stat, idx) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              className="flex-1"
            >
              <Card shadowSize="sm" className="text-center py-4 px-3 bg-surface rounded-lg">
                <div
                  className="text-2xl font-black font-display leading-none"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] text-text-muted font-bold mt-1">{stat.label}</div>
              </Card>
            </m.div>
          ))}
        </div>

        {/* Distribution card */}
        {totalReviewed > 0 && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card shadowSize="sm" className="bg-surface py-4.5 px-5 rounded-xl gap-4">
              <span className="text-[13px] font-extrabold text-text-primary flex items-center gap-1.5">
                <BarChart3 className="text-accent-active" />
                Retention Distribution
              </span>
              <div className="flex gap-3">
                {DISTRIBUTION_ITEMS.map((item) => {
                  const count = counts[item.key] ?? 0;
                  const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
                  return (
                    <div key={item.key} className="flex-1 flex flex-col items-center gap-1.5">
                      {/* Custom vertical bar graph */}
                      <div className="w-2 h-[52px] rounded-full relative overflow-hidden flex flex-col justify-end bg-border">
                        <m.div
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="w-full rounded-full"
                          style={{ background: item.color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-text-primary">{count}</span>
                      <span className="text-[11px] text-text-muted font-semibold">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </m.div>
        )}

        {/* Daily challenge prompt */}
        {!dailyChallengeCompleted && (
          <m.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push("/daily-challenge")}
            className="text-left border-none bg-transparent cursor-pointer p-0 block w-full font-body"
          >
            <Card
              shadowSize="sm"
              className="flex-row items-center gap-3.5 py-4 px-5 rounded-xl text-left"
              style={{
                background:
                  "color-mix(in srgb, var(--accent) 6%, var(--surface))",
                border: "2px solid color-mix(in srgb, var(--accent) 15%, var(--border))",
              }}
            >
              <div className="w-11 h-11 rounded-full grid shrink-0 place-items-center bg-[color-mix(in srgb, var(--warning) 8%, transparent)]">
                <Flame className="text-2xl text-[var(--xp)]" />
              </div>
              <div className="flex-1">
                <h4 className="m-0 text-sm font-extrabold text-text-primary">Daily Challenge</h4>
                <p className="m-0 text-xs text-text-muted font-medium">
                  Complete today's challenge to maintain your streak!
                </p>
              </div>
              <ChevronRight className="text-xs text-accent-active" />
            </Card>
          </m.button>
        )}

        {/* Actions button */}
        {onRestart && (
          <m.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="h-12 rounded-lg border-2 border-border text-[15px] font-extrabold cursor-pointer flex items-center justify-center gap-2 mt-2.5 text-[var(--text-on-accent)] shadow-sm"
            style={{
              background: "var(--accent)",
            }}
          >
            <RefreshCw size={13} />
            Start New Review Session
          </m.button>
        )}
      </div>
    </>
  );
}
