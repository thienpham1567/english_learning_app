"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import YouTube, { type YouTubeProps, type YouTubeEvent } from "react-youtube";

export type PlayerHandle = {
  seekTo: (sec: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  pause: () => void;
  play: () => void;
  setPlaybackRate: (rate: number) => void;
};

type Props = {
  videoId: string;
  onReady?: (player: PlayerHandle) => void;
  onStateChange?: (state: number) => void;
  onTick?: (currentSec: number) => void;
};

export const VideoPlayer = forwardRef<PlayerHandle, Props>(function VideoPlayer(
  { videoId, onReady, onStateChange, onTick },
  ref,
) {
  const playerRef = useRef<YouTubeEvent["target"] | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handle: PlayerHandle = {
    seekTo: (sec, allowSeekAhead = true) => {
      playerRef.current?.seekTo(sec, allowSeekAhead);
    },
    getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
    getDuration: () => playerRef.current?.getDuration() ?? 0,
    pause: () => playerRef.current?.pauseVideo(),
    play: () => playerRef.current?.playVideo(),
    setPlaybackRate: (rate) => playerRef.current?.setPlaybackRate(rate),
  };

  useImperativeHandle(ref, () => handle, []);

  const handleReady: YouTubeProps["onReady"] = (e) => {
    playerRef.current = e.target;
    onReady?.(handle);

    if (onTick) {
      if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = setInterval(() => {
        const t = playerRef.current?.getCurrentTime() ?? 0;
        onTick(t);
      }, 250);
    }
  };

  const handleStateChange: YouTubeProps["onStateChange"] = (e) => {
    onStateChange?.(e.data);
  };

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      modestbranding: 1,
      rel: 0,
      cc_load_policy: 0,
    },
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      aspectRatio: "16 / 9",
      borderRadius: 14,
      overflow: "hidden",
      background: "#000",
      boxShadow: "var(--shadow-md)",
    }}>
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
        style={{ width: "100%", height: "100%" }}
        iframeClassName="ytl-iframe"
      />
    </div>
  );
});
