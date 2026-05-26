"use client";

import { Flex, Typography } from "antd";
import * as m from "motion/react-client";
import { useEffect, useState } from "react";

const { Text } = Typography;

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
    timeLabel = ` · ~${minutesLeft} phút còn lại`;
  }

  return (
    <div style={{ width: "100%", marginBottom: 20 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
          Đang ôn tập: <span style={{ color: "var(--accent)" }}>{current}</span> / {total}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>
          {timeLabel}
        </span>
      </Flex>

      {/* Modern custom animated progress bar */}
      <div
        style={{
          height: 6,
          background: "var(--border)",
          borderRadius: 99,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 15 }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            background: "linear-gradient(90deg, var(--accent), var(--xp))",
            borderRadius: 99,
            boxShadow: "0 0 6px var(--accent)",
          }}
        />
      </div>
    </div>
  );
}
