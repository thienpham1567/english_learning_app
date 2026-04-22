"use client";
import { api } from "@/lib/api-client";
import { useCallback, useEffect, useState } from "react";
import { Card, Flex, Typography, Button, Progress, Tag, Spin, Steps } from "antd";
import {
  CheckCircleFilled,
  RightOutlined,
  TrophyOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { SCENARIOS, getScenarioById } from "@/lib/scenarios/data";
import type { Scenario, ScenarioStep, VocabContent, ListeningContent, SpeakingContent, ReadingContent, WritingContent } from "@/lib/scenarios/data";

const { Title, Text, Paragraph } = Typography;

type ScenarioSummary = {
  id: string; title: string; emoji: string; description: string; level: string;
  estimatedMinutes: number; totalSteps: number; completedSteps: number; isComplete: boolean;
  steps: Array<{ title: string; type: string; icon: string; completed: boolean; xp: number }>;
};

type Phase = "list" | "scenario" | "step";

const LEVEL_COLORS: Record<string, string> = {
  A1: "#ef4444", A2: "#f97316", B1: "#eab308", B2: "#22c55e", C1: "#3b82f6", C2: "#8b5cf6",
};

export default function ScenariosPage() {
  const [phase, setPhase] = useState<Phase>("list");
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepAnswers, setStepAnswers] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [writingText, setWritingText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ scenarios: ScenarioSummary[] }>("/scenarios");
      if (data) setScenarios(data.scenarios);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await api.get<{ scenarios: ScenarioSummary[] }>("/scenarios");
        if (!cancelled) setScenarios(data.scenarios);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const openScenario = (id: string) => {
    const scenario = getScenarioById(id);
    if (!scenario) return;
    setActiveScenario(scenario);
    const summary = scenarios.find((s) => s.id === id);
    const completed = new Set<number>();
    summary?.steps.forEach((s, i) => { if (s.completed) completed.add(i); });
    setCompletedSteps(completed);
    setPhase("scenario");
  };

  const startStep = (idx: number) => {
    setActiveStepIdx(idx);
    setStepAnswers([]);
    setSelectedOption(null);
    setWritingText("");
    setShowResult(false);
    setPhase("step");
  };

  const completeStep = async () => {
    if (!activeScenario || submitting) return;
    setSubmitting(true);
    try {
      await api.post("/scenarios", { scenarioId: activeScenario.id, stepIndex: activeStepIdx, score: stepAnswers.length });
      setCompletedSteps((prev) => new Set([...prev, activeStepIdx]));
      setShowResult(true);
      await fetchScenarios();
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  // ── Scenario List ──
  if (phase === "list") {
    if (loading) {
      return (
        <Flex align="center" justify="center" style={{ height: "100%", flexDirection: "column", gap: 16 }}>
          <Spin size="large" />
        </Flex>
      );
    }

    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-5)" style={{ maxWidth: 600, margin: "0 auto" }}>
          <div>
            <Title level={4} style={{ margin: "0 0 4px" }}>Tình huống thực tế</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Học tiếng Anh qua các tình huống đời thực</Text>
          </div>

          {scenarios.map((s) => (
            <Card
              key={s.id}
              hoverable
              onClick={() => openScenario(s.id)}
              style={{
                borderRadius: "var(--radius-xl)",
                cursor: "pointer",
                border: s.isComplete ? "1px solid #22c55e44" : "1px solid var(--border)",
              }}
              styles={{ body: { padding: "20px" } }}
            >
              <Flex align="flex-start" gap={14}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>{s.emoji}</span>
                <Flex vertical style={{ flex: 1 }} gap={6}>
                  <Flex align="center" gap={8}>
                    <Text strong style={{ fontSize: 15 }}>{s.title}</Text>
                    {s.isComplete && <CheckCircleFilled style={{ color: "#22c55e", fontSize: 14 }} />}
                  </Flex>
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.description}</Text>
                  <Flex gap={8} align="center" style={{ marginTop: 4 }}>
                    <Tag color={LEVEL_COLORS[s.level]} style={{ fontSize: 10, borderRadius: 99, margin: 0 }}>{s.level}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>~{s.estimatedMinutes} phút</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{s.completedSteps}/{s.totalSteps} bước</Text>
                  </Flex>
                  <Progress
                    percent={Math.round((s.completedSteps / s.totalSteps) * 100)}
                    showInfo={false}
                    size="small"
                    strokeColor={s.isComplete ? "#22c55e" : "var(--accent)"}
                    style={{ marginTop: 4 }}
                  />
                </Flex>
                <RightOutlined style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 8 }} />
              </Flex>
            </Card>
          ))}
        </Flex>
      </div>
    );
  }

  // ── Scenario Detail (steps list) ──
  if (phase === "scenario" && activeScenario) {
    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-5)" style={{ maxWidth: 600, margin: "0 auto" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => setPhase("list")}
            style={{ alignSelf: "flex-start", padding: "4px 0" }}
          >
            Quay lại
          </Button>

          <Card
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              borderRadius: "var(--radius-xl)",
              border: "none",
            }}
            styles={{ body: { padding: "28px" } }}
          >
            <span style={{ fontSize: 40 }}>{activeScenario.emoji}</span>
            <Title level={3} style={{ color: "#fff", margin: "8px 0 4px" }}>{activeScenario.title}</Title>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{activeScenario.description}</Text>
          </Card>

          <Steps
            direction="vertical"
            current={-1}
            items={activeScenario.steps.map((step, i) => ({
              title: (
                <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                  <Text strong style={{ fontSize: 13 }}>{step.icon} {step.title}</Text>
                  <Tag style={{ fontSize: 10, margin: 0 }}>+{step.xp} XP</Tag>
                </Flex>
              ),
              description: (
                <Flex align="center" gap={8} style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{step.description}</Text>
                  {completedSteps.has(i) ? (
                    <CheckCircleFilled style={{ color: "#22c55e", fontSize: 14 }} />
                  ) : (
                    <Button size="small" type="primary" onClick={() => startStep(i)}>
                      Bắt đầu
                    </Button>
                  )}
                </Flex>
              ),
              status: completedSteps.has(i) ? "finish" : "wait",
            }))}
          />

          {completedSteps.size === activeScenario.steps.length && (
            <Card style={{ borderRadius: "var(--radius-xl)", textAlign: "center", background: "#22c55e0a", border: "1px solid #22c55e33" }}>
              <TrophyOutlined style={{ fontSize: 28, color: "#22c55e" }} />
              <br />
              <Text strong style={{ color: "#22c55e" }}>Hoàn thành! +{activeScenario.bonusXp} XP bonus</Text>
            </Card>
          )}
        </Flex>
      </div>
    );
  }

  // ── Step Execution ──
  if (phase === "step" && activeScenario) {
    const step = activeScenario.steps[activeStepIdx];
    if (!step) return null;

    if (showResult) {
      return (
        <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
          <Flex vertical gap="var(--space-5)" style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <CheckCircleFilled style={{ fontSize: 48, color: "#22c55e" }} />
            <Title level={4} style={{ margin: 0 }}>Hoàn thành: {step.title}</Title>
            <Text type="secondary">+{step.xp} XP</Text>
            <Button type="primary" onClick={() => setPhase("scenario")} style={{ borderRadius: 12 }}>
              Quay lại tình huống
            </Button>
          </Flex>
        </div>
      );
    }

    return (
      <div style={{ height: "100%", overflowY: "auto", padding: "var(--space-6)" }} className="anim-fade-up">
        <Flex vertical gap="var(--space-5)" style={{ maxWidth: 600, margin: "0 auto" }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => setPhase("scenario")}
            style={{ alignSelf: "flex-start", padding: "4px 0" }}
          >
            Quay lại
          </Button>

          <Flex align="center" gap={8}>
            <span style={{ fontSize: 24 }}>{step.icon}</span>
            <Title level={4} style={{ margin: 0 }}>{step.title}</Title>
          </Flex>

          {/* Render step content based on type */}
          {step.type === "vocabulary" && <VocabStep content={step.content as VocabContent} onComplete={completeStep} submitting={submitting} />}
          {step.type === "listening" && <QuizStep content={step.content as ListeningContent} onComplete={completeStep} submitting={submitting} />}
          {step.type === "reading" && <ReadingStep content={step.content as ReadingContent} onComplete={completeStep} submitting={submitting} />}
          {step.type === "speaking" && <SpeakingStep content={step.content as SpeakingContent} onComplete={completeStep} submitting={submitting} />}
          {step.type === "writing" && <WritingStep content={step.content as WritingContent} onComplete={completeStep} submitting={submitting} />}
        </Flex>
      </div>
    );
  }

  return null;
}

