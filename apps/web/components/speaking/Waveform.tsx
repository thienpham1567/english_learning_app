"use client";

import { useEffect, useRef } from "react";

/**
 * Live waveform visualizer for speaking practice (AC1).
 * Renders the time-domain audio from a MediaStream as a scrolling line.
 */
export function Waveform({
  getStream,
  active,
  height = 60,
  color = "#ff4d4f",
}: {
  getStream: () => MediaStream | null;
  active: boolean;
  height?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const stream = getStream();
    if (!stream) return;

    const AudioCtx =
      typeof window !== "undefined"
        ? window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const ctx = canvas.getContext("2d");
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!ctx) return;

      analyser.getByteTimeDomainData(buffer);

      const { width, height: h } = canvas;
      ctx.clearRect(0, 0, width, h);
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const slice = width / buffer.length;
      let x = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = buffer[i]! / 128.0;
        const y = (v * h) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.stroke();
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        /* noop */
      }
      void audioCtx.close();
    };
  }, [active, getStream, color]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={height}
      style={{ width: "100%", height, display: "block" }}
      aria-hidden="true"
    />
  );
}
