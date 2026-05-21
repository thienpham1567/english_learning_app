"use client";

import { ReloadOutlined, StarOutlined, WarningOutlined, TrophyOutlined, SmileOutlined, LikeOutlined, FireOutlined, ThunderboltOutlined, BookOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";
import * as m from "motion/react-client";

type Props = {
  questions: GrammarQuestion[];
  answers: (number | null)[];
  score: number;
  maxCombo: number;
  topicBreakdown: Record<string, { correct: number; total: number }>;
  onRetry: () => void;
  onNewQuiz: () => void;
};

export function ScoreSummary({
  questions,
  answers: _answers,
  score,
  maxCombo,
  topicBreakdown,
  onRetry,
  onNewQuiz,
}: Props) {
  const router = useRouter();
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const icon = pct >= 90 
    ? <TrophyOutlined style={{ color: "var(--success)" }} /> 
    : pct >= 70 
    ? <SmileOutlined style={{ color: "var(--accent)" }} /> 
    : pct >= 50 
    ? <LikeOutlined style={{ color: "var(--warning)" }} /> 
    : <ThunderboltOutlined style={{ color: "var(--error)" }} />;
  
  const labelText = pct >= 90
    ? "Xuất sắc! Bạn đã làm chủ kiến thức."
    : pct >= 70
    ? "Rất tốt! Tiếp tục phát huy nhé."
    : pct >= 50
    ? "Khá tốt! Ôn thêm một chút nữa thôi."
    : "Cố gắng lên! Bạn cần luyện tập thêm.";

  const weakTopics = Object.entries(topicBreakdown)
    .filter(([, v]) => v.correct / v.total < 0.5)
    .map(([topic]) => topic);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 500,
        margin: "0 auto",
        textAlign: "center",
        background: "var(--surface)",
        padding: "36px 24px",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-lg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: "50%", top: "20%", transform: "translate(-50%, -50%)", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)", pointerEvents: "none" }} />

      <m.div
        initial={{ scale: 0.3, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
        style={{ fontSize: 56, display: "inline-block", marginBottom: 12 }}
      >
        {icon}
      </m.div>

      <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
        Kết quả bài Quiz
      </h2>
      <p style={{ margin: "0 0 20px", fontSize: 13.5, color: "var(--text-secondary)", fontWeight: 600 }}>
        {labelText}
      </p>

      {/* Main Stats Card */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          borderRadius: "var(--radius-xl)",
          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 14px var(--accent-muted)",
          color: "var(--text-on-accent)",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>
            Điểm số chính xác
          </span>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 2, display: "flex", alignItems: "baseline", gap: 4 }}>
            <span>{score}</span>
            <span style={{ fontSize: 15, opacity: 0.8 }}>/ {total} câu</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.9 }}>
            Tỉ lệ đạt
          </span>
          <div style={{ fontSize: 26, fontWeight: 900, marginTop: 2 }}>
            {pct}%
          </div>
        </div>
      </m.div>

      {/* Combo achievement */}
      {maxCombo >= 2 && (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            marginTop: 12,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 99,
            background: "linear-gradient(135deg, var(--fire), var(--xp))",
            padding: "6px 18px",
            fontSize: 13,
            fontWeight: 800,
            color: "var(--text-on-accent)",
            boxShadow: "0 2px 10px rgba(245, 158, 11, 0.25)",
          }}
        >
          <FireOutlined /> Combo liên tiếp tốt nhất: x{maxCombo}
        </m.div>
      )}

      {/* Topic breakdown */}
      <div style={{ marginTop: 28, textAlign: "left" }}>
        <h4 style={{ fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: 10 }}>
          Thống kê chi tiết chủ đề
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.entries(topicBreakdown).map(([topic, { correct, total: t }], idx) => {
            const isWeak = correct / t < 0.5;
            return (
              <m.div
                key={topic}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 + 0.2 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  background: isWeak ? "rgba(239, 68, 68, 0.03)" : "var(--surface-alt)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {isWeak ? (
                    <WarningOutlined style={{ color: "var(--error)", fontSize: 14 }} />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
                  )}
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: isWeak ? "var(--error)" : "var(--text-secondary)",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {topic}
                  </span>
                </div>
                
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: isWeak ? "var(--error-bg)" : "var(--border)",
                    color: isWeak ? "var(--error)" : "var(--text-secondary)",
                  }}
                >
                  {correct} / {t}
                </span>
              </m.div>
            );
          })}
        </div>
      </div>

      {/* Weak topics card */}
      {weakTopics.length > 0 && (
        <m.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: "var(--radius-lg)",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid color-mix(in srgb, var(--warning) 25%, var(--border))",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--warning)", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <WarningOutlined /> Cần ôn lại: {weakTopics.join(", ")}
          </p>
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/grammar-lessons")}
            style={{
              marginTop: 10,
              border: "none",
              background: "var(--warning)",
              color: "var(--text-on-accent)",
              padding: "6px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.2)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <BookOutlined /> Học ngay lý thuyết
          </m.button>
        </m.div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28 }}>
        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          style={{
            flex: 1,
            height: 40,
            borderRadius: "var(--radius-lg)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-primary)",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <ReloadOutlined /> Làm lại đề này
        </m.button>
        
        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewQuiz}
          style={{
            flex: 1,
            height: 40,
            borderRadius: "var(--radius-lg)",
            border: "none",
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            color: "var(--text-on-accent)",
            fontSize: 13.5,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: "0 2px 8px var(--accent-muted)",
          }}
        >
          <StarOutlined /> Đề mới ngẫu nhiên
        </m.button>
      </div>
    </div>
  );
}
