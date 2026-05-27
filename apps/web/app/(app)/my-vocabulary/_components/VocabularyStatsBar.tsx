"use client";

import { Star } from "lucide-react";
import * as m from "motion/react-client";

const LEVEL_COLORS: Record<string, string> = {
  A1: "var(--success)",
  A2: "var(--info)",
  B1: "var(--accent)",
  B2: "var(--warning)",
  C1: "var(--xp)",
  C2: "var(--error)",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

type StatsEntry = { level: string | null; saved: boolean };
type Props = { entries: StatsEntry[] };

export function VocabularyStatsBar({ entries }: Props) {
  const total = entries.length;
  const savedCount = entries.filter((e) => e.saved).length;

  const levelCounts = CEFR_LEVELS.reduce<Record<string, number>>((acc, level) => {
    const count = entries.filter((e) => e.level === level).length;
    if (count > 0) acc[level] = count;
    return acc;
  }, {});

  const hasLevels = Object.keys(levelCounts).length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "20px 0",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {/* Total stats card */}
        <m.div
          whileHover={{ y: -2 }}
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 900,
              color: "var(--text-primary)",
              lineHeight: 1,
            }}
          >
            {total}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
            }}
          >
            Words Looked Up
          </span>
        </m.div>

        {/* Saved stats card */}
        <m.div
          whileHover={{ y: -2 }}
          style={{
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 900,
              color: "var(--accent)",
              lineHeight: 1,
            }}
          >
            {savedCount}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--accent)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Saved Words <Star size={10} fill="currentColor" />
          </span>
        </m.div>
      </div>

      {/* CEFR Level stats */}
      {hasLevels && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            background: "var(--surface-alt)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "10px 14px",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginRight: 6,
            }}
          >
            Level Distribution:
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {CEFR_LEVELS.filter((l) => levelCounts[l]).map((level) => {
              const color = LEVEL_COLORS[level];
              return (
                <span
                  key={level}
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color,
                    background: `color-mix(in srgb, ${color} 8%, var(--surface))`,
                    border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
                    padding: "3px 8px",
                    borderRadius: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>{level}</span>
                  <span style={{ opacity: 0.6, fontSize: 9.5 }}>({levelCounts[level]})</span>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
