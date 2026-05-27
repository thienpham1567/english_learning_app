"use client";

import { Flex, message, Typography } from "antd";
import { Clock, History, Trash2, X } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { VOICES } from "../_data/voices";
import { isCached } from "../_hooks/useAudioPlayback";
import type { HistoryEntryCompat as HistoryEntry } from "../_hooks/useHistory";
import { timeAgo } from "../_hooks/useHistory";

const { Text } = Typography;

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
          <div
            className="bg-(--surface) rounded-(--radius-xl) border-2 border-border"
            style={{ padding: "var(--space-5)", boxShadow: "var(--shadow-md)" }}
          >
            {/* History header */}
            <Flex align="center" justify="space-between" className="mb-4">
              <Flex align="center" gap={8}>
                <History className="text-accent text-base" />
                <Text className="text-sm font-extrabold text-text-primary">
                  Listening History ({history.length})
                </Text>
              </Flex>
              <Flex gap={8}>
                {history.length > 0 && (
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClearAll}
                    className="flex items-center gap-1 rounded-lg text-destructive font-bold cursor-pointer font-body"
                    style={{
                      padding: "5px 12px",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      background: "rgba(239, 68, 68, 0.06)",
                      fontSize: 11.5,
                    }}
                  >
                    <Trash2 size={11} />
                    Clear All
                  </m.button>
                )}
                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="grid w-[28px] h-[28px] rounded-lg border-2 border-border bg-surface-alt text-text-muted text-xs cursor-pointer"
                  style={{ placeItems: "center" }}
                >
                  <X />
                </m.button>
              </Flex>
            </Flex>

            {/* History list */}
            {history.length === 0 ? (
              <div className="text-center text-text-muted" style={{ padding: "32px 16px" }}>
                <History className="text-[28px] mb-2" style={{ opacity: 0.4 }} />
                <div className="text-[13px] font-semibold">No history yet</div>
                <div className="mt-1" style={{ fontSize: 11.5 }}>
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
                      className="flex items-center gap-3 rounded-(--radius-lg) border-2 border-border bg-surface-alt cursor-pointer"
                      style={{ padding: "12px 14px", transition: "all 0.15s" }}
                    >
                      {/* Voice flag */}
                      <div
                        className="w-[36px] h-[36px] bg-(--surface) border-2 border-border grid text-lg shrink-0"
                        style={{ borderRadius: 10, placeItems: "center" }}
                      >
                        {voice?.flag ?? "🗣️"}
                      </div>

                      {/* Content */}
                      <div className="flex-1 w-[0px]">
                        <div
                          className="font-bold text-text-primary overflow-hidden"
                          style={{
                            fontSize: 13.5,
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            lineHeight: 1.3,
                          }}
                        >
                          {entry.preview}
                        </div>
                        <Flex align="center" gap={8} style={{ marginTop: 3 }}>
                          <span className="text-[11px] text-text-muted font-semibold">
                            {voice?.name ?? entry.voice} · {entry.speed}x · {entry.wordCount} words
                          </span>
                          <span className="text-[10.5px] text-text-muted">
                            <Clock className="text-[9px]" style={{ marginRight: 3 }} />
                            {timeAgo(entry.createdAt)}
                          </span>
                          {cached && (
                            <span
                              className="font-extrabold rounded-md text-emerald-500"
                              style={{
                                fontSize: 9.5,
                                padding: "1px 6px",
                                background: "rgba(16, 185, 129, 0.1)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                              }}
                            >
                              ⚡ Cached
                            </span>
                          )}
                        </Flex>
                      </div>

                      {/* Delete button */}
                      <m.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(entry.id);
                          message.success("Deleted history entry");
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.opacity = "0.5";
                          e.currentTarget.style.background = "transparent";
                        }}
                        className="grid w-[28px] h-[28px] rounded-lg bg-transparent text-destructive text-xs cursor-pointer shrink-0"
                        style={{
                          placeItems: "center",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          opacity: 0.5,
                          transition: "opacity 0.15s",
                        }}
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
