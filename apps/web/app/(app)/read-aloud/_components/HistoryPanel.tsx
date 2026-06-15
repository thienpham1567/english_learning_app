"use client";

import { Clock, History, Mic, Trash2, X, Zap } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
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
          <Card shadowSize="md" className="p-5 rounded-none shadow-[4px_4px_0_var(--shadow-color)]">
            {/* History header */}
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-accent">◆</span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted">
                  Lịch sử nghe ({history.length})
                </span>
              </div>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <m.button
                    whileHover={{ x: -1, y: -1 }}
                    whileTap={{ x: 0, y: 0 }}
                    onClick={onClearAll}
                    className="flex items-center gap-1 text-error font-mono font-black uppercase tracking-wide cursor-pointer py-1.5 px-3 text-[10px] border-2 border-border bg-error/10 shadow-[2px_2px_0_var(--shadow-color)] hover:shadow-[3px_3px_0_var(--shadow-color)] active:shadow-none"
                  >
                    <Trash2 size={11} />
                    Xoá hết
                  </m.button>
                )}
                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="grid place-items-center w-7 h-7 border-2 border-border bg-surface-alt text-text-muted text-xs cursor-pointer shadow-[2px_2px_0_var(--shadow-color)] active:shadow-none"
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
                      whileHover={{ x: -1, y: -1 }}
                      onClick={() => onReplay(entry)}
                      className="flex items-center gap-3 border-2 border-border bg-surface-alt cursor-pointer py-3 px-3.5 shadow-[2px_2px_0_var(--shadow-color)] transition-all duration-150 hover:bg-accent-light hover:shadow-[3px_3px_0_var(--shadow-color)]"
                    >
                      {/* Voice flag */}
                      <div className="w-9 h-9 bg-surface border-2 border-border grid place-items-center text-lg shrink-0">
                        {voice?.flag ?? <Mic className="h-4 w-4 text-text-secondary" />}
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
                            <span className="font-black font-mono uppercase text-success text-[9px] py-px px-1.5 bg-success/10 border-2 border-success/30 inline-flex items-center gap-0.5">
                              <Zap className="h-2.5 w-2.5 fill-success text-success" /> Cached
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
                        className="grid place-items-center w-7 h-7 bg-surface text-error text-xs cursor-pointer shrink-0 border-2 border-border opacity-50 hover:opacity-100 hover:bg-error/10 transition-all duration-150"
                      >
                        <Trash2 />
                      </m.button>
                    </m.div>
                  );
                })}
              </div>
            )}
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
}
