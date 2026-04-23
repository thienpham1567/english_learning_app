"use client";

import { api } from "@/lib/api-client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  AudioOutlined,
  SoundOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  BarChartOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Progress, Tag } from "antd";

import { useExamMode } from "@/components/shared/ExamModeProvider";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Waveform } from "@/components/speaking/Waveform";

/* ── Types ─────────────────────────────────────────────────── */

type GrammarError = { quote: string; suggestion: string; explanation: string };
type VocabUpgrade = { original: string; better: string; why: string };

type FeedbackResult = {
  fluency: {
    wpm: number;
    wpmTarget: string;
    fillerCount: number;
    fillers: Array<{ filler: string; count: number }>;
    pauseCount: number;
    score: number;
  };
  grammar: { errors: GrammarError[]; score: number };
  vocabulary: { rangeScore: number; upgrades: VocabUpgrade[] };
  coherence: { score: number; note: string };
  overall: number;
  transcript: string;
  summary: string;
};

type PageState =
  | "idle"
  | "generating-topic"
  | "ready"
  | "recording"
  | "evaluating"
  | "result"
  | "session-complete";

const LEVELS = [
  { value: "a2", label: "A2" },
  { value: "b1", label: "B1" },
  { value: "b2", label: "B2" },
  { value: "c1", label: "C1" },
] as const;

const DURATIONS = [
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
  { value: 120, label: "120s" },
] as const;

/* ── Component ─────────────────────────────────────────────── */

