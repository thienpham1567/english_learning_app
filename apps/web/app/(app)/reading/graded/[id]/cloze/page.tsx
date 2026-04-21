"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  SaveOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Button, message, Spin } from "antd";
import { api } from "@/lib/api-client";

type ClozeItem = {
  blankIndex: number;
  before: string;
  blank: string;
  after: string;
  answer: string;
};

export default function ClozeTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<ClozeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [savingFlashcards, setSavingFlashcards] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Fetch cloze items
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .post<{ items: ClozeItem[] }>("/reading/cloze", { passageId: id, mode: "vocab-recall" })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [id]);

  // Handle answer input
  const handleChange = useCallback((idx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }, []);

  // Submit and score (AC4)
  const handleSubmit = useCallback(() => {
    const res: Record<number, boolean> = {};
    for (const item of items) {
      const userAns = (answers[item.blankIndex] || "").trim().toLowerCase();
      res[item.blankIndex] = userAns === item.answer;
    }
    setResults(res);
    setSubmitted(true);
  }, [items, answers]);

  // Missed answers → flashcards (AC5)
  const saveMissedToFlashcards = useCallback(async () => {
    const missed = items.filter((item) => !results[item.blankIndex]);
    if (missed.length === 0) return;

    setSavingFlashcards(true);
    let saved = 0;
    for (const item of missed) {
      try {
        await api.post("/vocabulary/save", { query: item.answer });
        saved++;
      } catch {
        // May already exist — that's fine (idempotent)
      }
    }
    setSavingFlashcards(false);
    msgApi.success(`Đã lưu ${saved} từ vào sổ tay!`);
  }, [items, results, msgApi]);

  // Retry
  const handleRetry = useCallback(() => {
    setAnswers({});
    setResults({});
    setSubmitted(false);
  }, []);

  const correctCount = Object.values(results).filter(Boolean).length;
  const totalCount = items.length;
  const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
        <p>Không thể tạo bài kiểm tra cho bài đọc này.</p>
        <a href={`/reading/graded/${id}`} style={{ color: "var(--accent)" }}>← Quay lại bài đọc</a>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}>
      {contextHolder}
      <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Back */}
        <a
          href={`/reading/graded/${id}`}
          style={{ color: "var(--text-muted)", fontSize: 13, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
        >
          <ArrowLeftOutlined /> Quay lại bài đọc
        </a>

        {/* Header */}
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-muted)" }}>
            CLOZE TEST
          </div>
          <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "var(--text-primary)" }}>
            Điền từ vào chỗ trống
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            {totalCount} câu hỏi · Gõ đáp án và nhấn Nộp bài
          </p>
        </div>

        {/* Score card (after submit) */}
        {submitted && (
          <div style={{
            padding: 20,
            borderRadius: 16,
            background: score >= 80 ? "#52c41a15" : score >= 50 ? "#faad1415" : "#ff4d4f15",
            border: `1px solid ${score >= 80 ? "#52c41a" : score >= 50 ? "#faad14" : "#ff4d4f"}`,
            textAlign: "center",
          }}>
            <TrophyOutlined style={{ fontSize: 32, color: score >= 80 ? "#52c41a" : score >= 50 ? "#faad14" : "#ff4d4f" }} />
            <h3 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 700 }}>
              {score}%
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-secondary)" }}>
              {correctCount}/{totalCount} đúng
              {score >= 80 ? " — Tuyệt vời! 🎉" : score >= 50 ? " — Khá tốt!" : " — Cần ôn lại!"}
            </p>

            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
              <Button icon={<ReloadOutlined />} onClick={handleRetry}>Làm lại</Button>
              {correctCount < totalCount && (
                <Button
                  type="primary"
                  icon={savingFlashcards ? <LoadingOutlined /> : <SaveOutlined />}
                  onClick={saveMissedToFlashcards}
                  disabled={savingFlashcards}
                >
                  Lưu {totalCount - correctCount} từ sai vào sổ tay
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Cloze items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item, i) => {
            const isCorrect = results[item.blankIndex];
            const userAns = answers[item.blankIndex] || "";
            const showResult = submitted;

            return (
              <div
                key={item.blankIndex}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: showResult
                    ? `1px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}`
                    : "1px solid var(--border)",
                  background: showResult
                    ? isCorrect ? "#52c41a08" : "#ff4d4f08"
                    : "var(--card-bg)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  #{i + 1}
                </div>

                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: "var(--text)" }}>
                  {item.before}{" "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <input
                      ref={(el) => { inputRefs.current[item.blankIndex] = el; }}
                      type="text"
                      value={userAns}
                      onChange={(e) => handleChange(item.blankIndex, e.target.value)}
                      disabled={submitted}
                      placeholder="______"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          // Focus next input or submit
                          const nextItem = items[i + 1];
                          if (nextItem) {
                            inputRefs.current[nextItem.blankIndex]?.focus();
                          } else {
                            handleSubmit();
                          }
                        }
                      }}
                      style={{
                        width: Math.max(80, item.answer.length * 12),
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: showResult
                          ? `2px solid ${isCorrect ? "#52c41a" : "#ff4d4f"}`
                          : "1px dashed var(--accent)",
                        background: "var(--surface)",
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: "center",
                        outline: "none",
                        color: showResult
                          ? isCorrect ? "#52c41a" : "#ff4d4f"
                          : "var(--text)",
                      }}
                    />
                    {showResult && (
                      isCorrect
                        ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                        : <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
                    )}
                  </span>
                  {" "}{item.after}
                </p>

                {/* Show correct answer on wrong */}
                {showResult && !isCorrect && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#52c41a" }}>
                    Đáp án: <strong>{item.answer}</strong>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit button */}
        {!submitted && (
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            style={{ alignSelf: "center", borderRadius: 10, fontWeight: 600 }}
          >
            <CheckCircleOutlined /> Nộp bài ({totalCount} câu)
          </Button>
        )}
      </div>
    </div>
  );
}
