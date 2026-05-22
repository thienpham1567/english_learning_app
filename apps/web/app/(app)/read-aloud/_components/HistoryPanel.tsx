"use client";

import { Flex, Typography, message } from "antd";
import {
  HistoryOutlined,
  DeleteOutlined,
  CloseOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import type { HistoryEntry } from "../_hooks/useHistory";
import { timeAgo } from "../_hooks/useHistory";
import { isCached } from "../_hooks/useAudioPlayback";
import { VOICES } from "../_data/voices";

const { Text } = Typography;

interface HistoryPanelProps {
  history: HistoryEntry[];
  show: boolean;
  onClose: () => void;
  onReplay: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryPanel({ history, show, onClose, onReplay, onDelete, onClearAll }: HistoryPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ overflow: "hidden" }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "var(--space-5)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {/* History header */}
            <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
              <Flex align="center" gap={8}>
                <HistoryOutlined style={{ color: "var(--accent)", fontSize: 16 }} />
                <Text style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                  Lịch sử đã nghe ({history.length})
                </Text>
              </Flex>
              <Flex gap={8}>
                {history.length > 0 && (
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClearAll}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "5px 12px",
                      borderRadius: 8,
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      background: "rgba(239, 68, 68, 0.06)",
                      color: "var(--error)",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    <DeleteOutlined style={{ fontSize: 11 }} />
                    Xóa tất cả
                  </m.button>
                )}
                <m.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  style={{
                    display: "grid",
                    placeItems: "center",
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--surface-alt)",
                    color: "var(--text-muted)",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  <CloseOutlined />
                </m.button>
              </Flex>
            </Flex>

            {/* History list */}
            {history.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "var(--text-muted)",
                }}
              >
                <HistoryOutlined style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  Chưa có lịch sử nào
                </div>
                <div style={{ fontSize: 11.5, marginTop: 4 }}>
                  Khi bạn nghe đọc, các đoạn văn sẽ được lưu tại đây
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                {history.map((entry, idx) => {
                  const voice = VOICES.find((v) => v.role === entry.voice);
                  const cached = isCached(entry.text, entry.voice, entry.speed);
                  return (
                    <m.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)",
                        background: "var(--surface-alt)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      whileHover={{ x: 3, background: "var(--accent-light)" }}
                      onClick={() => onReplay(entry)}
                    >
                      {/* Voice flag */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {voice?.flag ?? "🗣️"}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: 1.3,
                          }}
                        >
                          {entry.preview}
                        </div>
                        <Flex align="center" gap={8} style={{ marginTop: 3 }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                            {voice?.name ?? entry.voice} · {entry.speed}x · {entry.wordCount} từ
                          </span>
                          <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                            <ClockCircleOutlined style={{ fontSize: 9, marginRight: 3 }} />
                            {timeAgo(entry.createdAt)}
                          </span>
                          {cached && (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 800,
                                padding: "1px 6px",
                                borderRadius: 6,
                                background: "rgba(16, 185, 129, 0.1)",
                                color: "var(--success)",
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
                          message.success("Đã xóa mục lịch sử");
                        }}
                        style={{
                          display: "grid",
                          placeItems: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          background: "transparent",
                          color: "var(--error)",
                          fontSize: 12,
                          cursor: "pointer",
                          flexShrink: 0,
                          opacity: 0.5,
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                        }}
                        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.currentTarget.style.opacity = "0.5";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <DeleteOutlined />
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
