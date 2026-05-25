"use client";

import { Flex, Typography, Slider } from "antd";
import {
  SoundOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  LoadingOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { SPEED_PRESETS, type VoiceOption } from "../_data/voices";

const { Text } = Typography;

interface PlaybackControlsProps {
  loading: boolean;
  playing: boolean;
  audioUrl: string | null;
  text: string;
  selectedVoice: VoiceOption;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onGenerate: () => void;
  onTogglePlayback: () => void;
  onStop: () => void;
}

export function PlaybackControls({
  loading,
  playing,
  audioUrl,
  text,
  selectedVoice,
  speed,
  onSpeedChange,
  onGenerate,
  onTogglePlayback,
  onStop,
}: PlaybackControlsProps) {
  return (
    <>
      {/* Speed & Generate */}
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="read-aloud-panel"
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
            onChange={onSpeedChange}
            tooltip={{ formatter: (val) => `${val}x` }}
            styles={{
              track: { background: "var(--accent)" },
              handle: { borderColor: "var(--accent)", width: 14, height: 14 },
            }}
          />

          {/* Preset Quick Select */}
          <Flex justify="space-between" style={{ marginTop: 8 }} gap={6}>
            {SPEED_PRESETS.map((preset) => (
              <m.button
                key={preset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(preset)}
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
            onClick={onGenerate}
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
              <><LoadingOutlined spin /> Đang xử lý giọng nói...</>
            ) : (
              <><SoundOutlined /> Bắt đầu nghe đọc</>
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
                  onClick={onTogglePlayback}
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
                  onClick={onStop}
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

      {/* Dynamic Waveform Visualizer */}
      <WaveformVisualizer loading={loading} playing={playing} selectedVoice={selectedVoice} />
    </>
  );
}

/* ── Waveform ── */
function WaveformVisualizer({ loading, playing, selectedVoice }: { loading: boolean; playing: boolean; selectedVoice: VoiceOption }) {
  if (!playing && !loading) return null;

  return (
    <AnimatePresence>
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
              width: 24, height: 24, borderRadius: "50%",
              border: "3px solid var(--accent-light)",
              borderTopColor: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
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
    </AnimatePresence>
  );
}
