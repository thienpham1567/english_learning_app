"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  History,
  Loader2,
  Mic,
  Pencil,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import type { ListeningHistoryItem } from "@/lib/listening/types";

const MODE_ICONS: Record<string, React.ReactNode> = {
  listening: <Volume2 size={16} />,
  shadowing: <Mic size={16} />,
  dictation: <Pencil size={16} />,
  summarize: <FileText size={16} />,
};

const MODE_LABELS: Record<string, string> = {
  listening: "Listening",
  shadowing: "Shadowing",
  dictation: "Dictation",
  summarize: "Summary",
};

const FILTER_MODES = [
  { value: "all", label: "All" },
  { value: "listening", label: "Listening" },
  { value: "shadowing", label: "Shadowing" },
  { value: "dictation", label: "Dictation" },
  { value: "summarize", label: "Summary" },
];

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US");
}

function scoreColor(score: number | null): string {
  if (score == null) return "text-text-muted";
  if (score >= 80) return "text-[var(--success)]";
  if (score >= 50) return "text-[var(--warning)]";
  return "text-[var(--error)]";
}

type Props = {
  open: boolean;
  onClose: () => void;
  onReplay?: (exerciseId: string) => void;
};

export function HistoryDrawer({ open, onClose, onReplay }: Props) {
  const history = useListeningHistory({ autoFetch: false });
  const [initialized, setInitialized] = useState(false);

  // Fetch on first open
  const handleOpen = useCallback(() => {
    if (!initialized) {
      history.fetchHistory();
      setInitialized(true);
    }
  }, [initialized, history]);

  // Trigger fetch when open changes to true
  if (open && !initialized) {
    handleOpen();
  }

  const totalPages = Math.ceil(history.total / history.pageSize);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-surface border-l-2 border-border z-50 flex flex-col shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between py-4 px-5 border-b-2 border-border shrink-0">
              <div className="flex items-center gap-2 text-base font-black text-text-primary">
                <History size={18} className="text-accent" />
                Listening History
              </div>
              <motion.button
                onClick={onClose}
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-8 h-8 rounded-lg border-2 border-border bg-surface grid place-items-center cursor-pointer hover:bg-surface-hover transition-colors"
              >
                <X size={16} />
              </motion.button>
            </div>

            {/* Filters */}
            <div className="py-3 px-5 flex flex-col gap-2.5 border-b-2 border-border shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-bold uppercase tracking-widest">
                <Filter size={12} /> Filters
              </div>
              {/* Mode pills */}
              <div className="flex gap-1 flex-wrap bg-bg-deep border-2 border-border rounded-lg p-1">
                {FILTER_MODES.map((m) => {
                  const isActive = (history.mode ?? "all") === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => history.setMode(m.value === "all" ? null : m.value)}
                      className={`flex-1 min-w-[60px] py-1.5 px-2 rounded-md text-[11px] font-bold cursor-pointer transition-all duration-100 ${
                        isActive
                          ? "bg-accent text-ink border-2 border-border shadow-sm -translate-y-0.5"
                          : "bg-transparent text-text-secondary hover:bg-surface-hover"
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <select
                  value={history.level ?? "all"}
                  onChange={(e) => history.setLevel(e.target.value === "all" ? null : e.target.value)}
                  className="flex-1 h-8 rounded-lg border-2 border-border bg-surface-alt px-2.5 text-xs font-bold text-ink outline-none focus-visible:shadow-sm transition-all cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
                <motion.button
                  onClick={() => history.setBookmarkedOnly(!history.bookmarkedOnly)}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-1 rounded-lg cursor-pointer text-xs font-bold py-1 px-2.5 border-2 transition-all duration-100 ${
                    history.bookmarkedOnly
                      ? "border-[var(--xp)] bg-[color-mix(in_srgb,var(--xp)_8%,transparent)] text-[var(--xp)]"
                      : "border-border bg-transparent text-text-muted hover:bg-surface-hover"
                  }`}
                >
                  <Star size={12} className={history.bookmarkedOnly ? "fill-current" : ""} />
                  Saved
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto py-3 px-5">
              {history.isLoading && (
                <div className="text-center py-10">
                  <Loader2 className="animate-spin text-accent mx-auto" size={24} />
                  <p className="text-xs text-text-muted mt-2">Loading history...</p>
                </div>
              )}

              {!history.isLoading && history.items.length === 0 && (
                <div className="text-center py-10">
                  <History size={40} className="text-text-muted mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-text-muted font-medium">No listening history yet</p>
                  <p className="text-xs text-text-muted mt-1">Complete exercises to see your history here</p>
                </div>
              )}

              {!history.isLoading && history.items.length > 0 && (
                <div className="flex flex-col gap-2">
                  {history.items.map((item, idx) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      index={idx}
                      onBookmark={(bookmarked) => history.toggleBookmark(item.id, bookmarked)}
                      onReplay={onReplay ? () => onReplay(item.id) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {history.total > history.pageSize && (
              <div className="py-2.5 px-5 text-center border-t-2 border-border shrink-0 flex items-center justify-center gap-2">
                <motion.button
                  onClick={() => history.goToPage(Math.max(1, history.page - 1))}
                  disabled={history.page <= 1}
                  whileHover={history.page > 1 ? { x: -2 } : {}}
                  className={`p-1.5 rounded-lg border-2 border-border ${
                    history.page <= 1 ? "text-border cursor-not-allowed" : "text-text-primary cursor-pointer hover:bg-surface-hover"
                  }`}
                >
                  <ChevronLeft size={14} />
                </motion.button>
                <span className="text-xs font-bold text-text-secondary px-2">
                  {history.page} / {totalPages}
                </span>
                <motion.button
                  onClick={() => history.goToPage(Math.min(totalPages, history.page + 1))}
                  disabled={history.page >= totalPages}
                  whileHover={history.page < totalPages ? { x: 2 } : {}}
                  className={`p-1.5 rounded-lg border-2 border-border ${
                    history.page >= totalPages ? "text-border cursor-not-allowed" : "text-text-primary cursor-pointer hover:bg-surface-hover"
                  }`}
                >
                  <ChevronRight size={14} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── History Card ──

function HistoryCard({
  item,
  index,
  onBookmark,
  onReplay,
}: {
  item: ListeningHistoryItem;
  index: number;
  onBookmark: (bookmarked: boolean) => void;
  onReplay?: () => void;
}) {
  return (
    <motion.div
      onClick={onReplay}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 350, damping: 30 }}
      className={`flex items-center gap-3 border-2 border-border bg-surface py-3 px-3.5 rounded-lg transition-all duration-100 ${
        onReplay ? "cursor-pointer hover:bg-surface-hover hover:shadow-sm hover:-translate-y-0.5" : "cursor-default"
      }`}
    >
      {/* Mode icon */}
      <div className="w-9 h-9 grid shrink-0 rounded-lg bg-accent-muted text-accent place-items-center">
        {MODE_ICONS[item.mode] ?? <Volume2 size={16} />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-extrabold text-accent font-mono rounded-sm py-0.5 px-1.5 bg-accent-muted">
            {item.level}
          </span>
          <span className="text-xs font-bold text-text-primary">
            {MODE_LABELS[item.mode] ?? item.mode}
          </span>
          {item.scriptRevealed && (
            <span className="text-[9px] font-bold py-0.5 px-1 rounded-sm bg-warning-bg text-[var(--warning)]">
              📖
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted">{relativeTime(item.completedAt)}</div>
      </div>

      {/* Score */}
      <div className={`text-lg font-extrabold font-mono w-9 text-right ${scoreColor(item.score)}`}>
        {item.score != null ? `${item.score}%` : "—"}
      </div>

      {/* Bookmark */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          onBookmark(!item.bookmarked);
        }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        className={`bg-transparent border-none cursor-pointer p-1 text-sm transition-colors duration-150 ${
          item.bookmarked ? "text-[var(--xp)]" : "text-border hover:text-text-muted"
        }`}
      >
        <Star size={14} className={item.bookmarked ? "fill-current" : ""} />
      </motion.button>

      {onReplay && <ChevronRight size={12} className="text-text-muted shrink-0" />}
    </motion.div>
  );
}
