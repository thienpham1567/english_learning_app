"use client";

import { Progress, Tag } from "antd";
import {
  CircleCheckBig,
  Eye,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api-client";
import type { CefrLevel } from "@/lib/listening/types";
import { CEFR_LEVELS } from "@/lib/listening/types";
import { AudioPlayer } from "./AudioPlayer";

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
  if (n >= 80) return "var(--success)";
  if (n >= 60) return "var(--warning)";
  return "var(--error)";
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
  const wcColor = wc < 30 ? "var(--text-muted)" : wc > 400 ? "var(--error)" : "var(--success)";

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
    <div className="w-[640px] mx-auto w-full flex flex-col gap-5">
      {/* Error banner */}
      {error && (
        <div
          className="py-2.5 px-4 rounded-lg text-destructive text-[13px]"
          style={{
            background: "var(--error-bg)",
            border: "1px solid color-mix(in srgb, var(--error) 25%, transparent)",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── Idle: level picker + start ── */}
      {state === "idle" && (
        <div
          className="p-6 border-2 border-border rounded-2xl"
          style={{ background: "var(--card-bg)" }}
        >
          <div className="text-center mb-6">
            <FileText size={40} className="text-accent" />
            <h2 className="text-lg" style={{ margin: "0 0 6px" }}>
              Listen &amp; Summarize
            </h2>
            <p className="text-text-secondary m-0 text-[13px]">
              Nghe đoạn văn → Tóm tắt → AI chấm điểm ý chính
            </p>
          </div>

          {/* Compact CEFR level selector */}
          <div className="mb-5">
            <div
              className="text-[11px] font-bold text-text-muted mb-2.5 uppercase"
              style={{ letterSpacing: "0.1em" }}
            >
              Cấp độ CEFR
            </div>
            <div className="flex gap-2 flex-wrap">
              {CEFR_LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className="py-1.5 px-3.5 rounded-lg font-bold text-[13px] cursor-pointer"
                  style={{
                    border:
                      selectedLevel === l ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: selectedLevel === l ? "var(--accent)" : "var(--surface)",
                    color: selectedLevel === l ? "var(--text-on-accent)" : "var(--text)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-text-muted" style={{ margin: "6px 0 0" }}>
              Đang chọn: <strong>{selectedLevel}</strong> · 3–5 câu · 30–400 từ
            </p>
          </div>

          <button
            onClick={startSession}
            className="w-full border-none text-[15px] font-semibold cursor-pointer"
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              background: "var(--accent)",
              color: "var(--text-on-accent)",
            }}
          >
            Bắt đầu
          </button>
        </div>
      )}

      {/* ── Loading audio ── */}
      {state === "listening" && !exercise && (
        <div className="text-center" style={{ padding: 40 }}>
          <Loader2 className="animate-spin text-accent" size={32} />
          <p className="text-text-secondary mt-3">Đang tạo bài nghe...</p>
        </div>
      )}

      {/* ── Listening: player + write prompt ── */}
      {(state === "listening" || state === "writing") && exercise && (
        <>
          {/* Instruction */}
          <div
            className="py-3 px-4 rounded-xl border-2 border-border text-[13px] text-text-secondary"
            style={{ background: "var(--card-bg)" }}
          >
            🎧 <strong>Nghe đoạn văn bên dưới.</strong> Đoạn văn gốc sẽ được tiết lộ sau khi bạn nộp
            bài tóm tắt.
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
            <div className="flex flex-col gap-2.5">
              <label
                htmlFor="summarize-textarea"
                className="text-[13px] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Tóm tắt đoạn văn bằng lời của bạn (3–5 câu):
              </label>
              <textarea
                id="summarize-textarea"
                ref={textareaRef}
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Viết tóm tắt của bạn ở đây... (tối thiểu 30 từ, tối đa 400 từ)"
                rows={6}
                className="w-full rounded-xl border-2 border-border text-sm"
                style={{
                  padding: 14,
                  background: "var(--card-bg, var(--surface))",
                  lineHeight: 1.7,
                  resize: "vertical",
                  color: "var(--text)",
                  fontFamily: "inherit",
                }}
              />
              {/* Word count indicator */}
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold flex items-center gap-1" style={{ color: wcColor }}>
                  {wc} từ{" "}
                  {wc < 30 ? (
                    "(cần ít nhất 30)"
                  ) : wc > 400 ? (
                    "(quá dài, tối đa 400)"
                  ) : (
                    <CircleCheckBig size={14} className="inline text-emerald-500" />
                  )}
                </span>
                <button
                  onClick={submitSummary}
                  disabled={!wcOk}
                  className="flex items-center gap-1.5 rounded-lg border-none text-[13px] font-semibold"
                  style={{
                    padding: "10px 20px",
                    background: wcOk ? "var(--accent)" : "var(--border)",
                    color: "var(--text-on-accent)",
                    cursor: wcOk ? "pointer" : "not-allowed",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Send /> Nộp bài
                </button>
              </div>
            </div>
          )}

          {/* "Start writing" button — shows after listening */}
          {state === "listening" && (
            <div className="text-center">
              <button
                onClick={() => setState("writing")}
                className="rounded-lg bg-transparent text-accent text-[13px] font-semibold cursor-pointer"
                style={{ padding: "10px 24px", border: "1px solid var(--accent)" }}
              >
                Đã nghe xong → Viết tóm tắt
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Scoring ── */}
      {state === "scoring" && (
        <div className="text-center" style={{ padding: 40 }}>
          <Loader2 className="animate-spin text-accent" size={32} />
          <p className="text-text-secondary mt-3">AI đang chấm bài tóm tắt của bạn...</p>
        </div>
      )}

      {/* ── Result ── */}
      {state === "result" && result && (
        <div className="flex flex-col gap-4">
          {/* Score overview */}
          <div
            className="p-6 rounded-2xl border-2 border-border text-center"
            style={{ background: "var(--card-bg)" }}
          >
            <Progress
              type="circle"
              percent={result.overall}
              size={110}
              strokeColor={scoreColor(result.overall)}
              format={(pct) => (
                <span
                  className="font-bold"
                  style={{ fontSize: 26, color: scoreColor(result.overall) }}
                >
                  {pct}
                </span>
              )}
            />
            <p className="text-[13px] text-text-secondary" style={{ margin: "12px 0 0" }}>
              Điểm tổng thể
            </p>

            {/* Sub-scores */}
            <div className="flex justify-center gap-6 mt-4">
              {[
                { label: "Chính xác", value: result.accuracyScore },
                { label: "Bao phủ ý", value: result.coverageScore },
                { label: "Súc tích", value: result.concisenessScore },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] text-text-secondary" style={{ margin: "0 0 4px" }}>
                    {label}
                  </p>
                  <p className="text-lg font-bold m-0" style={{ color: scoreColor(value) }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback */}
          {result.feedback && (
            <div
              className="p-4 rounded-xl border-2 border-border"
              style={{ background: "var(--card-bg)" }}
            >
              <p
                className="text-xs font-semibold text-text-secondary"
                style={{ margin: "0 0 6px" }}
              >
                <Info className="mr-1" />
                Nhận xét từ AI:
              </p>
              <p className="text-[13px] m-0 leading-relaxed">{result.feedback}</p>
            </div>
          )}

          {/* Key ideas coverage (AC3 — color-coded) */}
          <div
            className="p-4 rounded-xl border-2 border-border"
            style={{ background: "var(--card-bg)" }}
          >
            <p className="text-xs font-semibold text-text-secondary mb-2.5">
              Các ý chính trong đoạn văn:
            </p>
            <div className="flex flex-col gap-2">
              {result.coverage.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 py-2 px-3 rounded-lg"
                  style={{
                    background: item.covered
                      ? "color-mix(in srgb, var(--success) 6%, var(--surface))"
                      : "color-mix(in srgb, var(--error) 6%, var(--surface))",
                    border: `1px solid ${item.covered ? "color-mix(in srgb, var(--success) 20%, transparent)" : "color-mix(in srgb, var(--error) 20%, transparent)"}`,
                  }}
                >
                  <span className="text-sm shrink-0" style={{ marginTop: 1 }}>
                    {item.covered ? (
                      <CircleCheckBig className="text-emerald-500" />
                    ) : (
                      <XCircle className="text-destructive" />
                    )}
                  </span>
                  <div>
                    <p className="m-0 text-[13px] font-medium">{item.idea}</p>
                    {item.covered && item.whereInSummary && (
                      <p
                        className="text-[11px] text-text-muted italic"
                        style={{ margin: "2px 0 0" }}
                      >
                        {item.whereInSummary}
                      </p>
                    )}
                  </div>
                  <Tag
                    color={item.covered ? "success" : "error"}
                    className="shrink-0 text-[11px]"
                    style={{ marginLeft: "auto" }}
                  >
                    {item.covered ? "Có" : "Thiếu"}
                  </Tag>
                </div>
              ))}
            </div>
          </div>

          {/* Your summary */}
          <div
            className="p-4 rounded-xl border-2 border-border"
            style={{ background: "var(--card-bg)" }}
          >
            <p className="text-xs font-semibold text-text-secondary" style={{ margin: "0 0 6px" }}>
              Bài tóm tắt của bạn:
            </p>
            <p className="text-sm m-0 italic" style={{ lineHeight: 1.7 }}>
              {summaryText}
            </p>
          </div>

          {/* Transcript reveal (AC3 — revealed after submission) */}
          <div
            className="p-4 rounded-xl border-2 border-border"
            style={{ background: "var(--card-bg)" }}
          >
            <button
              onClick={() => setShowPassage((p) => !p)}
              className="flex items-center gap-1.5 bg-none border-none cursor-pointer text-accent text-[13px] font-semibold"
              style={{ padding: 0 }}
            >
              <Eye />
              {showPassage ? "Ẩn đoạn văn gốc" : "Xem đoạn văn gốc"}
            </button>
            {showPassage && (
              <p
                className="text-sm"
                style={{ margin: "10px 0 0", lineHeight: 1.8, color: "var(--text)" }}
              >
                {result.passage}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setState("writing");
                setResult(null);
                setSummaryText("");
                setShowPassage(false);
              }}
              className="rounded-lg border-2 border-border bg-transparent cursor-pointer text-[13px] font-medium"
              style={{ padding: "10px 20px", color: "var(--text)" }}
            >
              <RefreshCw /> Viết lại
            </button>
            <button
              onClick={startSession}
              className="rounded-lg border-none cursor-pointer text-[13px] font-semibold"
              style={{
                padding: "10px 20px",
                background: "var(--accent)",
                color: "var(--text-on-accent)",
              }}
            >
              Bài mới
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
