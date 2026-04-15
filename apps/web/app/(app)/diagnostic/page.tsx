"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Flex, Typography, Button, Progress, Spin, Tag } from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  RightOutlined,
  ReloadOutlined,
  TrophyOutlined,
  RadarChartOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type Question = {
  id: string;
  skill: string;
  level: string;
  question: string;
  options: string[];
  index: number;
};

type SkillResult = { level: number; cefr: string; correct: number; total: number };
type TestResult = {
  overallCefr: string;
  confidence: number;
  skills: Record<string, SkillResult>;
  xpAwarded: number;
};

type DiagnosticStatus = {
  lastResult: { overallCefr: string; confidence: number; skillBreakdown: Record<string, SkillResult>; completedAt: string } | null;
  canRetake: boolean;
  daysUntilRetake: number;
  hasResult: boolean;
};

type Phase = "loading" | "welcome" | "test" | "submitting" | "results";

const CEFR_COLORS: Record<string, string> = {
  A1: "#ef4444", A2: "#f97316", B1: "#eab308", B2: "#22c55e", C1: "#3b82f6", C2: "#8b5cf6",
};

const SKILL_LABELS: Record<string, string> = {
  grammar: "Ngữ pháp", vocabulary: "Từ vựng", reading: "Đọc hiểu", listening: "Nghe hiểu",
};

