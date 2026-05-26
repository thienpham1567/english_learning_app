"use client";

import { Drawer, Empty } from "antd";
import * as m from "motion/react-client";

export type QuizHistoryEntry = {
  date: string;
  level: string;
  score: number;
  total: number;
};

const LEVEL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Cơ bản A1–A2", color: "var(--success)", bg: "rgba(16, 185, 129, 0.08)" },
  medium: { label: "Trung cấp B1–B2", color: "var(--accent)", bg: "var(--accent-light)" },
  hard: { label: "Nâng cao C1–C2", color: "var(--error)", bg: "rgba(239, 68, 68, 0.08)" },
};

const HISTORY_KEY = "grammar-quiz-history";

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
      title={
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: "var(--text-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          Lịch sử làm bài
        </span>
      }
      open={open}
      onClose={onClose}
      width={360}
      styles={{
        body: { padding: "16px", background: "var(--surface)" },
        header: { borderBottom: "1px solid var(--border)", background: "var(--surface)" },
      }}
    >
      <style>{`
        .ant-drawer-content {
          background-color: var(--surface) !important;
        }
        .ant-drawer-header-title .ant-drawer-close {
          color: var(--text-secondary) !important;
        }
      `}</style>

      {history.length === 0 ? (
        <Empty
          description="Chưa có lịch sử làm bài"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ marginTop: 40 }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((entry, i) => {
            const pct = entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0;
            const levelInfo = LEVEL_LABELS[entry.level] ?? {
              label: entry.level,
              color: "var(--text-muted)",
              bg: "var(--surface-alt)",
            };
            return (
              <m.div
                key={`${entry.date}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-alt)",
                  padding: "12px 14px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        color: levelInfo.color,
                        background: levelInfo.bg,
                        padding: "2px 8px",
                        borderRadius: 6,
                      }}
                    >
                      {levelInfo.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                      Đúng {entry.score}/{entry.total}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                    {formatDate(entry.date)}
                  </span>
                </div>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background:
                      pct >= 80
                        ? "rgba(16, 185, 129, 0.08)"
                        : pct >= 50
                          ? "rgba(245, 158, 11, 0.08)"
                          : "rgba(239, 68, 68, 0.08)",
                    border: `1.5px solid ${pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)"}`,
                    fontSize: 12,
                    fontWeight: 800,
                    color:
                      pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)",
                    flexShrink: 0,
                  }}
                >
                  {pct}%
                </div>
              </m.div>
            );
          })}
        </div>
      )}
    </Drawer>
  );
}
