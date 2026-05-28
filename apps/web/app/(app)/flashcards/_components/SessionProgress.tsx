"use client";

import * as m from "motion/react-client";
import { useEffect, useState } from "react";

const DEFAULT_SECONDS_PER_CARD = 12;

type Props = {
  current: number;
  total: number;
  startTime?: number; // timestamp when session started
};

export function SessionProgress({ current, total, startTime }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const [now, setNow] = useState<number | null>(null);

  // Update "now" every 10s for time estimate (avoids impure Date.now during render)
  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Calculate estimated time remaining
  let timeLabel = "";
  if (total > 0) {
    const remaining = total - current;
    let avgMs: number;
    if (startTime && current > 0 && now !== null) {
      avgMs = (now - startTime) / current;
    } else {
      avgMs = DEFAULT_SECONDS_PER_CARD * 1000;
    }
    const minutesLeft = Math.ceil((remaining * avgMs) / 60000);
    timeLabel = ` · ~${minutesLeft}m remaining`;
  }

  return (
    <div className="w-full mb-5">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[13px] font-bold text-text-secondary">
          Reviewing: <span className="text-accent-active">{current}</span> / {total}
        </span>
        <span className="text-[12.5px] font-semibold text-text-muted">{timeLabel}</span>
      </div>

      {/* Modern custom animated progress bar */}
      <div className="h-1.5 bg-border rounded-full relative overflow-hidden">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          className="absolute left-0 top-0 bottom-0 rounded-full shadow-[0_0_6px_var(--accent)]"
          style={{
            background: "linear-gradient(90deg, var(--accent), var(--xp))",
          }}
        />
      </div>
    </div>
  );
}
