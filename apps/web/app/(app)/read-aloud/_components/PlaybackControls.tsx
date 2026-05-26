"use client";

import { Flex, Typography, Slider } from "antd";

import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { SPEED_PRESETS, type VoiceOption } from "../_data/voices";
import {
  Loader2,
  PauseCircle,
  PlayCircle,
  Undo,
  Volume2,
} from "lucide-react";

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
      <m.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="read-aloud-panel bg-(--surface) rounded-(--radius-xl) border border-(--border) flex flex-col" style={{padding: "var(--space-5)", boxShadow: "var(--shadow-md)", gap: "var(--space-4)"}} >
        <Text className="text-xs font-bold text-text-muted uppercase tracking-widest block" >
          ⚙️ Cấu hình phát
        </Text>

        {/* Speed Controller */}
        <div>
          <Flex align="center" justify="space-between" className="mb-1" >
            <Text className="text-[13px] text-text-secondary font-semibold" >Tốc độ đọc</Text>
            <Text className="text-sm font-extrabold text-accent" >{speed}x</Text>
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
          <Flex justify="space-between"  gap={6} className="mt-2" >
            {SPEED_PRESETS.map((preset) => (
              <m.button
                key={preset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(preset)} className="flex-1 text-[11px] font-bold rounded-lg cursor-pointer" style={{padding: "4px 0", border: speed === preset ? "1px solid var(--accent)" : "1px solid var(--border)", background: speed === preset ? "var(--accent-light)" : "var(--surface-alt)", color: speed === preset ? "var(--accent)" : "var(--text-secondary)", transition: "all 0.2s"}} >
                {preset === 1.0 ? "Chuẩn" : `${preset}x`}
              </m.button>
            ))}
          </Flex>
        </div>

        <div className="h-[1px]" style={{background: "var(--border)", margin: "4px 0"}} />

        {/* Action Buttons */}
        <Flex vertical gap={8}>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerate}
            disabled={loading || !text.trim()} className="flex items-center justify-center gap-2.5 py-4 px-5 rounded-(--radius-lg) border-none text-base font-extrabold font-body" style={{background: loading || !text.trim()
                ? "var(--border)"
                : "linear-gradient(135deg, var(--accent), var(--accent-hover))", color: loading || !text.trim()
                ? "var(--text-muted)"
                : "var(--text-on-accent)", cursor: loading || !text.trim() ? "not-allowed" : "pointer", boxShadow: !loading && text.trim() ? "0 4px 14px var(--accent-muted)" : "none", transition: "all 0.2s ease"}} >
            {loading ? (
              <><Loader2 className="animate-spin" /> Đang xử lý giọng nói...</>
            ) : (
              <><Volume2 /> Bắt đầu nghe đọc</>
            )}
          </m.button>

          <AnimatePresence>
            {audioUrl && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="flex gap-2 mt-1" >
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onTogglePlayback} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-(--radius-lg) bg-(--surface) text-text-primary text-sm font-bold cursor-pointer" style={{border: "1px solid var(--border-strong)"}} >
                  {playing ? <PauseCircle className="text-accent" /> : <PlayCircle style={{ color: "var(--sage)" }} />}
                  {playing ? "Tạm dừng" : "Tiếp tục phát"}
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStop} className="flex items-center justify-center rounded-(--radius-lg) text-destructive text-sm font-bold cursor-pointer" style={{padding: "12px 18px", border: "1px solid rgba(239, 68, 68, 0.2)", background: "var(--error-bg)"}} >
                  <Undo />
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
        exit={{ opacity: 0, scale: 0.95, y: 10 }} className="rounded-(--radius-xl) flex items-center justify-between gap-4" style={{background: "linear-gradient(90deg, var(--surface), var(--surface-alt))", border: "2px solid var(--accent-light)", padding: "var(--space-4) var(--space-5)", boxShadow: "var(--shadow-md)"}} >
        <div className="waveform-container flex items-center gap-2.5" >
          <m.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-[24px] h-[24px] rounded-full flex items-center justify-center" style={{border: "3px solid var(--accent-light)", borderTopColor: "var(--accent)"}} />
          <Text className="text-sm font-bold text-text-primary" >
            {loading ? (
              "Đang nén & tạo tệp âm thanh..."
            ) : (
              <span>
                Đang đọc giọng {selectedVoice.flag} <strong className="text-accent" >{selectedVoice.name}</strong> ({selectedVoice.label})
              </span>
            )}
          </Text>
        </div>

        {/* Dynamic Soundwave bars */}
        <Flex className="waveform-bars h-[36px]" gap={3} align="flex-end" >
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
              }} className="w-[3px] rounded-sm" style={{background: playing
                  ? "linear-gradient(to top, var(--accent), var(--xp))"
                  : "var(--border-strong)", opacity: playing ? 0.8 : 0.4}} />
          ))}
        </Flex>
      </m.div>
    </AnimatePresence>
  );
}
