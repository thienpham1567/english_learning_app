"use client";

import { useState, useEffect } from "react";
import type {
  DailyChallenge,
  StreakInfo,
  Badge,
  ExerciseAnswer,
} from "@/lib/daily-challenge/types";
import { StreakDisplay } from "./StreakDisplay";
import { BadgeGallery } from "./BadgeGallery";

type Props = {
  challenge: DailyChallenge;
  streak: StreakInfo;
  badges: Badge[];
};

/** Milliseconds until midnight VN time (UTC+7). */
function msUntilVnMidnight(): number {
  const now = new Date();
  // Get current VN date string, build tomorrow midnight in VN
  const vnToday = now.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const tomorrow = new Date(vnToday + "T00:00:00+07:00");
  tomorrow.setDate(tomorrow.getDate() + 1);
  return Math.max(0, tomorrow.getTime() - now.getTime());
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function CompletedState({ challenge, streak, badges }: Props) {
  const answers = (challenge.answers ?? []) as ExerciseAnswer[];
  const emoji = (challenge.score ?? 0) >= 4 ? "🎉" : "👍";

  const [countdown, setCountdown] = useState(msUntilVnMidnight());

  useEffect(() => {
    const id = setInterval(() => setCountdown(msUntilVnMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <span className="text-5xl">{emoji}</span>
      <h2 className="mt-3 [font-family:var(--font-display)] text-2xl italic text-(--ink)">
        Đã hoàn thành hôm nay!
      </h2>
      <p className="mt-1 text-sm text-(--text-muted)">Điểm: {challenge.score} / 5</p>

      <div className="mt-4">
        <StreakDisplay currentStreak={streak.currentStreak} bestStreak={streak.bestStreak} />
      </div>

      {/* Answer review */}
      <div className="mt-6 w-full space-y-1.5">
        {answers.map((a, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm ${
              a.isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>
              Câu {i + 1}: {a.isCorrect ? "✓" : "✗"}
            </span>
            {!a.isCorrect && <span className="text-xs">{a.explanation}</span>}
          </div>
        ))}
      </div>

      <div className="mt-6 w-full">
        <BadgeGallery badges={badges} />
      </div>

      {/* Countdown to next challenge */}
      <div className="mt-6 rounded-lg bg-(--bg-deep) px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-(--text-muted)">
          Thử thách tiếp theo
        </span>
        <p className="mt-0.5 font-mono text-lg font-bold text-(--accent)">
          {formatCountdown(countdown)}
        </p>
      </div>

      <p className="mt-4 text-sm text-(--text-muted)">Quay lại mai nhé! 🌙</p>
    </div>
  );
}
