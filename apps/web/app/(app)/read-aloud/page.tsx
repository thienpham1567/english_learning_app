"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Flex, Typography, Slider, message, Tooltip } from "antd";
import {
  SoundOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
  ManOutlined,
  WomanOutlined,
  DeleteOutlined,
  CopyOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
  UndoOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

const { Text, Title, Paragraph } = Typography;

/* ── Voice configuration ── */
type Accent = "us" | "uk" | "au";
type Gender = "m" | "f";

interface VoiceOption {
  accent: Accent;
  gender: Gender;
  role: string;
  label: string;
  name: string;
  flag: string;
  accentLabel: string;
  description: string;
}

const VOICES: VoiceOption[] = [
  { accent: "us", gender: "m", role: "us-m", label: "US Male", name: "Austin", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nam trầm ấm, phát âm rõ ràng chuẩn Mỹ." },
  { accent: "us", gender: "f", role: "us-f", label: "US Female", name: "Autumn", flag: "🇺🇸", accentLabel: "Mỹ", description: "Giọng nữ tự nhiên, biểu cảm, dễ nghe." },
  { accent: "uk", gender: "m", role: "uk-m", label: "UK Male", name: "Daniel", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nam Anh quý phái, thanh lịch, chuẩn mực." },
  { accent: "uk", gender: "f", role: "uk-f", label: "UK Female", name: "Diana", flag: "🇬🇧", accentLabel: "Anh", description: "Giọng nữ Anh ngọt ngào, tinh tế, truyền cảm." },
  { accent: "au", gender: "m", role: "au-m", label: "AU Male", name: "Troy", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nam Úc hào sảng, phóng khoáng, tự nhiên." },
  { accent: "au", gender: "f", role: "au-f", label: "AU Female", name: "Hannah", flag: "🇦🇺", accentLabel: "Úc", description: "Giọng nữ Úc nhẹ nhàng, êm dịu, dễ đồng điệu." },
];

const SPEED_PRESETS = [0.8, 1.0, 1.2, 1.5];

const SAMPLE_TEXTS = [
  {
    title: "Khoa học & Vũ trụ",
    text: "The Hubble Space Telescope has captured a stunning new image of a distant galaxy, revealing millions of newborn stars and intricate gas clouds. This discovery helps astronomers better understand how galaxies evolved in the early universe.",
  },
  {
    title: "Công nghệ & AI",
    text: "Artificial intelligence is changing the way we learn languages. By analyzing individual learning patterns, AI-driven applications can customize vocabulary exercises and speaking practices to suit each student's needs.",
  },
  {
    title: "Lời khuyên học tập",
    text: "Learning a language requires consistency rather than intensity. Spending fifteen minutes every day practicing listening and speaking will yield much better results than cramming for five hours once a week.",
  },
];

const MAX_CHARS = 10_000;
const HISTORY_KEY = "read-aloud-history";
const MAX_HISTORY = 50;

/* ── History types ── */
interface HistoryEntry {
  id: string;
  text: string;
  voice: string;
  speed: number;
  createdAt: string; // ISO string
  wordCount: number;
  preview: string; // first ~80 chars
}

/* ── Client-side audio blob cache ── */
const audioBlobCache = new Map<string, string>(); // cacheKey -> objectURL

function makeCacheKey(text: string, voice: string, speed: number): string {
  return `${voice}|${speed}|${text.trim()}`;
}

/* ── localStorage helpers ── */
function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* quota exceeded — ignore */ }
}

function addHistoryEntry(text: string, voice: string, speed: number): HistoryEntry[] {
  const trimmed = text.trim();
  const entries = loadHistory();

  // De-dup: if identical text+voice+speed exists, move to top
  const existing = entries.findIndex(
    (e) => e.text === trimmed && e.voice === voice && e.speed === speed,
  );
  if (existing >= 0) {
    const [item] = entries.splice(existing, 1);
    item.createdAt = new Date().toISOString();
    entries.unshift(item);
  } else {
    const preview = trimmed.length > 80 ? trimmed.slice(0, 77) + "..." : trimmed;
    entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      voice,
      speed,
      createdAt: new Date().toISOString(),
      wordCount: trimmed.split(/\s+/).length,
      preview,
    });
  }

  const sliced = entries.slice(0, MAX_HISTORY);
  saveHistory(sliced);
  return sliced;
}

