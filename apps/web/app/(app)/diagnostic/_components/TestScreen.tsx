"use client";

import { useEffect, useCallback } from "react";
import { Flex, Typography, Button, Tag } from "antd";
import { CEFR_COLORS } from "@/lib/constants/cefr";
import * as m from "motion/react-client";

import type { Question } from "./types";

const { Text } = Typography;

const LABELS = ["A", "B", "C", "D"] as const;

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp",
  vocabulary: "Từ vựng",
  reading: "Đọc hiểu",
  listening: "Nghe hiểu",
};

type Props = {
  question: Question;
  currentIndex: number;
  total: number;
  selectedOption: number | null;
  onSelectOption: (index: number) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

export function TestScreen({
  question,
  currentIndex,
  total,
  selectedOption,
  onSelectOption,
  onSubmit,
  onSkip,
}: Props) {
  const progressPct = ((currentIndex) / total) * 100;

  // Keyboard navigation: A/B/C/D to select, Enter to submit
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key >= "A" && key <= "D") {
        const idx = key.charCodeAt(0) - 65;
        if (idx < question.options.length) {
          onSelectOption(idx);
        }
      } else if (key === "ENTER" && selectedOption !== null) {
        e.preventDefault();
        onSubmit();
      }
    },
    [question.options.length, selectedOption, onSelectOption, onSubmit],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const levelColor = CEFR_COLORS[question.level] ?? "var(--accent)";

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        padding: "24px 20px 48px",
        background: "var(--bg-deep)",
      }}
    >
      <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
        
        {/* Progress & Metadata Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifySelf: "stretch", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
              Câu hỏi {currentIndex + 1} / {total}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: levelColor,
                  border: `1px solid ${levelColor}`,
                  background: "var(--surface)",
                  padding: "2px 8px",
                  borderRadius: 99,
                }}
              >
                {question.level}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  background: "var(--surface-alt)",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
              >
                {SKILL_LABELS[question.skill] ?? question.skill}
              </span>
            </div>
          </div>

          {/* Animated Custom Progress Bar */}
          <div
            style={{
              height: 6,
              background: "var(--border)",
              borderRadius: 99,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 80, damping: 15 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                background: "linear-gradient(90deg, var(--accent), var(--xp))",
                borderRadius: 99,
                boxShadow: "0 0 8px var(--accent)",
              }}
            />
          </div>
        </div>

        {/* Question excerpt */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            borderLeft: "4px solid var(--accent)",
            background: "var(--surface)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
            border: "1px solid var(--border)",
            borderLeftColor: "var(--accent)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 16.5,
              fontWeight: 600,
              lineHeight: 1.8,
              color: "var(--text-primary)",
              wordBreak: "break-word",
            }}
          >
            {question.question}
          </p>
        </div>

        {/* Options Stack */}
        <Flex vertical gap={10}>
          {question.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            return (
              <m.button
                key={i}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectOption(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderRadius: "var(--radius-lg)",
                  border: isSelected
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--accent-light)"
                    : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14.5,
                  fontWeight: isSelected ? 700 : 600,
                  color: isSelected ? "var(--accent)" : "var(--text-primary)",
                  transition: "border-color 0.2s, background-color 0.2s",
                  boxShadow: isSelected ? "0 4px 12px var(--accent-muted)" : "var(--shadow-sm)",
                }}
              >
                {/* Circle label */}
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: isSelected ? "var(--accent)" : "var(--border)",
                    color: isSelected ? "var(--text-on-accent)" : "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: 800,
                    transition: "all 0.15s",
                  }}
                >
                  {LABELS[i]}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </m.button>
            );
          })}
        </Flex>

        {/* Keyboard hint */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, opacity: 0.6, fontSize: 11, fontWeight: 500, color: "var(--text-muted)", marginTop: 4 }}>
          <span>Phím tắt:</span>
          <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>A</kbd>
          <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>B</kbd>
          <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>C</kbd>
          <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>D</kbd>
          <span>để chọn ·</span>
          <kbd style={{ background: "var(--border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--font-mono)", fontSize: 10 }}>Enter</kbd>
          <span>để xác nhận</span>
        </div>

        {/* Actions Button Row */}
        <Flex gap={12} style={{ marginTop: 10 }}>
          <m.button
            whileHover={selectedOption !== null ? { scale: 1.02, y: -1 } : {}}
            whileTap={selectedOption !== null ? { scale: 0.98 } : {}}
            disabled={selectedOption === null}
            onClick={onSubmit}
            style={{
              flex: 1,
              height: 48,
              borderRadius: "var(--radius-lg)",
              background: selectedOption === null
                ? "var(--border)"
                : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: selectedOption === null ? "var(--text-muted)" : "var(--text-on-accent)",
              border: "none",
              fontSize: 15,
              fontWeight: 800,
              cursor: selectedOption === null ? "default" : "pointer",
              boxShadow: selectedOption === null ? "none" : "0 4px 14px var(--accent-muted)",
              transition: "all 0.2s",
            }}
          >
            {currentIndex < total - 1 ? "Câu tiếp theo →" : "Hoàn thành bài test ✓"}
          </m.button>

          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onSkip}
            style={{
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-secondary)",
              padding: "0 20px",
              height: 48,
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
              transition: "all 0.2s",
            }}
          >
            Bỏ qua
          </m.button>
        </Flex>
      </Flex>
    </div>
  );
}
