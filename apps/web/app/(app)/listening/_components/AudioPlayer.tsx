"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  RetweetOutlined,
  ScissorOutlined,
  ClearOutlined,
} from "@ant-design/icons";

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
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setAudioError(null);
    }
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setAudioError("Không thể tải audio. Nhấn Nghe lại để thử lại.");
  }, []);

  const handleStalled = useCallback(() => {
    // If audio stalls and we still have no duration, treat as error
    if (audioRef.current && !audioRef.current.duration) {
      setIsLoading(false);
      setAudioError("Tải audio bị gián đoạn. Nhấn Nghe lại để thử lại.");
    }
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
  const seekDelta = useCallback((deltaSec: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + deltaSec, duration));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // ── Keyboard shortcuts (AC5) ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: KeyboardEvent) => {
      // Only respond when player container or its children are focused
      if (!container.contains(document.activeElement) && document.activeElement !== container) return;
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
        setAudioError("Tải audio quá lâu. Nhấn Nghe lại để thử lại.");
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
    <div
      ref={containerRef}
      tabIndex={0}
      className={className}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        outline: "none",
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onStalled={handleStalled}
        preload="auto"
      />

      {/* Audio error message */}
      {audioError && (
        <div
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            background: "#ff4d4f12",
            border: "1px solid #ff4d4f30",
            color: "#ff4d4f",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          ⚠️ {audioError}
        </div>
      )}

      {/* Play button + seek bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          style={{
            background: "none",
            border: "none",
            cursor: isLoading ? "wait" : "pointer",
            padding: 0,
            color: "var(--accent)",
            fontSize: 36,
            lineHeight: 1,
            display: "flex",
            transition: "transform 0.15s ease",
          }}
        >
          {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
        </button>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Seek bar with marker ticks (Task 4 visual polish) */}
          <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--border)", overflow: "visible" }}>
            {/* A-B highlighted region */}
            {markerAPos != null && markerBPos != null && (
              <div
                style={{
                  position: "absolute",
                  left: `${markerAPos}%`,
                  width: `${markerBPos - markerAPos}%`,
                  top: 0,
                  height: "100%",
                  background: looping ? "rgba(82, 196, 26, 0.3)" : "rgba(24, 144, 255, 0.2)",
                  borderRadius: 3,
                  transition: "background 0.2s ease",
                }}
              />
            )}
            {/* Progress fill */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                borderRadius: 3,
                transition: "width 0.1s linear",
              }}
            />
            {/* Marker A tick */}
            {markerAPos != null && (
              <div
                style={{
                  position: "absolute",
                  left: `${markerAPos}%`,
                  top: -3,
                  width: 3,
                  height: 12,
                  background: "#52c41a",
                  borderRadius: 1,
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
                title={`A: ${formatTime(markerA!)}`}
              />
            )}
            {/* Marker B tick */}
            {markerBPos != null && (
              <div
                style={{
                  position: "absolute",
                  left: `${markerBPos}%`,
                  top: -3,
                  width: 3,
                  height: 12,
                  background: "#ff4d4f",
                  borderRadius: 1,
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
                title={`B: ${formatTime(markerB!)}`}
              />
            )}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              style={{
                position: "absolute",
                top: -4,
                left: 0,
                width: "100%",
                height: 14,
                opacity: 0,
                cursor: "pointer",
                margin: 0,
              }}
            />
          </div>

          {/* Time display */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
            <span>{formatTime(currentTime)}</span>
            <span>{isLoading ? "Loading..." : formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls row: replay + speed */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Replay button */}
        <button
          onClick={handleReplay}
          disabled={replaysUsed >= maxReplays}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: replaysUsed >= maxReplays ? "var(--border)" : "var(--surface)",
            color: replaysUsed >= maxReplays ? "var(--text-muted)" : "var(--text)",
            cursor: replaysUsed >= maxReplays ? "not-allowed" : "pointer",
            fontSize: 12,
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
        >
          <ReloadOutlined />
          Nghe lại ({maxReplays - replaysUsed}/{maxReplays})
        </button>

        {/* Speed control (AC1) */}
        <button
          onClick={handleCycleSpeed}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: speed !== 1 ? "var(--accent-surface, rgba(99,102,241,0.08))" : "var(--surface)",
            color: speed !== 1 ? "var(--accent)" : "var(--text)",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            transition: "all 0.15s ease",
            minWidth: 80,
            justifyContent: "center",
          }}
        >
          <ThunderboltOutlined />
          {speed}×
        </button>
      </div>

      {/* A-B Loop controls (AC2) */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          flexWrap: "wrap",
          borderTop: "1px solid var(--border)",
          paddingTop: 12,
        }}
      >
        {/* Set A */}
        <button
          onClick={setA}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: markerA != null ? "1px solid #52c41a" : "1px solid var(--border)",
            background: markerA != null ? "#52c41a15" : "var(--surface)",
            color: markerA != null ? "#52c41a" : "var(--text-muted)",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          title="Set A marker [ [ ]"
        >
          <ScissorOutlined />
          A{markerA != null ? ` ${formatTime(markerA)}` : ""}
        </button>

        {/* Set B */}
        <button
          onClick={setB}
          disabled={!canSetB || isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: markerB != null ? "1px solid #ff4d4f" : "1px solid var(--border)",
            background: markerB != null ? "#ff4d4f15" : "var(--surface)",
            color: markerB != null ? "#ff4d4f" : canSetB ? "var(--text-muted)" : "var(--border)",
            cursor: canSetB ? "pointer" : "not-allowed",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          title="Set B marker [ ] ]"
        >
          <ScissorOutlined />
          B{markerB != null ? ` ${formatTime(markerB)}` : ""}
        </button>

        {/* Toggle Loop */}
        <button
          onClick={toggleLoop}
          disabled={!canLoop}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: looping ? "1px solid #52c41a" : "1px solid var(--border)",
            background: looping ? "#52c41a20" : "var(--surface)",
            color: looping ? "#52c41a" : canLoop ? "var(--text-muted)" : "var(--border)",
            cursor: canLoop ? "pointer" : "not-allowed",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          title="Toggle loop [ L ]"
        >
          <RetweetOutlined style={{ fontSize: 13 }} />
          {looping ? "Looping" : "Loop"}
        </button>

        {/* Clear */}
        <button
          onClick={clearMarkers}
          disabled={markerA == null && markerB == null}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: markerA != null || markerB != null ? "var(--text)" : "var(--border)",
            cursor: markerA != null || markerB != null ? "pointer" : "not-allowed",
            fontSize: 11,
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          title="Clear markers"
        >
          <ClearOutlined />
          Clear
        </button>
      </div>

      {/* preservesPitch note (AC3) */}
      <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
        {speed !== 1 && "🎵 Pitch preserved · "}
        Shortcuts: [ ] Set A/B · L Loop · ←/→ ±3s{selfManagedSpeed ? " · ,/. Speed" : ""} · Space Play/Pause
      </div>
    </div>
  );
}