export default function SpeakingPracticePage() {
  const { examMode, label: modeLabel } = useExamMode();

  const [state, setState] = useState<PageState>("idle");
  const [level, setLevel] = useState("b1");
  const [duration, setDuration] = useState(90);
  const [topic, setTopic] = useState<{ topic: string; description: string } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const isEvaluatingRef = useRef(false);
  const lastScorePushedRef = useRef(false);

  const voice = useVoiceInput({ autoTranscribe: false });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /* ── Timer ─────────────────────────────────────── */

  const startTimer = useCallback((durationSec: number) => {
    setTimeLeft(durationSec);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ── Generate Topic ───────────────────────────── */

  const generateTopic = useCallback(async () => {
    setState("generating-topic");
    setError(null);
    setFeedback(null);

    try {
      const data = await api.post<{ topic: string; description: string }>("/speaking/topic", {
        level,
        examMode,
      });
      if (!data.topic) throw new Error("No topic returned");
      setTopic(data);
      setState("ready");
    } catch {
      setError("Không thể tạo chủ đề. Vui lòng thử lại.");
      setState("idle");
    }
  }, [level, examMode]);

  /* ── Evaluate ─────────────────────────────────── */

  const evaluate = useCallback(
    async (blob: Blob, durationMs: number, currentTopic: string) => {
      if (isEvaluatingRef.current) return;
      isEvaluatingRef.current = true;
      lastScorePushedRef.current = false;
      setState("evaluating");

      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        formData.append("topic", currentTopic);
        formData.append("level", level);
        formData.append("durationMs", String(Math.round(durationMs)));

        const result = await api.post<FeedbackResult>("/speaking/feedback", formData);
        if (!isMountedRef.current) return;
        setFeedback(result);
        setSessionScores((prev) => [...prev, result.overall]);
        lastScorePushedRef.current = true;
        setState("result");
      } catch {
        if (!isMountedRef.current) return;
        setError("Có lỗi khi đánh giá. Vui lòng thử lại.");
        setState("ready");
      } finally {
        isEvaluatingRef.current = false;
      }
    },
    [level],
  );

  /* ── Record ───────────────────────────────────── */

  const startRecording = useCallback(async () => {
    if (state === "recording" || isEvaluatingRef.current) return;
    setError(null);
    try {
      await voice.start();
      setState("recording");
      startTimer(duration + 10); // +10s buffer per dev notes
    } catch {
      setError("Không thể truy cập microphone.");
    }
  }, [voice, startTimer, duration, state]);

  const stopRecording = useCallback(() => {
    if (state !== "recording") return;
    stopTimer();
    voice.stop();
    // Evaluation kicks in via the blob watcher below.
  }, [voice, stopTimer, state]);

  /* ── Watch for recorder blob → evaluate ───────── */

  useEffect(() => {
    if (state !== "recording") return;
    if (!voice.blob || isEvaluatingRef.current) return;
    if (!topic) return;
    // MediaRecorder's onstop populates blob + durationMs; fire evaluation.
    void evaluate(voice.blob, voice.durationMs, topic.topic);
  }, [state, voice.blob, voice.durationMs, topic, evaluate]);

  /* ── Auto-stop when timer hits 0 ─────────────── */

  useEffect(() => {
    if (state === "recording" && timeLeft === 0 && timerRef.current === null) {
      // Timer finished naturally (startTimer clears timerRef when reaching 0).
      stopRecording();
    }
  }, [state, timeLeft, stopRecording]);

  /* ── Retry / New Topic / End Session ─────────── */

  const retryTopic = useCallback(() => {
    setFeedback(null);
    if (lastScorePushedRef.current) {
      setSessionScores((prev) => prev.slice(0, -1));
      lastScorePushedRef.current = false;
    }
    setState("ready");
  }, []);

  const newTopic = useCallback(() => {
    setFeedback(null);
    void generateTopic();
  }, [generateTopic]);

  const endSession = useCallback(() => {
    setFeedback(null);
    setTopic(null);
    setState("session-complete");
  }, []);

  const resetSession = useCallback(() => {
    setSessionScores([]);
    setFeedback(null);
    setTopic(null);
    setState("idle");
  }, []);

  /* ── Helpers ──────────────────────────────────── */

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const scoreColor = (s: number) => (s >= 80 ? "var(--success)" : s >= 50 ? "var(--warning)" : "var(--error)");
  const avgScore = sessionScores.length
    ? Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length)
    : 0;

  const isSessionComplete = state === "session-complete" && sessionScores.length > 0;

  /* ── Render ──────────────────────────────────── */

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1, overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <SoundOutlined style={{ fontSize: 22, color: "var(--accent)" }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Luyện nói tự do</h1>
          <Tag
            color={examMode === "toeic" ? "blue" : "purple"}
            style={{ marginLeft: "auto", borderRadius: 99 }}
          >
            {examMode === "toeic" ? <BarChartOutlined /> : <TrophyOutlined />} {modeLabel}
          </Tag>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>
          Nói về chủ đề được giao, AI sẽ đánh giá chi tiết về ngữ pháp, từ vựng và mạch lạc
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 24, maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 16px", borderRadius: 8,
            background: "var(--error-bg)", color: "var(--error)",
            marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Session Complete */}
        {isSessionComplete && (
          <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {avgScore >= 80 ? <CheckCircleOutlined style={{ color: "var(--success)" }} /> :
               avgScore >= 50 ? <InfoCircleOutlined style={{ color: "var(--warning)" }} /> :
               <CloseCircleOutlined style={{ color: "var(--error)" }} />}
            </div>
            <h2 style={{ margin: "0 0 8px" }}>Phiên luyện tập hoàn thành!</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 20px" }}>
              Điểm trung bình: <strong style={{ fontSize: 24, color: "var(--accent)" }}>{avgScore}</strong>/100
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              {sessionScores.map((s, i) => (
                <Tag
                  key={`score-${i}-${s}`}
                  color={s >= 80 ? "success" : s >= 50 ? "warning" : "error"}
                  style={{ fontSize: 13, padding: "3px 10px" }}
                >
                  Lượt {i + 1}: {s}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={resetSession}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: 13,
                }}
              >
                Phiên mới
              </button>
              <button
                onClick={generateTopic}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: "none",
                  background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 14,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                <ReloadOutlined /> Luyện tiếp
              </button>
            </div>
          </div>
        )}

        {/* Idle: Setup */}
        {state === "idle" && (
          <div style={{ textAlign: "center", padding: 32, border: "1px solid var(--border)", borderRadius: 16, background: "var(--card-bg)" }}>
            <SoundOutlined style={{ fontSize: 48, color: "var(--accent)", marginBottom: 16 }} />
            <h2 style={{ margin: "0 0 8px" }}>Luyện nói tự do với AI</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: 13 }}>
              Chọn trình độ, thời gian và bắt đầu. AI sẽ đánh giá phát âm, ngữ pháp, từ vựng và mạch lạc.
            </p>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>Trình độ CEFR</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLevel(l.value)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: level === l.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: level === l.value ? "var(--accent-muted)" : "transparent",
                      color: level === l.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: level === l.value ? 600 : 400, cursor: "pointer", fontSize: 13,
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>Thời gian nói</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    style={{
                      padding: "8px 16px", borderRadius: 8,
                      border: duration === d.value ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: duration === d.value ? "var(--accent-muted)" : "transparent",
                      color: duration === d.value ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: duration === d.value ? 600 : 400, cursor: "pointer", fontSize: 13,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={generateTopic} style={{ padding: "12px 32px", borderRadius: 10, border: "none", background: "var(--accent)", color: "var(--text-on-accent, #fff)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
              Bắt đầu luyện nói
            </button>
          </div>
        )}

        {/* Generating topic */}
        {state === "generating-topic" && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
            <p style={{ color: "var(--text-secondary)", marginTop: 12 }}>Đang tạo chủ đề...</p>
          </div>
        )}

        {/* Ready / Recording / Evaluating */}
        {topic && (state === "ready" || state === "recording" || state === "evaluating") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{
              padding: 24, borderRadius: 16,
              border: state === "recording" ? "2px solid var(--error)" : "1px solid var(--border)",
              background: "var(--card-bg)", textAlign: "center",
              animation: state === "recording" ? "pulse 1.5s ease-in-out infinite" : undefined,
            }}>
              <Tag color="blue" style={{ marginBottom: 12, fontSize: 12 }}>{level.toUpperCase()} • {duration}s</Tag>
              <p style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.5 }}>
                {topic.topic}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                {topic.description}
              </p>
            </div>

            {state === "recording" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 36, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: timeLeft <= 10 ? "var(--error)" : "var(--text)",
                    transition: "color 0.3s",
                  }}>
                    {formatTime(timeLeft)}
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                    Thời gian còn lại
                  </p>
                </div>
                <div style={{
                  padding: 12, borderRadius: 12,
                  background: "var(--card-bg)", border: "1px solid var(--border)",
                }}>
                  <Waveform getStream={voice.getStream} active={true} />
                </div>
              </>
            )}

            <div style={{ textAlign: "center" }}>
              {state === "ready" && (
                <>
                  <button
                    onClick={startRecording}
                    style={{
                      width: 80, height: 80, borderRadius: "50%", border: "none",
                      background: "linear-gradient(135deg, var(--error), color-mix(in srgb, var(--error) 70%, white))",
                      color: "var(--text-on-accent, #fff)", fontSize: 28, cursor: "pointer",
                      boxShadow: "0 4px 16px color-mix(in srgb, var(--error) 30%, transparent)", transition: "transform 0.2s",
                    }}
                    aria-label="Bắt đầu ghi âm"
                  >
                    <AudioOutlined />
                  </button>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                    Nhấn để bắt đầu nói
                  </p>
                </>
              )}

              {state === "recording" && (
                <>
                  <button
                    onClick={stopRecording}
                    style={{
                      width: 80, height: 80, borderRadius: "50%",
                      border: "3px solid var(--error)", background: "var(--card-bg)",
                      color: "var(--error)", fontSize: 20, cursor: "pointer",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                    aria-label="Dừng ghi âm"
                  >
                    <PauseCircleOutlined />
                  </button>
                  <p style={{ fontSize: 12, color: "var(--error)", marginTop: 8, fontWeight: 600 }}>
                    Đang ghi âm... Nhấn để dừng
                  </p>
                </>
              )}

              {state === "evaluating" && (
                <div>
                  <LoadingOutlined style={{ fontSize: 32, color: "var(--accent)" }} />
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>
                    Đang đánh giá...
                  </p>
                </div>
              )}
            </div>

            {state === "ready" && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button
                  onClick={newTopic}
                  style={{
                    padding: "6px 14px", borderRadius: 6,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
                  }}
                >
                  <ReloadOutlined /> Đổi chủ đề khác
                </button>
                {sessionScores.length > 0 && (
                  <button
                    onClick={endSession}
                    style={{
                      padding: "6px 14px", borderRadius: 6,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--text-secondary)", cursor: "pointer", fontSize: 12,
                    }}
                  >
                    Kết thúc phiên
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {state === "result" && feedback && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ padding: 24, borderRadius: 16, background: "var(--card-bg)", border: "1px solid var(--border)", textAlign: "center" }}>
              <Progress
                type="circle"
                percent={feedback.overall}
                size={100}
                strokeColor={scoreColor(feedback.overall)}
                format={(pct) => <span style={{ fontSize: 24, fontWeight: 700 }}>{pct}</span>}
              />
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Trôi chảy", score: feedback.fluency.score },
                  { label: "Ngữ pháp", score: feedback.grammar.score },
                  { label: "Từ vựng", score: feedback.vocabulary.rangeScore },
                  { label: "Mạch lạc", score: feedback.coherence.score },
                ].map((s) => (
                  <div key={s.label}>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>{s.label}</p>
                    <p style={{ fontSize: 18, fontWeight: 600, margin: 0, color: scoreColor(s.score) }}>{s.score}</p>
                  </div>
                ))}
              </div>
            </div>

            {feedback.summary && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 13, margin: 0 }}>{feedback.summary}</p>
              </div>
            )}

            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                <PlayCircleOutlined /> Độ trôi chảy
              </p>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>WPM: </span>
                  <strong>{feedback.fluency.wpm}</strong>
                  <span style={{ color: "var(--text-secondary)", fontSize: 11 }}> ({feedback.fluency.wpmTarget})</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Từ đệm: </span>
                  <strong style={{ color: feedback.fluency.fillerCount > 5 ? "var(--error)" : "inherit" }}>
                    {feedback.fluency.fillerCount}
                  </strong>
                </div>
              </div>
              {feedback.fluency.fillers.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                  {feedback.fluency.fillers.map((f) => (
                    <Tag key={f.filler} color="warning" style={{ fontSize: 11 }}>
                      &quot;{f.filler}&quot; ×{f.count}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {(feedback.grammar.errors?.length ?? 0) > 0 && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  <WarningOutlined /> Lỗi ngữ pháp ({feedback.grammar.errors.length})
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {feedback.grammar.errors.map((e, i) => (
                    <div
                      key={`${e.quote}-${i}`}
                      style={{ fontSize: 13, padding: "8px 12px", borderRadius: 8, background: "var(--error-bg)" }}
                    >
                      <div>
                        <span style={{ textDecoration: "line-through", color: "var(--error)" }}>{e.quote}</span>
                        {" → "}
                        <span style={{ color: "var(--success)", fontWeight: 500 }}>{e.suggestion}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>{e.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(feedback.vocabulary.upgrades?.length ?? 0) > 0 && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 8px", fontWeight: 600 }}>
                  Nâng cấp từ vựng
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {feedback.vocabulary.upgrades.map((u, i) => (
                    <div key={`${u.original}-${i}`} style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{u.original}</span>
                      {" → "}
                      <strong style={{ color: "var(--accent)" }}>{u.better}</strong>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 6 }}>({u.why})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {feedback.coherence.note && (
              <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>
                  Mạch lạc
                </p>
                <p style={{ fontSize: 13, margin: 0 }}>{feedback.coherence.note}</p>
              </div>
            )}

            <div style={{ padding: 16, borderRadius: 12, background: "var(--card-bg)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 600 }}>
                Bạn đã nói:
              </p>
              <p style={{ fontSize: 13, margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
                &ldquo;{feedback.transcript}&rdquo;
              </p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={retryTopic}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}
              >
                <ReloadOutlined /> Thử lại
              </button>
              <button
                onClick={newTopic}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "none", background: "var(--accent)",
                  color: "var(--text-on-accent, #fff)", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                Chủ đề mới <CheckCircleOutlined />
              </button>
              <button
                onClick={endSession}
                style={{
                  padding: "10px 20px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-secondary)", cursor: "pointer", fontSize: 13,
                }}
              >
                Kết thúc phiên
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
