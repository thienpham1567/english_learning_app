"use client";

import type { ToeicWritingScores } from "@/lib/writing-practice/types";

const CRITERIA = [
  { key: "taskCompletion" as const, label: "Task" },
  { key: "organization" as const, label: "Organization" },
  { key: "vocabulary" as const, label: "Vocabulary" },
  { key: "grammar" as const, label: "Grammar" },
];

type Props = {
  scores: ToeicWritingScores;
  size?: number;
};

export function ToeicScoreRadar({ scores, size = 200 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const maxScore = 5;
  const levels = [1, 2, 3, 4, 5];
  const n = CRITERIA.length;

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / maxScore) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const polygonPoints = CRITERIA.map((c, i) => {
    const p = getPoint(i, scores[c.key]);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto" width={size} height={size}>
      {/* Grid rings */}
      {levels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon key={level} points={pts} fill="none" stroke="var(--border)" strokeWidth={0.5} />
        );
      })}

      {/* Axes */}
      {CRITERIA.map((_, i) => {
        const p = getPoint(i, maxScore);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--border)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="color-mix(in srgb, var(--success) 15%, transparent)"
        stroke="var(--accent)"
        strokeWidth={2}
      />

      {/* Data points */}
      {CRITERIA.map((c, i) => {
        const p = getPoint(i, scores[c.key]);
        return <circle key={c.key} cx={p.x} cy={p.y} r={3} fill="var(--accent)" />;
      })}

      {/* Labels */}
      {CRITERIA.map((c, i) => {
        const p = getPoint(i, maxScore + 0.8);
        return (
          <text
            key={c.key}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-text-secondary text-[10px] font-medium"
          >
            {c.label}
          </text>
        );
      })}

      {/* Score values */}
      {CRITERIA.map((c, i) => {
        const p = getPoint(i, scores[c.key]);
        return (
          <text
            key={`val-${c.key}`}
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            className="fill-accent text-[9px] font-bold"
          >
            {scores[c.key].toFixed(1)}
          </text>
        );
      })}
    </svg>
  );
}
