"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PlayCircleOutlined,
  HistoryOutlined,
  SendOutlined,
  LoadingOutlined,
  YoutubeOutlined,
  DownloadOutlined,
  AlignLeftOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { Modal } from "antd";

import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { api } from "@/lib/api-client";
import { AppError } from "@repo/shared";

import { VideoPlayer, type PlayerHandle } from "./_components/VideoPlayer";
import { ScriptPanel, type Segment } from "./_components/ScriptPanel";
import { HistoryDrawer, type HistoryItem } from "./_components/HistoryDrawer";

type CurrentVideo = {
  videoId: string;
  title: string;
  channelTitle: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  segments: Segment[];
};

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25];

export default function YoutubeLearnPage() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<CurrentVideo | null>(null);

  const [currentSec, setCurrentSec] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScript, setShowScript] = useState(true);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const playerRef = useRef<PlayerHandle | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get<{ history: HistoryItem[] }>("/youtube-learn/history");
      setHistory(res.history);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const saveToHistory = useCallback(async (v: CurrentVideo, lastPosition: number) => {
    try {
      await api.post("/youtube-learn/history", {
        videoId: v.videoId,
        title: v.title,
        channelTitle: v.channelTitle,
        thumbnailUrl: v.thumbnailUrl,
        durationSec: v.durationSec,
        transcript: v.segments,
        lastPosition,
      });
      fetchHistory();
    } catch {
      // ignore
    }
  }, [fetchHistory]);

  const loadFromUrl = useCallback(async () => {
    const url = urlInput.trim();
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CurrentVideo & { transcript: Segment[] }>(
        "/youtube-learn/transcript",
        { url },
      );
      const fresh: CurrentVideo = {
        videoId: res.videoId,
        title: res.title,
        channelTitle: res.channelTitle ?? null,
        thumbnailUrl: res.thumbnailUrl ?? null,
        durationSec: null,
        segments: res.transcript,
      };
      setVideo(fresh);
      setCurrentSec(0);
      setUrlInput("");
      saveToHistory(fresh, 0);
    } catch (err) {
      setError(err instanceof AppError && err.message ? err.message : "Không thể tải video.");
    } finally {
      setLoading(false);
    }
  }, [urlInput, saveToHistory]);

  const loadFromHistory = useCallback(async (item: HistoryItem) => {
    setLoading(true);
    setError(null);
    setHistoryOpen(false);
    try {
      const res = await api.get<CurrentVideo & { transcript: Segment[]; lastPosition: number }>(
        `/youtube-learn/history/${item.videoId}`,
      );
      const fresh: CurrentVideo = {
        videoId: res.videoId,
        title: res.title,
        channelTitle: res.channelTitle ?? null,
        thumbnailUrl: res.thumbnailUrl ?? null,
        durationSec: res.durationSec ?? null,
        segments: res.transcript,
      };
      setVideo(fresh);
      setCurrentSec(res.lastPosition ?? 0);
    } catch (err) {
      setError(err instanceof AppError && err.message ? err.message : "Không thể tải video.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlayerReady = useCallback((player: PlayerHandle) => {
    playerRef.current = player;
    if (currentSec > 0) {
      setTimeout(() => player.seekTo(currentSec, true), 200);
    }
  }, [currentSec]);

  const handleSeek = useCallback((sec: number) => {
    playerRef.current?.seekTo(sec, true);
    playerRef.current?.play();
  }, []);

  const handleRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  const handleDeleteHistory = useCallback(async (videoId: string) => {
    try {
      await api.delete(`/youtube-learn/history?videoId=${encodeURIComponent(videoId)}`);
      setHistory((prev) => prev.filter((h) => h.videoId !== videoId));
    } catch {
      // ignore
    }
  }, []);

  // Save position every 10s while playing
  useEffect(() => {
    if (!video) return;
    const id = setInterval(() => {
      const t = playerRef.current?.getCurrentTime();
      if (t !== undefined && t > 0) {
        api.post("/youtube-learn/history", {
          videoId: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnailUrl: video.thumbnailUrl,
          durationSec: video.durationSec ?? Math.floor(playerRef.current?.getDuration() ?? 0),
          transcript: video.segments,
          lastPosition: Math.floor(t),
        }).catch(() => {});
      }
    }, 10_000);
    return () => clearInterval(id);
  }, [video]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "hidden", position: "relative" }}>
      <ModuleHeader
        icon={<YoutubeOutlined />}
        gradient="var(--gradient-youtube-learn)"
        title="Học cùng YouTube"
        subtitle="Xem video kèm script tiếng Anh, click vào từ để tra nghĩa"
        action={
          <button
            onClick={() => setHistoryOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              color: "#fff", cursor: "pointer",
              fontSize: 13, fontWeight: 600,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <HistoryOutlined style={{ fontSize: 13 }} />
            Lịch sử ({history.length})
          </button>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "20px 20px 32px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", width: "100%" }}>

          {/* URL input */}
          <div
            className="anim-fade-up"
            style={{
              display: "flex", gap: 8, alignItems: "center",
              padding: "8px 8px 8px 16px",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: 99,
              boxShadow: "var(--shadow-sm)",
              marginBottom: error ? 8 : 20,
            }}
          >
            <YoutubeOutlined style={{ fontSize: 16, color: "var(--accent)", flexShrink: 0 }} />
            <input
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") loadFromUrl(); }}
              placeholder="Dán link YouTube..."
              style={{
                flex: 1, border: "none", outline: "none", boxShadow: "none",
                background: "transparent",
                fontSize: 14, fontFamily: "var(--font-body)",
                color: "var(--text-primary)",
                padding: "8px 0",
              }}
            />
            <button
              onClick={loadFromUrl}
              disabled={loading || !urlInput.trim()}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 18px", borderRadius: 99,
                border: "none", cursor: urlInput.trim() && !loading ? "pointer" : "default",
                background: urlInput.trim() && !loading
                  ? "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 78%, black))"
                  : "var(--bg-deep)",
                color: urlInput.trim() && !loading ? "#fff" : "var(--text-muted)",
                fontSize: 13, fontWeight: 700, transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => { if (urlInput.trim() && !loading) (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {loading
                ? <><LoadingOutlined spin style={{ fontSize: 12 }} /> Đang tải...</>
                : <><DownloadOutlined style={{ fontSize: 12 }} /> Tải script</>}
            </button>
          </div>

          {error && (
            <div className="anim-fade-up" style={{
              padding: "10px 16px", borderRadius: 12,
              background: "var(--error-bg)", color: "var(--error)",
              fontSize: 13, fontWeight: 500,
              marginBottom: 20,
              border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
            }}>
              {error}
            </div>
          )}

          {/* No video — empty state */}
          {!video && !loading && (
            <EmptyState recent={history.slice(0, 6)} onSelect={loadFromHistory} />
          )}

          {/* Video + Script */}
          {video && (
            <div className="anim-fade-up">
              {/* Title bar */}
              <div style={{ marginBottom: 16 }}>
                <h2 style={{
                  margin: 0, fontSize: 18, fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  color: "var(--text-primary)",
                  lineHeight: 1.4,
                }}>
                  {video.title}
                </h2>
                {video.channelTitle && (
                  <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
                    {video.channelTitle}
                  </div>
                )}
              </div>

              {/* Two-column grid */}
              <div className="ytl-grid" style={{
                display: "grid",
                gridTemplateColumns: showScript ? "minmax(0, 1.4fr) minmax(0, 1fr)" : "1fr",
                gap: 16,
                alignItems: "start",
              }}>
                <div>
                  <VideoPlayer
                    videoId={video.videoId}
                    onReady={handlePlayerReady}
                    onTick={setCurrentSec}
                  />

                  {/* Player controls */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    flexWrap: "wrap",
                    marginTop: 10, padding: "8px 12px",
                    background: "var(--surface)", borderRadius: 12,
                    border: "1px solid var(--border)",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                      Tốc độ
                    </span>
                    {PLAYBACK_RATES.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRateChange(r)}
                        style={{
                          padding: "3px 11px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                          border: "1.5px solid",
                          cursor: "pointer", transition: "all 0.15s",
                          borderColor: playbackRate === r ? "var(--accent)" : "var(--border)",
                          background: playbackRate === r ? "var(--accent)" : "transparent",
                          color: playbackRate === r ? "#fff" : "var(--text-secondary)",
                        }}
                      >
                        {r}x
                      </button>
                    ))}

                    <div style={{ flex: 1 }} />

                    <button
                      onClick={() => setAutoScroll((v) => !v)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        border: "1.5px solid",
                        cursor: "pointer", transition: "all 0.15s",
                        borderColor: autoScroll ? "var(--accent)" : "var(--border)",
                        background: autoScroll ? "color-mix(in srgb, var(--accent) 12%, var(--surface))" : "var(--surface)",
                        color: autoScroll ? "var(--accent)" : "var(--text-secondary)",
                      }}
                    >
                      <ThunderboltOutlined style={{ fontSize: 11 }} />
                      Auto-scroll
                    </button>

                    <button
                      onClick={() => setShowScript((v) => !v)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                        border: "1.5px solid var(--border)",
                        cursor: "pointer", transition: "all 0.15s",
                        background: "var(--surface)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <AlignLeftOutlined style={{ fontSize: 11 }} />
                      {showScript ? "Ẩn script" : "Hiện script"}
                    </button>
                  </div>
                </div>

                {showScript && (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    height: "calc(100vh - 280px)",
                    minHeight: 360,
                    borderRadius: 14,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      background: "color-mix(in srgb, var(--accent) 4%, var(--bg))",
                    }}>
                      <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)" }} />
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        textTransform: "uppercase", letterSpacing: "0.14em",
                        color: "var(--accent)",
                      }}>
                        Transcript
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                        {video.segments.length} câu · click từ để tra nghĩa
                      </span>
                    </div>

                    <ScriptPanel
                      segments={video.segments}
                      currentSec={currentSec}
                      onSeek={handleSeek}
                      autoScroll={autoScroll}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={history}
        onSelect={loadFromHistory}
        onDelete={handleDeleteHistory}
      />

      <style jsx global>{`
        @media (max-width: 900px) {
          .ytl-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ recent, onSelect }: { recent: HistoryItem[]; onSelect: (item: HistoryItem) => void }) {
  return (
    <div className="anim-fade-up" style={{
      padding: "48px 28px",
      borderRadius: 20,
      background: "var(--surface)",
      border: "1px dashed var(--border)",
      textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "color-mix(in srgb, var(--accent) 12%, var(--surface))",
        display: "grid", placeItems: "center",
        margin: "0 auto 16px",
      }}>
        <PlayCircleOutlined style={{ fontSize: 28, color: "var(--accent)" }} />
      </div>

      <h3 style={{
        margin: "0 0 8px", fontSize: 20, fontWeight: 700,
        fontFamily: "var(--font-display)",
        color: "var(--text-primary)",
      }}>
        Học tiếng Anh qua video YouTube
      </h3>
      <p style={{
        margin: "0 auto 28px", maxWidth: 460, fontSize: 14, lineHeight: 1.65,
        color: "var(--text-muted)",
      }}>
        Dán link một video YouTube có phụ đề tiếng Anh ở trên. Bạn có thể vừa xem vừa đọc script,
        click vào từ để tra nghĩa, và đổi tốc độ phát.
      </p>

      {recent.length > 0 && (
        <div style={{ marginTop: 32, textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: "var(--accent)" }} />
            <span style={{
              fontSize: 11, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.14em",
              color: "var(--accent)",
            }}>
              Tiếp tục xem
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 12,
          }}>
            {recent.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  textAlign: "left", padding: 0, cursor: "pointer",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "var(--bg)",
                  overflow: "hidden",
                  transition: "border-color 0.15s, transform 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ aspectRatio: "16 / 9", background: "var(--bg-deep)" }}>
                  {item.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ padding: "10px 12px" }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, lineHeight: 1.35,
                    color: "var(--text-primary)",
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {item.title}
                  </div>
                  {item.channelTitle && (
                    <div style={{ marginTop: 4, fontSize: 11, color: "var(--text-muted)" }}>
                      {item.channelTitle}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
