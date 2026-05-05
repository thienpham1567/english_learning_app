"use client";

import { Drawer } from "antd";
import { DeleteOutlined, PlayCircleOutlined } from "@ant-design/icons";

export type HistoryItem = {
  id: string;
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string | null;
  durationSec: number | null;
  lastPosition: number;
  updatedAt: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (videoId: string) => void;
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function formatDur(sec: number | null): string | null {
  if (sec === null) return null;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function HistoryDrawer({ open, onClose, history, onSelect, onDelete }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "var(--font-display)" }}>
          Lịch sử video
        </span>
      }
      placement="right"
      width={380}
      styles={{ body: { padding: 12 } }}
    >
      {history.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
          Chưa có video nào.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((item) => (
            <div
              key={item.id}
              style={{
                position: "relative",
                display: "flex", gap: 10,
                padding: 10, borderRadius: 12,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "border-color 0.15s, transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
              onClick={() => onSelect(item)}
            >
              <div style={{
                position: "relative", flexShrink: 0,
                width: 110, aspectRatio: "16 / 9",
                borderRadius: 8, overflow: "hidden",
                background: "var(--bg-deep)",
              }}>
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
                    <PlayCircleOutlined style={{ fontSize: 22, color: "var(--text-muted)" }} />
                  </div>
                )}
                {item.durationSec !== null && (
                  <span style={{
                    position: "absolute", right: 4, bottom: 4,
                    fontSize: 10, fontWeight: 700,
                    color: "#fff", background: "rgba(0,0,0,0.78)",
                    padding: "1px 5px", borderRadius: 3,
                  }}>
                    {formatDur(item.durationSec)}
                  </span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
                    lineHeight: 1.35,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {item.title}
                  </div>
                  {item.channelTitle && (
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      {item.channelTitle}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {formatRelative(item.updatedAt)}
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.videoId); }}
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 24, height: 24, borderRadius: 6,
                  border: "none", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer",
                  display: "grid", placeItems: "center",
                  opacity: 0.6, transition: "opacity 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.background = "var(--error-bg)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--error)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.6"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}
                aria-label="Xoá"
              >
                <DeleteOutlined style={{ fontSize: 12 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
