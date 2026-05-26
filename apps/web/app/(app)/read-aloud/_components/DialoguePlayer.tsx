"use client";

import { useState, useCallback } from "react";
import { Flex, Typography, message } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  LoadingOutlined,
  SoundOutlined,
  AudioOutlined,
  StopOutlined,
  RedoOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useDialogue } from "../_hooks/useDialogue";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { ShadowResult, type EvalResult } from "./ShadowResult";

const { Text, Title } = Typography;

const SPEAKER_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; shadow: string }> = {
  A: { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.2)", text: "#3b82f6", accent: "#3b82f6", shadow: "0 2px 8px rgba(59, 130, 246, 0.1)" },
  B: { bg: "rgba(236, 72, 153, 0.08)", border: "rgba(236, 72, 153, 0.2)", text: "#db2777", accent: "#ec4899", shadow: "0 2px 8px rgba(236, 72, 153, 0.1)" },
  C: { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)", text: "#10b981", accent: "#10b981", shadow: "0 2px 8px rgba(16, 185, 129, 0.1)" },
};

interface DialoguePlayerProps {
  voiceRole: string;
  speed: number;
}

export function DialoguePlayer({ voiceRole, speed }: DialoguePlayerProps) {
  const dlg = useDialogue();
  const [topic, setTopic] = useState("");
  const [speakers, setSpeakers] = useState<2 | 3>(2);
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");

  // Role-play state
  const [rolePlaySpeaker, setRolePlaySpeaker] = useState<string | null>(null);
  const [rolePlayStep, setRolePlayStep] = useState<"idle" | "listening" | "recording" | "evaluating" | "result">("idle");
  const [rolePlayLineIndex, setRolePlayLineIndex] = useState(-1);
  const [rolePlayResult, setRolePlayResult] = useState<EvalResult | null>(null);
  const [hasListenedOnce, setHasListenedOnce] = useState(false);
  const [isListeningPreview, setIsListeningPreview] = useState(false);
  const voice = useVoiceInput({ autoTranscribe: false });

  const handleGenerate = useCallback(async () => {
    setHasListenedOnce(false);
    setIsListeningPreview(false);
    await dlg.generate({ topic: topic || undefined, speakers, length, primaryVoice: voiceRole });
  }, [dlg, topic, speakers, length, voiceRole]);

  /* ── Listen preview: hear full dialogue before role-playing ── */
  const listenPreview = useCallback(async () => {
    setIsListeningPreview(true);
    await dlg.playAll(speed);
    setIsListeningPreview(false);
    setHasListenedOnce(true);
  }, [dlg, speed]);

  const skipListenPreview = useCallback(() => {
    setHasListenedOnce(true);
  }, []);

  /* ── Role-play: play non-user lines, record user lines ── */
  const startRolePlay = useCallback(async (speakerKey: string) => {
    if (!dlg.dialogue) return;
    setRolePlaySpeaker(speakerKey);
    setRolePlayStep("idle");
    setRolePlayLineIndex(0);
    setRolePlayResult(null);
  }, [dlg.dialogue]);

  const playRolePlayLine = useCallback(async (lineIndex: number) => {
    if (!dlg.dialogue) return;
    const line = dlg.dialogue.lines[lineIndex];
    if (!line) return;

    if (line.speaker === rolePlaySpeaker) {
      // User's turn — record
      setRolePlayStep("recording");
      setRolePlayLineIndex(lineIndex);
      await voice.start();
    } else {
      // AI's turn — play TTS
      setRolePlayStep("listening");
      setRolePlayLineIndex(lineIndex);
      await dlg.playSingleLine(lineIndex, speed);
      // Auto-advance to next
      const nextIdx = lineIndex + 1;
      if (nextIdx < dlg.dialogue.lines.length) {
        setTimeout(() => playRolePlayLine(nextIdx), 500);
      } else {
        setRolePlayStep("idle");
      }
    }
  }, [dlg, rolePlaySpeaker, speed, voice]);

  const stopAndEvaluateRolePlay = useCallback(async () => {
    voice.stop();
    setRolePlayStep("evaluating");

    await new Promise((r) => setTimeout(r, 300));

    const audioBlob = voice.blob;
    if (!audioBlob || !dlg.dialogue) {
      message.error("Không có bản ghi âm");
      setRolePlayStep("idle");
      return;
    }

    const line = dlg.dialogue.lines[rolePlayLineIndex];

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "roleplay.webm");
      formData.append("referenceText", line.text.trim());
      formData.append("durationMs", String(Math.round(voice.durationMs)));

      const res = await fetch("/api/read-aloud/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        if (err.error === "no-speech") {
          message.warning("Không nhận dạng được. Hãy thử lại.");
          setRolePlayStep("idle");
          return;
        }
        throw new Error(err.error || "Failed");
      }

      const result: EvalResult = await res.json();
      setRolePlayResult(result);
      setRolePlayStep("result");
    } catch {
      message.error("Lỗi chấm điểm");
      setRolePlayStep("idle");
    }
  }, [voice, dlg, rolePlayLineIndex]);

  const continueAfterRolePlay = useCallback(() => {
    if (!dlg.dialogue) return;
    const nextIdx = rolePlayLineIndex + 1;
    setRolePlayResult(null);
    if (nextIdx < dlg.dialogue.lines.length) {
      playRolePlayLine(nextIdx);
    } else {
      setRolePlayStep("idle");
      setRolePlaySpeaker(null);
      message.success("🎉 Hoàn thành hội thoại!");
    }
  }, [dlg, rolePlayLineIndex, playRolePlayLine]);

  /* ── Setup screen ── */
  if (!dlg.dialogue) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <m.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <Title level={5} style={{ margin: 0, color: "var(--text-primary)" }}>
            💬 Tạo hội thoại mới
          </Title>

          {/* Topic input */}
          <div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Chủ đề (tùy chọn)
            </Text>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: ordering coffee, job interview..."
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-alt)",
                color: "var(--text-primary)",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Speaker count */}
          <div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Số người
            </Text>
            <Flex gap={8}>
              {([2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSpeakers(n)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 12,
                    border: speakers === n ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: speakers === n ? "var(--accent-light)" : "var(--surface-alt)",
                    color: speakers === n ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  {n === 2 ? "👫 2 người" : "👨‍👩‍👦 3 người"}
                </button>
              ))}
            </Flex>
          </div>

          {/* Length */}
          <div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
              Độ dài
            </Text>
            <Flex gap={8}>
              {(["short", "medium", "long"] as const).map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setLength(len)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 12,
                    border: length === len ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: length === len ? "var(--accent-light)" : "var(--surface-alt)",
                    color: length === len ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  {len === "short" ? "Ngắn (~5 câu)" : len === "medium" ? "TB (~10 câu)" : "Dài (~16 câu)"}
                </button>
              ))}
            </Flex>
          </div>

          {/* Generate button */}
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGenerate}
            disabled={dlg.generating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 10, padding: "14px 20px", borderRadius: 14,
              border: "none",
              background: dlg.generating ? "var(--border)" : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: dlg.generating ? "var(--text-muted)" : "var(--text-on-accent)",
              fontSize: 15, fontWeight: 800, cursor: dlg.generating ? "wait" : "pointer",
              fontFamily: "var(--font-body)",
              boxShadow: dlg.generating ? "none" : "0 4px 14px var(--accent-muted)",
            }}
          >
            {dlg.generating ? <><LoadingOutlined spin /> Đang tạo hội thoại...</> : <>✨ Tạo hội thoại</>}
          </m.button>
        </m.div>

        {/* Saved dialogues */}
        {dlg.savedDialogues.length > 0 && (
          <m.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              padding: "20px",
              boxShadow: "var(--shadow)",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              📚 Hội thoại đã tạo ({dlg.savedDialogues.length})
            </Text>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {dlg.savedDialogues.map((saved, idx) => (
                <m.div
                  key={saved.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  whileHover={{ y: -1, boxShadow: "var(--shadow-sm)" }}
                  onClick={() => dlg.loadDialogue(saved)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-alt)",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {/* Speaker flags */}
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {saved.voiceConfigJson.map((v) => (
                      <span key={v.speaker} style={{ fontSize: 16 }}>{v.flag}</span>
                    ))}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{
                      fontSize: 13, fontWeight: 700, color: "var(--text-primary)",
                      display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {saved.title}
                    </Text>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 2 }}>
                      {saved.topic && (
                        <Text style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                          📌 {saved.topic}
                        </Text>
                      )}
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {saved.linesJson.length} câu
                      </Text>
                      {saved.rolePlayCount > 0 && (
                        <Text style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>
                          🎙️ {saved.rolePlayCount}x
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Bookmark */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); dlg.toggleBookmark(saved.id); }}
                    style={{
                      background: "transparent", border: "none",
                      fontSize: 18, cursor: "pointer", padding: 4,
                      color: saved.bookmarked ? "var(--accent)" : "var(--text-muted)",
                      opacity: saved.bookmarked ? 1 : 0.4,
                      transition: "all 0.15s",
                    }}
                  >
                    {saved.bookmarked ? "⭐" : "☆"}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); dlg.deleteDialogue(saved.id); }}
                    style={{
                      background: "transparent", border: "none",
                      fontSize: 14, cursor: "pointer", padding: 4,
                      color: "var(--error)",
                      opacity: 0.4,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = "1"; }}
                    onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.opacity = "0.4"; }}
                  >
                    🗑️
                  </button>

                  {/* Time */}
                  <Text style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                    {new Date(saved.createdAt).toLocaleDateString("vi-VN", { day: "numeric", month: "short" })}
                  </Text>
                </m.div>
              ))}
            </div>
          </m.div>
        )}
      </div>
    );
  }

  /* ── Dialogue view ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "16px 20px",
        boxShadow: "var(--shadow-md)",
      }}>
        <Flex justify="space-between" align="center">
          <div>
            <Text style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "block" }}>
              💬 {dlg.dialogue.title}
            </Text>
            <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {dlg.dialogue.context} • {dlg.dialogue.lines.length} câu
            </Text>
          </div>
          <Flex gap={8}>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.isPlaying ? dlg.stop : () => dlg.playAll(speed)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 12,
                border: dlg.isPlaying ? "1px solid var(--error)" : "1px solid var(--accent)",
                background: dlg.isPlaying ? "rgba(239,68,68,0.08)" : "var(--accent-light)",
                color: dlg.isPlaying ? "var(--error)" : "var(--accent)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              {dlg.isLoading ? <><LoadingOutlined spin /> Đang tải...</> : dlg.isPlaying ? <><PauseCircleOutlined /> Dừng</> : <><PlayCircleOutlined /> Phát tất cả</>}
            </m.button>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={dlg.reset}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface-alt)",
                color: "var(--text-secondary)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              <RedoOutlined /> Tạo mới
            </m.button>
          </Flex>
        </Flex>

        {/* Speaker badges */}
        <Flex gap={8} style={{ marginTop: 12 }}>
          {dlg.voiceAssignments.map((a) => {
            const colors = SPEAKER_COLORS[a.speaker] ?? SPEAKER_COLORS.A;
            return (
              <div key={a.speaker} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 10,
                background: colors.bg, border: `1px solid ${colors.border}`,
              }}>
                <span style={{ fontSize: 14 }}>{a.flag}</span>
                <Text style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>
                  {a.voiceName}
                </Text>
              </div>
            );
          })}
        </Flex>
      </div>

      {/* Chat bubbles */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 14,
        background: "var(--surface-alt)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "20px 16px",
        boxShadow: "var(--shadow)",
      }}>
        {dlg.dialogue.lines.map((line, i) => {
          const isLeft = line.speaker === "A";
          const colors = SPEAKER_COLORS[line.speaker] ?? SPEAKER_COLORS.A;
          const isActive = dlg.activeLineIndex === i;
          const isRolePlayLine = rolePlaySpeaker && line.speaker === rolePlaySpeaker && rolePlayLineIndex === i;
          const assignment = dlg.voiceAssignments.find((a) => a.speaker === line.speaker);

          return (
            <m.div
              key={i}
              initial={{ opacity: 0, x: isLeft ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                display: "flex",
                flexDirection: isLeft ? "row" : "row-reverse",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `color-mix(in srgb, ${colors.accent} 12%, var(--surface))`,
                border: `1.5px solid ${colors.border}`,
                display: "grid", placeItems: "center",
                fontSize: 18, flexShrink: 0,
                boxShadow: colors.shadow,
              }}>
                {assignment?.flag ?? "🗣️"}
              </div>

              {/* Bubble */}
              <div
                onClick={() => !dlg.isPlaying && dlg.playSingleLine(i, speed)}
                style={{
                  maxWidth: "78%",
                  padding: "14px 18px",
                  borderRadius: isLeft ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                  background: isActive
                    ? `color-mix(in srgb, ${colors.accent} 14%, var(--surface))`
                    : "var(--surface)",
                  border: isActive
                    ? `2px solid ${colors.accent}`
                    : `1px solid ${colors.border}`,
                  borderLeft: isLeft ? `3px solid ${colors.accent}` : undefined,
                  borderRight: !isLeft ? `3px solid ${colors.accent}` : undefined,
                  cursor: dlg.isPlaying ? "default" : "pointer",
                  transition: "all 0.2s",
                  position: "relative",
                  boxShadow: isActive
                    ? `0 4px 16px color-mix(in srgb, ${colors.accent} 20%, transparent)`
                    : colors.shadow,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: colors.accent,
                    flexShrink: 0,
                  }} />
                  <Text style={{ fontSize: 12, fontWeight: 800, color: colors.text, letterSpacing: "0.02em" }}>
                    {line.name}
                  </Text>
                </div>
                <Text style={{ fontSize: 15, color: "var(--text-primary)", lineHeight: 1.7, display: "block", fontWeight: 500 }}>
                  {line.text}
                </Text>
                {isActive && dlg.isLoading && (
                  <LoadingOutlined style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: colors.accent }} spin />
                )}
                {isActive && !dlg.isLoading && dlg.isPlaying && (
                  <SoundOutlined style={{ position: "absolute", top: 10, right: 10, fontSize: 14, color: colors.accent }} />
                )}
              </div>
            </m.div>
          );
        })}
      </div>

      {/* ── Step 1: Listen first CTA ── */}
      {!hasListenedOnce && !rolePlaySpeaker && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 8%, var(--surface)), color-mix(in srgb, var(--secondary, #a78bfa) 5%, var(--surface)))",
            borderRadius: "var(--radius-xl)",
            border: "2px solid color-mix(in srgb, var(--accent) 25%, var(--border))",
            padding: "20px",
            textAlign: "center",
            boxShadow: "0 4px 20px var(--accent-muted), var(--shadow)",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎧</div>
          <Text style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "block", marginBottom: 4 }}>
            Nghe trước hội thoại
          </Text>
          <Text style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 16, maxWidth: 360, margin: "0 auto 16px" }}>
            Lắng nghe cuộc trò chuyện giữa những người bản xứ trước khi bạn đóng vai nhé!
          </Text>

          <Flex gap={10} justify="center" wrap="wrap">
            <m.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={isListeningPreview ? dlg.stop : listenPreview}
              disabled={dlg.isLoading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 28px", borderRadius: 14,
                border: "none",
                background: isListeningPreview
                  ? "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 80%, #000))"
                  : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                color: "#fff",
                fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "var(--font-body)",
                boxShadow: isListeningPreview
                  ? "0 4px 14px rgba(239, 68, 68, 0.3)"
                  : "0 4px 14px var(--accent-muted)",
                minWidth: 200,
                justifyContent: "center",
              }}
            >
              {dlg.isLoading ? (
                <><LoadingOutlined spin /> Đang tải...</>
              ) : isListeningPreview ? (
                <><PauseCircleOutlined /> Dừng nghe</>
              ) : (
                <><PlayCircleOutlined /> Nghe hội thoại</>
              )}
            </m.button>

            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={skipListenPreview}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "14px 20px", borderRadius: 14,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text-muted)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              Bỏ qua →
            </m.button>
          </Flex>

          {/* Listening / batch-loading progress indicator */}
          {isListeningPreview && dlg.dialogue && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 14,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <m.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }}
              />
              <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                {dlg.isLoading && dlg.batchProgress
                  ? `Đang tải audio ${dlg.batchProgress.loaded}/${dlg.batchProgress.total}...`
                  : dlg.isLoading
                    ? `Đang tải audio ${dlg.dialogue.lines.length} câu...`
                    : `Đang phát câu ${Math.max(1, (dlg.activeLineIndex ?? 0) + 1)} / ${dlg.dialogue.lines.length}`}
              </Text>
            </m.div>
          )}
        </m.div>
      )}

      {/* ── Step 2: Role-play controls (after listening) ── */}
      {hasListenedOnce && !rolePlaySpeaker && !dlg.isPlaying && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            padding: "16px 20px",
            boxShadow: "var(--shadow)",
          }}
        >
          {/* Replay button */}
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
              🎙️ Đóng vai — Chọn nhân vật bạn muốn đọc
            </Text>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={listenPreview}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 12px", borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface-alt)",
                color: "var(--text-muted)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              <PlayCircleOutlined /> Nghe lại
            </m.button>
          </Flex>
          <Flex gap={8}>
            {dlg.voiceAssignments.map((a) => {
              const line = dlg.dialogue!.lines.find((l) => l.speaker === a.speaker);
              return (
                <m.button
                  key={a.speaker}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startRolePlay(a.speaker)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, padding: "12px 16px", borderRadius: 12,
                    border: `1px solid ${SPEAKER_COLORS[a.speaker]?.border ?? "var(--border)"}`,
                    background: SPEAKER_COLORS[a.speaker]?.bg ?? "var(--surface-alt)",
                    color: SPEAKER_COLORS[a.speaker]?.text ?? "var(--text-primary)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  {a.flag} Đóng vai {line?.name ?? a.voiceName}
                </m.button>
              );
            })}
          </Flex>
        </m.div>
      )}

      {/* Role-play active */}
      <AnimatePresence>
        {rolePlaySpeaker && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              background: "var(--surface)",
              borderRadius: "var(--radius-xl)",
              border: "2px solid var(--accent)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              boxShadow: "0 4px 20px var(--accent-muted), var(--shadow-md)",
            }}
          >
            <Flex justify="space-between" align="center">
              <Text style={{ fontSize: 14, fontWeight: 800, color: "var(--accent)" }}>
                🎙️ Đang đóng vai — Bạn là {dlg.dialogue.lines.find((l) => l.speaker === rolePlaySpeaker)?.name ?? "..."}
              </Text>
              <m.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setRolePlaySpeaker(null); setRolePlayStep("idle"); dlg.stop(); }}
                style={{
                  padding: "4px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--surface-alt)",
                  color: "var(--text-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Thoát
              </m.button>
            </Flex>

            {rolePlayStep === "idle" && (
              <m.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => playRolePlayLine(0)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "var(--text-on-accent)", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", fontFamily: "var(--font-body)",
                }}
              >
                ▶ Bắt đầu hội thoại
              </m.button>
            )}

            {rolePlayStep === "listening" && (
              <Flex align="center" justify="center" gap={8} style={{ padding: 12 }}>
                <m.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                  style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--accent)" }} />
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                  Đang nghe đối phương nói...
                </Text>
              </Flex>
            )}

            {rolePlayStep === "recording" && (
              <Flex vertical gap={8} align="center" style={{ padding: 12 }}>
                <Flex align="center" gap={8}>
                  <m.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}
                    style={{ width: 14, height: 14, borderRadius: "50%", background: "var(--error)" }} />
                  <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--error)" }}>
                    Lượt bạn! Hãy đọc câu của mình
                  </Text>
                </Flex>
                <Text style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                  &quot;{dlg.dialogue.lines[rolePlayLineIndex]?.text}&quot;
                </Text>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopAndEvaluateRolePlay}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "10px 24px", borderRadius: 12,
                    border: "2px solid var(--error)", background: "rgba(239,68,68,0.08)",
                    color: "var(--error)", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  <StopOutlined /> Dừng & chấm điểm
                </m.button>
              </Flex>
            )}

            {rolePlayStep === "evaluating" && (
              <Flex align="center" justify="center" gap={8} style={{ padding: 16 }}>
                <LoadingOutlined spin style={{ fontSize: 20, color: "var(--accent)" }} />
                <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                  🤖 Đang chấm điểm...
                </Text>
              </Flex>
            )}

            {rolePlayStep === "result" && rolePlayResult && (
              <>
                <ShadowResult result={rolePlayResult} referenceText={dlg.dialogue.lines[rolePlayLineIndex]?.text ?? ""} />
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={continueAfterRolePlay}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 12,
                    border: "none",
                    background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                    color: "var(--text-on-accent)", fontSize: 14, fontWeight: 800,
                    cursor: "pointer", fontFamily: "var(--font-body)",
                  }}
                >
                  {rolePlayLineIndex < dlg.dialogue.lines.length - 1 ? "➡️ Tiếp tục" : "🎉 Hoàn thành"}
                </m.button>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
