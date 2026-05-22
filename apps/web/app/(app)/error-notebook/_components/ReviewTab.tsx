"use client";

import { useEffect, useState, useCallback } from "react";
import { Typography, message } from "antd";
import {
  LoadingOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import { useErrorSRS } from "../_hooks/useErrorSRS";
import { SRS_GRADE_OPTIONS, MODULE_LABELS, MODULE_ICONS } from "../_types/types";
import type { SRSGrade } from "../_types/types";
import { DeepExplanation } from "./DeepExplanation";

const { Text, Title } = Typography;

export function ReviewTab() {
  const srs = useErrorSRS();
  const [showAnswer, setShowAnswer] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    srs.fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset flip on new card
  useEffect(() => {
    setShowAnswer(false);
    setFlipped(false);
  }, [srs.currentIndex]);

  const handleReveal = useCallback(() => {
    setShowAnswer(true);
    setFlipped(true);
  }, []);

  const handleGrade = useCallback(async (grade: SRSGrade) => {
    await srs.gradeAndNext(grade);
  }, [srs]);

  /* ── Loading ── */
  if (srs.loading) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <LoadingOutlined spin style={{ fontSize: 28, color: "var(--accent)", marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
          Đang tải hàng đợi ôn tập...
        </div>
      </div>
    );
  }

  /* ── Empty queue ── */
  if (srs.queue.length === 0 && !srs.loading) {
    return (
      <m.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: "60px 24px", textAlign: "center",
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <Title level={4} style={{ margin: "0 0 8px", color: "var(--text-primary)" }}>
          Không có lỗi cần ôn tập!
        </Title>
        <Text style={{ color: "var(--text-muted)", display: "block", maxWidth: 360, margin: "0 auto" }}>
          Bạn đã ôn hết tất cả. Hãy tiếp tục làm bài tập để có thêm lỗi sai cần ghi nhớ.
        </Text>
        <m.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={srs.fetchQueue}
          style={{
            marginTop: 20, display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 20px", borderRadius: 12,
            border: "1px solid var(--border)", background: "var(--surface-alt)",
            color: "var(--text-secondary)", fontSize: 13, fontWeight: 700,
            cursor: "pointer", fontFamily: "var(--font-body)",
          }}
        >
          <ReloadOutlined /> Kiểm tra lại
        </m.button>
      </m.div>
    );
  }

  /* ── Session complete ── */
  if (srs.isComplete) {
    const pct = srs.reviewed > 0 ? Math.round((srs.correct / srs.reviewed) * 100) : 0;
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: "40px 24px", textAlign: "center",
          background: "var(--surface)",
          borderRadius: "var(--radius-xl)",
          border: "1px solid var(--border)",
        }}
      >
        <TrophyOutlined style={{ fontSize: 40, color: pct >= 80 ? "var(--success)" : "var(--accent)", marginBottom: 12 }} />
        <Title level={3} style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>
          Hoàn thành ôn tập!
        </Title>
        <div style={{ fontSize: 36, fontWeight: 900, color: "var(--accent)", fontFamily: "var(--font-display)" }}>
          {srs.correct}/{srs.reviewed}
        </div>
        <Text style={{ fontSize: 14, color: "var(--text-secondary)", display: "block", margin: "8px 0 4px" }}>
          {pct >= 80 ? "Xuất sắc! Bạn nhớ rất tốt! 🎉" : pct >= 50 ? "Khá tốt! Hãy tiếp tục ôn nhé." : "Cần ôn thêm. Đừng bỏ cuộc!"}
        </Text>
        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Chính xác {pct}%
        </Text>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { srs.resetSession(); srs.fetchQueue(); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)", fontSize: 14, fontWeight: 800,
              cursor: "pointer", fontFamily: "var(--font-body)",
              boxShadow: "0 4px 14px var(--accent-muted)",
            }}
          >
            <ReloadOutlined /> Ôn tiếp
          </m.button>
        </div>
      </m.div>
    );
  }

  /* ── Active card ── */
  const error = srs.currentError!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Progress */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
          🧠 Ôn tập: {srs.currentIndex + 1} / {srs.queue.length}
        </Text>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--success)" }}>
            ✓ {srs.correct}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
            / {srs.reviewed}
          </span>
        </div>
      </div>

      {/* Flash Card */}
      <AnimatePresence mode="wait">
        <m.div
          key={error.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-xl)",
            border: flipped ? "2px solid var(--accent)" : "1px solid var(--border)",
            overflow: "hidden",
            transition: "border-color 0.2s",
          }}
        >
          {/* Card header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "12px 20px",
            background: "var(--surface-alt)",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 16 }}>{MODULE_ICONS[error.sourceModule] ?? "📄"}</span>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
              {MODULE_LABELS[error.sourceModule] ?? error.sourceModule}
            </Text>
            {error.grammarTopic && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                background: "var(--accent-light)", color: "var(--accent)",
                border: "1px solid color-mix(in srgb, var(--accent) 15%, transparent)",
              }}>
                {error.grammarTopic}
              </span>
            )}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
              Ôn lần {error.reviewCount + 1}
            </span>
          </div>

          {/* Question */}
          <div style={{ padding: "24px 20px" }}>
            <Text style={{
              fontSize: 17, fontWeight: 600, lineHeight: 1.7,
              color: "var(--text-primary)", display: "block",
            }}>
              {error.questionStem}
            </Text>

            {/* Options (if exists) */}
            {error.options && error.options.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {error.options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 14px", borderRadius: 10,
                      fontSize: 14,
                      background: showAnswer && opt === error.correctAnswer
                        ? "color-mix(in srgb, var(--success) 8%, var(--surface))"
                        : showAnswer && opt === error.userAnswer && opt !== error.correctAnswer
                          ? "color-mix(in srgb, var(--error) 8%, var(--surface))"
                          : "var(--surface-alt)",
                      border: showAnswer && opt === error.correctAnswer
                        ? "1.5px solid var(--success)"
                        : showAnswer && opt === error.userAnswer && opt !== error.correctAnswer
                          ? "1.5px solid var(--error)"
                          : "1px solid var(--border)",
                      color: showAnswer && opt === error.correctAnswer
                        ? "var(--success)"
                        : showAnswer && opt === error.userAnswer && opt !== error.correctAnswer
                          ? "var(--error)"
                          : "var(--text-primary)",
                      fontWeight: showAnswer && (opt === error.correctAnswer || opt === error.userAnswer) ? 700 : 500,
                    }}
                  >
                    {showAnswer && opt === error.correctAnswer && <CheckCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />}
                    {showAnswer && opt === error.userAnswer && opt !== error.correctAnswer && <CloseCircleOutlined style={{ marginRight: 6, fontSize: 12 }} />}
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reveal / Answer section */}
          {!showAnswer ? (
            <div style={{ padding: "0 20px 24px" }}>
              {/* Answer comparison (hidden) */}
              <div style={{
                padding: "12px 16px", borderRadius: 12,
                background: "var(--surface-alt)", border: "1px dashed var(--border)",
                textAlign: "center",
              }}>
                <Text style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>
                  🤔 Bạn có nhớ đáp án không?
                </Text>
              </div>

              <m.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleReveal}
                style={{
                  width: "100%", marginTop: 12,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 8, padding: "14px 20px",
                  borderRadius: "var(--radius-lg)",
                  border: "none",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                  color: "var(--text-on-accent)",
                  fontSize: 15, fontWeight: 800,
                  cursor: "pointer", fontFamily: "var(--font-body)",
                  boxShadow: "0 4px 14px var(--accent-muted)",
                }}
              >
                <BulbOutlined /> Xem đáp án
              </m.button>
            </div>
          ) : (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ padding: "0 20px 24px" }}
            >
              {/* Answer comparison */}
              <div style={{
                display: "flex", gap: 8, marginBottom: 16,
              }}>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: "color-mix(in srgb, var(--error) 6%, var(--surface))",
                  border: "1px solid color-mix(in srgb, var(--error) 18%, transparent)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--error)", textTransform: "uppercase", marginBottom: 4 }}>
                    <CloseCircleOutlined style={{ fontSize: 9 }} /> Bạn chọn
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--error)" }}>
                    {error.userAnswer || "(Trống)"}
                  </div>
                </div>
                <div style={{
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  background: "color-mix(in srgb, var(--success) 6%, var(--surface))",
                  border: "1px solid color-mix(in srgb, var(--success) 18%, transparent)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--success)", textTransform: "uppercase", marginBottom: 4 }}>
                    <CheckCircleOutlined style={{ fontSize: 9 }} /> Đáp án đúng
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>
                    {error.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Deep explanation */}
              <DeepExplanation
                errorId={error.id}
                cached={error.deepExplanation}
                fallbackEn={error.explanationEn}
                fallbackVi={error.explanationVi}
              />

              {/* Grade buttons */}
              <div style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                  Bạn nhớ thế nào?
                </Text>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {SRS_GRADE_OPTIONS.map((opt) => (
                    <m.button
                      key={opt.grade}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleGrade(opt.grade)}
                      disabled={srs.grading}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 4, padding: "12px 8px",
                        borderRadius: 12,
                        border: `1.5px solid color-mix(in srgb, ${opt.color} 25%, var(--border))`,
                        background: `color-mix(in srgb, ${opt.color} 5%, var(--surface))`,
                        cursor: srs.grading ? "wait" : "pointer",
                        opacity: srs.grading ? 0.5 : 1,
                        fontFamily: "var(--font-body)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: opt.color }}>{opt.label}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{opt.desc}</span>
                    </m.button>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </m.div>
      </AnimatePresence>

      {/* Remaining queue */}
      <Text style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", display: "block" }}>
        Còn {srs.queue.length - srs.currentIndex - 1} lỗi nữa trong phiên ôn tập này
      </Text>
    </div>
  );
}
