"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LoadingOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  ExportOutlined,
  RightOutlined,
  LeftOutlined,
  BookOutlined,
  ToolOutlined,
  ReadOutlined,
  SoundOutlined,
  FileTextOutlined,
  EditOutlined,
  AudioOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import { Card, Empty, Flex, Typography, Tag, Progress } from "antd";
import { api } from "@/lib/api-client";
import { ModuleHeader } from "@/components/shared/ModuleHeader";

const { Text } = Typography;

// ── Types (mirrors API + session state machine) ─────────────────────────────

interface DueReviewItem {
  id: string;
  sourceType: string;
  sourceId: string;
  skillIds: string[];
  priority: number;
  dueAt: string;
  estimatedMinutes: number;
  reviewMode: string;
  reason: string;
}

type TaskOutcome = "correct" | "incorrect" | "skipped";

interface SessionTaskResult {
  taskId: string;
  sourceType: string;
  outcome: TaskOutcome;
}

// ── Supported types & delegate routes (mirrors review-session.ts) ───────────

const SUPPORTED = new Set(["vocabulary", "flashcard", "error_log", "grammar_quiz"]);

function getDelegateRoute(sourceType: string): string {
  switch (sourceType) {
    case "vocabulary": case "flashcard": return "/flashcards";
    case "error_log": return "/review-quiz";
    case "grammar_quiz": return "/grammar-quiz";
    case "listening": return "/listening";
    case "reading": return "/reading";
    case "writing": return "/writing-practice";
    case "pronunciation": return "/pronunciation";
    default: return "/review";
  }
}

function sourceLabel(sourceType: string): string {
  switch (sourceType) {
    case "vocabulary": case "flashcard": return "Từ vựng";
    case "error_log": return "Lỗi sai";
    case "grammar_quiz": return "Ngữ pháp";
    case "listening": return "Nghe";
    case "reading": return "Đọc";
    case "writing": return "Viết";
    case "pronunciation": return "Phát âm";
    default: return "Ôn tập";
  }
}

