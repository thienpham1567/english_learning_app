"use client";

import {
  BookOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
  SyncOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { Skeleton } from "antd";
import * as m from "motion/react-client";
import { parseAsArrayOf, parseAsString, useQueryState, useQueryStates } from "nuqs";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { VocabularyDetailSheet } from "@/app/(app)/my-vocabulary/_components/VocabularyDetailSheet";
import { VocabularyStatsBar } from "@/app/(app)/my-vocabulary/_components/VocabularyStatsBar";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";
import type { Vocabulary } from "@/lib/schemas/vocabulary";

export type VocabularyEntry = {
  id: string;
  query: string;
  saved: boolean;
  lookedUpAt: string;
  headword: string | null;
  level: string | null;
  entryType: Vocabulary["entryType"] | null;
  mastery: "new" | "learning" | "mastered";
};

const ENTRY_TYPE_LABELS: Record<Vocabulary["entryType"], string> = {
  word: "Từ / Cụm từ",
  phrasal_verb: "Cụm ĐT",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  A1: {
    bg: "rgba(16, 185, 129, 0.08)",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  A2: {
    bg: "rgba(16, 185, 129, 0.06)",
    color: "var(--success)",
    border: "rgba(16, 185, 129, 0.15)",
  },
  B1: { bg: "var(--accent-light)", color: "var(--accent)", border: "var(--accent-muted)" },
  B2: {
    bg: "rgba(245, 158, 11, 0.08)",
    color: "var(--warning)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  C1: { bg: "rgba(139, 92, 246, 0.08)", color: "var(--xp)", border: "rgba(139, 92, 246, 0.2)" },
  C2: { bg: "rgba(239, 68, 68, 0.08)", color: "var(--error)", border: "rgba(239, 68, 68, 0.2)" },
};

const MASTERY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  new: {
    icon: <StarOutlined style={{ color: "var(--warning)" }} />,
    label: "Mới",
    color: "var(--warning)",
  },
  learning: {
    icon: <SyncOutlined style={{ color: "var(--accent)" }} />,
    label: "Đang học",
    color: "var(--accent)",
  },
  mastered: {
    icon: <CheckCircleOutlined style={{ color: "var(--success)" }} />,
    label: "Thành thạo",
    color: "var(--success)",
  },
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ENTRY_TYPES: Vocabulary["entryType"][] = ["word", "phrasal_verb", "idiom"];
const ENTRY_TYPE_SET = new Set<Vocabulary["entryType"]>(ENTRY_TYPES);

type TabKey = "all" | "saved";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả từ đã tra" },
  { key: "saved", label: "Từ vựng đã lưu ⭐" },
];

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

type PendingDelete = {
  entry: VocabularyEntry;
  index: number;
  timerId: ReturnType<typeof setTimeout>;
};

export default function MyVocabularyPage() {
  const [entries, setEntries] = useState<VocabularyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [selected, setSelected] = useQueryState("selected", parseAsString);
  const [filters, setFilters] = useQueryStates({
    search: parseAsString.withDefault(""),
    level: parseAsArrayOf(parseAsString, ",").withDefault([]),
    type: parseAsArrayOf(parseAsString, ",").withDefault([]),
  });

  const { search, level: levelFilter, type: typeFilter } = filters;
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);
  const sanitizedTypeFilter = typeFilter.filter((type): type is Vocabulary["entryType"] =>
    ENTRY_TYPE_SET.has(type as Vocabulary["entryType"]),
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.get<VocabularyEntry[]>("/vocabulary");
        if (!cancelled) {
          setEntries(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignore load failures and keep the empty state.
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sanitizedTypeFilter.length !== typeFilter.length) {
      void setFilters({ type: sanitizedTypeFilter.length > 0 ? sanitizedTypeFilter : null });
    }
  }, [sanitizedTypeFilter, setFilters, typeFilter.length]);

  useEffect(() => {
    pendingDeleteRef.current = pendingDelete;
  }, [pendingDelete]);

  // Fire pending delete on unmount
  useEffect(() => {
    return () => {
      const pd = pendingDeleteRef.current;
      if (pd) {
        clearTimeout(pd.timerId);
        void api.delete(`/vocabulary/${encodeURIComponent(pd.entry.query)}`).catch(() => {});
      }
    };
  }, []);

  const handleToggleSaved = async (entry: VocabularyEntry) => {
    const next = !entry.saved;
    setEntries((curr) => curr.map((e) => (e.id === entry.id ? { ...e, saved: next } : e)));
    try {
      await api.patch(`/vocabulary/${encodeURIComponent(entry.query)}/saved`, { saved: next });
    } catch {
      setEntries((curr) => curr.map((e) => (e.id === entry.id ? { ...e, saved: !next } : e)));
    }
  };

  const handleDelete = (entry: VocabularyEntry) => {
    if (selected === entry.query) void setSelected(null);

    if (pendingDelete) {
      clearTimeout(pendingDelete.timerId);
      void api
        .delete(`/vocabulary/${encodeURIComponent(pendingDelete.entry.query)}`)
        .catch(() => {});
    }

    const index = entries.findIndex((e) => e.id === entry.id);
    setEntries((curr) => curr.filter((e) => e.id !== entry.id));

    const timerId = setTimeout(() => {
      void api.delete(`/vocabulary/${encodeURIComponent(entry.query)}`).catch(() => {});
      setPendingDelete(null);
    }, 5000);

    setPendingDelete({ entry, index, timerId });
  };

  const handleUndoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timerId);
    setEntries((curr) => {
      const next = [...curr];
      next.splice(pendingDelete.index, 0, pendingDelete.entry);
      return next;
    });
    setPendingDelete(null);
  };

  const toggleLevel = (level: string) => {
    const next = levelFilter.includes(level)
      ? levelFilter.filter((l) => l !== level)
      : [...levelFilter, level];
    void setFilters({ level: next.length > 0 ? next : null });
  };

  const toggleType = (type: string) => {
    const next = sanitizedTypeFilter.includes(type as Vocabulary["entryType"])
      ? sanitizedTypeFilter.filter((t) => t !== type)
      : [...sanitizedTypeFilter, type as Vocabulary["entryType"]];
    void setFilters({ type: next.length > 0 ? next : null });
  };

  const hasActiveFilter = !!search || levelFilter.length > 0 || sanitizedTypeFilter.length > 0;

  const clearFilters = () => {
    void setFilters({ search: null, level: null, type: null });
  };

  // Filter entries based on active tab + filters
  const visible = entries.filter((e) => {
    if (activeTab === "saved" && !e.saved) return false;
    if (levelFilter.length > 0 && !levelFilter.includes(e.level ?? "")) return false;
    if (sanitizedTypeFilter.length > 0) {
      if (!e.entryType) return false;
      if (!sanitizedTypeFilter.includes(e.entryType)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hw = (e.headword ?? e.query).toLowerCase();
      if (!hw.includes(q) && !e.query.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectedEntry = entries.find((e) => e.query === selected) ?? null;
  const handleCloseSheet = useCallback(() => {
    void setSelected(null);
  }, [setSelected]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        minHeight: 0,
        flex: 1,
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div className="grain-overlay" style={{ opacity: 0.03, zIndex: 0 }} />

      {/* Page Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <ModuleHeader
          icon={<StarOutlined />}
          gradient="var(--gradient-vocabulary)"
          title="Từ vựng của tôi"
          subtitle="Sổ tay lưu trữ và tra cứu từ vựng cá nhân tích hợp SRS"
          action={
            !isLoading && entries.length > 0 ? (
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-on-accent)",
                  fontWeight: 800,
                  background: "rgba(255,255,255,0.15)",
                  padding: "4px 10px",
                  borderRadius: 8,
                }}
              >
                {visible.length !== entries.length
                  ? `Đang hiện ${visible.length} / ${entries.length} từ`
                  : `${entries.length} từ`}
              </span>
            ) : undefined
          }
        />
      </div>

      {/* Main content scroll container */}
      <div
        style={{
          position: "relative",
          minHeight: 0,
          flex: 1,
          overflowY: "auto",
          padding: "24px 20px 80px",
          zIndex: 1,
        }}
      >
        {/* Soft background glow */}
        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, color-mix(in srgb, var(--accent) 4%, transparent) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Custom Tabs Pills */}
          <div
            style={{
              display: "flex",
              gap: 6,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "4px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {TABS.map((tabItem) => {
              const isTabActive = activeTab === tabItem.key;
              return (
                <m.button
                  key={tabItem.key}
                  onClick={() => setActiveTab(tabItem.key)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: isTabActive ? "var(--accent)" : "transparent",
                    color: isTabActive ? "var(--text-on-accent)" : "var(--text-secondary)",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "color 0.2s, background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {tabItem.label}
                </m.button>
              );
            })}
          </div>

          {/* Stats section */}
          {!isLoading && entries.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "0 20px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <VocabularyStatsBar entries={entries} />
            </div>
          )}

          {/* Filters section */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: 20,
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <SearchOutlined
                style={{
                  fontSize: 16,
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => void setFilters({ search: e.target.value || null })}
                placeholder="Nhập từ cần tìm..."
                aria-label="Tìm kiếm từ vựng"
                style={{
                  width: "100%",
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface-alt)",
                  border: "1.5px solid var(--border)",
                  padding: "10px 16px 10px 42px",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Filter buttons grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* CEFR Level filter */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    minWidth: 80,
                  }}
                >
                  Trình độ:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CEFR_LEVELS.map((level) => {
                    const active = levelFilter.includes(level);
                    return (
                      <m.button
                        key={level}
                        onClick={() => toggleLevel(level)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent-light)" : "var(--surface-alt)",
                          color: active ? "var(--accent)" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {level}
                      </m.button>
                    );
                  })}
                </div>
              </div>

              {/* Types filter */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    minWidth: 80,
                  }}
                >
                  Loại từ:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ENTRY_TYPES.map((type) => {
                    const active = typeFilter.includes(type);
                    return (
                      <m.button
                        key={type}
                        onClick={() => toggleType(type)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 800,
                          padding: "4px 10px",
                          borderRadius: 8,
                          border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent-light)" : "var(--surface-alt)",
                          color: active ? "var(--accent)" : "var(--text-secondary)",
                          cursor: "pointer",
                        }}
                      >
                        {ENTRY_TYPE_LABELS[type]}
                      </m.button>
                    );
                  })}
                </div>

                {hasActiveFilter && (
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 800,
                      color: "var(--error)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      marginLeft: "auto",
                      textDecoration: "underline",
                    }}
                  >
                    Xoá tất cả bộ lọc
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List entries */}
          <div style={{ marginTop: 8 }}>
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-xl)",
                      padding: 20,
                    }}
                  >
                    <Skeleton active title={{ width: 140 }} paragraph={{ rows: 1, width: 80 }} />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-xl)",
                  padding: "48px 20px",
                  textAlign: "center",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <BookOutlined
                  style={{ fontSize: 32, color: "var(--text-muted)", marginBottom: 12 }}
                />
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text-secondary)",
                    margin: "0 0 4px",
                  }}
                >
                  {hasActiveFilter
                    ? "Không tìm thấy từ vựng phù hợp."
                    : entries.length === 0
                      ? "Sổ từ vựng của bạn đang trống."
                      : activeTab === "saved"
                        ? "Bạn chưa lưu từ vựng nào."
                        : "Không có từ vựng."}
                </p>
                <p
                  style={{ fontSize: 12.5, color: "var(--text-muted)", margin: 0, fontWeight: 500 }}
                >
                  {entries.length === 0
                    ? "Hãy thử tra cứu từ mới trong mục Từ điển!"
                    : "Nhấn nút lưu ⭐ để lưu trữ từ vựng cần ôn tập."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {visible.map((entry, idx) => {
                  const masteryInfo = MASTERY_CONFIG[entry.mastery] ?? MASTERY_CONFIG.new;
                  const levelStyle = entry.level ? LEVEL_COLORS[entry.level] : null;
                  return (
                    <m.div
                      key={entry.id}
                      onClick={() => void setSelected(entry.query)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      whileHover={{ y: -2, borderColor: "var(--accent)" }}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        background: "var(--surface)",
                        border: "1.5px solid var(--border)",
                        borderRadius: "var(--radius-xl)",
                        padding: "16px 20px",
                        cursor: "pointer",
                        boxShadow: "var(--shadow-sm)",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {/* Left vertical tag stripe */}
                      {levelStyle && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: 4,
                            background: levelStyle.color,
                            borderTopLeftRadius: "var(--radius-xl)",
                            borderBottomLeftRadius: "var(--radius-xl)",
                          }}
                        />
                      )}

                      <div style={{ minWidth: 0, flex: 1, paddingLeft: levelStyle ? 4 : 0 }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {/* Mastery dot */}
                          <span title={masteryInfo.label} style={{ fontSize: 13, display: "flex" }}>
                            {masteryInfo.icon}
                          </span>

                          <span
                            style={{
                              fontSize: 17,
                              fontWeight: 850,
                              fontFamily: "var(--font-display)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {entry.headword ?? entry.query}
                          </span>

                          {levelStyle && (
                            <span
                              style={{
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontSize: 10.5,
                                fontWeight: 800,
                                background: levelStyle.bg,
                                color: levelStyle.color,
                                border: `1.5px solid ${levelStyle.border}`,
                              }}
                            >
                              {entry.level}
                            </span>
                          )}

                          {entry.entryType && (
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 800,
                                color: "var(--text-muted)",
                                background: "var(--surface-alt)",
                                padding: "2px 8px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                              }}
                            >
                              {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            marginTop: 6,
                            fontSize: 11.5,
                            color: "var(--text-muted)",
                            fontWeight: 500,
                            margin: "6px 0 0",
                          }}
                        >
                          Tra cứu: {formatRelativeTime(entry.lookedUpAt)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <m.button
                          whileHover={{ scale: 1.1, color: "var(--error)" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry);
                          }}
                          style={{
                            display: "grid",
                            width: 34,
                            height: 34,
                            placeItems: "center",
                            borderRadius: 8,
                            color: "var(--text-muted)",
                            background: "var(--surface-alt)",
                            border: "1px solid var(--border)",
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          aria-label={`Xoá ${entry.headword ?? entry.query}`}
                        >
                          <DeleteOutlined style={{ fontSize: 13 }} />
                        </m.button>

                        <m.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSaved(entry);
                          }}
                          style={{
                            display: "grid",
                            width: 34,
                            height: 34,
                            placeItems: "center",
                            borderRadius: 8,
                            color: entry.saved ? "var(--accent)" : "var(--text-muted)",
                            background: entry.saved ? "var(--accent-light)" : "var(--surface-alt)",
                            border: `1.5px solid ${entry.saved ? "var(--accent-muted)" : "var(--border)"}`,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          aria-label={entry.saved ? "Bỏ lưu" : "Lưu từ này"}
                        >
                          {entry.saved ? <StarFilled /> : <StarOutlined />}
                        </m.button>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <VocabularyDetailSheet
        query={selected}
        onClose={handleCloseSheet}
        saved={selectedEntry?.saved ?? false}
        onToggleSaved={() => selectedEntry && handleToggleSaved(selectedEntry)}
      />

      {/* Premium Undo toast banner */}
      {pendingDelete && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            pointerEvents: "none",
          }}
        >
          <m.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderRadius: "var(--radius-xl)",
              background: "var(--ink)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "12px 20px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <InfoCircleOutlined style={{ color: "var(--text-on-accent)" }} />
            <span style={{ fontSize: 13.5, color: "var(--text-on-accent)", fontWeight: 700 }}>
              Đã xóa thành công từ "{pendingDelete.entry.headword ?? pendingDelete.entry.query}"
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 300 }}>|</span>
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUndoDelete}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 900,
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <UndoOutlined /> Hoàn tác
            </m.button>
          </m.div>
        </div>
      )}
    </div>
  );
}
