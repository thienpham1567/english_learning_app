"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
    setAudioError("Không thể tải audio. Nhấn Nghe lại để thử lại.");
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
      if (audioRef.current && audioRef.current.buffered.length === 0 && !Number.isFinite(audioRef.current.duration)) {
        setIsLoading(false);
        setAudioError("Tải audio bị gián đoạn. Nhấn Nghe lại để thử lại.");
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
    <div ref={containerRef} tabIndex={0} className={`${className} bg-(--surface) border border-(--border) rounded-(--radius-lg) flex flex-col gap-3.5`} style={{padding: "20px", outline: "none"}} >
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
        <div className="rounded-(--radius-sm) text-destructive text-xs text-center" style={{padding: "8px 14px", background: "var(--error-bg)", border: "1px solid color-mix(in srgb, var(--error) 20%, transparent)"}} >
          <AlertTriangle style={{ marginRight: 6 }} /> {audioError}
        </div>
      )}

      {/* Play button + seek bar */}
      <div className="flex items-center gap-3" >
        <button
          onClick={togglePlay}
          disabled={isLoading} className="bg-none border-none text-accent text-[36px] leading-none flex" style={{cursor: isLoading ? "wait" : "pointer", padding: 0, transition: "transform 0.15s ease"}} >
          {isPlaying ? <PauseCircle /> : <PlayCircle />}
        </button>

        <div className="flex-1 flex flex-col gap-1" >
          {/* Seek bar with marker ticks (Task 4 visual polish) */}
          <div className="relative h-[6px]" style={{borderRadius: 3, background: "var(--border)", overflow: "visible"}} >
            {/* A-B highlighted region */}
            {markerAPos != null && markerBPos != null && (
              <div className="absolute h-full" style={{left: `${markerAPos}%`, width: `${markerBPos - markerAPos}%`, top: 0, background: looping ? "color-mix(in srgb, var(--success) 30%, transparent)" : "color-mix(in srgb, var(--info) 20%, transparent)", borderRadius: 3, transition: "background 0.2s ease"}} />
            )}
            {/* Progress fill */}
            <div className="absolute h-full" style={{left: 0, top: 0, width: `${progress}%`, background: "linear-gradient(90deg, var(--accent), var(--accent-hover))", borderRadius: 3, transition: "width 0.1s linear"}} />
            {/* Marker A tick */}
            {markerAPos != null && (
              <div
                
                title={`A: ${formatTime(markerA!)}`} className="absolute w-[3px] h-[12px]" style={{left: `${markerAPos}%`, top: -3, background: "var(--success)", borderRadius: 1, transform: "translateX(-50%)", zIndex: 2}} />
            )}
            {/* Marker B tick */}
            {markerBPos != null && (
              <div
                
                title={`B: ${formatTime(markerB!)}`} className="absolute w-[3px] h-[12px]" style={{left: `${markerBPos}%`, top: -3, background: "var(--error)", borderRadius: 1, transform: "translateX(-50%)", zIndex: 2}} />
            )}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek} className="absolute w-full h-[14px] cursor-pointer m-0" style={{top: -4, left: 0, opacity: 0}} />
          </div>

          {/* Time display */}
          <div className="flex justify-between text-[11px] text-text-muted" >
            <span>{formatTime(currentTime)}</span>
            <span>{isLoading ? "Loading..." : formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Controls row: replay + speed */}
      <div className="flex justify-center gap-2.5 flex-wrap" >
        {/* Replay button */}
        <button
          onClick={handleReplay}
          disabled={replaysUsed >= maxReplays} className="flex items-center gap-1.5 rounded-(--radius-sm) border border-(--border) text-xs font-medium" style={{padding: "8px 14px", background: replaysUsed >= maxReplays ? "var(--border)" : "var(--surface)", color: replaysUsed >= maxReplays ? "var(--text-muted)" : "var(--text)", cursor: replaysUsed >= maxReplays ? "not-allowed" : "pointer", transition: "all 0.15s ease"}} >
          <RefreshCw />
          Nghe lại ({maxReplays - replaysUsed}/{maxReplays})
        </button>

        {/* Speed control (AC1) */}
        <button
          onClick={handleCycleSpeed} className="flex items-center gap-1.5 rounded-(--radius-sm) border border-(--border) cursor-pointer text-xs font-semibold w-[80px] justify-center" style={{padding: "8px 14px", background: speed !== 1 ? "var(--accent-surface, rgba(99,102,241,0.08))" : "var(--surface)", color: speed !== 1 ? "var(--accent)" : "var(--text)", transition: "all 0.15s ease"}} >
          <Zap />
          {speed}×
        </button>
      </div>

      {/* A-B Loop controls (AC2) */}
      <div className="flex justify-center gap-2 flex-wrap pt-3" style={{borderTop: "1px solid var(--border)"}} >
        {/* Set A */}
        <button
          onClick={setA}
          disabled={isLoading}
          
          title="Set A marker [ [ ]" className="flex items-center gap-1 py-1.5 px-3 rounded-(--radius-sm) cursor-pointer text-[11px] font-semibold" style={{border: markerA != null ? "1px solid var(--success)" : "1px solid var(--border)", background: markerA != null ? "color-mix(in srgb, var(--success) 8%, transparent)" : "var(--surface)", color: markerA != null ? "var(--success)" : "var(--text-muted)", transition: "all 0.15s ease"}} >
          <Scissors />
          A{markerA != null ? ` ${formatTime(markerA)}` : ""}
        </button>

        {/* Set B */}
        <button
          onClick={setB}
          disabled={!canSetB || isLoading}
          
          title="Set B marker [ ] ]" className="flex items-center gap-1 py-1.5 px-3 rounded-(--radius-sm) text-[11px] font-semibold" style={{border: markerB != null ? "1px solid var(--error)" : "1px solid var(--border)", background: markerB != null ? "color-mix(in srgb, var(--error) 8%, transparent)" : "var(--surface)", color: markerB != null ? "var(--error)" : canSetB ? "var(--text-muted)" : "var(--border)", cursor: canSetB ? "pointer" : "not-allowed", transition: "all 0.15s ease"}} >
          <Scissors />
          B{markerB != null ? ` ${formatTime(markerB)}` : ""}
        </button>

        {/* Toggle Loop */}
        <button
          onClick={toggleLoop}
          disabled={!canLoop}
          
          title="Toggle loop [ L ]" className="flex items-center gap-1 py-1.5 px-3 rounded-(--radius-sm) text-[11px] font-semibold" style={{border: looping ? "1px solid var(--success)" : "1px solid var(--border)", background: looping ? "color-mix(in srgb, var(--success) 12%, transparent)" : "var(--surface)", color: looping ? "var(--success)" : canLoop ? "var(--text-muted)" : "var(--border)", cursor: canLoop ? "pointer" : "not-allowed", transition: "all 0.15s ease"}} >
          <Repeat size={13} />
          {looping ? "Looping" : "Loop"}
        </button>

        {/* Clear */}
        <button
          onClick={clearMarkers}
          disabled={markerA == null && markerB == null}
          
          title="Clear markers" className="flex items-center gap-1 py-1.5 px-3 rounded-(--radius-sm) border border-(--border) bg-(--surface) text-[11px] font-semibold" style={{color: markerA != null || markerB != null ? "var(--text)" : "var(--border)", cursor: markerA != null || markerB != null ? "pointer" : "not-allowed", transition: "all 0.15s ease"}} >
          <Eraser />
          Clear
        </button>
      </div>

      {/* preservesPitch note (AC3) */}
      <div className="text-[10px] text-text-muted text-center" >
        {speed !== 1 && <><Headphones className="mr-1" /> Pitch preserved · </>}
        Shortcuts: [ ] Set A/B · L Loop · ←/→ ±3s{selfManagedSpeed ? " · ,/. Speed" : ""} · Space Play/Pause
      </div>
    </div>
  );
}
