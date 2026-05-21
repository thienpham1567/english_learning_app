"use client";

import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  StarOutlined,
  ThunderboltOutlined,
  EditOutlined,
  SwapOutlined,
  TranslationOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  BulbOutlined,
  RightOutlined,
  ReadOutlined,
  MessageOutlined,
  LinkOutlined,
  FontSizeOutlined,
  BlockOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import Link from "next/link";

import type { ExerciseAnswer, StreakInfo, Badge } from "@/lib/daily-challenge/types";
import { CelebrationOverlay } from "@/components/shared";
import { BadgeGallery } from "./BadgeGallery";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";

/* ── Tier config ── */
const TIERS = [
  { min: 5, tier: "big" as const, label: "Hoàn hảo! 🌟", sub: "Tất cả câu trả lời đều chính xác" },
  { min: 4, tier: "medium" as const, label: "Xuất sắc! 🎉", sub: "Gần như tuyệt đối" },
  { min: 3, tier: "small" as const, label: "Tốt lắm! 👍", sub: "Bạn đang tiến bộ rất nhanh" },
  { min: 0, tier: null, label: "Cố gắng lên! 💪", sub: "Luyện tập thêm để đạt điểm tuyệt đối nhé" },
];

/* ── Exercise type maps ── */
const EXERCISE_ICONS: Record<string, React.ReactNode> = {
  "fill-in-blank": <EditOutlined />,
  "sentence-order": <SwapOutlined />,
  "translation": <TranslationOutlined />,
  "error-correction": <SearchOutlined />,
  "word-formation": <FontSizeOutlined />,
  "dialogue-completion": <MessageOutlined />,
  "synonym-antonym": <LinkOutlined />,
  "reading-comprehension": <ReadOutlined />,
  "collocation": <BlockOutlined />,
};

const EXERCISE_LABELS: Record<string, string> = {
  "fill-in-blank": "Điền từ vào chỗ trống",
  "sentence-order": "Sắp xếp thứ tự câu",
  "translation": "Dịch thuật câu",
  "error-correction": "Tìm và sửa lỗi sai",
  "word-formation": "Cấu tạo từ vựng",
  "dialogue-completion": "Hoàn thành hội thoại",
  "synonym-antonym": "Từ đồng / trái nghĩa",
  "reading-comprehension": "Đọc hiểu văn bản",
  "collocation": "Kết hợp từ (Collocation)",
};

