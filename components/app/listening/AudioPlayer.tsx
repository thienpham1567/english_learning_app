"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

type Props = {
  audioUrl: string;
  speed: number;
  replaysUsed: number;
  maxReplays: number;
  onReplay: () => boolean;
  onCycleSpeed: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ audioUrl, speed, replaysUsed, maxReplays, onReplay, onCycleSpeed }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Update playback rate when speed changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        // Browser may block autoplay — silently fail
      });
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
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [onReplay]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
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
        preload="auto"
      />

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
          {/* Seek bar */}
          <div style={{ position: "relative", height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
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
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
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

      {/* Controls row */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        {/* Replay button */}
        <button
          onClick={handleReplay}
          disabled={replaysUsed >= maxReplays}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: replaysUsed >= maxReplays ? "var(--border)" : "var(--surface)",
            color: replaysUsed >= maxReplays ? "var(--text-muted)" : "var(--text)",
            cursor: replaysUsed >= maxReplays ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
        >
          <ReloadOutlined />
          Nghe lại ({maxReplays - replaysUsed}/{maxReplays})
        </button>

        {/* Speed control */}
        <button
          onClick={onCycleSpeed}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            transition: "all 0.15s ease",
            minWidth: 90,
            justifyContent: "center",
          }}
        >
          <ThunderboltOutlined />
          {speed}x
        </button>
      </div>
    </div>
  );
}
