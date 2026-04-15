"use client";

import { useEffect, useState } from "react";
import { Progress, Flex, Typography } from "antd";

const { Text } = Typography;

const DEFAULT_SECONDS_PER_CARD = 12;

type Props = {
  current: number;
  total: number;
  startTime?: number; // timestamp when session started
};

export function SessionProgress({ current, total, startTime }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const [now, setNow] = useState(() => Date.now());

  // Update "now" every 10s for time estimate (avoids impure Date.now during render)
  useEffect(() => {
    if (!startTime) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [startTime, current]);

  // Calculate estimated time remaining
  let timeLabel = "";
  if (total > 0) {
    const remaining = total - current;
    let avgMs: number;
    if (startTime && current > 0) {
      avgMs = (now - startTime) / current;
    } else {
      avgMs = DEFAULT_SECONDS_PER_CARD * 1000;
    }
    const minutesLeft = Math.ceil((remaining * avgMs) / 60000);
    timeLabel = ` · ~${minutesLeft} phút`;
  }

  return (
    <Flex align="center" gap={12} style={{ marginBottom: 24 }}>
      <Flex style={{ flex: 1 }}>
        <Progress
          percent={pct}
          showInfo={false}
          strokeColor={{ from: "var(--accent)", to: "#f59e0b" }}
          size="small"
        />
      </Flex>
      <Text type="secondary" style={{ flexShrink: 0, fontSize: 13, fontWeight: 500 }}>
        {current} of {total}{timeLabel}
      </Text>
    </Flex>
  );
}

