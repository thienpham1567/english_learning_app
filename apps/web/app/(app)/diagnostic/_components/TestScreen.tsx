"use client";

import { useEffect, useCallback } from "react";
import { Flex, Typography, Button, Progress, Tag } from "antd";
import { CEFR_COLORS } from "@/lib/constants/cefr";

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
  const progress = Math.round((currentIndex / total) * 100);

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

  return (
    <div
      style={{ height: "100%", overflowY: "auto", padding: "24px 16px" }}
      className="anim-fade-up"
    >
      <Flex vertical gap={20} style={{ maxWidth: 600, margin: "0 auto" }}>
        {/* Progress */}
        <div>
          <Flex justify="space-between" style={{ marginBottom: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Câu {currentIndex + 1}/{total}
            </Text>
            <Flex gap={6} align="center">
              <Tag
                style={{
                  fontSize: 10,
                  borderRadius: 99,
                  margin: 0,
                  border: `1px solid ${CEFR_COLORS[question.level] ?? "var(--border)"}`,
                  color: CEFR_COLORS[question.level] ?? "var(--text-secondary)",
                  background: "transparent",
                }}
              >
                {question.level}
              </Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {SKILL_LABELS[question.skill] ?? question.skill}
              </Text>
            </Flex>
          </Flex>
          <Progress
            percent={progress}
            showInfo={false}
            strokeColor="var(--accent)"
            size="small"
          />
        </div>

        {/* Question */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            borderLeft: "4px solid var(--accent)",
            background: "var(--bg-deep)",
            padding: "20px 24px",
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.6,
              color: "var(--ink)",
            }}
          >
            {question.question}
          </Text>
        </div>

        {/* Options */}
        <Flex vertical gap={10}>
          {question.options.map((opt, i) => {
            const isSelected = selectedOption === i;
            return (
              <button
                key={i}
                onClick={() => onSelectOption(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--accent-muted)"
                    : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "var(--accent)" : "var(--ink)",
                  transition: "all 0.15s ease",
                }}
              >
                {/* Circle label */}
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 99,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: isSelected ? "var(--accent)" : "var(--border)",
                    color: isSelected ? "#fff" : "var(--text-muted)",
                    fontSize: 12,
                    fontWeight: 700,
                    transition: "all 0.15s",
                  }}
                >
                  {LABELS[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </Flex>

        {/* Keyboard hint */}
        <Text
          type="secondary"
          style={{ fontSize: 11, textAlign: "center", opacity: 0.6 }}
        >
          💡 Nhấn A/B/C/D để chọn · Enter để xác nhận
        </Text>

        {/* Actions */}
        <Flex gap={12}>
          <Button
            type="primary"
            size="large"
            disabled={selectedOption === null}
            onClick={onSubmit}
            style={{
              flex: 1,
              height: 48,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
            }}
          >
            {currentIndex < total - 1 ? "Câu tiếp theo →" : "Hoàn thành ✓"}
          </Button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-muted)",
              padding: "8px 14px",
              borderRadius: 999,
              transition: "color 0.15s, background 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--error)";
              e.currentTarget.style.background = "var(--error-bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-muted)";
              e.currentTarget.style.background = "none";
            }}
          >
            Bỏ qua
          </button>
        </Flex>
      </Flex>
    </div>
  );
}
