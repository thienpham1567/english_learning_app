// app/(app)/my-vocabulary/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryState, useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";
import { BookOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { VocabularyStatsBar } from "@/app/(app)/my-vocabulary/_components/VocabularyStatsBar";
import { VocabularyDetailSheet } from "@/app/(app)/my-vocabulary/_components/VocabularyDetailSheet";
import { ToeicVocabularySection } from "@/app/(app)/my-vocabulary/_components/ToeicVocabularySection";
import type { Vocabulary } from "@/lib/schemas/vocabulary";
import { api } from "@/lib/api-client";

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
  word: "Từ / cụm từ",
  phrasal_verb: "Cụm ĐT",
  idiom: "Thành ngữ",
};

const LEVEL_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  A1: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
  A2: { bg: "#f0fdfa", color: "#0f766e", border: "#99f6e4" },
  B1: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  B2: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
  C1: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  C2: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
};

const MASTERY_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  new: { emoji: "🟡", label: "Mới", color: "#eab308" },
  learning: { emoji: "🔵", label: "Đang học", color: "#3b82f6" },
  mastered: { emoji: "🟢", label: "Thành thạo", color: "#22c55e" },
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const ENTRY_TYPES: Vocabulary["entryType"][] = ["word", "phrasal_verb", "idiom"];
const ENTRY_TYPE_SET = new Set<Vocabulary["entryType"]>(ENTRY_TYPES);

type TabKey = "all" | "saved" | "toeic";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "saved", label: "Đã lưu ⭐" },
  { key: "toeic", label: "TOEIC 📋" },
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