/* ── Answer Detail Card ── */
function AnswerDetailCard({ answer, index }: { answer: ExerciseAnswer; index: number }) {
  const [isExpanded, setIsExpanded] = useState(!answer.isCorrect);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const ok = answer.isCorrect;
  const exerciseIcon = answer.exerciseType ? EXERCISE_ICONS[answer.exerciseType] : <QuestionCircleOutlined />;
  const exerciseLabel = answer.exerciseType ? EXERCISE_LABELS[answer.exerciseType] : "";

  const fetchAIExplanation = useCallback(async () => {
    if (aiExplanation || aiLoading) return;
    setAiLoading(true);
    try {
      const data = await api.post<{ explanation: string }>("/daily-challenge/explain", {
        exercise: { type: answer.exerciseType, instruction: "", data: answer.questionStem },
        userAnswer: answer.answer,
        isCorrect: answer.isCorrect,
      });
      setAiExplanation(data.explanation);
    } catch {
      setAiExplanation("Không thể kết nối máy chủ AI để lấy giải thích. Vui lòng thử lại sau.");
    } finally {
      setAiLoading(false);
    }
  }, [answer, aiExplanation, aiLoading]);

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index + 1, 6) * 0.08 }}
      style={{
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${ok ? "rgba(16, 185, 129, 0.22)" : "rgba(239, 68, 68, 0.18)"}`,
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 18px",
          background: ok ? "rgba(16, 185, 129, 0.03)" : "rgba(239, 68, 68, 0.02)",
          border: "none",
          cursor: "pointer",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: ok ? "#10b981" : "#ef4444",
              boxShadow: ok ? "0 0 8px #10b981" : "0 0 8px #ef4444",
              flexShrink: 0,
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2, minWidth: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Câu số {index + 1}
            </span>
            {exerciseLabel && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                {exerciseIcon} {exerciseLabel}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 20,
              background: ok ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.1)",
              color: ok ? "#10b981" : "#ef4444",
            }}
          >
            {ok ? "Chính xác" : "Chưa đúng"}
          </span>
          <DownOutlined
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              transition: "transform 0.25s ease",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
            }}
          />
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "4px 18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Question stem */}
              {answer.questionStem && (
                <div
                  style={{
                    borderRadius: "var(--radius)",
                    background: "var(--surface-alt)",
                    padding: "12px 14px",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Đề bài câu hỏi
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: "var(--text-primary)",
                      lineHeight: 1.7,
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}
                  >
                    {answer.questionStem}
                  </span>
                </div>
              )}

              {/* User answer */}
              <div
                style={{
                  borderRadius: "var(--radius)",
                  borderLeft: `3px solid ${ok ? "#10b981" : "#ef4444"}`,
                  padding: "11px 14px",
                  background: ok
                    ? "rgba(16, 185, 129, 0.06)"
                    : "rgba(239, 68, 68, 0.05)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    color: ok ? "#10b981" : "#ef4444",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {ok ? "Đáp án của bạn" : "Đáp án bạn chọn"}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    wordBreak: "break-word",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {answer.answer || "(bỏ trống)"}
                </span>
              </div>

              {/* Correct answer (wrong only) */}
              {!ok && answer.correctAnswer && (
                <div
                  style={{
                    borderRadius: "var(--radius)",
                    borderLeft: "3px solid #10b981",
                    padding: "11px 14px",
                    background: "rgba(16, 185, 129, 0.06)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "#10b981",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Đáp án đúng chuẩn
                  </span>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#10b981",
                      wordBreak: "break-word",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {answer.correctAnswer}
                  </span>
                </div>
              )}

              {/* Static explanation */}
              {answer.explanation && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    padding: "6px 2px",
                    alignItems: "flex-start",
                  }}
                >
                  <BulbOutlined
                    style={{
                      color: "var(--accent)",
                      fontSize: 13,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                      margin: 0,
                      wordBreak: "break-word",
                    }}
                  >
                    {answer.explanation}
                  </p>
                </div>
              )}

              {/* AI Explanation Button */}
              {!aiExplanation && (
                <m.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); fetchAIExplanation(); }}
                  disabled={aiLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 99,
                    border: "1px solid color-mix(in srgb, var(--accent) 30%, var(--border))",
                    background: "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                    color: "var(--accent)",
                    cursor: aiLoading ? "wait" : "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    width: "fit-content",
                    marginTop: 4,
                  }}
                >
                  {aiLoading ? (
                    <><LoadingOutlined spin style={{ fontSize: 12 }} /> AI đang phân tích...</>
                  ) : (
                    <><BulbOutlined style={{ fontSize: 12 }} /> Hỏi AI giải thích chi tiết</>
                  )}
                </m.button>
              )}

              {/* AI Explanation Content */}
              {aiExplanation && (
                <m.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 6,
                    padding: "14px",
                    borderRadius: "var(--radius-lg)",
                    background: "linear-gradient(135deg, var(--accent-light), var(--surface-alt))",
                    border: "1px solid color-mix(in srgb, var(--accent) 20%, var(--border))",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <BulbOutlined style={{ fontSize: 13, color: "var(--accent)" }} />
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--accent)" }}>
                      Giải thích từ trợ lý AI
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: "var(--text-primary)",
                      margin: 0,
                      wordBreak: "break-word",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {aiExplanation}
                  </p>
                </m.div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

/* ── Main Results Component ── */
type Props = {
  answers: ExerciseAnswer[];
  score: number;
  streak: StreakInfo;
  badges: Badge[];
  newBadges: Badge[];
  timeElapsedMs: number;
};

export function ChallengeResults({
  answers,
  score,
  streak,
  badges,
  newBadges,
  timeElapsedMs,
}: Props) {
  const matched = TIERS.find((t) => score >= t.min)!;
  const [showCelebration, setShowCelebration] = useState(matched.tier !== null);

  const minutes = Math.floor(timeElapsedMs / 60000);
  const seconds = Math.floor((timeElapsedMs % 60000) / 1000);
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const wrongCount = answers.length - correctCount;
  const pct = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <>
      {matched.tier && (
        <CelebrationOverlay
          tier={matched.tier}
          visible={showCelebration}
          onComplete={() => setShowCelebration(false)}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 800,
              color: matched.tier === "big" ? "var(--xp)" : "var(--accent)",
            }}
          >
            {matched.label}
          </span>
        </CelebrationOverlay>
      )}

      <div
        className="anim-scale-in"
        style={{
          maxWidth: 540,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* ── Score Hero Card ── */}
        <div
          style={{
            borderRadius: "var(--radius-xl)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "36px 24px 28px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, var(--accent), var(--xp))`,
            }}
          />

          {/* Big score number */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            <m.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 80, damping: 10 }}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 96,
                fontWeight: 900,
                lineHeight: 1,
                color: correctCount === answers.length
                  ? "#10b981"
                  : correctCount >= answers.length * 0.6
                  ? "var(--text-primary)"
                  : "var(--accent)",
                letterSpacing: "-.04em",
              }}
            >
              {correctCount}
            </m.span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 32,
                fontWeight: 400,
                color: "var(--text-muted)",
                letterSpacing: "-.02em",
                marginBottom: 8,
              }}
            >
              /{answers.length}
            </span>
          </div>

          {/* Title */}
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 800,
              color: "var(--text-primary)",
              margin: "0 0 6px",
            }}
          >
            {matched.label}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 13.5,
              color: "var(--text-muted)",
              margin: 0,
              fontWeight: 500,
            }}
          >
            {matched.sub} · Độ chính xác {pct}%
          </p>

          {/* Divider */}
          <div
            style={{
              margin: "20px auto",
              width: 50,
              height: 1,
              background: "var(--border)",
            }}
          />

          {/* Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {[
              { icon: <CheckCircleFilled style={{ color: "#10b981" }} />, label: "Đúng", value: correctCount },
              { icon: <CloseCircleFilled style={{ color: "#ef4444" }} />, label: "Sai", value: wrongCount },
              { icon: <ClockCircleOutlined style={{ color: "var(--accent)" }} />, label: "Thời gian", value: `${minutes}:${seconds.toString().padStart(2, "0")}` },
              { icon: <FireOutlined style={{ color: "#f97316" }} />, label: "Chuỗi ngày", value: streak.currentStreak },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 4px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <span style={{ fontSize: 16 }}>{s.icon}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                  }}
                >
                  {s.value}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    color: "var(--text-muted)",
                  }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── New Badges ── */}
        {newBadges.length > 0 && (
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              borderRadius: "var(--radius-xl)",
              border: "1.5px solid rgba(245, 158, 11, 0.35)",
              background: "rgba(245, 158, 11, 0.06)",
              padding: "16px 20px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
              <StarOutlined style={{ fontSize: 13, color: "var(--xp)" }} />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  color: "var(--xp)",
                }}
              >
                Mở khóa huy hiệu mới!
              </span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {newBadges.map((b, i) => (
                <span
                  key={b.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    padding: "6px 16px",
                    borderRadius: 99,
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                    background: "var(--surface)",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {b.icon === "TrophyOutlined" ? (
                    <TrophyOutlined style={{ color: "var(--xp)" }} />
                  ) : (
                    <FireOutlined style={{ color: "var(--xp)" }} />
                  )}
                  {b.label}
                </span>
              ))}
            </div>
          </m.div>
        )}

        {/* ── Answer Breakdown header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 10,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: ".08em",
              color: "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Chi tiết các câu trả lời
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* Answer Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {answers.map((a, i) => (
            <AnswerDetailCard key={i} answer={a} index={i} />
          ))}
        </div>

        {/* Badges Gallery */}
        <div>
          <BadgeGallery badges={badges} />
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            href="/daily-challenge"
            prefetch={false}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "14px 28px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)",
              fontWeight: 800,
              fontSize: 15,
              textDecoration: "none",
              boxShadow: "0 6px 18px var(--accent-muted)",
              transition: "all 0.2s",
            }}
          >
            Hoàn tất & Tiếp tục
            <RightOutlined style={{ fontSize: 12 }} />
          </Link>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            Quay lại mai nhé!
          </span>
        </div>
      </div>
    </>
  );
}