/* ── Format time ago ── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffS = Math.floor((now - then) / 1000);
  if (diffS < 60) return "vừa xong";
  if (diffS < 3600) return `${Math.floor(diffS / 60)} phút trước`;
  if (diffS < 86400) return `${Math.floor(diffS / 3600)} giờ trước`;
  return `${Math.floor(diffS / 86400)} ngày trước`;
}

/* ══════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════ */

export default function ReadAloudPage() {
  const [text, setText] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("us-m");
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const selectedVoice = VOICES.find((v) => v.role === selectedRole)!;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedMinutes = Math.ceil(wordCount / (150 * speed));

  /* ── Generate audio (with client blob cache) ── */
  const handleGenerate = useCallback(async () => {
    if (!text.trim()) {
      message.warning("Hãy nhập văn bản trước!");
      return;
    }
    if (text.length > MAX_CHARS) {
      message.error(`Văn bản quá dài! Tối đa ${MAX_CHARS.toLocaleString()} ký tự.`);
      return;
    }

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      // Don't revoke — keep in blob cache
      setAudioUrl(null);
    }

    setLoading(true);
    setPlaying(false);

    const cacheKey = makeCacheKey(text, selectedVoice.role, speed);

    // Check client blob cache first
    const cachedUrl = audioBlobCache.get(cacheKey);
    if (cachedUrl) {
      setAudioUrl(cachedUrl);
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        message.error("Lỗi phát audio");
      };
      await audio.play();
      setPlaying(true);
      setLoading(false);

      // Still add to history
      setHistory(addHistoryEntry(text, selectedVoice.role, speed));
      message.success("⚡ Phát từ bộ nhớ đệm — không tốn token!");
      return;
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/read-aloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          voice: selectedVoice.role,
          speed,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Lỗi không xác định" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      // Store in client blob cache
      audioBlobCache.set(cacheKey, url);

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => {
        setPlaying(false);
        message.error("Lỗi phát audio");
      };
      await audio.play();
      setPlaying(true);

      // Add to history
      setHistory(addHistoryEntry(text, selectedVoice.role, speed));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      message.error(err instanceof Error ? err.message : "Lỗi tổng hợp giọng nói");
    } finally {
      setLoading(false);
    }
  }, [text, selectedVoice, speed, audioUrl]);

  /* ── Playback controls ── */
  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleStop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    // Don't revoke blob URLs — keep them cached
    setAudioUrl(null);
    setPlaying(false);
    setLoading(false);
  }, []);

  const handleClear = useCallback(() => {
    handleStop();
    setText("");
  }, [handleStop]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboard = await navigator.clipboard.readText();
      setText(clipboard);
      message.success("Đã dán từ clipboard!");
    } catch {
      message.error("Không thể truy cập clipboard");
    }
  }, []);

  /* ── History actions ── */
  const handleReplayHistory = useCallback((entry: HistoryEntry) => {
    setText(entry.text);
    setSelectedRole(entry.voice);
    setSpeed(entry.speed);
    setShowHistory(false);
    message.info("Đã tải lại đoạn văn — nhấn \"Bắt đầu nghe đọc\" để phát");
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveHistory(next);
      return next;
    });
    message.success("Đã xóa mục lịch sử");
  }, []);

  const handleClearAllHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
    // Also clear blob cache
    for (const [, url] of audioBlobCache) {
      URL.revokeObjectURL(url);
    }
    audioBlobCache.clear();
    message.success("Đã xóa toàn bộ lịch sử");
  }, []);

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}
      className="anim-fade-up"
    >
      <Flex vertical gap="var(--space-5)" style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <ModuleHeader
          icon={<SoundOutlined />}
          gradient="linear-gradient(135deg, #4c1d95, #6d28d9 50%, #7c3aed)"
          title="Đọc to — Read Aloud"
          subtitle="Công cụ chuyển đổi văn bản tiếng Anh thành giọng nói thông minh với công nghệ Groq LPU siêu tốc"
        />

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "var(--space-5)",
          }}
          className="read-aloud-grid"
        >
          {/* ── Left: Input & Sample area ── */}
          <Flex vertical gap="var(--space-4)">
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                position: "relative",
              }}
            >
              {/* Header Actions */}
              <Flex align="center" justify="space-between">
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                  <FileTextOutlined style={{ color: "var(--accent)" }} />
                  Nhập văn bản tiếng Anh
                </Text>
                <Flex gap={8}>
                  <ToolButton
                    icon={<HistoryOutlined />}
                    label={`Lịch sử (${history.length})`}
                    onClick={() => setShowHistory(!showHistory)}
                    active={showHistory}
                  />
                  <ToolButton
                    icon={<CopyOutlined />}
                    label="Dán văn bản"
                    onClick={handlePaste}
                  />
                  <ToolButton
                    icon={<DeleteOutlined />}
                    label="Xóa hết"
                    onClick={handleClear}
                    danger
                  />
                </Flex>
              </Flex>

              {/* Input Area */}
              <div style={{ position: "relative" }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"Dán hoặc nhập một đoạn văn tiếng Anh vào đây để nghe đọc thử...\n\nNhấp vào các văn bản mẫu bên dưới để thử nhanh."}
                  maxLength={MAX_CHARS}
                  style={{
                    width: "100%",
                    minHeight: 320,
                    resize: "vertical",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4)",
                    fontSize: 16,
                    lineHeight: 1.75,
                    fontFamily: "var(--font-body)",
                    color: "var(--text-primary)",
                    background: "var(--surface-alt)",
                    outline: "none",
                    transition: "all 0.25s ease",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.boxShadow = "0 0 0 4px var(--accent-muted)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.background = "var(--surface-alt)";
                  }}
                />
              </div>

              {/* Text Stats */}
              <Flex align="center" justify="space-between" style={{ padding: "0 4px" }}>
                <Flex gap={16}>
                  <Stat label="Số từ" value={wordCount.toLocaleString()} />
                  <Stat label="Ký tự" value={`${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`} />
                </Flex>
                {wordCount > 0 && (
                  <Flex align="center" gap={6} style={{ background: "var(--accent-light)", padding: "4px 10px", borderRadius: 12 }}>
                    <FieldTimeOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                    <Text style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>
                      Thời gian nghe ước tính: ~{estimatedMinutes} phút
                    </Text>
                  </Flex>
                )}
              </Flex>
            </m.div>

            {/* ── History Panel (collapsible) ── */}
            <AnimatePresence>
              {showHistory && (
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
                            onClick={handleClearAllHistory}
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
                          onClick={() => setShowHistory(false)}
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
                          const isCached = audioBlobCache.has(makeCacheKey(entry.text, entry.voice, entry.speed));
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
                              onClick={() => handleReplayHistory(entry)}
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
                                  {isCached && (
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
                                  handleDeleteHistory(entry.id);
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

            {/* Quick Sample Texts */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-4) var(--space-5)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 12 }}>
                💡 Sử dụng văn bản mẫu
              </Text>
              <Flex gap={8} wrap="wrap">
                {SAMPLE_TEXTS.map((sample, idx) => (
                  <m.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setText(sample.text);
                      message.success(`Đã tải văn bản mẫu: ${sample.title}`);
                    }}
                    style={{
                      border: "1px dashed var(--border-strong)",
                      borderRadius: "var(--radius)",
                      background: "var(--surface-alt)",
                      padding: "8px 14px",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "var(--font-body)",
                    }}
                    className="btn-shimmer"
                  >
                    🚀 {sample.title}
                  </m.button>
                ))}
              </Flex>
            </m.div>
          </Flex>

          {/* ── Right: Voice & Playback Controls ── */}
          <Flex vertical gap="var(--space-4)">
            {/* Voice Options Card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                🗣️ Chọn giọng đọc
              </Text>

              {/* 3D Voice Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {VOICES.map((v) => {
                  const isActive = selectedRole === v.role;
                  return (
                    <m.button
                      key={v.role}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedRole(v.role)}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-lg)",
                        border: isActive ? "2px solid var(--accent)" : "1px solid var(--border)",
                        background: isActive ? "var(--accent-light)" : "var(--surface-alt)",
                        cursor: "pointer",
                        transition: "all 0.25s ease",
                        textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: 24, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
                        {v.flag}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={6}>
                          <Text style={{ fontWeight: isActive ? 800 : 700, fontSize: 14, color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
                            {v.name}
                          </Text>
                          <span
                            style={{
                              fontSize: 10,
                              background: v.gender === "m" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)",
                              color: v.gender === "m" ? "#2563eb" : "#db2777",
                              padding: "1px 6px",
                              borderRadius: 8,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            {v.gender === "m" ? <ManOutlined /> : <WomanOutlined />}
                            {v.gender === "m" ? "Nam" : "Nữ"}
                          </span>
                        </Flex>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isActive ? "var(--accent)" : "var(--text-muted)",
                            display: "block",
                            marginTop: 2,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          Giọng {v.accentLabel} • {v.label}
                        </Text>
                      </div>

                      <Tooltip title={v.description} placement="left">
                        <InfoCircleOutlined
                          style={{
                            fontSize: 14,
                            color: "var(--text-muted)",
                            opacity: 0.6,
                            cursor: "help",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Tooltip>

                      {isActive && (
                        <m.div
                          layoutId="selected-indicator"
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "30%",
                            bottom: "30%",
                            width: 3,
                            background: "var(--accent)",
                            borderRadius: "4px 0 0 4px",
                          }}
                        />
                      )}
                    </m.button>
                  );
                })}
              </div>
            </m.div>

            {/* Playback Configuration Card */}
            <m.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius-xl)",
                border: "1px solid var(--border)",
                padding: "var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block" }}>
                ⚙️ Cấu hình phát
              </Text>

              {/* Speed Controller */}
              <div>
                <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Tốc độ đọc</Text>
                  <Text style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>{speed}x</Text>
                </Flex>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={speed}
                  onChange={(val) => setSpeed(val)}
                  tooltip={{ formatter: (val) => `${val}x` }}
                  styles={{
                    track: { background: "var(--accent)" },
                    handle: { borderColor: "var(--accent)", width: 14, height: 14 },
                  }}
                />

                {/* Preset Quick Select Buttons */}
                <Flex justify="space-between" style={{ marginTop: 8 }} gap={6}>
                  {SPEED_PRESETS.map((preset) => (
                    <m.button
                      key={preset}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSpeed(preset)}
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 0",
                        borderRadius: 8,
                        border: speed === preset ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: speed === preset ? "var(--accent-light)" : "var(--surface-alt)",
                        color: speed === preset ? "var(--accent)" : "var(--text-secondary)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {preset === 1.0 ? "Chuẩn" : `${preset}x`}
                    </m.button>
                  ))}
                </Flex>
              </div>

              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

              {/* Action Buttons */}
              <Flex vertical gap={8}>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerate}
                  disabled={loading || !text.trim()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "16px 20px",
                    borderRadius: "var(--radius-lg)",
                    border: "none",
                    background: loading || !text.trim()
                      ? "var(--border)"
                      : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: loading || !text.trim()
                      ? "var(--text-muted)"
                      : "var(--text-on-accent)",
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                    boxShadow: !loading && text.trim() ? "0 4px 14px var(--accent-muted)" : "none",
                    transition: "all 0.2s ease",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {loading ? (
                    <>
                      <LoadingOutlined spin />
                      Đang xử lý giọng nói...
                    </>
                  ) : (
                    <>
                      <SoundOutlined />
                      Bắt đầu nghe đọc
                    </>
                  )}
                </m.button>

                <AnimatePresence>
                  {audioUrl && (
                    <m.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", gap: 8, marginTop: 4 }}
                    >
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={togglePlayback}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid var(--border-strong)",
                          background: "var(--surface)",
                          color: "var(--text-primary)",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {playing ? <PauseCircleOutlined style={{ color: "var(--accent)" }} /> : <PlayCircleOutlined style={{ color: "var(--sage)" }} />}
                        {playing ? "Tạm dừng" : "Tiếp tục phát"}
                      </m.button>
                      <m.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStop}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "12px 18px",
                          borderRadius: "var(--radius-lg)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          background: "var(--error-bg)",
                          color: "var(--error)",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <UndoOutlined />
                      </m.button>
                    </m.div>
                  )}
                </AnimatePresence>
              </Flex>
            </m.div>
          </Flex>
        </div>

        {/* Dynamic Waveform Visualizer */}
        <AnimatePresence>
          {(playing || loading) && (
            <m.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                background: "linear-gradient(90deg, var(--surface), var(--surface-alt))",
                borderRadius: "var(--radius-xl)",
                border: "2px solid var(--accent-light)",
                padding: "var(--space-4) var(--space-5)",
                boxShadow: "var(--shadow-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    border: "3px solid var(--accent-light)",
                    borderTopColor: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {loading ? (
                    "Đang nén & tạo tệp âm thanh..."
                  ) : (
                    <span>
                      Đang đọc giọng {selectedVoice.flag} <strong style={{ color: "var(--accent)" }}>{selectedVoice.name}</strong> ({selectedVoice.label})
                    </span>
                  )}
                </Text>
              </div>

              {/* Dynamic Soundwave bars */}
              <Flex gap={3} align="flex-end" style={{ height: 36 }}>
                {Array.from({ length: 28 }).map((_, i) => (
                  <m.div
                    key={i}
                    animate={{
                      height: playing
                        ? [6, 12 + Math.random() * 24, 6, 18 + Math.random() * 18, 6]
                        : [6, 10, 6],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7 + Math.random() * 0.5,
                      delay: i * 0.03,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 3,
                      borderRadius: 2,
                      background: playing
                        ? "linear-gradient(to top, var(--accent), var(--xp))"
                        : "var(--border-strong)",
                      opacity: playing ? 0.8 : 0.4,
                    }}
                  />
                ))}
              </Flex>
            </m.div>
          )}
        </AnimatePresence>

        {/* Feature Highlights/Guide */}
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <Title level={5} style={{ margin: "0 0 16px 0", color: "var(--text-primary)", fontSize: 15 }}>
            🚀 Luyện phát âm & luyện nghe hiệu quả cùng Read Aloud
          </Title>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                title: "So sánh các giọng đọc",
                desc: "Nghe cùng một đoạn văn với accent Mỹ, Anh hoặc Úc giúp bạn dễ nhận diện sự khác biệt ngữ điệu.",
                emoji: "🌏",
              },
              {
                title: "Bộ nhớ đệm thông minh",
                desc: "Đoạn văn đã nghe sẽ được cache cả trên server và trình duyệt. Nghe lại không tốn thêm token AI!",
                emoji: "⚡",
              },
              {
                title: "Điều chỉnh tốc độ",
                desc: "Giảm tốc độ đọc xuống 0.8x để nghe chi tiết nối âm, tăng tốc lên 1.2x - 1.5x để thử thách phản xạ.",
                emoji: "🎚️",
              },
              {
                title: "Lịch sử & tái sử dụng",
                desc: "Mọi đoạn văn bạn đã nghe đều được lưu lại. Mở lại bất kỳ lúc nào mà không cần nhập lại từ đầu.",
                emoji: "📋",
              },
            ].map((card, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface-alt)",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 8 }}>{card.emoji}</div>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4, color: "var(--text-primary)" }}>
                  {card.title}
                </Text>
                <Paragraph style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  {card.desc}
                </Paragraph>
              </div>
            ))}
          </div>
        </m.div>
      </Flex>

      {/* Responsive adjustments */}
      <style>{`
        @media (max-width: 860px) {
          .read-aloud-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Small utility components ── */

function ToolButton({
  icon,
  label,
  onClick,
  danger = false,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <m.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: "var(--radius-md)",
        border: active ? "1px solid var(--accent)" : "1px solid var(--border)",
        background: active ? "var(--accent-light)" : "var(--surface-alt)",
        color: danger ? "var(--error)" : active ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "var(--font-body)",
        transition: "all 0.2s",
      }}
    >
      {icon}
      {label}
    </m.button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Flex align="center" gap={4}>
      <Text style={{ fontSize: 12.5, color: "var(--text-muted)" }}>{label}:</Text>
      <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-secondary)" }}>{value}</Text>
    </Flex>
  );
}
