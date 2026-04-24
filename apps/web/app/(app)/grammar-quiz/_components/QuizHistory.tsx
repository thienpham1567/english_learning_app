"use client";

import { Drawer, Empty, Flex, Tag, Typography } from "antd";

const { Text } = Typography;

const HISTORY_KEY = "grammar-quiz-history";

export type QuizHistoryEntry = {
  date: string;
  level: string;
  score: number;
  total: number;
};

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: "A1–A2", color: "var(--accent)" },
  medium: { label: "B1–B2", color: "var(--secondary)" },
  hard: { label: "C1–C2", color: "var(--tertiary)" },
};

export function saveQuizHistory(entry: Omit<QuizHistoryEntry, "date">) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: QuizHistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift({ ...entry, date: new Date().toISOString() });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
  } catch {
    // silently ignore storage errors
  }
}

function getQuizHistory(): QuizHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
};

export function QuizHistory({ open, onClose }: Props) {
  const history = open ? getQuizHistory() : [];

  return (
    <Drawer
      title="Lịch sử làm bài"
      open={open}
      onClose={onClose}
      size="default"
      styles={{ body: { padding: "12px 16px" } }}
    >
      {history.length === 0 ? (
        <Empty description="Chưa có lịch sử" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Flex vertical gap={8}>
          {history.map((entry, i) => {
            const pct = entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0;
            const levelInfo = LEVEL_LABELS[entry.level] ?? { label: entry.level, color: "var(--text-muted)" };
            return (
              <div
                key={`${entry.date}-${i}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  padding: "10px 14px",
                }}
              >
                <Flex vertical gap={2}>
                  <Flex align="center" gap={6}>
                    <Tag
                      style={{
                        margin: 0,
                        fontSize: 11,
                        fontWeight: 600,
                        borderColor: levelInfo.color,
                        color: levelInfo.color,
                      }}
                    >
                      {levelInfo.label}
                    </Tag>
                    <Text strong style={{ fontSize: 14 }}>
                      {entry.score}/{entry.total}
                    </Text>
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatDate(entry.date)}
                  </Text>
                </Flex>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: pct >= 70 ? "color-mix(in srgb, var(--success) 8%, var(--surface))" : pct >= 50 ? "color-mix(in srgb, var(--warning) 8%, var(--surface))" : "var(--error-bg)",
                    border: `1px solid ${pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)"}`,
                    fontSize: 12,
                    fontWeight: 700,
                    color: pct >= 70 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)",
                  }}
                >
                  {pct}%
                </div>
              </div>
            );
          })}
        </Flex>
      )}
    </Drawer>
  );
}
