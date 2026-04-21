"use client";

import { useState } from "react";
import { SoundOutlined, LoadingOutlined, CheckOutlined } from "@ant-design/icons";
import { CEFR_LEVELS, EXERCISE_TYPES } from "@/lib/listening/types";
import type { CefrLevel, ExerciseType } from "@/lib/listening/types";

const LEVEL_META: Record<CefrLevel, { label: string; color: string; desc: string }> = {
  A1: { label: "Beginner", color: "#52c41a", desc: "Câu ngắn, từ cơ bản" },
  A2: { label: "Elementary", color: "#73d13d", desc: "Hội thoại đơn giản" },
  B1: { label: "Intermediate", color: "#1890ff", desc: "Chủ đề quen thuộc" },
  B2: { label: "Upper-Int", color: "#2f54eb", desc: "Thảo luận chi tiết" },
  C1: { label: "Advanced", color: "#722ed1", desc: "Phân tích sâu" },
  C2: { label: "Proficiency", color: "#eb2f96", desc: "Ngôn ngữ phức tạp" },
};

const TYPE_META: Record<ExerciseType, { label: string; icon: string; desc: string }> = {
  comprehension: { label: "Nghe hiểu", icon: "🎯", desc: "Trả lời câu hỏi trắc nghiệm" },
  dictation: { label: "Nghe chép", icon: "✍️", desc: "Viết lại nội dung nghe được" },
  fill_blanks: { label: "Điền từ", icon: "📝", desc: "Điền từ còn thiếu vào chỗ trống" },
};

type Props = {
  onStart: (level: CefrLevel, exerciseType: ExerciseType) => void;
  isLoading: boolean;
  recommendedLevel?: CefrLevel | null;
};

export function LevelSelector({ onStart, isLoading, recommendedLevel }: Props) {
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("comprehension");
  const [hoveredLevel, setHoveredLevel] = useState<CefrLevel | null>(null);
  const [hoveredType, setHoveredType] = useState<ExerciseType | null>(null);
  const activeLevel = level ?? recommendedLevel ?? null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        padding: "24px 20px",
        maxWidth: 600,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 60,
            height: 60,
            borderRadius: 18,
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            fontSize: 28,
            marginBottom: 12,
            boxShadow: "0 4px 16px rgba(154,177,122,0.35)",
          }}
        >
          🎧
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text)",
            fontFamily: "var(--font-display)",
          }}
        >
          Luyện nghe tiếng Anh
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
          Chọn cấp độ và loại bài tập để bắt đầu
        </p>
      </div>

      {/* CEFR Level Grid */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Cấp độ CEFR
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CEFR_LEVELS.map((l) => {
            const meta = LEVEL_META[l];
            const isSelected = activeLevel === l;
            const isHov = hoveredLevel === l && !isSelected;

            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                onMouseEnter={() => setHoveredLevel(l)}
                onMouseLeave={() => setHoveredLevel(null)}
                style={{
                  position: "relative",
                  padding: "14px 10px",
                  borderRadius: 14,
                  border: isSelected ? `2px solid ${meta.color}` : "1px solid var(--border)",
                  background: isSelected
                    ? `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`
                    : isHov
                    ? `${meta.color}0a`
                    : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  transform: isSelected ? "scale(1.04)" : isHov ? "scale(1.02)" : "scale(1)",
                  boxShadow: isSelected
                    ? `0 4px 16px ${meta.color}45`
                    : isHov
                    ? "0 2px 8px rgba(0,0,0,0.08)"
                    : "none",
                }}
              >
                {/* Recommended badge */}
                {recommendedLevel === l && (
                  <span
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      background: "#f59e0b",
                      borderRadius: 99,
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#fff",
                      padding: "2px 7px",
                      boxShadow: "0 1px 4px rgba(245,158,11,0.4)",
                    }}
                  >
                    ★ Đề xuất
                  </span>
                )}
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: isSelected ? "#fff" : meta.color,
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isSelected ? "rgba(255,255,255,0.9)" : "var(--text-secondary)",
                    marginTop: 4,
                  }}
                >
                  {meta.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: isSelected ? "rgba(255,255,255,0.7)" : "var(--text-muted)",
                    marginTop: 3,
                    lineHeight: 1.3,
                  }}
                >
                  {meta.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Type */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-muted)",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          Loại bài tập
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXERCISE_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const isSelected = exerciseType === t;
            const isHov = hoveredType === t && !isSelected;

            return (
              <button
                key={t}
                onClick={() => setExerciseType(t)}
                onMouseEnter={() => setHoveredType(t)}
                onMouseLeave={() => setHoveredType(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 18px",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  borderLeft: isSelected
                    ? "4px solid var(--accent)"
                    : isHov
                    ? "4px solid var(--border)"
                    : "4px solid transparent",
                  background: isSelected
                    ? "color-mix(in srgb, var(--accent) 8%, var(--surface))"
                    : isHov
                    ? "var(--bg-deep, rgba(0,0,0,0.03))"
                    : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.18s ease",
                }}
              >
                <span
                  style={{
                    display: "grid",
                    width: 42,
                    height: 42,
                    placeItems: "center",
                    borderRadius: 10,
                    background: isSelected
                      ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                      : "var(--bg-deep, rgba(0,0,0,0.05))",
                    fontSize: 20,
                    flexShrink: 0,
                    transition: "background 0.18s",
                    boxShadow: isSelected ? "0 2px 8px rgba(154,177,122,0.35)" : "none",
                  }}
                >
                  {meta.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? "var(--accent)" : "var(--text)",
                    }}
                  >
                    {meta.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>
                    {meta.desc}
                  </div>
                </div>
                {isSelected && (
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 99,
                      background: "var(--accent)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CheckOutlined style={{ fontSize: 11, color: "#fff" }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => activeLevel && onStart(activeLevel, exerciseType)}
        disabled={!activeLevel || isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "15px 24px",
          borderRadius: 14,
          border: "none",
          background: activeLevel
            ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
            : "var(--border)",
          color: activeLevel ? "#fff" : "var(--text-muted)",
          fontSize: 16,
          fontWeight: 700,
          cursor: activeLevel && !isLoading ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          opacity: isLoading ? 0.75 : 1,
          boxShadow: activeLevel ? "0 4px 16px rgba(154,177,122,0.35)" : "none",
        }}
      >
        {isLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
        {isLoading ? "Đang tạo bài nghe..." : "Bắt đầu luyện nghe"}
      </button>
    </div>
  );
}
