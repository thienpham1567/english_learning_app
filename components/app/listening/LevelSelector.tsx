"use client";

import { useState, useEffect } from "react";
import { SoundOutlined, LoadingOutlined } from "@ant-design/icons";
import { CEFR_LEVELS, EXERCISE_TYPES } from "@/lib/listening/types";
import type { CefrLevel, ExerciseType } from "@/lib/listening/types";

const LEVEL_META: Record<CefrLevel, { label: string; color: string; desc: string }> = {
  A1: { label: "Beginner", color: "#52c41a", desc: "Từ vựng cơ bản, câu ngắn" },
  A2: { label: "Elementary", color: "#73d13d", desc: "Hội thoại đơn giản" },
  B1: { label: "Intermediate", color: "#1890ff", desc: "Chủ đề quen thuộc" },
  B2: { label: "Upper-Int", color: "#2f54eb", desc: "Thảo luận chi tiết" },
  C1: { label: "Advanced", color: "#722ed1", desc: "Phân tích sâu" },
  C2: { label: "Proficiency", color: "#eb2f96", desc: "Ngôn ngữ phức tạp" },
};

const TYPE_META: Record<ExerciseType, { label: string; icon: string; desc: string }> = {
  comprehension: { label: "Nghe hiểu", icon: "🎯", desc: "Trả lời câu hỏi trắc nghiệm" },
  dictation: { label: "Nghe chép", icon: "✍️", desc: "Viết lại nội dung nghe được" },
  fill_blanks: { label: "Điền từ", icon: "📝", desc: "Điền từ còn thiếu" },
};

type Props = {
  onStart: (level: CefrLevel, exerciseType: ExerciseType) => void;
  isLoading: boolean;
  recommendedLevel?: CefrLevel | null;
};

export function LevelSelector({ onStart, isLoading, recommendedLevel }: Props) {
  const [level, setLevel] = useState<CefrLevel | null>(null);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("comprehension");

  // Auto-select recommended level on mount
  useEffect(() => {
    if (recommendedLevel && !level) {
      setLevel(recommendedLevel);
    }
  }, [recommendedLevel]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "24px 20px", maxWidth: 600, margin: "0 auto", width: "100%" }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎧</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text)" }}>Luyện nghe tiếng Anh</h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
          Chọn cấp độ và bắt đầu luyện nghe
        </p>
      </div>

      {/* CEFR Level Grid */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Cấp độ CEFR
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {CEFR_LEVELS.map((l) => {
            const meta = LEVEL_META[l];
            const isSelected = level === l;
            return (
              <button
                key={l}
                onClick={() => setLevel(l)}
                style={{
                  padding: "14px 10px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? `2px solid ${meta.color}` : "1px solid var(--border)",
                  background: isSelected ? `${meta.color}15` : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  boxShadow: isSelected ? `0 0 0 3px ${meta.color}20` : "none",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: meta.color }}>{l}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{meta.label}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, opacity: 0.7 }}>{meta.desc}</div>
                {recommendedLevel === l && (
                  <div style={{ fontSize: 9, color: meta.color, fontWeight: 700, marginTop: 4 }}>★ Đề xuất</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise Type */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
          Loại bài tập
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXERCISE_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const isSelected = exerciseType === t;
            return (
              <button
                key={t}
                onClick={() => setExerciseType(t)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                  background: isSelected ? "var(--accent-surface)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{meta.label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{meta.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => level && onStart(level, exerciseType)}
        disabled={!level || isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "14px 24px",
          borderRadius: "var(--radius-md)",
          border: "none",
          background: level ? "linear-gradient(135deg, var(--accent), var(--accent-hover))" : "var(--border)",
          color: level ? "#fff" : "var(--text-muted)",
          fontSize: 16,
          fontWeight: 700,
          cursor: level ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? <LoadingOutlined spin /> : <SoundOutlined />}
        {isLoading ? "Đang tạo bài nghe..." : "Bắt đầu luyện nghe"}
      </button>
    </div>
  );
}
