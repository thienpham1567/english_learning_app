"use client";

import { Clock, History, Trash2, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { toast } from "sonner";
import { VOICES } from "../_data/voices";
import { isCached } from "../_hooks/useAudioPlayback";
import type { HistoryEntryCompat as HistoryEntry } from "../_hooks/useHistory";
import { timeAgo } from "../_hooks/useHistory";

interface HistoryPanelProps {
  history: HistoryEntry[];
  show: boolean;
  onClose: () => void;
  onReplay: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({
  history,
  show,
  onClose,
  onReplay,
  onDelete,
  onClearAll,
}: HistoryPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="bg-surface rounded-xl border-2 border-border p-5 shadow-md">
            {/* History header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="text-accent text-base" />
                <span className="text-sm font-extrabold text-text-primary">
                  Listening History ({history.length})
                </span>
              </div>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClearAll}
                    className="flex items-center gap-1 rounded-lg text-destructive font-bold cursor-pointer font-body py-1.5 px-3 text-[11.5px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.06)]"
                  >
                    <Trash2 size={11} />
                    Clear All
                  </m.button>
                )}
                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="grid place-items-center w-7 h-7 rounded-lg border-2 border-border bg-surface-alt text-text-muted text-xs cursor-pointer"
                >
                  <X />
                </m.button>
              </div>
            </div>

            {/* History list */}
            {history.length === 0 ? (
              <div className="text-center text-text-muted py-8 px-4">
                <History className="text-[28px] mb-2 opacity-40" />
                <div className="text-[13px] font-semibold">No history yet</div>
                <div className="mt-1 text-[11.5px]">
                  When you listen to passages, they will appear here
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 h-[380px] overflow-y-auto">
                {history.map((entry, idx) => {
                  const voice = VOICES.find((v) => v.role === entry.voice);
                  const cached = isCached(entry.text, entry.voice, entry.speed);
                  return (
                    <m.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      whileHover={{ x: 3, background: "var(--accent-light)" }}
                      onClick={() => onReplay(entry)}
                      className="flex items-center gap-3 rounded-lg border-2 border-border bg-surface-alt cursor-pointer py-3 px-3.5 transition-all duration-150"
                    >
                      {/* Voice flag */}
                      <div className="w-9 h-9 bg-surface border-2 border-border grid place-items-center text-lg shrink-0 rounded-[10px]">
                        {voice?.flag ?? "🗣️"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-text-primary text-[13.5px] whitespace-nowrap overflow-hidden text-ellipsis leading-tight">
                          {entry.preview}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-text-muted font-semibold">
                            {voice?.name ?? entry.voice} · {entry.speed}x · {entry.wordCount} words
                          </span>
                          <span className="text-[10.5px] text-text-muted inline-flex items-center">
                            <Clock className="text-[9px] mr-0.5" />
                            {timeAgo(entry.createdAt)}
                          </span>
                          {cached && (
                            <span className="font-extrabold rounded-md text-emerald-500 text-[9.5px] py-px px-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                              ⚡ Cached
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <m.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.id);
                          toast.success("Deleted history entry");
                        }}
                        className="grid place-items-center w-7 h-7 rounded-lg bg-transparent text-destructive text-xs cursor-pointer shrink-0 border border-[rgba(239,68,68,0.15)] opacity-50 hover:opacity-100 hover:bg-[rgba(239,68,68,0.08)] transition-all duration-150"
                      >
                        <Trash2 />
                      </m.button>
                    </m.div>
                  );
                })}
              </div>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
