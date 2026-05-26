"use client";

import { Button, Segmented, Switch } from "antd";
import * as m from "motion/react-client";
import {
  BookOpen,
  Check,
  Clock,
  Loader2,
  Rocket,
  Zap,
} from "lucide-react";

const CEFR_LEVELS = [
  { id: "A1", tier: "easy", label: "A1", desc: "Cơ bản" },
  { id: "A2", tier: "easy", label: "A2", desc: "Sơ cấp" },
  { id: "B1", tier: "medium", label: "B1", desc: "Trung cấp" },
  { id: "B2", tier: "medium", label: "B2", desc: "Khá" },
  { id: "C1", tier: "hard", label: "C1", desc: "Nâng cao" },
  { id: "C2", tier: "hard", label: "C2", desc: "Thành thạo" },
] as const;

const TIER_COLORS: Record<string, string> = {
  easy: "var(--success)",
  medium: "var(--accent)",
  hard: "var(--error)",
};

const TIER_GLOWS: Record<string, string> = {
  easy: "rgba(16, 185, 129, 0.2)",
  medium: "color-mix(in srgb, var(--accent) 20%, transparent)",
  hard: "rgba(239, 68, 68, 0.2)",
};

type Props = {
  selected: string;
  onSelect: (level: string) => void;
  onStart: () => void;
  isLoading: boolean;
  timedMode?: boolean;
  onTimedModeChange?: (val: boolean) => void;
  sourceMode?: "ai" | "ets";
  onSourceModeChange?: (val: "ai" | "ets") => void;
};

export function CEFRPath({
  selected,
  onSelect,
  onStart,
  isLoading,
  timedMode,
  onTimedModeChange,
  sourceMode = "ai",
  onSourceModeChange,
}: Props) {
  const isEts = sourceMode === "ets";
  return (
    <div
      className="anim-fade-up"
      style={{
        maxWidth: 480,
        margin: "0 auto",
        textAlign: "center",
        background: "var(--surface)",
        padding: "32px 24px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "0%",
          transform: "translateX(-50%)",
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <h3
        style={{
          fontSize: 20,
          fontWeight: 900,
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        TOEIC Part 5 Quiz
      </h3>
      <p
        style={{
          marginTop: 4,
          fontSize: 13,
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        Luyện tập trắc nghiệm Part 5 với câu hỏi biên soạn chuẩn đề thi
      </p>

      {/* Source mode toggle */}
      {onSourceModeChange && (
        <div style={{ marginTop: 20, marginBottom: 4, position: "relative", zIndex: 1 }}>
          <Segmented
            value={sourceMode}
            onChange={(val) => onSourceModeChange(val as "ai" | "ets")}
            options={[
              {
                value: "ai",
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "4px 12px",
                      fontWeight: 700,
                    }}
                  >
                    <Zap size={13} />
                    <span>AI tạo đề</span>
                  </div>
                ),
              },
              {
                value: "ets",
                label: (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "4px 12px",
                      fontWeight: 700,
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Đề ETS thật</span>
                  </div>
                ),
              },
            ]}
            style={{
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--surface-alt)",
            }}
          />
          {isEts && (
            <p
              style={{ marginTop: 8, fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}
            >
              240 câu hỏi trích xuất từ đề thi ETS thật · Tự động trộn ngẫu nhiên
            </p>
          )}
        </div>
      )}

      {/* CEFR Path */}
      <div
        style={{
          opacity: isEts ? 0.35 : 1,
          pointerEvents: isEts ? "none" : "auto",
          transition: "opacity 0.2s",
          marginTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 0,
            padding: "4px 0 12px",
          }}
        >
          {CEFR_LEVELS.map((level, i) => {
            const isSelected = selected === level.tier;
            const tierColor = TIER_COLORS[level.tier];
            const isLast = i === CEFR_LEVELS.length - 1;

            return (
              <div key={level.id} style={{ display: "flex", alignItems: "center" }}>
                {/* Node wrapper */}
                <m.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
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
                    padding: "0",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? tierColor : "var(--border)"}`,
                      background: isSelected ? tierColor : "var(--surface-alt)",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: isSelected ? `0 0 10px ${TIER_GLOWS[level.tier]}` : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isSelected ? (
                      <Check
                        style={{ fontSize: 12, color: "var(--text-on-accent)", fontWeight: 900 }}
                      />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)" }}>
                        {level.label}
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: isSelected ? tierColor : "var(--text-muted)",
                      transition: "color 0.2s",
                    }}
                  >
                    {level.desc}
                  </span>
                </m.button>

                {/* Line */}
                {!isLast && (
                  <div
                    style={{
                      width: 24,
                      height: 2,
                      alignSelf: "flex-start",
                      marginTop: 15,
                      background:
                        isSelected && CEFR_LEVELS[i + 1]?.tier === level.tier
                          ? tierColor
                          : "var(--border)",
                      borderRadius: 99,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p
          style={{
            marginTop: 8,
            fontSize: 12.5,
            fontWeight: 800,
            color: TIER_COLORS[selected] ?? "var(--text-secondary)",
          }}
        >
          {selected === "easy" && "Độ khó: Ngữ pháp cơ bản (A1–A2)"}
          {selected === "medium" && "Độ khó: Ngữ pháp trung cấp (B1–B2)"}
          {selected === "hard" && "Độ khó: Ngữ pháp nâng cao (C1–C2)"}
        </p>
      </div>

      {/* Timer switches */}
      {onTimedModeChange && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            borderTop: "1.5px dashed var(--border)",
            paddingTop: 16,
          }}
        >
          <Clock
            style={{ fontSize: 14, color: timedMode ? "var(--accent)" : "var(--text-muted)" }}
          />
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 700 }}>
            Tính giờ làm bài
          </span>
          <Switch size="small" checked={timedMode} onChange={onTimedModeChange} />
          {timedMode && (
            <span style={{ fontSize: 11.5, color: "var(--text-muted)", fontWeight: 600 }}>
              (30s / câu hỏi)
            </span>
          )}
        </div>
      )}

      {/* Start Button */}
      <m.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        disabled={isLoading}
        style={{
          marginTop: 24,
          height: 44,
          width: "100%",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          color: "var(--text-on-accent)",
          border: "none",
          fontWeight: 800,
          fontSize: 14.5,
          cursor: "pointer",
          boxShadow: "0 4px 12px var(--accent-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" /> Đang lập đề...
          </>
        ) : (
          <>
            <Rocket /> Bắt đầu luyện đề
          </>
        )}
      </m.button>
    </div>
  );
}
