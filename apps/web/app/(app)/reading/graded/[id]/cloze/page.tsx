"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  TrophyFilled,
  ReloadOutlined,
  SaveOutlined,
  LoadingOutlined,
  EditOutlined,
  FireFilled,
} from "@ant-design/icons";
import { Card, Button, Flex, Typography, Spin, Tag, message } from "antd";
import { api } from "@/lib/api-client";

const { Text, Title } = Typography;

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .post<{ items: ClozeItem[] }>("/reading/cloze", { passageId: id, mode: "vocab-recall" })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = useCallback((idx: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    const res: Record<number, boolean> = {};
    for (const item of items) {
      const userAns = (answers[item.blankIndex] || "").trim().toLowerCase();
      res[item.blankIndex] = userAns === item.answer;
    }
    setResults(res);
    setSubmitted(true);
  }, [items, answers]);

  const saveMissedToFlashcards = useCallback(async () => {
    const missed = items.filter((item) => !results[item.blankIndex]);
    if (missed.length === 0) return;
    setSavingFlashcards(true);
    let saved = 0;
    for (const item of missed) {
      try { await api.post("/vocabulary/save", { query: item.answer }); saved++; } catch { /* ok */ }
    }
    setSavingFlashcards(false);
    msgApi.success(`Đã lưu ${saved} từ vào sổ tay!`);
  }, [items, results, msgApi]);

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
      <Flex align="center" justify="center" style={{ height: "100%", padding: 60 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />} />
      </Flex>
    );
  }

  if (items.length === 0) {
    return (
      <Flex vertical align="center" justify="center" gap={12} style={{ height: "100%", padding: 60 }}>
        <EditOutlined style={{ fontSize: 48, color: "var(--text-muted)" }} />
        <Text type="secondary">Không thể tạo bài kiểm tra cho bài đọc này</Text>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => router.push(`/reading/graded/${id}`)}>
          Quay lại bài đọc
        </Button>
      </Flex>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }}>
      {contextHolder}
      <Flex vertical gap={20} style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Back */}
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/reading/graded/${id}`)}
          style={{ alignSelf: "flex-start", color: "var(--text-muted)", fontSize: 13, borderRadius: 10 }}
        >
          Quay lại bài đọc
        </Button>

        {/* Header card */}
        <Card
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
            border: "none",
          }}
          styles={{ body: { padding: "20px 24px" } }}
        >
          <Flex align="center" gap={14}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(255,255,255,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <EditOutlined style={{ fontSize: 22, color: "var(--text-on-accent)" }} />
            </div>
            <div>
              <Text style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>
                CLOZE TEST
              </Text>
              <Title level={4} style={{ margin: 0, color: "var(--text-on-accent)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>
                Điền từ vào chỗ trống
              </Title>
            </div>
            <Tag style={{ marginLeft: "auto", borderRadius: 10, border: "none", background: "rgba(255,255,255,0.2)", color: "var(--text-on-accent)", fontWeight: 700, fontSize: 13, padding: "4px 14px" }}>
              {totalCount} câu
            </Tag>
          </Flex>
        </Card>

        {/* Score card (after submit) */}
        {submitted && (
          <Card
            style={{
              borderRadius: 20, textAlign: "center",
              border: `2px solid ${score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)"}`,
              background: score >= 80 ? "color-mix(in srgb, var(--success) 3%, transparent)" : score >= 50 ? "color-mix(in srgb, var(--warning) 3%, transparent)" : "color-mix(in srgb, var(--error) 3%, transparent)",
            }}
            styles={{ body: { padding: "24px" } }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: score >= 80 ? "color-mix(in srgb, var(--success) 12%, transparent)" : score >= 50 ? "color-mix(in srgb, var(--warning) 12%, transparent)" : "color-mix(in srgb, var(--error) 12%, transparent)",
            }}>
              {score >= 80
                ? <TrophyFilled style={{ fontSize: 28, color: "var(--success)" }} />
                : score >= 50
                  ? <FireFilled style={{ fontSize: 28, color: "var(--warning)" }} />
                  : <EditOutlined style={{ fontSize: 28, color: "var(--error)" }} />
              }
            </div>
            <Title level={2} style={{ margin: "0 0 4px", color: score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)" }}>
              {score}%
            </Title>
            <Text type="secondary">
              {correctCount}/{totalCount} đúng
              {score >= 80 ? "" : score >= 50 ? "" : ""}
            </Text>

            <Flex gap={10} justify="center" style={{ marginTop: 16 }}>
              <Button icon={<ReloadOutlined />} onClick={handleRetry} style={{ borderRadius: 10 }}>
                Làm lại
              </Button>
              {correctCount < totalCount && (
                <Button
                  type="primary"
                  icon={savingFlashcards ? <LoadingOutlined /> : <SaveOutlined />}
                  onClick={saveMissedToFlashcards}
                  disabled={savingFlashcards}
                  style={{ borderRadius: 10 }}
                >
                  Lưu {totalCount - correctCount} từ sai
                </Button>
              )}
            </Flex>
          </Card>
        )}

        {/* Cloze items */}
        <Flex vertical gap={10}>
          {items.map((item, i) => {
            const isCorrect = results[item.blankIndex];
            const userAns = answers[item.blankIndex] || "";
            const showResult = submitted;

            return (
              <Card
                key={item.blankIndex}
                style={{
                  borderRadius: 16,
                  border: showResult
                    ? `1.5px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                    : "1px solid var(--border)",
                  background: showResult
                    ? isCorrect ? "var(--success)06" : "var(--error)06"
                    : undefined,
                  transition: "all 0.2s ease",
                }}
                styles={{ body: { padding: "14px 20px" } }}
              >
                <Flex gap={10} align="flex-start">
                  {/* Number badge */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: showResult
                      ? isCorrect ? "color-mix(in srgb, var(--success) 8%, transparent)" : "color-mix(in srgb, var(--error) 8%, transparent)"
                      : "var(--surface)",
                    fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2,
                    color: showResult
                      ? isCorrect ? "var(--success)" : "var(--error)"
                      : "var(--text-muted)",
                  }}>
                    {showResult
                      ? isCorrect ? <CheckCircleFilled /> : <CloseCircleFilled />
                      : i + 1
                    }
                  </div>

                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, lineHeight: 1.8 }}>
                      {item.before}{" "}
                      <input
                        ref={(el) => { inputRefs.current[item.blankIndex] = el; }}
                        type="text"
                        value={userAns}
                        onChange={(e) => handleChange(item.blankIndex, e.target.value)}
                        disabled={submitted}
                        placeholder="______"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const nextItem = items[i + 1];
                            if (nextItem) inputRefs.current[nextItem.blankIndex]?.focus();
                            else handleSubmit();
                          }
                        }}
                        style={{
                          width: Math.max(90, item.answer.length * 12),
                          padding: "3px 10px",
                          borderRadius: 8,
                          border: showResult
                            ? `2px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                            : "1.5px dashed var(--accent)",
                          background: "var(--surface)",
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: "center",
                          outline: "none",
                          color: showResult
                            ? isCorrect ? "var(--success)" : "var(--error)"
                            : "var(--text)",
                          transition: "border-color 0.2s",
                        }}
                      />
                      {" "}{item.after}
                    </Text>

                    {showResult && !isCorrect && (
                      <Text style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--success)" }}>
                        <CheckCircleFilled style={{ marginRight: 4 }} />
                        Đáp án: <strong>{item.answer}</strong>
                      </Text>
                    )}
                  </div>
                </Flex>
              </Card>
            );
          })}
        </Flex>

        {/* Submit button */}
        {!submitted && (
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleFilled />}
            onClick={handleSubmit}
            style={{
              alignSelf: "center", borderRadius: 12, fontWeight: 700,
              height: 48, padding: "0 32px", fontSize: 15,
            }}
          >
            Nộp bài ({totalCount} câu)
          </Button>
        )}
      </Flex>
    </div>
  );
}
