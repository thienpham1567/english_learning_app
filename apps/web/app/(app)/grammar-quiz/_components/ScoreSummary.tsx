"use client";

import {
  AlertTriangle,
  BookOpen,
  Flame,
  RefreshCw,
  Smile,
  Star,
  ThumbsUp,
  Trophy,
  Zap,
} from "lucide-react";
import * as m from "motion/react-client";
import { useRouter } from "next/navigation";
import type { GrammarQuestion } from "@/lib/grammar-quiz/types";

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

  const icon =
    pct >= 90 ? (
      <Trophy className="text-emerald-500" />
    ) : pct >= 70 ? (
      <Smile className="text-accent" />
    ) : pct >= 50 ? (
      <ThumbsUp style={{ color: "var(--warning)" }} />
    ) : (
      <Zap className="text-destructive" />
    );

  const labelText =
    pct >= 90
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
      className="w-full w-[500px] mx-auto text-center bg-(--surface) rounded-(--radius-xl) border-2 border-border relative overflow-hidden"
      style={{ padding: "36px 24px", boxShadow: "var(--shadow-lg)" }}
    >
      <div
        className="absolute w-[220px] h-[220px] rounded-full"
        style={{
          left: "50%",
          top: "20%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, var(--accent) 5%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <m.div
        initial={{ scale: 0.3, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12 }}
        className="inline-block mb-3"
        style={{ fontSize: 56 }}
      >
        {icon}
      </m.div>

      <h2
        className="text-2xl font-black text-text-primary font-display"
        style={{ margin: "0 0 6px" }}
      >
        Kết quả bài Quiz
      </h2>
      <p
        className="text-text-secondary font-semibold"
        style={{ margin: "0 0 20px", fontSize: 13.5 }}
      >
        {labelText}
      </p>

      {/* Main Stats Card */}
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-(--radius-xl) flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          padding: "20px 24px",
          boxShadow: "0 4px 14px var(--accent-muted)",
          color: "var(--text-on-accent)",
        }}
      >
        <div className="text-left">
          <span
            className="text-[11px] font-extrabold uppercase tracking-widest"
            style={{ opacity: 0.9 }}
          >
            Điểm số chính xác
          </span>
          <div
            className="font-black flex items-baseline gap-1"
            style={{ fontSize: 26, marginTop: 2 }}
          >
            <span>{score}</span>
            <span className="text-[15px]" style={{ opacity: 0.8 }}>
              / {total} câu
            </span>
          </div>
        </div>
        <div className="text-right">
          <span
            className="text-[11px] font-extrabold uppercase tracking-widest"
            style={{ opacity: 0.9 }}
          >
            Tỉ lệ đạt
          </span>
          <div className="font-black" style={{ fontSize: 26, marginTop: 2 }}>
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
          className="mt-3 items-center gap-1.5 rounded-full text-[13px] font-extrabold"
          style={{
            display: "inline-flex",
            background: "linear-gradient(135deg, var(--fire), var(--xp))",
            padding: "6px 18px",
            color: "var(--text-on-accent)",
            boxShadow: "0 2px 10px rgba(245, 158, 11, 0.25)",
          }}
        >
          <Flame /> Combo liên tiếp tốt nhất: x{maxCombo}
        </m.div>
      )}

      {/* Topic breakdown */}
      <div className="text-left" style={{ marginTop: 28 }}>
        <h4
          className="font-extrabold uppercase tracking-widest text-text-secondary mb-2.5"
          style={{ fontSize: 11.5 }}
        >
          Thống kê chi tiết chủ đề
        </h4>
        <div className="flex flex-col gap-2">
          {Object.entries(topicBreakdown).map(([topic, { correct, total: t }], idx) => {
            const isWeak = correct / t < 0.5;
            return (
              <m.div
                key={topic}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 + 0.2 }}
                className="flex items-center justify-between rounded-(--radius-lg) border-2 border-border"
                style={{
                  padding: "12px 14px",
                  background: isWeak ? "rgba(239, 68, 68, 0.03)" : "var(--surface-alt)",
                }}
              >
                <div className="flex items-center gap-2 w-[0px]">
                  {isWeak ? (
                    <AlertTriangle className="text-destructive text-sm" />
                  ) : (
                    <div
                      className="w-[6px] h-[6px] rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                  <span
                    className="font-bold overflow-hidden"
                    style={{
                      fontSize: 13.5,
                      color: isWeak ? "var(--error)" : "var(--text-secondary)",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {topic}
                  </span>
                </div>

                <span
                  className="font-extrabold rounded-md"
                  style={{
                    fontSize: 12.5,
                    padding: "2px 8px",
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
          className="mt-5 rounded-(--radius-lg) text-center"
          style={{
            padding: 14,
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid color-mix(in srgb, var(--warning) 25%, var(--border))",
          }}
        >
          <p
            className="text-[13px] font-bold m-0 flex items-center justify-center gap-1.5"
            style={{ color: "var(--warning)" }}
          >
            <AlertTriangle /> Cần ôn lại: {weakTopics.join(", ")}
          </p>
          <m.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/grammar-lessons")}
            className="mt-2.5 border-none py-1.5 px-3.5 rounded-lg text-xs font-extrabold cursor-pointer items-center gap-1"
            style={{
              background: "var(--warning)",
              color: "var(--text-on-accent)",
              boxShadow: "0 2px 6px rgba(245, 158, 11, 0.2)",
              display: "inline-flex",
            }}
          >
            <BookOpen /> Học ngay lý thuyết
          </m.button>
        </m.div>
      )}

      {/* Actions */}
      <div className="flex gap-2.5 justify-center" style={{ marginTop: 28 }}>
        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="flex-1 h-[40px] rounded-(--radius-lg) bg-(--surface) text-text-primary font-extrabold cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            border: "1.5px solid var(--border)",
            fontSize: 13.5,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <RefreshCw /> Làm lại đề này
        </m.button>

        <m.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewQuiz}
          className="flex-1 h-[40px] rounded-(--radius-lg) border-none font-extrabold cursor-pointer flex items-center justify-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            color: "var(--text-on-accent)",
            fontSize: 13.5,
            boxShadow: "0 2px 8px var(--accent-muted)",
          }}
        >
          <Star /> Đề mới ngẫu nhiên
        </m.button>
      </div>
    </div>
  );
}
