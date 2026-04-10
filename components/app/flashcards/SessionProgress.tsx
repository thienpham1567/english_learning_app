"use client";

import { Progress } from "antd";

type Props = {
  current: number;
  total: number;
};

export function SessionProgress({ current, total }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ flex: 1 }}>
        <Progress
          percent={pct}
          showInfo={false}
          strokeColor={{ from: "var(--accent)", to: "#f59e0b" }}
          size="small"
        />
      </div>
      <span
        style={{ flexShrink: 0, fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}
      >
        {current} / {total}
      </span>
    </div>
  );
}
