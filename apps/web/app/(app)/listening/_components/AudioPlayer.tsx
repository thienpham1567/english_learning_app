"use client";

import {
  AlertTriangle,
  Eraser,
  Headphones,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Repeat,
  Scissors,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";

// ── Speed presets (AC1) ──
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

function nextSpeed(current: number): SpeedOption {
  const idx = SPEED_OPTIONS.indexOf(current as SpeedOption);
  return SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
}

function prevSpeed(current: number): SpeedOption {
  const idx = SPEED_OPTIONS.indexOf(current as SpeedOption);
  return SPEED_OPTIONS[(idx - 1 + SPEED_OPTIONS.length) % SPEED_OPTIONS.length];
}

// ── Types ──
export type AudioPlayerProps = {
  audioUrl: string;
  /** Current playback speed — managed externally for legacy compat */
  speed: number;
  replaysUsed: number;
  maxReplays: number;
  onReplay: () => boolean;
  onCycleSpeed: () => void;
  /** Optional: if true, player manages speed internally (19.3.2 mode) */
  selfManagedSpeed?: boolean;
  className?: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  audioUrl,
  speed: externalSpeed,
  replaysUsed,
  maxReplays,
  onReplay,
  onCycleSpeed,
  selfManagedSpeed = false,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);

  // A-B loop state (AC2)
  const [markerA, setMarkerA] = useState<number | null>(null);
  const [markerB, setMarkerB] = useState<number | null>(null);
  const [looping, setLooping] = useState(false);

  // Internal speed state (AC1 — self-managed mode)
  const [internalSpeed, setInternalSpeed] = useState<SpeedOption>(1);
  const speed = selfManagedSpeed ? internalSpeed : externalSpeed;

  // ── Sync playbackRate + preservesPitch (AC3) ──
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      // Always set preservesPitch explicitly (AC3)
      audioRef.current.preservesPitch = true;
    }
  }, [speed]);

  // ── Time update with A-B loop enforcement ──
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = audio.currentTime;
    setCurrentTime(t);

    // A-B loop: when looping and time exceeds B, jump back to A
    if (looping && markerA != null && markerB != null && t >= markerB) {
      audio.currentTime = markerA;
    }
  }, [looping, markerA, markerB]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d)) setDuration(d);
      setIsLoading(false);
      setAudioError(null);
    }
  }, []);

  // For streamed audio that initially reports Infinity, the browser fires
  // `durationchange` once the full file has been buffered and the real
  // duration is known.
  const handleDurationChange = useCallback(() => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setAudioError("Unable to load audio. Click Replay to try again.");
  }, []);

  const handleStalled = useCallback(() => {
    // For streamed audio, stalling is normal during initial buffering.
    // Only show error if we've been stalling with zero buffered data for a while.
    const audio = audioRef.current;
    if (!audio) return;
    // If there's any buffered data, stalling is just buffering — not an error
    if (audio.buffered.length > 0) return;
    // If duration is already known, the audio loaded fine — just a network hiccup
    if (Number.isFinite(audio.duration) && audio.duration > 0) return;
    // Set a delayed error only for truly stuck cases
    const timer = setTimeout(() => {
      if (
        audioRef.current &&
        audioRef.current.buffered.length === 0 &&
        !Number.isFinite(audioRef.current.duration)
      ) {
        setIsLoading(false);
        setAudioError("Audio loading interrupted. Click Replay to try again.");
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnded = useCallback(() => {
    // If A-B looping is active, jump back to A instead of stopping
    if (looping && markerA != null && markerB != null && audioRef.current) {
      audioRef.current.currentTime = markerA;
      audioRef.current.play().catch(() => {});
      return;
    }
    setIsPlaying(false);
  }, [looping, markerA, markerB]);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    setAudioError(null);
    // For streamed audio, duration may become available at canplay
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }
  }, []);

  // 'playing' event fires when audio actually starts playing — most reliable signal
  const handlePlaying = useCallback(() => {
    setIsLoading(false);
    setAudioError(null);
    setIsPlaying(true);
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleReplay = useCallback(() => {
    if (onReplay() && audioRef.current) {
      setAudioError(null);
      setIsLoading(true);
      audioRef.current.load(); // re-fetch audio in case of previous error
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [onReplay]);

  // ── A-B loop controls (AC2) ──
  const setA = useCallback(() => {
    setMarkerA(currentTime);
    // If B is already set and less than new A, clear B
    if (markerB != null && markerB <= currentTime) {
      setMarkerB(null);
      setLooping(false);
    }
  }, [currentTime, markerB]);

  const setB = useCallback(() => {
    if (markerA == null) return; // A must be set first
    if (currentTime <= markerA) return; // B must be after A
    setMarkerB(currentTime);
  }, [currentTime, markerA]);

  const toggleLoop = useCallback(() => {
    if (markerA == null || markerB == null) return;
    setLooping((prev) => {
      const willLoop = !prev;
      // When enabling loop, jump to A immediately
      if (willLoop && audioRef.current) {
        audioRef.current.currentTime = markerA;
        if (!isPlaying) {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
      return willLoop;
    });
  }, [markerA, markerB, isPlaying]);

  const clearMarkers = useCallback(() => {
    setMarkerA(null);
    setMarkerB(null);
    setLooping(false);
  }, []);

  // ── Speed controls (self-managed mode) ──
  const handleCycleSpeed = useCallback(() => {
    if (selfManagedSpeed) {
      setInternalSpeed((prev) => nextSpeed(prev));
    } else {
      onCycleSpeed();
    }
  }, [selfManagedSpeed, onCycleSpeed]);

  // ── Seek by delta ──
  const seekDelta = useCallback(
    (deltaSec: number) => {
      if (!audioRef.current) return;
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + deltaSec, duration));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration],
  );

  // ── Keyboard shortcuts (AC5) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      // Only respond when player container or its children are focused
      if (!container.contains(document.activeElement) && document.activeElement !== container)
        return;
      // Don't fire when typing in input/textarea
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key) {
        case "[":
          e.preventDefault();
          setA();
          break;
        case "]":
          e.preventDefault();
          setB();
          break;
        case "l":
        case "L":
          e.preventDefault();
          toggleLoop();
          break;
        case "ArrowLeft":
          e.preventDefault();
          seekDelta(-3);
          break;
        case "ArrowRight":
          e.preventDefault();
          seekDelta(3);
          break;
        case ",":
          e.preventDefault();
          if (selfManagedSpeed) {
            setInternalSpeed((prev) => prevSpeed(prev));
          }
          break;
        case ".":
          e.preventDefault();
          if (selfManagedSpeed) {
            setInternalSpeed((prev) => nextSpeed(prev));
          }
          break;
        case " ":
          e.preventDefault();
          togglePlay();
          break;
      }
    };

    container.addEventListener("keydown", handler);
    return () => container.removeEventListener("keydown", handler);
  }, [setA, setB, toggleLoop, seekDelta, togglePlay, selfManagedSpeed]);

  // ── Clear markers on audioUrl change (AC6) ──
  useEffect(() => {
    clearMarkers();
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setIsLoading(true);
  }, [audioUrl, clearMarkers]);

  // ── Timeout fallback: if audio doesn't load within 30s, show error ──
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      if (isLoading && !audioRef.current?.duration) {
        setIsLoading(false);
        setAudioError("Audio loading took too long. Click Replay to try again.");
      }
    }, 30_000);
    return () => clearTimeout(timer);
  }, [isLoading, audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const markerAPos = duration > 0 && markerA != null ? (markerA / duration) * 100 : null;
  const markerBPos = duration > 0 && markerB != null ? (markerB / duration) * 100 : null;

  const canSetB = markerA != null;
  const canLoop = markerA != null && markerB != null;

  return (
    <Card
      ref={containerRef}
      tabIndex={0}
      shadowSize="sm"
      className={`${className ?? ""} gap-3.5 p-5 outline-none focus-visible:shadow`}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleDurationChange}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
        onError={handleError}
        onStalled={handleStalled}
        preload="auto"
      />

      {/* Audio error message */}
      {audioError && (
        <div className="rounded-lg text-[var(--error)] text-xs text-center py-2 px-3.5 bg-error-bg border-2 border-[color-mix(in_srgb,var(--error)_20%,var(--border))] flex items-center justify-center gap-1.5">
          <AlertTriangle size={14} /> {audioError}
        </div>
      )}

      {/* Play button + seek bar */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={togglePlay}
          disabled={isLoading}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`bg-transparent border-none text-accent text-4xl leading-none flex p-0 transition-transform duration-150 ${
            isLoading ? "cursor-wait opacity-50" : "cursor-pointer"
          }`}
        >
          {isPlaying ? <PauseCircle size={36} /> : <PlayCircle size={36} />}
        </motion.button>

        <div className="flex-1 flex flex-col gap-1">
          {/* Seek bar with marker ticks */}
          <div className="relative h-[6px] rounded-sm bg-border overflow-visible">
            {/* A-B highlighted region */}
            {markerAPos != null && markerBPos != null && (
              <div
                className={`absolute h-full rounded-sm transition-colors duration-200 ${
                  looping ? "bg-[color-mix(in_srgb,var(--success)_30%,transparent)]" : "bg-[color-mix(in_srgb,var(--info)_20%,transparent)]"
                }`}
                style={{ left: `${markerAPos}%`, width: `${markerBPos - markerAPos}%`, top: 0 }}
              />
            )}
            {/* Progress fill */}
            <div
              className="absolute h-full rounded-sm bg-gradient-to-r from-accent to-accent-hover transition-[width] duration-100 ease-linear"
              style={{ left: 0, top: 0, width: `${progress}%` }}
            />
            {/* Marker A tick */}
            {markerAPos != null && (
              <div
                title={`A: ${formatTime(markerA!)}`}
                className="absolute w-[3px] h-[12px] bg-[var(--success)] rounded-sm -translate-x-1/2 z-[2]"
                style={{ left: `${markerAPos}%`, top: -3 }}
              />
            )}
            {/* Marker B tick */}
            {markerBPos != null && (
              <div
                title={`B: ${formatTime(markerB!)}`}
                className="absolute w-[3px] h-[12px] bg-[var(--error)] rounded-sm -translate-x-1/2 z-[2]"
                style={{ left: `${markerBPos}%`, top: -3 }}
              />
            )}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-[14px] cursor-pointer m-0 opacity-0 top-[-4px] left-0"
            />
          </div>

          {/* Time display */}
          <div className="flex justify-between text-[11px] text-text-muted font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{isLoading ? "Loading..." : formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls row: replay + speed */}
      <div className="flex justify-center gap-2.5 flex-wrap">
        {/* Replay button */}
        <motion.button
          onClick={handleReplay}
          disabled={replaysUsed >= maxReplays}
          whileHover={replaysUsed < maxReplays ? { y: -2 } : {}}
          whileTap={replaysUsed < maxReplays ? { scale: 0.97 } : {}}
          className={`flex items-center gap-1.5 rounded-lg border-2 border-border text-xs font-bold py-2 px-3.5 transition-all duration-100 ${
            replaysUsed >= maxReplays
              ? "bg-bg-deep text-text-muted cursor-not-allowed"
              : "bg-surface text-text-primary cursor-pointer hover:bg-surface-hover hover:shadow-sm hover:-translate-y-0.5"
          }`}
        >
          <RefreshCw size={13} />
          Replay ({maxReplays - replaysUsed}/{maxReplays})
        </motion.button>

        {/* Speed control (AC1) */}
        <motion.button
          onClick={handleCycleSpeed}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          className={`flex items-center gap-1.5 rounded-lg border-2 border-border cursor-pointer text-xs font-bold w-[80px] justify-center py-2 px-3.5 transition-all duration-100 ${
            speed !== 1
              ? "bg-accent-muted text-accent"
              : "bg-surface text-text-primary hover:bg-surface-hover"
          }`}
        >
          <Zap size={13} />
          {speed}×
        </motion.button>
      </div>

      {/* A-B Loop controls (AC2) */}
      <div className="flex justify-center gap-2 flex-wrap pt-3 border-t-2 border-border">
        {/* Set A */}
        <motion.button
          onClick={setA}
          disabled={isLoading}
          whileHover={{ y: -1 }}
          title="Set A marker [ [ ]"
          className={`flex items-center gap-1 py-1.5 px-3 rounded-lg cursor-pointer text-[11px] font-bold border-2 transition-all duration-100 ${
            markerA != null
              ? "border-[var(--success)] bg-success-bg text-[var(--success)]"
              : "border-border bg-surface text-text-muted hover:bg-surface-hover"
          }`}
        >
          <Scissors size={12} />A{markerA != null ? ` ${formatTime(markerA)}` : ""}
        </motion.button>

        {/* Set B */}
        <motion.button
          onClick={setB}
          disabled={!canSetB || isLoading}
          whileHover={canSetB ? { y: -1 } : {}}
          title="Set B marker [ ] ]"
          className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-bold border-2 transition-all duration-100 ${
            markerB != null
              ? "border-[var(--error)] bg-error-bg text-[var(--error)] cursor-pointer"
              : canSetB
                ? "border-border bg-surface text-text-muted cursor-pointer hover:bg-surface-hover"
                : "border-border bg-surface text-border cursor-not-allowed"
          }`}
        >
          <Scissors size={12} />B{markerB != null ? ` ${formatTime(markerB)}` : ""}
        </motion.button>

        {/* Toggle Loop */}
        <motion.button
          onClick={toggleLoop}
          disabled={!canLoop}
          whileHover={canLoop ? { y: -1 } : {}}
          title="Toggle loop [ L ]"
          className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-[11px] font-bold border-2 transition-all duration-100 ${
            looping
              ? "border-[var(--success)] bg-success-bg text-[var(--success)] cursor-pointer"
              : canLoop
                ? "border-border bg-surface text-text-muted cursor-pointer hover:bg-surface-hover"
                : "border-border bg-surface text-border cursor-not-allowed"
          }`}
        >
          <Repeat size={13} />
          {looping ? "Looping" : "Loop"}
        </motion.button>

        {/* Clear */}
        <motion.button
          onClick={clearMarkers}
          disabled={markerA == null && markerB == null}
          whileHover={markerA != null || markerB != null ? { y: -1 } : {}}
          title="Clear markers"
          className={`flex items-center gap-1 py-1.5 px-3 rounded-lg border-2 border-border bg-surface text-[11px] font-bold transition-all duration-100 ${
            markerA != null || markerB != null
              ? "text-text-primary cursor-pointer hover:bg-surface-hover"
              : "text-border cursor-not-allowed"
          }`}
        >
          <Eraser size={12} />
          Clear
        </motion.button>
      </div>

      {/* preservesPitch note (AC3) */}
      <div className="text-[10px] text-text-muted text-center flex items-center justify-center gap-1 flex-wrap">
        {speed !== 1 && (
          <>
            <Headphones size={10} /> Pitch preserved ·{" "}
          </>
        )}
        Shortcuts: [ ] Set A/B · L Loop · ←/→ ±3s{selfManagedSpeed ? " · ,/. Speed" : ""} · Space
        Play/Pause
      </div>
    </Card>
  );
}