// ── Styles ──
const filterBtnBase: React.CSSProperties = {
  position: "relative",
  paddingBottom: 4,
  fontSize: 12,
  fontWeight: 500,
  background: "none",
  border: "none",
  cursor: "pointer",
  transition: "color 0.15s",
};
const filterBtnActive: React.CSSProperties = {
  ...filterBtnBase,
  color: "var(--ink)",
};
const filterBtnInactive: React.CSSProperties = {
  ...filterBtnBase,
  color: "var(--text-muted)",
};
const filterUnderline: React.CSSProperties = {
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  height: 1,
  background: "var(--accent)",
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

  const hasActiveFilter =
    !!search || levelFilter.length > 0 || sanitizedTypeFilter.length > 0;

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
    <div style={{ minHeight: "100%", overflowY: "auto" }}>
      <div>
        {/* ── Page Header ── */}
        <header style={{ marginBottom: 4 }}>
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              color: "var(--accent)",
              margin: 0,
            }}
          >
            Từ vựng của tôi
          </p>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 36,
                fontStyle: "italic",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              Lịch sử tra cứu
            </h1>
            {!isLoading && entries.length > 0 && (
              <span style={{ marginBottom: 4, fontSize: 14, color: "var(--text-muted)" }}>
                {visible.length !== entries.length
                  ? `${visible.length} / ${entries.length} từ`
                  : `${entries.length} từ`}
              </span>
            )}
          </div>
          <div style={{ marginTop: 16, height: 1, background: "var(--border)" }} />
        </header>

        {/* ── Tab Navigation (AC #3) ── */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--border)",
            marginTop: 8,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 600 : 400,
                color: activeTab === tab.key ? "var(--accent)" : "var(--text-muted)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TOEIC Tab Content ── */}
        {activeTab === "toeic" && (
          <div style={{ marginTop: 16 }}>
            <ToeicVocabularySection />
          </div>
        )}

        {/* ── Vocabulary List Tabs (all / saved) ── */}
        {activeTab !== "toeic" && (
          <>
            {/* Stats bar */}
            {!isLoading && entries.length > 0 && (
              <>
                <VocabularyStatsBar entries={entries} />
                <div style={{ height: 1, background: "var(--border)" }} />
              </>
            )}

            {/* Search */}
            <div style={{ position: "relative", marginTop: 24 }}>
              <SearchOutlined
                style={{
                  fontSize: 15,
                  position: "absolute",
                  left: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => void setFilters({ search: e.target.value || null })}
                placeholder="Tìm từ..."
                aria-label="Tìm kiếm từ vựng"
                style={{
                  width: "100%",
                  borderBottom: "1px solid var(--border)",
                  background: "transparent",
                  padding: "12px 16px 10px 28px",
                  fontSize: 14,
                  color: "var(--text-primary)",
                  outline: "none",
                  border: "none",
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
                  borderBottomColor: "var(--border)",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderBottomColor = "var(--accent)"; }}
                onBlur={(e) => { e.currentTarget.style.borderBottomColor = "var(--border)"; }}
              />
            </div>

            {/* Filters */}
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* CEFR levels */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
                {CEFR_LEVELS.map((level) => {
                  const active = levelFilter.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      style={active ? filterBtnActive : filterBtnInactive}
                    >
                      {level}
                      {active && <span style={filterUnderline} />}
                    </button>
                  );
                })}
              </div>

              {/* Entry types */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 20 }}>
                {ENTRY_TYPES.map((type) => {
                  const active = typeFilter.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      style={active ? filterBtnActive : filterBtnInactive}
                    >
                      {ENTRY_TYPE_LABELS[type]}
                      {active && <span style={filterUnderline} />}
                    </button>
                  );
                })}
                {hasActiveFilter && (
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: 11,
                      fontStyle: "italic",
                      color: "var(--text-muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      transition: "color 0.15s",
                    }}
                  >
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            </div>

            {/* ── Entry list ── */}
            <div style={{ marginTop: 24 }}>
              {isLoading ? (
                // Skeleton rows
                <div>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        padding: "16px 0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            height: 20,
                            width: 100 + i * 30,
                            borderRadius: 8,
                            background: "var(--border)",
                            animation: "pulse 1.5s infinite",
                          }}
                        />
                        <div
                          style={{
                            height: 16,
                            width: 32,
                            borderRadius: 8,
                            background: "var(--border)",
                            animation: "pulse 1.5s infinite",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          height: 12,
                          width: 80,
                          borderRadius: 8,
                          background: "var(--border)",
                          animation: "pulse 1.5s infinite",
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "80px 0",
                    textAlign: "center",
                  }}
                >
                  <BookOutlined style={{ fontSize: 28, color: "var(--border-strong)" }} />
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 20,
                      fontStyle: "italic",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    {hasActiveFilter
                      ? "Không có từ nào khớp."
                      : entries.length === 0
                        ? "Chưa tra từ nào."
                        : activeTab === "saved"
                          ? "Chưa lưu từ nào."
                          : "Không có từ nào."}
                  </p>
                  {!hasActiveFilter && (
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                      {entries.length === 0 ? "Hãy thử từ điển nhé!" : "Nhấn dấu ★ khi tra từ nhé!"}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {visible.map((entry, idx) => {
                    const masteryInfo = MASTERY_CONFIG[entry.mastery] ?? MASTERY_CONFIG.new;
                    const levelStyle = entry.level ? LEVEL_COLORS[entry.level] : null;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => void setSelected(entry.query)}
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          borderBottom: "1px solid var(--border)",
                          padding: "16px 0",
                          cursor: "pointer",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--surface-hover)";
                          const bar = e.currentTarget.querySelector<HTMLElement>("[data-accent-bar]");
                          if (bar) bar.style.opacity = "1";
                          const del = e.currentTarget.querySelector<HTMLElement>("[data-delete-btn]");
                          if (del) del.style.opacity = "1";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          const bar = e.currentTarget.querySelector<HTMLElement>("[data-accent-bar]");
                          if (bar) bar.style.opacity = "0";
                          const del = e.currentTarget.querySelector<HTMLElement>("[data-delete-btn]");
                          if (del) del.style.opacity = "0";
                        }}
                      >
                        {/* Left accent bar */}
                        <div
                          data-accent-bar
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: 2,
                            background: "var(--accent)",
                            opacity: 0,
                            transition: "opacity 0.15s",
                          }}
                        />

                        <div style={{ minWidth: 0, flex: 1, paddingLeft: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "baseline",
                              gap: 8,
                            }}
                          >
                            {/* Mastery indicator (AC #1) */}
                            <span
                              title={masteryInfo.label}
                              style={{ fontSize: 12, lineHeight: 1, cursor: "default" }}
                            >
                              {masteryInfo.emoji}
                            </span>
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 18,
                                fontStyle: "italic",
                                color: "var(--ink)",
                              }}
                            >
                              {entry.headword ?? entry.query}
                            </span>
                            {levelStyle && (
                              <span
                                style={{
                                  borderRadius: 4,
                                  padding: "1px 6px",
                                  fontSize: 10,
                                  fontWeight: 600,
                                  background: levelStyle.bg,
                                  color: levelStyle.color,
                                  border: `1px solid ${levelStyle.border}`,
                                }}
                              >
                                {entry.level}
                              </span>
                            )}
                            {entry.entryType && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                {ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}
                              </span>
                            )}
                          </div>
                          <p
                            style={{
                              marginTop: 2,
                              fontSize: 11,
                              letterSpacing: "0.03em",
                              color: "var(--text-muted)",
                              margin: "2px 0 0",
                            }}
                          >
                            {formatRelativeTime(entry.lookedUpAt)}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexShrink: 0,
                            alignItems: "center",
                            gap: 2,
                            paddingRight: 4,
                          }}
                        >
                          <button
                            data-delete-btn
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry);
                            }}
                            style={{
                              display: "grid",
                              width: 32,
                              height: 32,
                              placeItems: "center",
                              borderRadius: 4,
                              color: "var(--text-muted)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              opacity: 0,
                              transition: "opacity 0.15s, color 0.15s",
                            }}
                            aria-label={idx === 0 ? "Xoá từ này" : `Xoá ${entry.headword ?? entry.query}`}
                          >
                            <DeleteOutlined style={{ fontSize: 14 }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSaved(entry);
                            }}
                            style={{
                              display: "grid",
                              width: 32,
                              height: 32,
                              flexShrink: 0,
                              placeItems: "center",
                              borderRadius: 4,
                              color: entry.saved ? "var(--accent)" : "var(--text-muted)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "color 0.15s",
                            }}
                            aria-label={entry.saved ? "Bỏ lưu" : "Lưu từ này"}
                          >
                            <BookOutlined style={{ fontSize: 15 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <VocabularyDetailSheet
        query={selected}
        onClose={handleCloseSheet}
        saved={selectedEntry?.saved ?? false}
        onToggleSaved={() => selectedEntry && handleToggleSaved(selectedEntry)}
      />

      {pendingDelete && (
        <div
          key="undo-toast"
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 999,
            background: "var(--ink)",
            padding: "10px 20px",
            fontSize: 14,
            color: "#fff",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <span>Đã xoá</span>
          <span aria-hidden="true">·</span>
          <button
            onClick={handleUndoDelete}
            style={{
              fontWeight: 600,
              textDecoration: "underline",
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Hoàn tác
          </button>
        </div>
      )}
    </div>
  );
}
