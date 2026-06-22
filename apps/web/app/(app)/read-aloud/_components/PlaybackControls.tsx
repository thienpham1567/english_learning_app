"use client";

import {
  Download,
  Loader2,
  Mic,
  PauseCircle,
  PlayCircle,
  Settings,
  Undo,
  Volume2,
  Zap,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-client";
import { SPEED_PRESETS, type VoiceOption } from "../_data/voices";

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
  const canStart = !loading && text.trim();

  return (
    <>
      {/* Speed & Generate */}
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-surface border border-border rounded-2xl flex flex-col p-5 gap-4 shadow-sm"
      >
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em] flex items-center gap-1.5">
          <m.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="inline-flex text-accent"
          >
            <Settings size={13} />
          </m.span>
          Cấu hình phát
        </span>

        {/* Speed Controller */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">
              Tốc độ đọc
            </span>
            <span className="font-mono text-sm font-bold text-accent tabular-nums">
              {speed}x
            </span>
          </div>

          {/* Custom range slider */}
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.1}
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-border appearance-none cursor-pointer accent-accent"
          />

          {/* Preset Quick Select */}
          <div className="flex justify-between gap-1.5 mt-2">
            {SPEED_PRESETS.map((preset) => (
              <m.button
                key={preset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(preset)}
                className={`flex-1 font-mono text-[11px] font-semibold uppercase cursor-pointer py-1.5 rounded-lg transition-all duration-200 border ${
                  speed === preset
                    ? "bg-accent text-text-on-accent border-accent shadow-sm"
                    : "bg-surface-alt text-text-secondary border-border hover:text-ink hover:bg-surface-hover"
                }`}
              >
                {preset === 1.0 ? "1x" : `${preset}x`}
              </m.button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <m.button
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
            onClick={onGenerate}
            disabled={!canStart}
            className={`flex items-center justify-center gap-2.5 py-4 px-5 rounded-xl border text-base font-bold tracking-tight transition-all duration-200 ${
              canStart
                ? "cursor-pointer bg-accent text-text-on-accent border-accent shadow-md hover:shadow-lg active:scale-[0.98]"
                : "cursor-not-allowed bg-bg-deep text-text-muted border-border"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Đang xử lý giọng…
              </>
            ) : (
              <>
                <Volume2 /> Bắt đầu nghe
              </>
            )}
          </m.button>

          <AnimatePresence>
            {audioUrl && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 mt-1"
              >
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onTogglePlayback}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-surface text-text-primary text-sm font-semibold cursor-pointer rounded-xl border border-border shadow-sm hover:shadow transition-all duration-200"
                >
                  {playing ? (
                    <PauseCircle className="text-accent" />
                  ) : (
                    <PlayCircle className="text-success" />
                  )}
                  {playing ? "Tạm dừng" : "Tiếp tục"}
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStop}
                  className="flex items-center justify-center text-error text-sm font-semibold cursor-pointer py-3 px-4.5 rounded-xl border border-error/20 bg-error/5 shadow-sm hover:shadow transition-all duration-200"
                >
                  <Undo size={16} />
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!audioUrl) return;
                    const a = document.createElement("a");
                    a.href = audioUrl;
                    a.download = `read-aloud-${Date.now()}.mp3`;
                    a.click();
                  }}
                  className="flex items-center justify-center text-accent text-sm font-semibold cursor-pointer py-3 px-4.5 rounded-xl border border-accent/20 bg-accent/5 shadow-sm hover:shadow transition-all duration-200"
                  title="Download audio"
                >
                  <Download size={16} />
                </m.button>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>

      {/* Dynamic Waveform Visualizer */}
      <WaveformVisualizer loading={loading} playing={playing} selectedVoice={selectedVoice} />
    </>
  );
}

/* ── Waveform ── */
function WaveformVisualizer({
  loading,
  playing,
  selectedVoice,
}: {
  loading: boolean;
  playing: boolean;
  selectedVoice: VoiceOption;
}) {
  if (!playing && !loading) return null;

  return (
    <AnimatePresence>
      <m.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="flex items-center justify-between gap-4 p-4 px-5 shadow-sm rounded-2xl border border-border bg-surface"
      >
        <div className="waveform-container flex items-center gap-2.5">
          <m.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-accent-light border-t-accent"
          />
          <span className="text-sm font-medium text-text-primary">
            {loading ? (
              "Đang tạo audio…"
            ) : (
              <span className="inline-flex items-center gap-1 flex-wrap">
                {selectedVoice.provider === "elevenlabs" ? (
                  <span className="inline-flex items-center gap-1">
                    <Mic className="h-3.5 w-3.5 text-accent" /> ElevenLabs
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-accent fill-accent/20" /> Groq
                  </span>
                )}
                {" • "}
                {selectedVoice.flag}{" "}
                <strong className="text-accent">{selectedVoice.name}</strong> (
                {selectedVoice.label})
              </span>
            )}
          </span>
        </div>

        {/* Dynamic Soundwave bars */}
        <div className="waveform-bars h-9 flex items-end gap-[3px]">
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
              className={`w-[3px] rounded-full transition-all duration-150 ${
                playing
                  ? "bg-gradient-to-t from-accent to-accent/50 opacity-80"
                  : "bg-border-strong opacity-40"
              }`}
            />
          ))}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
