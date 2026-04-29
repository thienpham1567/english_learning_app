"use client";

import { useCallback, useState } from "react";
import {
  HistoryOutlined,
  SoundOutlined,
  AudioOutlined,
  EditOutlined,
  FileTextOutlined,
  StarFilled,
  StarOutlined,
  FilterOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Drawer, Segmented, Select, Empty, Pagination, Spin } from "antd";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import type { ListeningHistoryItem } from "@/lib/listening/types";

const MODE_ICONS: Record<string, React.ReactNode> = {
  listening: <SoundOutlined />,
  shadowing: <AudioOutlined />,
  dictation: <EditOutlined />,
  summarize: <FileTextOutlined />,
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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <HistoryOutlined style={{ color: "var(--accent)" }} />
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
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <FilterOutlined /> Bộ lọc
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
        <div style={{ display: "flex", gap: 8 }}>
          <Select
            value={history.level ?? "all"}
            onChange={(val) => history.setLevel(val === "all" ? null : val)}
            size="small"
            style={{ flex: 1 }}
            options={[
              { value: "all", label: "Tất cả level" },
              { value: "A1", label: "A1" },
              { value: "A2", label: "A2" },
              { value: "B1", label: "B1" },
              { value: "B2", label: "B2" },
              { value: "C1", label: "C1" },
              { value: "C2", label: "C2" },
            ]}
          />
          <button
            onClick={() => history.setBookmarkedOnly(!history.bookmarkedOnly)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              border: history.bookmarkedOnly
                ? "1px solid var(--xp)"
                : "1px solid var(--border)",
              background: history.bookmarkedOnly
                ? "color-mix(in srgb, var(--xp) 8%, transparent)"
                : "transparent",
              color: history.bookmarkedOnly ? "var(--xp)" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {history.bookmarkedOnly ? <StarFilled /> : <StarOutlined />}
            Đánh dấu
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {history.isLoading && (
          <div style={{ textAlign: "center", padding: 40 }}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: onReplay ? "pointer" : "default",
        transition: "all 0.15s ease",
        animation: `fadeIn 0.2s ease ${index * 50}ms both`,
      }}
      onClick={onReplay}
    >
      {/* Mode icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          color: "var(--accent)",
          flexShrink: 0,
        }}
      >
        {MODE_ICONS[item.mode] ?? <SoundOutlined />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: "var(--accent)",
              fontFamily: "var(--font-mono)",
              padding: "1px 5px",
              borderRadius: 4,
              background: "color-mix(in srgb, var(--accent) 8%, transparent)",
            }}
          >
            {item.level}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
            {MODE_LABELS[item.mode] ?? item.mode}
          </span>
          {item.scriptRevealed && (
            <span
              style={{
                fontSize: 9,
                padding: "1px 4px",
                borderRadius: 3,
                background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                color: "var(--warning)",
                fontWeight: 700,
              }}
            >
              📖
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {relativeTime(item.completedAt)}
        </div>
      </div>

      {/* Score */}
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: scoreColor(item.score),
          fontFamily: "var(--font-mono)",
          minWidth: 36,
          textAlign: "right",
        }}
      >
        {item.score != null ? `${item.score}%` : "—"}
      </div>

      {/* Bookmark */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onBookmark(!item.bookmarked);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: item.bookmarked ? "var(--xp)" : "var(--border)",
          fontSize: 14,
          transition: "color 0.15s ease",
        }}
      >
        {item.bookmarked ? <StarFilled /> : <StarOutlined />}
      </button>

      {onReplay && (
        <RightOutlined style={{ fontSize: 10, color: "var(--text-muted)" }} />
      )}
    </div>
  );
}
