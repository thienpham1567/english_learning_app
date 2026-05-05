"use client";

import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  FlagOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Progress, Tag, Collapse } from "antd";
import type { MockQuestion } from "./types";
import { formatTime, isFillBlank } from "./types";

type Props = {
  questions: MockQuestion[];
  passage: string | null;
  answers: (number | string | null)[];
  fillBlankInputs: Record<number, string>;
  flagged: Set<number>;
  score: number;
  percentage: number;
  timeLimit: number;
  timeLeft: number;
  onRetry: () => void;
};

export function MockTestReview({
  questions, passage, answers, fillBlankInputs, flagged,
  score, percentage, timeLimit, timeLeft, onRetry,
}: Props) {
  const isCorrect = (idx: number): boolean => {
    const q = questions[idx];
    if (isFillBlank(q.type)) {
      return (fillBlankInputs[idx] ?? "").trim().toLowerCase() === (q.correctAnswer ?? "").trim().toLowerCase();
    }
    return answers[idx] === q.correctIndex;
  };

  const isGood = percentage >= 80;

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Score card */}
      <div
        style={{
          textAlign: "center",
          padding: "36px 32px",
          borderRadius: 24,
          background: isGood
            ? "linear-gradient(145deg, color-mix(in srgb, var(--accent) 85%, #000) 0%, var(--accent) 50%, var(--secondary) 100%)"
            : "var(--surface)",
          border: isGood ? "none" : "1px solid var(--border)",
          boxShadow: isGood
            ? "0 8px 32px color-mix(in srgb, var(--accent) 25%, transparent)"
            : "var(--shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isGood && (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 80% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        )}
        <Progress
          type="circle"
          percent={percentage}
          size={120}
          strokeColor={isGood ? "rgba(255,255,255,0.9)" : percentage >= 50 ? "var(--warning)" : "var(--error)"}
          trailColor={isGood ? "rgba(255,255,255,0.15)" : undefined}
          format={() => (
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: isGood ? "var(--text-on-accent)" : "var(--ink)" }}>{score}/{questions.length}</div>
              <div style={{ fontSize: 12, color: isGood ? "rgba(255,255,255,0.6)" : "var(--text-secondary)" }}>{percentage}%</div>
            </div>
          )}
        />
        <h2 style={{
          margin: "16px 0 4px", fontFamily: "var(--font-display)", fontStyle: "italic",
          color: isGood ? "var(--text-on-accent)" : "var(--ink)",
        }}>
          {percentage >= 80 ? "Xuất sắc!" : percentage >= 60 ? "Khá tốt!" : percentage >= 40 ? "Cần cải thiện" : "Cố gắng thêm!"}
        </h2>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 14px", borderRadius: 999, margin: "0 0 20px",
          background: isGood ? "rgba(255,255,255,0.12)" : "var(--bg-secondary)",
          color: isGood ? "rgba(255,255,255,0.7)" : "var(--text-secondary)",
          fontSize: 12, fontWeight: 500,
        }}>
          <ClockCircleOutlined style={{ fontSize: 11 }} />
          {formatTime(timeLimit - timeLeft)} / {formatTime(timeLimit)}
        </div>
        <div>
          <button
            onClick={onRetry}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 28px", borderRadius: 12,
              border: isGood ? "1px solid rgba(255,255,255,0.2)" : "none",
              background: isGood ? "rgba(255,255,255,0.12)" : "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              color: "var(--text-on-accent)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              backdropFilter: "blur(8px)", transition: "all 0.15s ease",
            }}
          >
            <ReloadOutlined /> Thi lại
          </button>
        </div>
      </div>

      {/* IELTS passage in review */}
      {passage && (
        <Collapse
          items={[{
            key: "passage-review",
            label: <span><ReadOutlined /> Bài đọc gốc</span>,
            children: <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{passage}</p>,
          }]}
          style={{ marginBottom: 0 }}
        />
      )}

      {/* Topic breakdown */}
      {(() => {
        const topicMap = new Map<string, { correct: number; total: number }>();
        questions.forEach((q, i) => {
          const topic = q.topic || "Other";
          const entry = topicMap.get(topic) ?? { correct: 0, total: 0 };
          entry.total++;
          if (isCorrect(i)) entry.correct++;
          topicMap.set(topic, entry);
        });
        return (
          <div style={{
            padding: "16px 18px", borderRadius: 16,
            border: "1px solid var(--border)", background: "var(--surface)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <InfoCircleOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>
                Phân tích theo chủ đề
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...topicMap.entries()].map(([topic, { correct, total }]) => {
                const pct = Math.round((correct / total) * 100);
                return (
                  <div key={topic} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, minWidth: 100, color: "var(--ink)" }}>{topic}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)",
                        width: `${pct}%`, transition: "width 0.5s ease",
                      }} />
                    </div>
                    <Tag
                      color={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}
                      style={{ margin: 0, fontSize: 11, fontWeight: 700, borderRadius: 6 }}
                    >
                      {correct}/{total}
                    </Tag>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Score history trend */}
      {(() => {
        const HISTORY_KEY = "mock-test-scores";
        // Save current score
        try {
          const raw = localStorage.getItem(HISTORY_KEY);
          const history: { score: number; total: number; date: string }[] = raw ? JSON.parse(raw) : [];
          const today = new Date().toISOString().slice(0, 10);
          // Only add if this session hasn't been added yet (check last entry)
          const last = history[history.length - 1];
          if (!last || last.score !== score || last.total !== questions.length || last.date !== today) {
            history.push({ score, total: questions.length, date: today });
            if (history.length > 10) history.shift();
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          }
          if (history.length >= 2) {
            return (
              <div style={{
                padding: "16px 18px", borderRadius: 16,
                border: "1px solid var(--border)", background: "var(--surface)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <ClockCircleOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)" }}>
                    Lịch sử điểm (gần nhất)
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {history.map((h, i) => {
                    const pct = Math.round((h.score / h.total) * 100);
                    return (
                      <Tag
                        key={`${h.date}-${i}`}
                        color={pct >= 80 ? "success" : pct >= 50 ? "warning" : "error"}
                        style={{ fontSize: 12, padding: "3px 10px", fontWeight: 600, borderRadius: 6 }}
                      >
                        {pct}%
                      </Tag>
                    );
                  })}
                </div>
                {(() => {
                  const lastPct = Math.round((history[history.length - 1].score / history[history.length - 1].total) * 100);
                  const prevPct = Math.round((history[history.length - 2].score / history[history.length - 2].total) * 100);
                  const diff = lastPct - prevPct;
                  if (diff === 0) return null;
                  return (
                    <p style={{
                      margin: "8px 0 0", fontSize: 12,
                      color: diff > 0 ? "var(--success)" : "var(--error)",
                      fontWeight: 600,
                    }}>
                      {diff > 0 ? `↑ +${diff}%` : `↓ ${diff}%`} so với lần trước
                    </p>
                  );
                })()}
              </div>
            );
          }
        } catch { /* ignore */ }
        return null;
      })()}

      {/* Question review */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <InfoCircleOutlined style={{ fontSize: 12, color: "var(--accent)" }} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)" }}>
          Chi tiết đáp án
        </span>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {questions.map((q, i) => {
          const correct = isCorrect(i);
          return (
            <div
              key={i}
              className={`anim-fade-up anim-delay-${Math.min(i + 1, 8)}`}
              style={{
                padding: "16px 18px", borderRadius: 16,
                border: `1px solid ${correct ? "color-mix(in srgb, var(--success) 25%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
                background: correct ? "color-mix(in srgb, var(--success) 3%, var(--surface))" : "color-mix(in srgb, var(--error) 3%, var(--surface))",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", flexShrink: 0,
                  background: correct ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--error) 12%, transparent)",
                }}>
                  {correct ? <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 12 }} /> : <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 12 }} />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>Câu {i + 1}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: "var(--accent-muted)", color: "var(--accent)" }}>{q.topic}</span>
                {flagged.has(i) && <FlagOutlined style={{ color: "var(--warning)", fontSize: 12 }} />}
                <span style={{
                  marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "2px 10px", borderRadius: 999,
                  background: correct ? "color-mix(in srgb, var(--success) 10%, transparent)" : "color-mix(in srgb, var(--error) 10%, transparent)",
                  color: correct ? "var(--success)" : "var(--error)",
                }}>
                  {correct ? "Đúng" : "Sai"}
                </span>
              </div>

              <p style={{ fontSize: 13, margin: "0 0 10px", lineHeight: 1.5, color: "var(--ink)" }}>{q.stem}</p>

              {q.options && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  {q.options.map((opt, oi) => {
                    const isUserAnswer = answers[i] === oi;
                    const isCorrectOpt = oi === q.correctIndex;
                    return (
                      <div
                        key={oi}
                        style={{
                          padding: "7px 12px", borderRadius: 10, fontSize: 13,
                          display: "flex", alignItems: "center", gap: 6,
                          background: isCorrectOpt ? "color-mix(in srgb, var(--success) 7%, transparent)" : isUserAnswer && !isCorrectOpt ? "color-mix(in srgb, var(--error) 7%, transparent)" : "transparent",
                          border: isCorrectOpt ? "1px solid color-mix(in srgb, var(--success) 25%, transparent)" : isUserAnswer ? "1px solid color-mix(in srgb, var(--error) 25%, transparent)" : "1px solid transparent",
                          color: "var(--ink)",
                        }}
                      >
                        {isCorrectOpt && <CheckCircleOutlined style={{ color: "var(--success)", fontSize: 11 }} />}
                        {isUserAnswer && !isCorrectOpt && <CloseCircleOutlined style={{ color: "var(--error)", fontSize: 11 }} />}
                        {String.fromCharCode(65 + oi)}. {opt}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fill blank */}
              {isFillBlank(q.type) && !q.options && (
                <div style={{ fontSize: 13, marginBottom: 10 }}>
                  <span>Bạn trả lời: </span>
                  <strong style={{ color: correct ? "var(--success)" : "var(--error)" }}>
                    {fillBlankInputs[i]?.trim() || "(không trả lời)"}
                  </strong>
                  {!correct && (
                    <span> → Đáp án: <strong style={{ color: "var(--success)" }}>{q.correctAnswer}</strong></span>
                  )}
                </div>
              )}

              {/* Explanation */}
              <Collapse
                size="small"
                items={[{
                  key: `exp-${i}`,
                  label: <span style={{ fontSize: 12 }}><InfoCircleOutlined /> Giải thích</span>,
                  children: (
                    <div style={{ fontSize: 13 }}>
                      <p style={{ margin: "0 0 4px" }}>{q.explanationEn}</p>
                      <p style={{ margin: 0, color: "var(--text-secondary)" }}>{q.explanationVi}</p>
                    </div>
                  ),
                }]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
