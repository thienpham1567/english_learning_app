"use client";

import { ClipboardList, X } from "lucide-react";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

export type QuizHistoryEntry = {
  date: string;
  level: string;
  score: number;
  total: number;
};

const LEVEL_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: "Basic A1–A2", color: "var(--success)", bg: "color-mix(in srgb, var(--success) 8%, transparent)" },
  medium: { label: "Intermediate B1–B2", color: "var(--accent)", bg: "var(--accent-light)" },
  hard: { label: "Advanced C1–C2", color: "var(--error)", bg: "color-mix(in srgb, var(--error) 8%, transparent)" },
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
  return d.toLocaleDateString("en-US", {
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[900] bg-black/50"
          />

          {/* Sheet */}
          <m.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-[min(360px,90vw)] z-[901] bg-surface border-l-2 border-border shadow-lg flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border shrink-0">
              <h3 className="text-base font-black text-text-primary font-display m-0">
                Quiz History
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg grid place-items-center border-none bg-transparent text-text-muted cursor-pointer hover:bg-surface-alt hover:text-ink transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 mt-10 text-center">
                  <ClipboardList className="w-8 h-8 text-text-muted" />
                  <p className="text-sm text-text-muted">No quiz history found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {history.map((entry, i) => {
                    const pct = entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0;
                    const levelInfo = LEVEL_LABELS[entry.level] ?? {
                      label: entry.level,
                      color: "var(--text-muted)",
                      bg: "var(--surface-alt)",
                    };
                    const scoreColor =
                      pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)";
                    const scoreBg =
                      pct >= 80
                        ? "color-mix(in srgb, var(--success) 8%, transparent)"
                        : pct >= 50
                          ? "color-mix(in srgb, var(--warning) 8%, transparent)"
                          : "color-mix(in srgb, var(--error) 8%, transparent)";
                    return (
                      <m.div
                        key={`${entry.date}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between rounded-lg border-2 border-border bg-surface-alt py-3 px-3.5 shadow-sm"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[10.5px] font-extrabold py-0.5 px-2 rounded-md"
                              style={{ color: levelInfo.color, background: levelInfo.bg }}
                            >
                              {levelInfo.label}
                            </span>
                            <span className="text-sm font-extrabold text-text-primary">
                              {entry.score}/{entry.total} Correct
                            </span>
                          </div>
                          <span className="text-[11px] text-text-muted font-medium">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        <div
                          className="w-[38px] h-[38px] rounded-lg grid place-items-center text-xs font-extrabold shrink-0"
                          style={{
                            background: scoreBg,
                            border: `1.5px solid ${scoreColor}`,
                            color: scoreColor,
                          }}
                        >
                          {pct}%
                        </div>
                      </m.div>
                    );
                  })}
                </div>
              )}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
