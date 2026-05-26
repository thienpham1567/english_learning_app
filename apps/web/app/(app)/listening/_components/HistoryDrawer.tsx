"use client";

import { Drawer, Empty, Pagination, Segmented, Select, Spin } from "antd";
import { ChevronRight, FileText, Filter, History, Mic, Pencil, Star, Volume2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import type { ListeningHistoryItem } from "@/lib/listening/types";

const MODE_ICONS: Record<string, React.ReactNode> = {
  listening: <Volume2 />,
  shadowing: <Mic />,
  dictation: <Pencil />,
  summarize: <FileText />,
};

const MODE_LABELS: Record<string, string> = {
  listening: "Nghe",
  shadowing: "Shadow",
  dictation: "Dictation",
  summarize: "Tóm tắt",
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function scoreColor(score: number | null): string {
  if (score == null) return "var(--text-muted)";
  if (score >= 80) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--error)";
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
  const handleOpen = useCallback(
    (visible: boolean) => {
      if (visible && !initialized) {
        history.fetchHistory();
        setInitialized(true);
      }
    },
    [initialized, history],
  );

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <History className="text-accent" />
          <span>Lịch sử luyện nghe</span>
        </div>
      }
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      afterOpenChange={handleOpen}
      styles={{
        body: { padding: 0, display: "flex", flexDirection: "column" },
        header: { borderBottom: "1px solid var(--border)" },
      }}
    >
      {/* Filters */}
      <div
        className="py-3 px-4 flex flex-col gap-2.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center gap-1.5 text-[11px] text-text-muted font-semibold uppercase"
          style={{ letterSpacing: "0.1em" }}
        >
          <Filter /> Bộ lọc
        </div>
        <Segmented
          value={history.mode ?? "all"}
          onChange={(val) => history.setMode(val === "all" ? null : (val as string))}
          options={[
            { value: "all", label: "Tất cả" },
            { value: "listening", label: "Nghe" },
            { value: "shadowing", label: "Shadow" },
            { value: "dictation", label: "Dictation" },
            { value: "summarize", label: "Tóm tắt" },
          ]}
          size="small"
          block
        />
        <div className="flex gap-2">
          <Select
            value={history.level ?? "all"}
            onChange={(val) => history.setLevel(val === "all" ? null : val)}
            size="small"
            options={[
              { value: "all", label: "Tất cả level" },
              { value: "A1", label: "A1" },
              { value: "A2", label: "A2" },
              { value: "B1", label: "B1" },
              { value: "B2", label: "B2" },
              { value: "C1", label: "C1" },
              { value: "C2", label: "C2" },
            ]}
            className="flex-1"
          />
          <button
            onClick={() => history.setBookmarkedOnly(!history.bookmarkedOnly)}
            className="flex items-center gap-1 rounded-(--radius-sm) cursor-pointer text-xs font-semibold"
            style={{
              padding: "4px 10px",
              border: history.bookmarkedOnly ? "1px solid var(--xp)" : "1px solid var(--border)",
              background: history.bookmarkedOnly
                ? "color-mix(in srgb, var(--xp) 8%, transparent)"
                : "transparent",
              color: history.bookmarkedOnly ? "var(--xp)" : "var(--text-muted)",
            }}
          >
            {history.bookmarkedOnly ? <Star /> : <Star />}
            Đánh dấu
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto py-3 px-4">
        {history.isLoading && (
          <div className="text-center" style={{ padding: 40 }}>
            <Spin />
          </div>
        )}

        {!history.isLoading && history.items.length === 0 && (
          <Empty
            description="Chưa có bài nghe nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 40 }}
          />
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
        <div className="py-2.5 px-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
          <Pagination
            current={history.page}
            pageSize={history.pageSize}
            total={history.total}
            onChange={history.goToPage}
            size="small"
            showSizeChanger={false}
          />
        </div>
      )}
    </Drawer>
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
    <div
      onClick={onReplay}
      className="flex items-center gap-3 border-2 border-border bg-(--surface)"
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        cursor: onReplay ? "pointer" : "default",
        transition: "all 0.15s ease",
        animation: `fadeIn 0.2s ease ${index * 50}ms both`,
      }}
    >
      {/* Mode icon */}
      <div
        className="w-[36px] h-[36px] grid text-base text-accent shrink-0"
        style={{
          borderRadius: 10,
          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          placeItems: "center",
        }}
      >
        {MODE_ICONS[item.mode] ?? <Volume2 />}
      </div>

      {/* Info */}
      <div className="flex-1 w-[0px]">
        <div className="flex items-center gap-1.5" style={{ marginBottom: 2 }}>
          <span
            className="text-[10px] font-extrabold text-accent font-mono rounded"
            style={{
              padding: "1px 5px",
              background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            }}
          >
            {item.level}
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
            {MODE_LABELS[item.mode] ?? item.mode}
          </span>
          {item.scriptRevealed && (
            <span
              className="text-[9px] font-bold"
              style={{
                padding: "1px 4px",
                borderRadius: 3,
                background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                color: "var(--warning)",
              }}
            >
              📖
            </span>
          )}
        </div>
        <div className="text-[11px] text-text-muted">{relativeTime(item.completedAt)}</div>
      </div>

      {/* Score */}
      <div
        className="text-lg font-extrabold font-mono w-[36px] text-right"
        style={{ color: scoreColor(item.score) }}
      >
        {item.score != null ? `${item.score}%` : "—"}
      </div>

      {/* Bookmark */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBookmark(!item.bookmarked);
        }}
        className="bg-none border-none cursor-pointer p-1 text-sm"
        style={{
          color: item.bookmarked ? "var(--xp)" : "var(--border)",
          transition: "color 0.15s ease",
        }}
      >
        {item.bookmarked ? <Star /> : <Star />}
      </button>

      {onReplay && <ChevronRight className="text-[10px] text-text-muted" />}
    </div>
  );
}
