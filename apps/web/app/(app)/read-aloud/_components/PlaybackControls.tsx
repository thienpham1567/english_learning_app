"use client";

import { Download, Loader2, PauseCircle, PlayCircle, Undo, Volume2, Settings } from "lucide-react";
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
        className="read-aloud-panel bg-surface rounded-xl border-2 border-border flex flex-col p-5 gap-4 shadow-md"
      >
        <span className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5">
          <m.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="inline-flex text-text-muted"
          >
            <Settings size={13} />
          </m.span>
          Playback Configuration
        </span>

        {/* Speed Controller */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] text-text-secondary font-semibold">Reading Speed</span>
            <span className="text-sm font-extrabold text-accent-active">{speed}x</span>
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
                className={`flex-1 text-[11px] font-extrabold rounded-lg cursor-pointer py-1 transition-all duration-200 ${
                  speed === preset
                    ? "border-2 border-border bg-accent text-ink shadow-sm"
                    : "border-2 border-border bg-surface-alt text-text-secondary hover:border-border-strong"
                }`}
              >
                {preset === 1.0 ? "Normal" : `${preset}x`}
              </m.button>
            ))}
          </div>
        </div>

        <div className="h-px bg-border my-1" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <m.button
            whileHover={canStart ? { scale: 1.02 } : {}}
            whileTap={canStart ? { scale: 0.98 } : {}}
            onClick={onGenerate}
            disabled={!canStart}
            className={`flex items-center justify-center gap-2.5 py-4 px-5 rounded-xl border-2 border-border text-base font-black font-body transition-all duration-200 ${
              canStart
                ? "cursor-pointer bg-accent text-ink shadow hover:bg-accent-hover"
                : "cursor-not-allowed bg-bg-deep text-text-muted border-border/40"
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> Processing voice...
              </>
            ) : (
              <>
                <Volume2 /> Start Listening
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
                  className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl bg-surface text-text-primary text-sm font-bold cursor-pointer border-2 border-border shadow-sm hover:bg-surface-hover"
                >
                  {playing ? (
                    <PauseCircle className="text-accent-active" />
                  ) : (
                    <PlayCircle className="text-success" />
                  )}
                  {playing ? "Pause" : "Resume"}
                </m.button>
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onStop}
                  className="flex items-center justify-center rounded-xl text-destructive text-sm font-bold cursor-pointer py-3 px-4.5 border-2 border-border bg-error/10 hover:bg-error/20 shadow-sm"
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
                  className="flex items-center justify-center rounded-xl text-accent text-sm font-bold cursor-pointer py-3 px-4.5 border-2 border-border bg-accent/10 hover:bg-accent/20 shadow-sm"
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
        className="rounded-xl flex items-center justify-between gap-4 p-4 px-5 shadow-md border-2 border-accent bg-gradient-to-r from-surface to-surface-alt"
      >
        <div className="waveform-container flex items-center gap-2.5">
          <m.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-6 h-6 rounded-full flex items-center justify-center border-[3px] border-accent-light border-t-accent"
          />
          <span className="text-sm font-bold text-text-primary">
            {loading ? (
              "Compiling & generating audio..."
            ) : (
              <span>
                {selectedVoice.provider === "elevenlabs" ? "🎙 ElevenLabs" : "⚡ Groq"} • {selectedVoice.flag}{" "}
                <strong className="text-accent-active">{selectedVoice.name}</strong> (
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
              className={`w-[3px] rounded-sm transition-all duration-150 ${
                playing
                  ? "bg-gradient-to-t from-accent to-xp opacity-80"
                  : "bg-border-strong opacity-40"
              }`}
            />
          ))}
        </div>
      </m.div>
    </AnimatePresence>
  );
}
