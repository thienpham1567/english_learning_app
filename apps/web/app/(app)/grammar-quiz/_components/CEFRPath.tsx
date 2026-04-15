"use client";

import { Button } from "antd";

const CEFR_LEVELS = [
  { id: "A1", tier: "easy", label: "A1", desc: "Cơ bản" },
  { id: "A2", tier: "easy", label: "A2", desc: "Sơ cấp" },
  { id: "B1", tier: "medium", label: "B1", desc: "Trung cấp" },
  { id: "B2", tier: "medium", label: "B2", desc: "Khá" },
  { id: "C1", tier: "hard", label: "C1", desc: "Nâng cao" },
  { id: "C2", tier: "hard", label: "C2", desc: "Thành thạo" },
] as const;

const TIER_COLORS: Record<string, string> = {
  easy: "#9AB17A",
  medium: "#C3CC9B",
  hard: "#E4DFB5",
};

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
};

export function CEFRPath({ selected, onSelect, onStart, isLoading }: Props) {
  return (
    <div
      className="anim-fade-up"
      style={{ maxWidth: 540, margin: "0 auto", textAlign: "center" }}
    >
      <h3
        style={{
          fontSize: 22,
          fontWeight: 600,
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          color: "var(--ink)",
          margin: 0,
        }}
      >
        TOEIC Part 5
      </h3>
      <p
        style={{
          marginTop: 6,
          fontSize: 14,
          color: "var(--text-secondary)",
        }}
      >
        Incomplete Sentences — Chọn trình độ CEFR
      </p>

      {/* CEFR Path */}
      <div
        style={{
          marginTop: 28,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 0,
          overflowX: "auto",
          padding: "4px 0 16px",
        }}
      >
        {CEFR_LEVELS.map((level, i) => {
          const isSelected = selected === level.tier;
          const tierColor = TIER_COLORS[level.tier];
          const isLast = i === CEFR_LEVELS.length - 1;

          return (
            <div key={level.id} style={{ display: "flex", alignItems: "flex-start" }}>
              {/* Node */}
              <button
                type="button"
                onClick={() => onSelect(level.tier)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 4px",
                  transition: "transform 0.15s",
                }}
              >
                {/* Circle */}
                <div
                  className={isSelected ? "anim-pop-in" : ""}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: `2.5px solid ${isSelected ? tierColor : "var(--border)"}`,
                    background: isSelected ? tierColor : "var(--surface)",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: isSelected
                      ? `0 0 0 3px ${tierColor}33, 0 2px 8px ${tierColor}44`
                      : "none",
                    transition: "all 0.25s ease",
                  }}
                >
                  {isSelected && (
                    <span style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>✓</span>
                  )}
                </div>
                {/* Label */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? tierColor : "var(--text-muted)",
                    transition: "color 0.2s",
                  }}
                >
                  {level.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    marginTop: 17, // center with 36px circle
                    background:
                      isSelected && CEFR_LEVELS[i + 1]?.tier === level.tier
                        ? tierColor
                        : "var(--border)",
                    borderRadius: 1,
                    transition: "background 0.2s",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected tier label */}
      <p
        className="anim-fade-in"
        key={selected}
        style={{
          marginTop: 4,
          fontSize: 13,
          fontWeight: 500,
          color: TIER_COLORS[selected] ?? "var(--text-secondary)",
        }}
      >
        {selected === "easy" && "🟢 Ngữ pháp cơ bản (A1–A2)"}
        {selected === "medium" && "🟡 Ngữ pháp trung cấp (B1–B2)"}
        {selected === "hard" && "🔴 Ngữ pháp nâng cao (C1–C2)"}
      </p>

      <Button
        type="primary"
        size="large"
        className="anim-fade-up anim-delay-4"
        onClick={onStart}
        disabled={isLoading}
        loading={isLoading}
        style={{ marginTop: 24, borderRadius: 999, paddingInline: 40 }}
      >
        {isLoading ? "Đang tạo đề..." : "🚀 Bắt đầu"}
      </Button>
    </div>
  );
}
