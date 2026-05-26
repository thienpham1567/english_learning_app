"use client";

import { Button, Card, Flex, message, Spin, Tag, Typography } from "antd";
import {
  ArrowLeft,
  CheckCircle,
  Flame,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trophy,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
      try {
        await api.post("/vocabulary/save", { query: item.answer });
        saved++;
      } catch {
        /* ok */
      }
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
      <Flex align="center" justify="center" className="h-full" style={{ padding: 60 }}>
        <Spin indicator={<Loader2 className="animate-spin text-accent" size={32} />} />
      </Flex>
    );
  }

  if (items.length === 0) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        gap={12}
        className="h-full"
        style={{ padding: 60 }}
      >
        <Pencil size={48} className="text-text-muted" />
        <Text type="secondary">Không thể tạo bài kiểm tra cho bài đọc này</Text>
        <Button
          type="link"
          icon={<ArrowLeft />}
          onClick={() => router.push(`/reading/graded/${id}`)}
        >
          Quay lại bài đọc
        </Button>
      </Flex>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ padding: "var(--space-6)" }}>
      {contextHolder}
      <Flex vertical gap={20} className="w-[720px] mx-auto">
        {/* Back */}
        <Button
          type="text"
          icon={<ArrowLeft />}
          onClick={() => router.push(`/reading/graded/${id}`)}
          className="text-text-muted text-[13px]"
          style={{ alignSelf: "flex-start", borderRadius: 10 }}
        >
          Quay lại bài đọc
        </Button>

        {/* Header card */}
        <Card
          styles={{ body: { padding: "20px 24px" } }}
          className="border-none"
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, var(--accent), var(--secondary))",
          }}
        >
          <Flex align="center" gap={14}>
            <div
              className="w-[44px] h-[44px] rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.2)" }}
            >
              <Pencil size={22} className="text-(--text-on-accent)" />
            </div>
            <div>
              <Text
                className="text-[11px] uppercase"
                style={{ letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}
              >
                CLOZE TEST
              </Text>
              <Title
                level={4}
                className="m-0 font-display italic"
                style={{ color: "var(--text-on-accent)" }}
              >
                Điền từ vào chỗ trống
              </Title>
            </div>
            <Tag
              className="border-none font-bold text-[13px]"
              style={{
                marginLeft: "auto",
                borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                color: "var(--text-on-accent)",
                padding: "4px 14px",
              }}
            >
              {totalCount} câu
            </Tag>
          </Flex>
        </Card>

        {/* Score card (after submit) */}
        {submitted && (
          <Card
            styles={{ body: { padding: "24px" } }}
            className="text-center"
            style={{
              borderRadius: 20,
              border: `2px solid ${score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)"}`,
              background:
                score >= 80
                  ? "color-mix(in srgb, var(--success) 3%, transparent)"
                  : score >= 50
                    ? "color-mix(in srgb, var(--warning) 3%, transparent)"
                    : "color-mix(in srgb, var(--error) 3%, transparent)",
            }}
          >
            <div
              className="w-[56px] h-[56px] rounded-2xl flex items-center justify-center"
              style={{
                margin: "0 auto 12px",
                background:
                  score >= 80
                    ? "color-mix(in srgb, var(--success) 12%, transparent)"
                    : score >= 50
                      ? "color-mix(in srgb, var(--warning) 12%, transparent)"
                      : "color-mix(in srgb, var(--error) 12%, transparent)",
              }}
            >
              {score >= 80 ? (
                <Trophy size={28} className="text-(--success)" />
              ) : score >= 50 ? (
                <Flame size={28} className="text-(--warning)" />
              ) : (
                <Pencil size={28} className="text-(--error)" />
              )}
            </div>
            <Title
              level={2}
              style={{
                margin: "0 0 4px",
                color:
                  score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--error)",
              }}
            >
              {score}%
            </Title>
            <Text type="secondary">
              {correctCount}/{totalCount} đúng
              {score >= 80 ? "" : score >= 50 ? "" : ""}
            </Text>

            <Flex gap={10} justify="center" className="mt-4">
              <Button icon={<RefreshCw />} onClick={handleRetry} style={{ borderRadius: 10 }}>
                Làm lại
              </Button>
              {correctCount < totalCount && (
                <Button
                  type="primary"
                  icon={savingFlashcards ? <Loader2 className="animate-spin" /> : <Save />}
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
                styles={{ body: { padding: "14px 20px" } }}
                className="rounded-2xl"
                style={{
                  border: showResult
                    ? `1.5px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                    : "1px solid var(--border)",
                  background: showResult
                    ? isCorrect
                      ? "var(--success)06"
                      : "var(--error)06"
                    : undefined,
                  transition: "all 0.2s ease",
                }}
              >
                <Flex gap={10} align="flex-start">
                  {/* Number badge */}
                  <div
                    className="w-[28px] h-[28px] rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: showResult
                        ? isCorrect
                          ? "color-mix(in srgb, var(--success) 8%, transparent)"
                          : "color-mix(in srgb, var(--error) 8%, transparent)"
                        : "var(--surface)",
                      marginTop: 2,
                      color: showResult
                        ? isCorrect
                          ? "var(--success)"
                          : "var(--error)"
                        : "var(--text-muted)",
                    }}
                  >
                    {showResult ? isCorrect ? <CheckCircle /> : <XCircle /> : i + 1}
                  </div>

                  <div className="flex-1">
                    <Text className="text-sm" style={{ lineHeight: 1.8 }}>
                      {item.before}{" "}
                      <input
                        ref={(el) => {
                          inputRefs.current[item.blankIndex] = el;
                        }}
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
                        className="rounded-lg bg-(--surface) text-sm font-semibold text-center"
                        style={{
                          width: Math.max(90, item.answer.length * 12),
                          padding: "3px 10px",
                          border: showResult
                            ? `2px solid ${isCorrect ? "var(--success)" : "var(--error)"}`
                            : "1.5px dashed var(--accent)",
                          outline: "none",
                          color: showResult
                            ? isCorrect
                              ? "var(--success)"
                              : "var(--error)"
                            : "var(--text)",
                          transition: "border-color 0.2s",
                        }}
                      />{" "}
                      {item.after}
                    </Text>

                    {showResult && !isCorrect && (
                      <Text className="block mt-1.5 text-xs text-emerald-500">
                        <CheckCircle className="mr-1" />
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
            icon={<CheckCircle />}
            onClick={handleSubmit}
            className="rounded-xl font-bold h-[48px] text-[15px]"
            style={{ alignSelf: "center", padding: "0 32px" }}
          >
            Nộp bài ({totalCount} câu)
          </Button>
        )}
      </Flex>
    </div>
  );
}