function sourceIcon(sourceType: string): ReactNode {
  switch (sourceType) {
    case "vocabulary": case "flashcard": return <BookOutlined />;
    case "error_log": return <ToolOutlined />;
    case "grammar_quiz": return <ReadOutlined />;
    case "listening": return <SoundOutlined />;
    case "reading": return <FileTextOutlined />;
    case "writing": return <EditOutlined />;
    case "pronunciation": return <AudioOutlined />;
    default: return <SyncOutlined />;
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MixedReviewSessionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<DueReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionTaskResult[]>([]);
  const [status, setStatus] = useState<"loading" | "in-progress" | "completed" | "exited">("loading");

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ items: DueReviewItem[] }>("/review/due");
      setTasks(data.items);
      setCurrentIndex(0);
      setResults([]);
      setStatus(data.items.length === 0 ? "completed" : "in-progress");
    } catch {
      setTasks([]);
      setStatus("completed");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Current task
  const current = status === "in-progress" ? tasks[currentIndex] ?? null : null;
  const progress = tasks.length > 0 ? Math.round((results.length / tasks.length) * 100) : 100;

  // Record outcome and advance
  const recordOutcome = useCallback((outcome: TaskOutcome) => {
    if (!current) return;
    setResults((prev) => [...prev, { taskId: current.id, sourceType: current.sourceType, outcome }]);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= tasks.length) {
      setStatus("completed");
    } else {
      setCurrentIndex(nextIndex);
    }
  }, [current, currentIndex, tasks.length]);

  // Exit
  const handleExit = useCallback(() => {
    setStatus("exited");
  }, []);

  // ── Submit outcomes to server (Story 22.4, AC: 1-4) ───────────────────────
  // Maps UI outcomes → SRS outcomes and fires to /api/review/outcome.
  // Fire-and-forget: telemetry failure doesn't erase the visible answer (AC: 4).
  useEffect(() => {
    if (status !== "completed" && status !== "exited") return;
    if (results.length === 0) return;

    const outcomeResults = results
      .filter((r) => r.outcome !== "skipped")
      .map((r) => ({
        taskId: r.taskId,
        outcome: r.outcome === "correct" ? "good" as const : "again" as const,
        durationMs: 0,
      }));

    if (outcomeResults.length === 0) return;

    // Fire-and-forget — never blocks the UI (AC: 4)
    void api.post("/review/outcome", { results: outcomeResults }).catch((err) => {
      console.warn("[review/session] Outcome submission failed — answers preserved in UI:", err);
    });
  }, [status, results]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
        <ModuleHeader title="Ôn tập hỗn hợp" subtitle="Đang tải bài ôn..." icon={<HistoryOutlined />} gradient="var(--gradient-daily)" />
        <Flex justify="center" align="center" style={{ padding: 60 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
        </Flex>
      </div>
    );
  }

  // ── Completed / Exited Summary ─────────────────────────────────────────────

  if (status === "completed" || status === "exited") {
    const correct = results.filter((r) => r.outcome === "correct").length;
    const incorrect = results.filter((r) => r.outcome === "incorrect").length;
    const skipped = results.filter((r) => r.outcome === "skipped").length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const scoreColor = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--error)";

    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
        <ModuleHeader
          title={status === "exited" ? "Phiên ôn tập đã dừng" : "Hoàn thành ôn tập!"}
          subtitle={total === 0 ? "Không có gì cần ôn hôm nay" : `Bạn đã ôn ${total} bài`}
          icon={<HistoryOutlined />}
          gradient="var(--gradient-daily)"
        />

        {total > 0 && (
          <Card
            style={{
              borderRadius: "var(--radius-xl)",
              textAlign: "center",
              marginTop: 20,
              background: "linear-gradient(180deg, var(--card-bg) 0%, color-mix(in srgb, var(--accent) 4%, var(--surface)) 100%)",
            }}
            styles={{ body: { padding: "36px 28px" } }}
          >
            <Progress
              type="circle"
              percent={pct}
              size={120}
              strokeWidth={8}
              strokeColor={scoreColor}
              trailColor="var(--border)"
              format={() => (
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>{correct}/{total}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{pct}%</div>
                </div>
              )}
            />

            <Flex justify="center" gap={12} style={{ marginTop: 20, flexWrap: "wrap" }}>
              {correct > 0 && (
                <Tag color="green" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>
                  <CheckCircleOutlined /> {correct} đúng
                </Tag>
              )}
              {incorrect > 0 && (
                <Tag color="red" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>
                  <CloseCircleOutlined /> {incorrect} sai
                </Tag>
              )}
              {skipped > 0 && (
                <Tag color="orange" style={{ fontSize: 12, padding: "4px 12px", borderRadius: 99 }}>
                  {skipped} bỏ qua
                </Tag>
              )}
            </Flex>
          </Card>
        )}

        {total === 0 && (
          <Card style={{ borderRadius: "var(--radius-xl)", marginTop: 20 }}>
            <Empty description="Tuyệt vời! Bạn không có bài ôn nào hôm nay." />
          </Card>
        )}

        <Flex gap={12} style={{ marginTop: 20 }}>
          <button
            onClick={() => router.push("/review")}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border)",
              background: "var(--card-bg)",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <LeftOutlined style={{ marginRight: 6 }} /> Về trang ôn tập
          </button>
          <button
            onClick={() => router.push("/home")}
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: "var(--radius-xl)",
              border: "none",
              background: "linear-gradient(135deg, var(--accent), var(--secondary))",
              color: "var(--text-on-accent)",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
            }}
          >
            <TrophyOutlined style={{ marginRight: 6 }} /> Về trang chủ
          </button>
        </Flex>
      </div>
    );
  }

  // ── In-Progress: Task Display ──────────────────────────────────────────────

  if (!current) return null;

  const isUnsupported = !SUPPORTED.has(current.sourceType);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px 40px" }}>
      <ModuleHeader title="Ôn tập hỗn hợp" subtitle={`${current.reason}`} icon={<HistoryOutlined />} gradient="var(--gradient-daily)" />

      {/* Progress bar (AC: 1) */}
      <Flex align="center" gap={12} style={{ marginTop: 16, marginBottom: 20 }}>
        <Progress
          percent={progress}
          size="small"
          showInfo={false}
          style={{ flex: 1 }}
        />
        <Tag color="orange" style={{ borderRadius: 99 }}>
          {currentIndex + 1}/{tasks.length}
        </Tag>
        <button
          onClick={handleExit}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-secondary)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Thoát
        </button>
      </Flex>

      {/* Task Header (AC: 1) */}
      <Card
        style={{ borderRadius: "var(--radius-xl)", marginBottom: 16 }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        <Flex align="center" gap={12}>
          <span style={{ fontSize: 32, color: "var(--accent)", display: "inline-flex" }}>{sourceIcon(current.sourceType)}</span>
          <Flex vertical style={{ flex: 1 }}>
            <Text style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>
              {sourceLabel(current.sourceType)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {current.reason} · ~{current.estimatedMinutes} phút · {current.reviewMode}
            </Text>
          </Flex>
          <Tag
            color={current.priority <= 30 ? "red" : current.priority <= 60 ? "orange" : "blue"}
            style={{ borderRadius: 6 }}
          >
            P{current.priority}
          </Tag>
        </Flex>
      </Card>

      {/* Answer Area (AC: 1, 2, 3, 4) */}
      {isUnsupported ? (
        /* AC: 4 — Unsupported fallback */
        <Card style={{ borderRadius: "var(--radius-xl)", textAlign: "center" }} styles={{ body: { padding: "32px 24px" } }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 14 }}>
            Bài ôn này cần mở trang riêng để thực hiện.
          </Text>
          <button
            onClick={() => {
              window.open(getDelegateRoute(current.sourceType), "_blank");
              recordOutcome("skipped");
            }}
            style={{
              padding: "12px 24px",
              borderRadius: "var(--radius)",
              border: "none",
              background: "var(--accent)",
              color: "var(--text-on-accent)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ExportOutlined style={{ marginRight: 6 }} />
            Mở {sourceLabel(current.sourceType)}
          </button>
        </Card>
      ) : (
        /* AC: 2, 3 — Supported task: self-report outcome */
        <Card style={{ borderRadius: "var(--radius-xl)" }} styles={{ body: { padding: "24px" } }}>
          <Text style={{ display: "block", marginBottom: 16, fontSize: 14, color: "var(--text-secondary)" }}>
            Bạn đã ôn xong bài này chưa? Đánh giá kết quả:
          </Text>
          <Flex vertical gap={10}>
            <button
              onClick={() => recordOutcome("correct")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--radius)",
                border: "2px solid color-mix(in srgb, var(--success) 30%, transparent)",
                background: "color-mix(in srgb, var(--success) 6%, transparent)",
                color: "var(--success)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <CheckCircleOutlined style={{ marginRight: 8 }} /> Đã nhớ / Đúng
            </button>
            <button
              onClick={() => recordOutcome("incorrect")}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "var(--radius)",
                border: "2px solid color-mix(in srgb, var(--error) 30%, transparent)",
                background: "color-mix(in srgb, var(--error) 6%, transparent)",
                color: "var(--error)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <CloseCircleOutlined style={{ marginRight: 8 }} /> Chưa nhớ / Sai
            </button>
            <button
              onClick={() => recordOutcome("skipped")}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-muted)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Bỏ qua →
            </button>
          </Flex>
        </Card>
      )}
    </div>
  );
}