// ── Step Components ──

function VocabStep({ content, onComplete, submitting }: { content: VocabContent; onComplete: () => void; submitting: boolean }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const word = content.words[current];

  return (
    <Flex vertical gap={16}>
      <Text type="secondary" style={{ fontSize: 12 }}>Flashcard {current + 1}/{content.words.length}</Text>
      <Card
        hoverable
        onClick={() => setFlipped(!flipped)}
        style={{
          borderRadius: "var(--radius-xl)",
          minHeight: 160,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {!flipped ? (
          <Flex vertical align="center" gap={8}>
            <Title level={3} style={{ margin: 0 }}>{word.word}</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Nhấn để lật</Text>
          </Flex>
        ) : (
          <Flex vertical align="center" gap={8}>
            <Text strong style={{ fontSize: 16, color: "var(--accent)" }}>{word.translation}</Text>
            <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>{word.example}</Text>
          </Flex>
        )}
      </Card>
      <Flex gap={12}>
        {current > 0 && (
          <Button onClick={() => { setCurrent(prev => prev - 1); setFlipped(false); }}>← Trước</Button>
        )}
        {current < content.words.length - 1 ? (
          <Button type="primary" onClick={() => { setCurrent(prev => prev + 1); setFlipped(false); }}>Tiếp →</Button>
        ) : (
          <Button type="primary" onClick={onComplete} loading={submitting}>Hoàn thành ✓</Button>
        )}
      </Flex>
    </Flex>
  );
}

function QuizStep({ content, onComplete, submitting }: { content: ListeningContent; onComplete: () => void; submitting: boolean }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const q = content.questions[qIdx];

  return (
    <Flex vertical gap={16}>
      <Card style={{ borderRadius: "var(--radius-xl)", background: "var(--surface-alt, #f9f9fb)" }}>
        <Text style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>🔊 {content.dialogue}</Text>
      </Card>
      <Text strong style={{ fontSize: 14 }}>Câu {qIdx + 1}/{content.questions.length}: {q.question}</Text>
      <Flex vertical gap={8}>
        {q.options.map((opt, i) => (
          <button key={i} disabled={answered} onClick={() => { setSelected(i); setAnswered(true); }}
            style={{
              padding: "12px 16px", borderRadius: 10, textAlign: "left", fontSize: 13, cursor: answered ? "default" : "pointer",
              border: answered ? (i === q.correctIndex ? "2px solid #22c55e" : selected === i ? "2px solid #ef4444" : "1px solid var(--border)") : (selected === i ? "2px solid var(--accent)" : "1px solid var(--border)"),
              background: answered && i === q.correctIndex ? "#22c55e11" : "var(--card-bg, var(--surface))",
              color: "var(--text)",
            }}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </Flex>
      {answered && (
        qIdx < content.questions.length - 1 ? (
          <Button type="primary" onClick={() => { setQIdx(prev => prev + 1); setSelected(null); setAnswered(false); }}>Câu tiếp →</Button>
        ) : (
          <Button type="primary" onClick={onComplete} loading={submitting}>Hoàn thành ✓</Button>
        )
      )}
    </Flex>
  );
}

function ReadingStep({ content, onComplete, submitting }: { content: ReadingContent; onComplete: () => void; submitting: boolean }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const q = content.questions[qIdx];

  return (
    <Flex vertical gap={16}>
      <Card style={{ borderRadius: "var(--radius-xl)", background: "var(--surface-alt, #f9f9fb)" }}>
        <pre style={{ fontSize: 12, lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace" }}>{content.passage}</pre>
      </Card>
      <Text strong style={{ fontSize: 14 }}>Câu {qIdx + 1}/{content.questions.length}: {q.question}</Text>
      <Flex vertical gap={8}>
        {q.options.map((opt, i) => (
          <button key={i} disabled={answered} onClick={() => { setSelected(i); setAnswered(true); }}
            style={{
              padding: "12px 16px", borderRadius: 10, textAlign: "left", fontSize: 13, cursor: answered ? "default" : "pointer",
              border: answered ? (i === q.correctIndex ? "2px solid #22c55e" : selected === i ? "2px solid #ef4444" : "1px solid var(--border)") : "1px solid var(--border)",
              background: answered && i === q.correctIndex ? "#22c55e11" : "var(--card-bg, var(--surface))",
              color: "var(--text)",
            }}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </Flex>
      {answered && (
        qIdx < content.questions.length - 1 ? (
          <Button type="primary" onClick={() => { setQIdx(prev => prev + 1); setSelected(null); setAnswered(false); }}>Câu tiếp →</Button>
        ) : (
          <Button type="primary" onClick={onComplete} loading={submitting}>Hoàn thành ✓</Button>
        )
      )}
    </Flex>
  );
}

function SpeakingStep({ content, onComplete, submitting }: { content: SpeakingContent; onComplete: () => void; submitting: boolean }) {
  const [showSample, setShowSample] = useState<number | null>(null);

  return (
    <Flex vertical gap={16}>
      <Card style={{ borderRadius: "var(--radius-xl)", background: "var(--surface-alt, #f9f9fb)" }}>
        <Text style={{ fontSize: 13 }}>💡 {content.situation}</Text>
      </Card>
      {content.prompts.map((prompt, i) => (
        <Card key={i} size="small" style={{ borderRadius: 12 }}>
          <Flex vertical gap={8}>
            <Text style={{ fontSize: 13, fontWeight: 500 }}>{prompt}</Text>
            <Button size="small" type="link" style={{ alignSelf: "flex-start", padding: 0, fontSize: 12 }}
              onClick={() => setShowSample(showSample === i ? null : i)}>
              {showSample === i ? "Ẩn gợi ý" : "Xem gợi ý trả lời"}
            </Button>
            {showSample === i && (
              <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic", background: "var(--accent-muted, #f0f0ff)", padding: 8, borderRadius: 8 }}>
                {content.sampleResponses[i]}
              </Text>
            )}
          </Flex>
        </Card>
      ))}
      <Button type="primary" onClick={onComplete} loading={submitting}>Hoàn thành ✓</Button>
    </Flex>
  );
}

function WritingStep({ content, onComplete, submitting }: { content: WritingContent; onComplete: () => void; submitting: boolean }) {
  const [text, setText] = useState("");
  const [showSample, setShowSample] = useState(false);

  return (
    <Flex vertical gap={16}>
      <Card style={{ borderRadius: "var(--radius-xl)" }}>
        <Flex vertical gap={8}>
          <Text strong style={{ fontSize: 14 }}>📝 Đề bài:</Text>
          <Text style={{ fontSize: 13, lineHeight: 1.6 }}>{content.prompt}</Text>
          <Flex vertical gap={4} style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>Gợi ý:</Text>
            {content.hints.map((h, i) => (
              <Text key={i} type="secondary" style={{ fontSize: 11 }}>• {h}</Text>
            ))}
          </Flex>
        </Flex>
      </Card>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Viết câu trả lời của bạn ở đây..."
        style={{
          width: "100%", minHeight: 150, padding: 16, borderRadius: 12,
          border: "1px solid var(--border)", background: "var(--card-bg, var(--surface))",
          fontSize: 13, lineHeight: 1.6, resize: "vertical", color: "var(--text)",
          fontFamily: "inherit",
        }}
      />
      <Button type="link" onClick={() => setShowSample(!showSample)} style={{ alignSelf: "flex-start", padding: 0, fontSize: 12 }}>
        {showSample ? "Ẩn bài mẫu" : "Xem bài mẫu"}
      </Button>
      {showSample && (
        <Card size="small" style={{ borderRadius: 12, background: "var(--accent-muted, #f0f0ff)" }}>
          <Paragraph style={{ fontSize: 12, whiteSpace: "pre-wrap", margin: 0 }}>{content.sampleAnswer}</Paragraph>
        </Card>
      )}
      <Button type="primary" onClick={onComplete} loading={submitting} disabled={text.length < 20}>Hoàn thành ✓</Button>
    </Flex>
  );
}