export default function DiagnosticPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [status, setStatus] = useState<DiagnosticStatus | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedIndex: number; timeMs: number }>>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [result, setResult] = useState<TestResult | null>(null);

  // Load diagnostic status
  useEffect(() => {
    api.get<DiagnosticStatus>("/diagnostic")
      .then((d) => {
        if (d) {
          setStatus(d);
          setPhase("welcome");
        }
      })
      .catch(() => setPhase("welcome"));
  }, []);

  // Start test
  const startTest = useCallback(async () => {
    setPhase("loading");
    try {
      const data = await api.post<{ questions: Question[] }>("/diagnostic", { action: "generate" });
      setQuestions(data.questions);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
      setPhase("test");
    } catch {
      setPhase("welcome");
    }
  }, []);

  // Submit answer and move to next
  const submitAnswer = useCallback(() => {
    if (selectedOption === null) return;
    const q = questions[currentIndex];
    const timeMs = Date.now() - questionStartTime;

    const newAnswers = [...answers, { questionId: q.id, selectedIndex: selectedOption, timeMs }];
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setQuestionStartTime(Date.now());
    } else {
      // Submit all answers
      setPhase("submitting");
      api.post<TestResult>("/diagnostic", { action: "submit", answers: newAnswers })
        .then((data) => {
          if (data) {
            setResult(data);
            setPhase("results");
          } else {
            setPhase("welcome");
          }
        })
        .catch(() => setPhase("welcome"));
    }
  }, [selectedOption, questions, currentIndex, questionStartTime, answers]);

  // ── Loading ──
  if (phase === "loading") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang chuẩn bị bài test...</Text>
      </Flex>
    );
  }

  // ── Welcome / Status screen ──
  if (phase === "welcome") {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-6)" style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Header */}
          <Card
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "var(--radius-xl)",
              border: "none",
            }}
            styles={{ body: { padding: "32px" } }}
          >
            <Flex vertical gap={12}>
              <span style={{ fontSize: 40 }}>📊</span>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>Bài test xếp loại CEFR</Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.6 }}>
                Kiểm tra trình độ tiếng Anh của bạn qua 30 câu hỏi thích ứng.
                Kết quả sẽ giúp hệ thống cá nhân hóa bài học cho bạn.
              </Text>
            </Flex>
          </Card>

          {/* Test info */}
          <Card style={{ borderRadius: "var(--radius-xl)" }}>
            <Flex vertical gap={16}>
              <Text strong style={{ fontSize: 15 }}>Thông tin bài test:</Text>
              {[
                { icon: "📝", label: "30 câu hỏi", desc: "10 ngữ pháp + 10 từ vựng + 5 đọc + 5 nghe" },
                { icon: "🎯", label: "Thích ứng", desc: "Độ khó tự động điều chỉnh theo câu trả lời" },
                { icon: "⏱️", label: "~15 phút", desc: "Không giới hạn thời gian cho mỗi câu" },
                { icon: "📈", label: "Kết quả", desc: "Xếp loại CEFR (A1–C2) + biểu đồ kỹ năng" },
              ].map((item) => (
                <Flex key={item.label} align="flex-start" gap={12}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                  </div>
                </Flex>
              ))}
            </Flex>
          </Card>

          {/* Previous result */}
          {status?.hasResult && status.lastResult && (
            <Card style={{ borderRadius: "var(--radius-xl)" }}>
              <Flex vertical gap={12}>
                <Flex align="center" gap={8}>
                  <TrophyOutlined style={{ color: CEFR_COLORS[status.lastResult.overallCefr] }} />
                  <Text strong>Kết quả lần trước</Text>
                </Flex>
                <Flex align="center" gap={12}>
                  <Tag
                    color={CEFR_COLORS[status.lastResult.overallCefr]}
                    style={{ fontSize: 18, fontWeight: 700, padding: "4px 16px", borderRadius: 99 }}
                  >
                    {status.lastResult.overallCefr}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Độ tin cậy: {Math.round(status.lastResult.confidence * 100)}%
                  </Text>
                </Flex>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(status.lastResult.completedAt).toLocaleDateString("vi-VN")}
                </Text>
              </Flex>
            </Card>
          )}

          {/* Start button */}
          {status?.canRetake !== false ? (
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={startTest}
              style={{
                height: 52,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 14,
              }}
            >
              {status?.hasResult ? "Làm lại test" : "Bắt đầu test"}
            </Button>
          ) : (
            <Card style={{ borderRadius: "var(--radius-xl)", textAlign: "center" }}>
              <ClockCircleOutlined style={{ fontSize: 24, color: "var(--text-secondary)", marginBottom: 8 }} />
              <br />
              <Text type="secondary">
                Bạn có thể làm lại test sau <strong>{status?.daysUntilRetake}</strong> ngày
              </Text>
            </Card>
          )}
        </Flex>
      </div>
    );
  }

  // ── Test in progress ──
  if (phase === "test" && questions.length > 0) {
    const q = questions[currentIndex];
    const progress = Math.round(((currentIndex) / questions.length) * 100);

    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-5)" style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Progress */}
          <div>
            <Flex justify="space-between" style={{ marginBottom: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Câu {currentIndex + 1}/{questions.length}
              </Text>
              <Tag color={CEFR_COLORS[q.level] ?? "default"} style={{ fontSize: 10, borderRadius: 99 }}>
                {q.level} · {SKILL_LABELS[q.skill] ?? q.skill}
              </Tag>
            </Flex>
            <Progress percent={progress} showInfo={false} strokeColor="var(--accent)" size="small" />
          </div>

          {/* Question */}
          <Card style={{ borderRadius: "var(--radius-xl)" }} styles={{ body: { padding: "24px" } }}>
            <Text style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.6, color: "var(--text)" }}>
              {q.question}
            </Text>
          </Card>

          {/* Options */}
          <Flex vertical gap={10}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelectedOption(i)}
                style={{
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: selectedOption === i
                    ? "2px solid var(--accent)"
                    : "1px solid var(--border)",
                  background: selectedOption === i
                    ? "var(--accent-muted, rgba(99,102,241,0.08))"
                    : "var(--card-bg, var(--surface))",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  fontWeight: selectedOption === i ? 600 : 400,
                  color: selectedOption === i ? "var(--accent)" : "var(--text)",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ marginRight: 10, fontWeight: 700, opacity: 0.5 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            ))}
          </Flex>

          {/* Submit */}
          <Button
            type="primary"
            size="large"
            disabled={selectedOption === null}
            onClick={submitAnswer}
            style={{
              height: 48,
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
            }}
          >
            {currentIndex < questions.length - 1 ? "Câu tiếp theo →" : "Hoàn thành ✓"}
          </Button>
        </Flex>
      </div>
    );
  }

  // ── Submitting ──
  if (phase === "submitting") {
    return (
      <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
        <Spin size="large" />
        <Text type="secondary">Đang phân tích kết quả...</Text>
      </Flex>
    );
  }

  // ── Results ──
  if (phase === "results" && result) {
    const cefrColor = CEFR_COLORS[result.overallCefr] ?? "var(--accent)";

    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-6)" style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* Hero result */}
          <Card
            style={{
              background: `linear-gradient(135deg, ${cefrColor}15, ${cefrColor}05)`,
              borderRadius: "var(--radius-xl)",
              border: `1px solid ${cefrColor}33`,
              textAlign: "center",
            }}
            styles={{ body: { padding: "36px 24px" } }}
          >
            <CheckCircleFilled style={{ fontSize: 36, color: cefrColor, marginBottom: 12 }} />
            <Title level={4} style={{ margin: "0 0 8px", color: "var(--text)" }}>Kết quả xếp loại</Title>
            <div style={{ fontSize: 56, fontWeight: 800, color: cefrColor, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {result.overallCefr}
            </div>
            <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
              Độ tin cậy: {Math.round(result.confidence * 100)}% · +{result.xpAwarded} XP
            </Text>
          </Card>

          {/* Skill breakdown */}
          <Card
            title={<span><RadarChartOutlined style={{ marginRight: 6 }} /> Kỹ năng chi tiết</span>}
            style={{ borderRadius: "var(--radius-xl)" }}
            styles={{ header: { borderBottom: "1px solid var(--border)" } }}
          >
            <Flex vertical gap={14}>
              {Object.entries(result.skills).map(([skill, skillResult]) => {
                const pct = Math.round((skillResult.correct / Math.max(skillResult.total, 1)) * 100);
                const skillColor = CEFR_COLORS[skillResult.cefr] ?? "var(--accent)";
                return (
                  <div key={skill}>
                    <Flex justify="space-between" style={{ marginBottom: 6 }}>
                      <Text style={{ fontSize: 13, fontWeight: 500 }}>
                        {SKILL_LABELS[skill] ?? skill}
                      </Text>
                      <Flex gap={8} align="center">
                        <Tag color={skillColor} style={{ fontSize: 11, fontWeight: 700, borderRadius: 99, margin: 0 }}>
                          {skillResult.cefr}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {skillResult.correct}/{skillResult.total} ({pct}%)
                        </Text>
                      </Flex>
                    </Flex>
                    <div style={{ height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 4,
                        background: skillColor,
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </Flex>
          </Card>

          {/* Actions */}
          <Flex gap={12}>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={() => router.push("/home")}
              style={{ flex: 1, height: 48, borderRadius: 12 }}
            >
              Về trang chủ
            </Button>
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={() => router.push("/progress")}
              style={{ height: 48, borderRadius: 12 }}
            >
              Xem tiến độ
            </Button>
          </Flex>
        </Flex>
      </div>
    );
  }

  return null;
}
