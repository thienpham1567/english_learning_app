"use client";

/**
 * Tiny inline SVG sparkline for trend visualization.
 * No dependencies — pure SVG path generation.
 */

interface SparklineProps {
  /** Data points (e.g., weekly error counts) */
  data: number[];
  /** Width in px (default 64) */
  width?: number;
  /** Height in px (default 20) */
  height?: number;
  /** Stroke color (CSS variable or hex) */
  color?: string;
  /** Whether to fill area under curve */
  filled?: boolean;
  /** Additional CSS class */
  className?: string;
}

export function Sparkline({
  data,
  width = 64,
  height = 20,
  color = "var(--accent)",
  filled = true,
  className = "",
}: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (val - min) / range) * (height - padding * 2),
  }));

  // Build SVG path
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  // Fill path (close to bottom)
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  // Endpoint dot
  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ display: "block" }}
    >
      {filled && (
        <path d={fillPath} fill={color} fillOpacity={0.12} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Endpoint dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2.5}
        fill={color}
        stroke="var(--surface)"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * Compute weekly error counts from error timestamps.
 * Returns last N weeks of data.
 */
export function computeWeeklyData(
  timestamps: (string | Date)[],
  weeks = 6,
): number[] {
  const now = Date.now();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const counts = new Array(weeks).fill(0);

  for (const ts of timestamps) {
    const date = typeof ts === "string" ? new Date(ts).getTime() : ts.getTime();
    const weeksAgo = Math.floor((now - date) / msPerWeek);
    if (weeksAgo >= 0 && weeksAgo < weeks) {
      counts[weeks - 1 - weeksAgo]++;
    }
  }

  return counts;
}
