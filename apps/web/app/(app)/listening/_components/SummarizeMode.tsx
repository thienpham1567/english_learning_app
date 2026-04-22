"use client";

import { useState, useCallback, useRef } from "react";
import {
  FileTextOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";
import { api } from "@/lib/api-client";
import { AudioPlayer } from "./AudioPlayer";
import { CEFR_LEVELS } from "@/lib/listening/types";
import type { CefrLevel } from "@/lib/listening/types";

// ── Types ──
type CoverageItem = {
  idea: string;
  covered: boolean;
  whereInSummary?: string;
};

type ScoreResult = {
  attemptId: string;
  overall: number;
  accuracyScore: number;
  coverageScore: number;
  concisenessScore: number;
  keyIdeas: string[];
  coverage: CoverageItem[];
  feedback: string;
  passage: string;
};

type Exercise = {
  id: string;
  level: string;
  audioUrl: string;
};

type SummarizeState = "idle" | "listening" | "writing" | "scoring" | "result";

interface Props {
  examMode: string;
}

function scoreColor(n: number): string {
  if (n >= 80) return "#52c41a";
  if (n >= 60) return "#faad14";
  return "#ff4d4f";
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Noop handlers for AudioPlayer (unlimited replays in summarize mode)
const noop = () => true;
const noopVoid = () => {};

export default function SummarizeMode({ examMode }: Props) {
  const [state, setState] = useState<SummarizeState>("idle");
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassage, setShowPassage] = useState(false);
  // Adaptive level selection (D1 resolution)
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>("B1");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wc = wordCount(summaryText);
  const wcOk = wc >= 30 && wc <= 400;
  const wcColor = wc < 30 ? "var(--text-muted)" : wc > 400 ? "#ff4d4f" : "#52c41a";

  // ── Generate exercise ──
  const startSession = useCallback(async () => {
    setState("idle");
    setError(null);
    setExercise(null);
    setSummaryText("");
    setResult(null);
    setShowPassage(false);

    setState("listening");
    try {
      const data = await api.post<Exercise>("/listening/generate", {
        level: selectedLevel.toLowerCase(), // use selected level (D1 fix)
        exerciseType: "comprehension",
        examMode,
      });
      setExercise(data);
    } catch {
      setError("Không thể tạo bài nghe. Vui lòng thử lại.");
      setState("idle");
    }
  }, [examMode, selectedLevel]);

  // ── Submit summary ──
  const submitSummary = useCallback(async () => {
    if (!exercise || !wcOk) return;
    setState("scoring");
    setError(null);

    try {
      const data = await api.post<ScoreResult>("/listening/summary-score", {
        exerciseId: exercise.id,
        summary: summaryText.trim(),
      });
      setResult(data);
      setState("result");
    } catch (err: unknown) {
      // Extract server error message from API client error shape
      type ApiError = { response?: { data?: { error?: string } }; message?: string };
      const apiErr = err as ApiError;
      const msg =
        apiErr?.response?.data?.error ??
        apiErr?.message ??
        "Có lỗi khi chấm bài. Vui lòng thử lại.";
      setError(msg);
      setState("writing");
    }
  }, [exercise, summaryText, wcOk]);

  // ── RENDER ──
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Error banner */}
      {error && (
        <div style={{ padding: "10px 16px", borderRadius: 8, background: "#ff4d4f15", border: "1px solid #ff4d4f40", color: "#ff4d4f", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle: level picker + start ── */}
      {state === "idle" && (
        <div style={{ padding: 24, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <FileTextOutlined style={{ fontSize: 40, color: "var(--accent)", marginBottom: 12 }} />
            <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>Listen &amp; Summarize</h2>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: 13 }}>
              Nghe đoạn văn → Tóm tắt → AI chấm điểm ý chính
            </p>
          </div>

          {/* Compact CEFR level selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Cấp độ CEFR
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CEFR_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: selectedLevel === l ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: selectedLevel === l ? "var(--accent)" : "var(--surface)",
                    color: selectedLevel === l ? "#fff" : "var(--text)",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 0" }}>
              Đang chọn: <strong>{selectedLevel}</strong> · 3–5 câu · 30–400 từ
            </p>
          </div>

          <button
            onClick={startSession}
            style={{ width: "100%", padding: "12px 24px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Bắt đầu
          </button>
        </div>
      )}

      {/* ── Loading audio ── */}
      {state === "listening" && !exercise && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo bài nghe...</p>
        </div>
      )}

      {/* ── Listening: player + write prompt ── */}
      {(state === "listening" || state === "writing") && exercise && (
        <>
          {/* Instruction */}
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)", fontSize: 13, color: "var(--text-secondary)" }}>
            🎧 <strong>Nghe đoạn văn bên dưới.</strong> Đoạn văn gốc sẽ được tiết lộ sau khi bạn nộp bài tóm tắt.
          </div>

          {/* AudioPlayer (AC1 — reuses 19.3.2 component with A-B loop + speed) */}
          <AudioPlayer
            audioUrl={exercise.audioUrl}
            speed={1}
            replaysUsed={0}
            maxReplays={999}
            onReplay={noop}
            onCycleSpeed={noopVoid}
            selfManagedSpeed
          />

          {/* Summary textarea — shown after first play or via button */}
          {state === "writing" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label htmlFor="summarize-textarea" style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                Tóm tắt đoạn văn bằng lời của bạn (3–5 câu):
              </label>
              <textarea
                id="summarize-textarea"
                ref={textareaRef}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Viết tóm tắt của bạn ở đây... (tối thiểu 30 từ, tối đa 400 từ)"
                rows={6}
                style={{
                  width: "100%",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--card-bg, var(--surface))",
                  fontSize: 14,
                  lineHeight: 1.7,
                  resize: "vertical",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              />
              {/* Word count indicator */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: wcColor, fontWeight: 600 }}>
                  {wc} từ {wc < 30 ? "(cần ít nhất 30)" : wc > 400 ? "(quá dài, tối đa 400)" : "✓"}
                </span>
                <button
                  onClick={submitSummary}
                  disabled={!wcOk}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 8, border: "none",
                    background: wcOk ? "var(--accent)" : "var(--border)",
                    color: "#fff", fontSize: 13, fontWeight: 600,
                    cursor: wcOk ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                  }}
                >
                  <SendOutlined /> Nộp bài
                </button>
              </div>
            </div>
          )}

          {/* "Start writing" button — shows after listening */}
          {state === "listening" && (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => setState("writing")}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "1px solid var(--accent)",
                  background: "transparent", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Đã nghe xong → Viết tóm tắt
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Scoring ── */}
      {state === "scoring" && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
          <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>AI đang chấm bài tóm tắt của bạn...</p>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Score overview */}
          <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", textAlign: "center" }}>
            <Progress
              type="circle"
              percent={result.overall}
              size={110}
              strokeColor={scoreColor(result.overall)}
              format={(pct) => <span style={{ fontSize: 26, fontWeight: 700, color: scoreColor(result.overall) }}>{pct}</span>}
            />
            <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>Điểm tổng thể</p>

            {/* Sub-scores */}
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
              {[
                { label: "Chính xác", value: result.accuracyScore },
                { label: "Bao phủ ý", value: result.coverageScore },
                { label: "Súc tích", value: result.concisenessScore },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "0 0 4px" }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: scoreColor(value) }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {result.feedback && (
            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />Nhận xét từ AI:
              </p>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{result.feedback}</p>
            </div>
          )}

          {/* Key ideas coverage (AC3 — color-coded) */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 10px" }}>
              Các ý chính trong đoạn văn:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.coverage.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "8px 12px", borderRadius: 8,
                    background: item.covered ? "#52c41a10" : "#ff4d4f10",
                    border: `1px solid ${item.covered ? "#52c41a30" : "#ff4d4f30"}`,
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                    {item.covered
                      ? <CheckCircleOutlined style={{ color: "#52c41a" }} />
                      : <CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{item.idea}</p>
                    {item.covered && item.whereInSummary && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                        {item.whereInSummary}
                      </p>
                    )}
                  </div>
                  <Tag
                    color={item.covered ? "success" : "error"}
                    style={{ marginLeft: "auto", flexShrink: 0, fontSize: 11 }}
                  >
                    {item.covered ? "Có" : "Thiếu"}
                  </Tag>
                </div>
              ))}
            </div>
          </div>

          {/* Your summary */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px" }}>Bài tóm tắt của bạn:</p>
            <p style={{ fontSize: 14, margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>{summaryText}</p>
          </div>

          {/* Transcript reveal (AC3 — revealed after submission) */}
          <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setShowPassage((p) => !p)}
              style={{
                display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                cursor: "pointer", color: "var(--accent)", fontSize: 13, fontWeight: 600, padding: 0,
              }}
            >
              <EyeOutlined />
              {showPassage ? "Ẩn đoạn văn gốc" : "Xem đoạn văn gốc"}
            </button>
            {showPassage && (
              <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.8, color: "var(--text)" }}>
                {result.passage}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => { setState("writing"); setResult(null); setSummaryText(""); setShowPassage(false); }}
              style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
            >
              <ReloadOutlined /> Viết lại
            </button>
            <button
              onClick={startSession}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              Bài mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
